import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMenuItemSchema, insertMenuCategorySchema } from "../shared/schema";
import { broadcast } from "./websocket";
import crypto from "crypto";

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.adminId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

function generateSessionCode(): string {
  return crypto.randomBytes(6).toString("hex");
}

function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `K-${ts}${rand}`;
}

const QR_ROTATION_ID = "qr-v2-2026-03-18";
const qrSecret = process.env.QR_SECRET || process.env.SESSION_SECRET || "kebabil-qr-secret";
const pinSecret = process.env.PIN_SECRET || process.env.SESSION_SECRET || "kebabil-pin-secret";

function buildQrToken(tableId: number): string {
  return crypto.createHmac("sha256", qrSecret).update(`${tableId}:${QR_ROTATION_ID}`).digest("hex").slice(0, 24);
}

function isValidQrToken(tableId: number, token: string): boolean {
  const expected = buildQrToken(tableId);
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

function getPublicBaseUrl(req: Request): string {
  const protoHeader = req.headers["x-forwarded-proto"];
  const hostHeader = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = Array.isArray(protoHeader) ? protoHeader[0] : protoHeader || req.protocol || "http";
  const host = Array.isArray(hostHeader) ? hostHeader[0] : hostHeader || "localhost:5000";
  return `${proto}://${host}`;
}

function normalizeUnitPrice(priceValue: unknown, priceLabel?: string): number {
  const cleaned = (priceLabel || "").replace(/[^\d.]/g, "");
  const parsedLabel = cleaned ? Number.parseFloat(cleaned) : NaN;
  const labelPaise = Number.isFinite(parsedLabel) && parsedLabel >= 0 ? Math.round(parsedLabel * 100) : 0;
  if (labelPaise > 0) return labelPaise;

  const numericPriceValue = Number(priceValue);
  if (!Number.isFinite(numericPriceValue) || numericPriceValue < 0) return 0;
  if (numericPriceValue > 0 && numericPriceValue < 1000) return Math.round(numericPriceValue * 100);
  return Math.round(numericPriceValue);
}

function hashPin(pin: string): string {
  return crypto.createHmac("sha256", pinSecret).update(pin).digest("hex");
}

function generate4DigitPin(): string {
  return crypto.randomInt(0, 10000).toString().padStart(4, "0");
}

const UPI_MERCHANT_ID =
  (process.env.UPI_MERCHANT_ID || "").trim().toLowerCase() === "kebabil@upi"
    ? "aamirkhalife@fam"
    : (process.env.UPI_MERCHANT_ID || "aamirkhalife@fam").trim();
const UPI_MERCHANT_NAME = process.env.UPI_MERCHANT_NAME || "Kebabil";
const PENDING_PAYMENT_TTL_MS = 15 * 60 * 1000;

type BillSummary = {
  subtotal: number;
  tax: number;
  total: number;
};

function sanitizeTxnNote(note: string): string {
  return note.replace(/[^\w\-:/ ]/g, "").slice(0, 70);
}

function buildUpiUri(args: { pa: string; pn: string; am: number; tn: string; tr: string }): string {
  const params = new URLSearchParams({
    pa: args.pa.trim(),
    pn: args.pn.trim(),
    am: (Math.max(0, args.am) / 100).toFixed(2),
    cu: "INR",
    tn: sanitizeTxnNote(args.tn),
    tr: args.tr,
  });
  return `upi://pay?${params.toString()}`;
}

function isStalePendingPayment(payment: { paymentStatus: string; createdAt: Date | string | number }, now = Date.now()): boolean {
  if (payment.paymentStatus !== "pending_verification") return false;
  const createdAt = new Date(payment.createdAt).getTime();
  if (!Number.isFinite(createdAt)) return false;
  return now - createdAt >= PENDING_PAYMENT_TTL_MS;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ===== AUTH ROUTES =====
  app.post("/api/auth/setup", async (req, res) => {
    try {
      const count = await storage.getAdminCount();
      if (count > 0) {
        return res.status(403).json({ message: "Admin already exists. Use login." });
      }
      const { username, password, displayName } = req.body;
      if (!username || !password || !displayName) {
        return res.status(400).json({ message: "Username, password, and display name required" });
      }
      const user = await storage.createAdminUser({
        username,
        passwordHash: hashPassword(password),
        displayName,
        role: "owner",
        isActive: true,
      });
      req.session.adminId = user.id;
      req.session.adminUsername = user.username;
      req.session.adminRole = user.role;
      res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
    } catch (error) {
      console.error("Setup error:", error);
      res.status(500).json({ message: "Setup failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }
      const user = await storage.getAdminByUsername(username);
      if (!user || !user.isActive || user.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      await storage.updateAdminLastLogin(user.id);
      req.session.adminId = user.id;
      req.session.adminUsername = user.username;
      req.session.adminRole = user.role;
      res.json({ id: user.id, username: user.username, displayName: user.displayName, role: user.role });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ message: "Logout failed" });
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.adminId) {
      return res.json({ authenticated: false });
    }
    const user = await storage.getAdminById(req.session.adminId);
    if (!user || !user.isActive) {
      return res.json({ authenticated: false });
    }
    res.json({
      authenticated: true,
      user: { id: user.id, username: user.username, displayName: user.displayName, role: user.role },
    });
  });

  app.get("/api/auth/needs-setup", async (_req, res) => {
    const count = await storage.getAdminCount();
    res.json({ needsSetup: count === 0 });
  });

  // ===== MENU ROUTES =====
  app.get("/api/menu", async (_req, res) => {
    try {
      const categories = await storage.getMenuCategories();
      const items = await storage.getMenuItems();

      const menu = categories.map(cat => ({
        category: cat.name,
        categoryId: cat.id,
        items: items
          .filter(item => item.categoryId === cat.id && item.isActive)
          .map(item => ({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price,
            priceValue: normalizeUnitPrice(item.priceValue, item.price),
            variants: item.variants,
            addons: item.addons,
            badge: item.badge,
            imageUrl: item.imageUrl,
            type: item.type,
            spiceLevel: item.spiceLevel,
            isAvailable: item.isAvailable,
            prepTimeMinutes: item.prepTimeMinutes,
          })),
      }));

      res.json(menu);
    } catch (error) {
      console.error("Error fetching menu:", error);
      res.status(500).json({ message: "Failed to fetch menu" });
    }
  });

  app.post("/api/menu/categories", async (req, res) => {
    try {
      const parsed = insertMenuCategorySchema.parse(req.body);
      const category = await storage.createMenuCategory(parsed);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.post("/api/menu/items", async (req, res) => {
    try {
      const parsed = insertMenuItemSchema.parse(req.body);
      const item = await storage.createMenuItem(parsed);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating menu item:", error);
      res.status(400).json({ message: "Invalid menu item data" });
    }
  });

  app.patch("/api/menu/items/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const updated = await storage.updateMenuItem(id, req.body);
      if (!updated) {
        res.status(404).json({ message: "Menu item not found" });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error("Error updating menu item:", error);
      res.status(400).json({ message: "Failed to update menu item" });
    }
  });

  app.delete("/api/menu/items/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMenuItem(id);
      if (!deleted) {
        res.status(404).json({ message: "Menu item not found" });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting menu item:", error);
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // ===== TABLE ROUTES =====
  app.get("/api/tables", async (_req, res) => {
    try {
      const tables = await storage.getTables();
      res.json(tables);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tables" });
    }
  });

  app.post("/api/tables", async (req, res) => {
    try {
      const table = await storage.createTable(req.body);
      res.status(201).json(table);
    } catch (error) {
      res.status(400).json({ message: "Failed to create table" });
    }
  });

  // ===== QR ROUTES =====
  app.get("/api/qr/tables", requireAdmin, async (req, res) => {
    try {
      const baseUrl = getPublicBaseUrl(req);
      const tables = await storage.getTables();
      res.json(
        tables.map((table) => {
          const token = buildQrToken(table.id);
          return {
            tableId: table.id,
            tableNumber: table.tableNumber,
            scanPath: `/t/${table.id}/${token}`,
            scanUrl: `${baseUrl}/t/${table.id}/${token}`,
          };
        })
      );
    } catch (error) {
      res.status(500).json({ message: "Failed to generate QR mappings" });
    }
  });

  app.get("/api/qr/resolve/:tableNumber", async (req, res) => {
    try {
      const tableNumber = Number(req.params.tableNumber);
      if (!Number.isFinite(tableNumber) || tableNumber <= 0) {
        res.status(400).json({ message: "Invalid table number" });
        return;
      }

      const table = await storage.getTableByNumber(tableNumber);
      if (!table) {
        res.status(404).json({ message: "Table not found" });
        return;
      }

      const token = buildQrToken(table.id);
      const scanPath = `/t/${table.id}/${token}`;
      const baseUrl = getPublicBaseUrl(req);
      res.json({
        tableId: table.id,
        tableNumber: table.tableNumber,
        token,
        scanPath,
        scanUrl: `${baseUrl}${scanPath}`,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to resolve table QR" });
    }
  });

  app.post("/api/qr/scan", async (req, res) => {
    try {
      const tableId = Number(req.body?.tableId);
      const token = String(req.body?.token || "");

      if (!Number.isFinite(tableId) || tableId <= 0 || !token) {
        res.status(400).json({ message: "Invalid QR payload" });
        return;
      }
      if (!isValidQrToken(tableId, token)) {
        res.status(403).json({ message: "QR code is invalid or expired" });
        return;
      }

      const table = await storage.getTableById(tableId);
      if (!table) {
        res.status(404).json({ message: "Table not found" });
        return;
      }

      let session = await storage.getActiveSessionForTable(table.id);

      if (!session) {
        const sessionCode = generateSessionCode();
        session = await storage.createSession({
          tableId: table.id,
          sessionCode,
          status: "active",
        });
        await storage.updateTable(table.id, { status: "occupied", activeSessionId: session.id });
      }

      let tableStatus = table.status;
      if (table.activeSessionId !== session.id || table.status !== "occupied") {
        await storage.updateTable(table.id, { status: "occupied", activeSessionId: session.id });
        tableStatus = "occupied";
      }

      res.json({
        table: { id: table.id, tableNumber: table.tableNumber, status: tableStatus },
        session: { id: session.id, sessionCode: session.sessionCode, status: session.status },
        qr: { tableId, token, rotation: QR_ROTATION_ID },
      });
    } catch (error) {
      console.error("Error scanning QR:", error);
      res.status(500).json({ message: "Failed to process table scan" });
    }
  });

  // Legacy endpoint retained as compatibility bridge to signed flow.
  app.post("/api/table/:tableNumber/scan", async (req, res) => {
    try {
      const tableNumber = Number(req.params.tableNumber);
      if (!Number.isFinite(tableNumber) || tableNumber <= 0) {
        res.status(400).json({ message: "Invalid table number" });
        return;
      }
      const table = await storage.getTableByNumber(tableNumber);
      if (!table) {
        res.status(404).json({ message: "Table not found" });
        return;
      }

      let session = await storage.getActiveSessionForTable(table.id);
      if (!session) {
        const sessionCode = generateSessionCode();
        session = await storage.createSession({
          tableId: table.id,
          sessionCode,
          status: "active",
        });
      }

      let tableStatus = table.status;
      if (table.activeSessionId !== session.id || table.status !== "occupied") {
        await storage.updateTable(table.id, { status: "occupied", activeSessionId: session.id });
        tableStatus = "occupied";
      }

      const token = buildQrToken(table.id);
      res.json({
        table: { id: table.id, tableNumber: table.tableNumber, status: tableStatus },
        session: { id: session.id, sessionCode: session.sessionCode, status: session.status },
        qr: { tableId: table.id, token, rotation: QR_ROTATION_ID, bridged: true },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to process table scan" });
    }
  });

  // ===== SESSION ROUTES =====
  app.get("/api/session/:code", async (req, res) => {
    try {
      const session = await storage.getSessionByCode(req.params.code);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session" });
    }
  });

  // ===== ORDER ROUTES =====
  app.post("/api/orders", async (req, res) => {
    try {
      const { sessionId, tableId, items, notes } = req.body;

      if (!items || !items.length) {
        res.status(400).json({ message: "Order must have at least one item" });
        return;
      }

      const session = await storage.getSessionById(Number(sessionId));
      if (!session || session.tableId !== Number(tableId) || session.status !== "active") {
        res.status(400).json({ message: "Invalid or inactive table session" });
        return;
      }

      let subtotal = 0;
      const resolvedItems: Array<{
        menuItemId: number;
        menuItemName: string;
        quantity: number;
        unitPrice: number;
        totalPrice: number;
        itemNote: string;
        variant: string;
      }> = [];

      for (const item of items) {
        const menuItem = await storage.getMenuItemById(item.menuItemId);
        if (!menuItem) {
          res.status(400).json({ message: `Menu item ${item.menuItemId} not found` });
          return;
        }
        const quantity = Number(item.quantity);
        const safeQuantity = Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1;
        const unitPrice = normalizeUnitPrice(menuItem.priceValue, menuItem.price);
        const totalPrice = unitPrice * safeQuantity;
        subtotal += totalPrice;
        resolvedItems.push({
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          quantity: safeQuantity,
          unitPrice,
          totalPrice,
          itemNote: item.itemNote || "",
          variant: item.variant || "",
        });
      }

      const tax = Math.round(subtotal * 0.05);
      const total = subtotal + tax;

      const order = await storage.createOrder({
        sessionId,
        tableId,
        orderNumber: generateOrderNumber(),
        status: "new",
        subtotal,
        tax,
        total,
        notes: notes || "",
      });

      for (const item of resolvedItems) {
        await storage.createOrderItem({ ...item, orderId: order.id });
      }

      const orderItemsResult = await storage.getOrderItemsByOrder(order.id);

      const fullOrder = { ...order, items: orderItemsResult };
      broadcast("new_order", fullOrder);

      res.status(201).json(fullOrder);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.get("/api/orders/active", requireAdmin, async (_req, res) => {
    try {
      const activeOrders = await storage.getActiveOrders();
      const ordersWithItems = await Promise.all(
        activeOrders.map(async (order) => {
          const items = await storage.getOrderItemsByOrder(order.id);
          return { ...order, items };
        })
      );
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active orders" });
    }
  });

  app.get("/api/orders/session/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      const sessionOrders = await storage.getOrdersBySession(sessionId);
      const ordersWithItems = await Promise.all(
        sessionOrders.map(async (order) => {
          const items = await storage.getOrderItemsByOrder(order.id);
          return { ...order, items };
        })
      );
      res.json(ordersWithItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch session orders" });
    }
  });

  app.patch("/api/orders/:id/status", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const status = String(req.body?.status || "");
      const validStatuses = ["new", "accepted", "preparing", "ready", "served"];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ message: "Invalid status" });
        return;
      }
      const updated = await storage.updateOrder(id, { status });
      if (!updated) {
        res.status(404).json({ message: "Order not found" });
        return;
      }
      const items = await storage.getOrderItemsByOrder(updated.id);
      const fullOrder = { ...updated, items };
      broadcast("order_update", fullOrder);
      res.json(fullOrder);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // ===== PAYMENT ROUTES =====
  const getSessionBillingSnapshot = async (sessionId: number) => {
    const session = await storage.getSessionById(sessionId);
    if (!session) return null;

    const sessionOrders = await storage.getOrdersBySession(sessionId);
    const ordersWithItems = await Promise.all(
      sessionOrders.map(async (order) => {
        const items = await storage.getOrderItemsByOrder(order.id);
        return { ...order, items };
      })
    );

    const bill: BillSummary = {
      subtotal: sessionOrders.reduce((sum, o) => sum + o.subtotal, 0),
      tax: sessionOrders.reduce((sum, o) => sum + o.tax, 0),
      total: sessionOrders.reduce((sum, o) => sum + o.total, 0),
    };

    const payments = await storage.getPaymentsBySession(sessionId);
    const now = Date.now();
    for (const payment of payments) {
      if (!isStalePendingPayment(payment, now)) continue;
      await storage.updatePayment(payment.id, { paymentStatus: "expired" });
      payment.paymentStatus = "expired";
    }
    const completedPayment = payments.find((p) => p.paymentStatus === "completed");

    return {
      session,
      sessionOrders,
      ordersWithItems,
      bill,
      payments,
      isPaid: Boolean(completedPayment),
      completedPayment,
    };
  };

  const buildPendingPaymentSummary = async (payment: any) => {
    const snapshot = await getSessionBillingSnapshot(payment.sessionId);
    if (!snapshot) return null;
    const table = await storage.getTableById(snapshot.session.tableId);
    const primaryOrder = snapshot.sessionOrders[0];
    return {
      paymentId: payment.id,
      sessionId: snapshot.session.id,
      tableId: snapshot.session.tableId,
      tableNumber: table?.tableNumber || snapshot.session.tableId,
      orderId: primaryOrder?.id || null,
      orderNumber: primaryOrder?.orderNumber || "",
      amount: payment.amount,
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
      transactionRef: payment.transactionRef,
      createdAt: payment.createdAt,
    };
  };

  const confirmPaymentAndIssuePin = async (paymentId: number, verifier: { adminId: number; name: string }, transactionRefInput?: string) => {
    const paymentRecord = await storage.getPaymentById(paymentId);
    if (!paymentRecord) return { error: { status: 404, message: "Payment not found" } };
    if (paymentRecord.paymentStatus === "completed") return { error: { status: 409, message: "Payment already completed" } };

    const snapshot = await getSessionBillingSnapshot(paymentRecord.sessionId);
    if (!snapshot) return { error: { status: 404, message: "Session not found" } };
    if (snapshot.sessionOrders.length === 0 || snapshot.bill.total <= 0) {
      return { error: { status: 400, message: "No valid order found for payment" } };
    }
    if (snapshot.completedPayment && snapshot.completedPayment.id !== paymentRecord.id) {
      return { error: { status: 409, message: "Session already paid" } };
    }
    if (paymentRecord.amount !== snapshot.bill.total) {
      return { error: { status: 409, message: "Payment amount mismatch. Regenerate payment link." } };
    }

    const paymentMethod = paymentRecord.paymentMethod || "cash";
    const transactionRef = String(transactionRefInput || paymentRecord.transactionRef || `${paymentMethod.toUpperCase()}-${Date.now()}`);
    const payment = await storage.updatePayment(paymentId, {
      paymentStatus: "completed",
      transactionRef,
      verifiedByAdminId: verifier.adminId,
      verifiedByName: verifier.name,
      paidAt: new Date(),
    });
    if (!payment) return { error: { status: 404, message: "Payment not found" } };

    await storage.updateSession(payment.sessionId, { status: "paid" });

    const order = snapshot.sessionOrders[0];
    const pin = generate4DigitPin();
    const expiresAt = new Date(Date.now() + 7 * 60 * 1000);
    await storage.expireActiveExitPinsByTable(snapshot.session.tableId);
    const exitPin = await storage.createExitPin({
      orderId: order.id,
      tableId: snapshot.session.tableId,
      paymentId: payment.id,
      pinHash: hashPin(pin),
      pinCode: pin,
      status: "active",
      expiresAt,
      maxAttempts: 5,
    });

    broadcast("payment_complete", {
      sessionId: payment.sessionId,
      paymentId: payment.id,
      tableId: snapshot.session.tableId,
      exitPinId: exitPin.id,
    });

    return {
      payment,
      exitPin: {
        id: exitPin.id,
        orderId: exitPin.orderId,
        tableId: exitPin.tableId,
        pin,
        status: exitPin.status,
        expiresAt: exitPin.expiresAt,
      },
    };
  };

  app.get("/api/session/:sessionId/bill", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const snapshot = await getSessionBillingSnapshot(sessionId);
      if (!snapshot) {
        res.status(404).json({ message: "Session not found" });
        return;
      }

      res.json({
        session: snapshot.session,
        orders: snapshot.ordersWithItems,
        bill: snapshot.bill,
        isPaid: snapshot.isPaid,
        payments: snapshot.payments,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate bill" });
    }
  });

  app.get("/api/session/:sessionId/payment/upi", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const snapshot = await getSessionBillingSnapshot(sessionId);
      if (!snapshot) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      if (snapshot.sessionOrders.length === 0 || snapshot.bill.total <= 0) {
        res.status(400).json({ message: "No valid order found for payment" });
        return;
      }
      if (snapshot.isPaid) {
        res.status(409).json({ message: "Session already paid" });
        return;
      }

      const latestOrder = snapshot.sessionOrders[0];
      const note = `ORDER-${latestOrder.orderNumber}`;
      const paymentIntentRef = `UPI-INTENT-${snapshot.session.id}-${Date.now()}`;
      const pendingUpi = snapshot.payments.find(
        (p) =>
          p.paymentStatus === "pending_verification" &&
          p.paymentMethod === "upi" &&
          p.amount === snapshot.bill.total
      );
      const paymentRecord = pendingUpi
        ? pendingUpi
        : await storage.createPayment({
            sessionId: snapshot.session.id,
            amount: snapshot.bill.total,
            paymentMethod: "upi",
            paymentStatus: "pending_verification",
            transactionRef: paymentIntentRef,
          });
      const upiUri = buildUpiUri({
        pa: UPI_MERCHANT_ID,
        pn: UPI_MERCHANT_NAME,
        am: snapshot.bill.total,
        tn: note,
        tr: `TXN-${paymentRecord.id}-${snapshot.session.id}`,
      });

      res.set("Cache-Control", "no-store").json({
        paymentId: paymentRecord.id,
        sessionId: snapshot.session.id,
        amountPaise: snapshot.bill.total,
        amount: (snapshot.bill.total / 100).toFixed(2),
        merchantUpiId: UPI_MERCHANT_ID,
        merchantName: UPI_MERCHANT_NAME,
        note,
        upiUri,
        deepLink: upiUri,
        verificationStatus: paymentRecord.paymentStatus,
      });
    } catch (error) {
      console.error("Error generating UPI payment data:", error);
      res.status(500).json({ message: "Failed to generate UPI payment link" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const sessionId = Number(req.body?.sessionId);
      const paymentMethod = String(req.body?.paymentMethod || "upi").toLowerCase();
      const validMethods = ["cash", "card", "upi"];
      if (!Number.isFinite(sessionId) || sessionId <= 0) {
        res.status(400).json({ message: "Invalid session" });
        return;
      }
      if (!validMethods.includes(paymentMethod)) {
        res.status(400).json({ message: "Invalid payment method" });
        return;
      }
      const snapshot = await getSessionBillingSnapshot(sessionId);
      if (!snapshot) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      if (snapshot.sessionOrders.length === 0 || snapshot.bill.total <= 0) {
        res.status(400).json({ message: "No valid order found for payment" });
        return;
      }
      if (snapshot.isPaid) {
        res.status(409).json({ message: "Session already paid" });
        return;
      }

      const existingPending = snapshot.payments.find((p) => p.paymentStatus === "pending_verification");
      if (existingPending) {
        const updatedPending = await storage.updatePayment(existingPending.id, {
          amount: snapshot.bill.total,
          paymentMethod,
          paymentStatus: "pending_verification",
          transactionRef: existingPending.transactionRef || `${paymentMethod.toUpperCase()}-INTENT-${Date.now()}`,
        });
        res.status(200).json(updatedPending);
        return;
      }

      const payment = await storage.createPayment({
        sessionId,
        amount: snapshot.bill.total,
        paymentMethod,
        paymentStatus: "pending_verification",
        transactionRef: `${paymentMethod.toUpperCase()}-INTENT-${Date.now()}`,
      });
      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.get("/api/session/:sessionId/exit-pin", async (req, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const session = await storage.getSessionById(sessionId);
      if (!session) {
        res.status(404).json({ message: "Session not found" });
        return;
      }
      const pins = await storage.getActiveExitPinsByTable(session.tableId);
      const latestPin = pins[0];
      if (!latestPin) {
        res.status(404).json({ message: "Exit PIN not available yet" });
        return;
      }
      res.json({
        id: latestPin.id,
        orderId: latestPin.orderId,
        tableId: latestPin.tableId,
        pin: latestPin.pinCode,
        status: latestPin.status,
        expiresAt: latestPin.expiresAt,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exit PIN" });
    }
  });

  app.get("/api/waiter/payments/pending", requireAdmin, async (_req, res) => {
    try {
      const allPayments = await storage.getAllPayments();
      const now = Date.now();
      for (const payment of allPayments) {
        if (!isStalePendingPayment(payment, now)) continue;
        await storage.updatePayment(payment.id, { paymentStatus: "expired" });
        payment.paymentStatus = "expired";
      }
      const pendingPayments = allPayments
        .filter((p) => p.paymentStatus === "pending_verification")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const seenSessions = new Set<number>();
      const result: Array<{
        paymentId: number;
        sessionId: number;
        tableId: number;
        tableNumber: number;
        orderId: number | null;
        orderNumber: string;
        amount: number;
        paymentMethod: string;
        paymentStatus: string;
        transactionRef: string;
        createdAt: Date;
      }> = [];
      for (const payment of pendingPayments) {
        if (seenSessions.has(payment.sessionId)) continue;
        seenSessions.add(payment.sessionId);
        const summary = await buildPendingPaymentSummary(payment);
        if (!summary) continue;
        result.push(summary);
      }
      res.json(result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending payments" });
    }
  });

  app.patch("/api/waiter/payments/:id/confirm", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const adminId = req.session.adminId;
      if (!adminId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const verifier = {
        adminId,
        name: req.session.adminUsername || "waiter",
      };
      const result = await confirmPaymentAndIssuePin(id, verifier, req.body?.transactionRef);
      if ((result as any).error) {
        const err = (result as any).error as { status: number; message: string };
        res.status(err.status).json({ message: err.message });
        return;
      }
      res.json(result);
    } catch (error) {
      console.error("Error confirming payment:", error);
      res.status(500).json({ message: "Failed to confirm payment" });
    }
  });

  app.patch("/api/payments/:id/complete", requireAdmin, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const adminId = req.session.adminId;
      if (!adminId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
      }
      const verifier = {
        adminId,
        name: req.session.adminUsername || "waiter",
      };
      const result = await confirmPaymentAndIssuePin(id, verifier, req.body?.transactionRef);
      if ((result as any).error) {
        const err = (result as any).error as { status: number; message: string };
        res.status(err.status).json({ message: err.message });
        return;
      }
      res.json(result);
    } catch (error) {
      console.error("Error completing payment:", error);
      res.status(500).json({ message: "Failed to complete payment" });
    }
  });

  // ===== EXIT PIN ROUTES =====
  app.post("/api/exit-pin/verify", async (req, res) => {
    try {
      const pin = String(req.body?.pin || "").trim();
      const tableNumber = Number(req.body?.tableNumber);

      if (!/^\d{4}$/.test(pin)) {
        res.status(400).json({ valid: false, reason: "invalid_pin" });
        return;
      }
      if (!Number.isFinite(tableNumber) || tableNumber <= 0) {
        res.status(400).json({ valid: false, reason: "invalid_table" });
        return;
      }

      const table = await storage.getTableByNumber(tableNumber);
      if (!table) {
        res.status(404).json({ valid: false, reason: "invalid_table" });
        return;
      }

      const activePins = await storage.getActiveExitPinsByTable(table.id);
      const now = new Date();

      for (const p of activePins) {
        if (now > new Date(p.expiresAt)) {
          await storage.updateExitPin(p.id, { status: "expired" });
        }
      }

      const refreshedPins = (await storage.getActiveExitPinsByTable(table.id))
        .filter((p) => now <= new Date(p.expiresAt));
      const pinHash = hashPin(pin);

      const matched = refreshedPins.find((p) =>
        crypto.timingSafeEqual(Buffer.from(p.pinHash), Buffer.from(pinHash))
      );

      if (!matched) {
        const latest = await storage.getLatestExitPinByTable(table.id);
        if (latest && latest.status === "active") {
          const attempts = (latest.attempts || 0) + 1;
          const exceeded = attempts >= (latest.maxAttempts || 5);
          await storage.updateExitPin(latest.id, {
            attempts,
            status: exceeded ? "expired" : latest.status,
          });
        }
        res.status(400).json({ valid: false, reason: "invalid_pin" });
        return;
      }

      if (matched.status === "used") {
        res.status(400).json({ valid: false, reason: "already_used" });
        return;
      }
      if (now > new Date(matched.expiresAt)) {
        await storage.updateExitPin(matched.id, { status: "expired" });
        res.status(400).json({ valid: false, reason: "expired" });
        return;
      }

      const payment = await storage.getPaymentById(matched.paymentId);
      if (!payment || payment.paymentStatus !== "completed") {
        res.status(400).json({ valid: false, reason: "payment_incomplete" });
        return;
      }

      await storage.updateExitPin(matched.id, { status: "used", usedAt: now });

      const session = await storage.getSessionById(payment.sessionId);
      if (session) {
        await storage.updateSession(session.id, { status: "exited", closedAt: now });
      }
      await storage.updateTable(table.id, { status: "available", activeSessionId: null });

      broadcast("exit_verified", { tableId: table.id, orderId: matched.orderId, exitPinId: matched.id });

      res.json({
        valid: true,
        message: "door_unlocked",
        orderId: matched.orderId,
        tableNumber: table.tableNumber,
      });
    } catch (error) {
      res.status(500).json({ valid: false, reason: "server_error" });
    }
  });

  // ===== ADMIN: Update table capacity =====
  app.patch("/api/admin/table/:tableId", requireAdmin, async (req, res) => {
    try {
      const tableId = Number(req.params.tableId);
      const { capacity } = req.body;
      const rawStatus = typeof req.body?.status === "string" ? req.body.status.toLowerCase().trim() : undefined;
      const normalizedStatus =
        rawStatus === "unoccupied" ? "available" : rawStatus;
      const validStatuses = ["available", "occupied", "reserved"];

      if (capacity !== undefined && (typeof capacity !== "number" || capacity < 1 || capacity > 20)) {
        return res.status(400).json({ message: "Capacity must be between 1 and 20" });
      }
      if (normalizedStatus !== undefined && !validStatuses.includes(normalizedStatus)) {
        return res.status(400).json({ message: "Status must be occupied, reserved, or unoccupied" });
      }

      const updatePayload: { capacity?: number; status?: string; activeSessionId?: number | null } = {};
      if (capacity !== undefined) updatePayload.capacity = capacity;
      if (normalizedStatus !== undefined) {
        updatePayload.status = normalizedStatus;
        if (normalizedStatus === "available" || normalizedStatus === "reserved") {
          updatePayload.activeSessionId = null;
        }
      }

      if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ message: "No valid fields to update" });
      }

      const updated = await storage.updateTable(tableId, updatePayload);
      if (!updated) return res.status(404).json({ message: "Table not found" });
      broadcast("table_cleared", { tableId: updated.id, status: updated.status });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update table" });
    }
  });

  // ===== WAITER DASHBOARD DATA =====
  app.get("/api/waiter/tables", requireAdmin, async (_req, res) => {
    try {
      const tables = await storage.getTables();
      const tablesWithDetails = await Promise.all(
        tables.map(async (table) => {
          let session = null;
          let activeOrders: any[] = [];
          if (table.activeSessionId) {
            session = await storage.getSessionById(table.activeSessionId);
            if (session) {
              const sessionOrders = await storage.getOrdersBySession(session.id);
              activeOrders = await Promise.all(
                sessionOrders.map(async (order) => {
                  const items = await storage.getOrderItemsByOrder(order.id);
                  return { ...order, items };
                })
              );
            }
          }
          return { ...table, session, orders: activeOrders };
        })
      );
      res.json(tablesWithDetails);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch waiter data" });
    }
  });

  app.post("/api/waiter/table/:tableId/clear", requireAdmin, async (req, res) => {
    try {
      const tableId = Number(req.params.tableId);
      const table = await storage.getTables().then(t => t.find(tb => tb.id === tableId));
      if (!table) { res.status(404).json({ message: "Table not found" }); return; }

      if (table.activeSessionId) {
        await storage.updateSession(table.activeSessionId, { status: "exited", closedAt: new Date() });
      }
      await storage.updateTable(tableId, { status: "available", activeSessionId: null });

      broadcast("table_cleared", { tableId });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear table" });
    }
  });

  // ===== ANALYTICS ROUTES =====
  app.get("/api/analytics/overview", requireAdmin, async (_req, res) => {
    try {
      const allOrders = await storage.getAllOrders();
      const allSessions = await storage.getAllSessions();
      const allPayments = await storage.getAllPayments();
      const allOrderItems = await storage.getAllOrderItems();
      const tables = await storage.getTables();
      const doorLogs = await storage.getDoorAccessLogs();

      const totalRevenue = allPayments.filter(p => p.paymentStatus === "completed").reduce((sum, p) => sum + p.amount, 0);
      const totalOrders = allOrders.length;
      const totalSessions = allSessions.length;
      const occupiedTables = tables.filter(t => t.status === "occupied").length;

      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayOrders = allOrders.filter(o => new Date(o.createdAt) >= todayStart);
      const todayRevenue = allPayments.filter(p => p.paymentStatus === "completed" && new Date(p.paidAt || p.createdAt) >= todayStart).reduce((sum, p) => sum + p.amount, 0);
      const todaySessions = allSessions.filter(s => new Date(s.openedAt) >= todayStart);

      const itemPopularity: Record<string, { name: string; count: number; revenue: number }> = {};
      for (const oi of allOrderItems) {
        if (!itemPopularity[oi.menuItemName]) {
          itemPopularity[oi.menuItemName] = { name: oi.menuItemName, count: 0, revenue: 0 };
        }
        itemPopularity[oi.menuItemName].count += oi.quantity;
        itemPopularity[oi.menuItemName].revenue += oi.totalPrice;
      }
      const topItems = Object.values(itemPopularity).sort((a, b) => b.count - a.count).slice(0, 10);

      const ordersByStatus: Record<string, number> = {};
      for (const o of allOrders) {
        ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
      }

      const paymentMethods: Record<string, { count: number; total: number }> = {};
      for (const p of allPayments.filter(p => p.paymentStatus === "completed")) {
        if (!paymentMethods[p.paymentMethod]) {
          paymentMethods[p.paymentMethod] = { count: 0, total: 0 };
        }
        paymentMethods[p.paymentMethod].count++;
        paymentMethods[p.paymentMethod].total += p.amount;
      }

      const hourlyOrders: Record<number, number> = {};
      for (const o of todayOrders) {
        const hour = new Date(o.createdAt).getHours();
        hourlyOrders[hour] = (hourlyOrders[hour] || 0) + 1;
      }
      const hourlyData = Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        label: `${h.toString().padStart(2, "0")}:00`,
        orders: hourlyOrders[h] || 0,
      }));

      const doorAccessStats = {
        total: doorLogs.length,
        successful: doorLogs.filter(d => d.result === "success").length,
        failed: doorLogs.filter(d => d.result === "failed").length,
      };

      const avgOrderValue = totalOrders > 0 ? Math.round(allOrders.reduce((s, o) => s + o.total, 0) / totalOrders) : 0;

      res.json({
        summary: {
          totalRevenue,
          totalOrders,
          totalSessions,
          occupiedTables,
          totalTables: tables.length,
          todayRevenue,
          todayOrders: todayOrders.length,
          todaySessions: todaySessions.length,
          avgOrderValue,
        },
        topItems,
        ordersByStatus,
        paymentMethods,
        hourlyData,
        doorAccessStats,
        recentOrders: allOrders.slice(0, 20).map(o => ({
          id: o.id,
          orderNumber: o.orderNumber,
          tableId: o.tableId,
          status: o.status,
          total: o.total,
          createdAt: o.createdAt,
        })),
      });
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // ===== DOOR ACCESS LOGS =====
  app.get("/api/door/logs", requireAdmin, async (_req, res) => {
    try {
      const logs = await storage.getDoorAccessLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch door logs" });
    }
  });

  return httpServer;
}
