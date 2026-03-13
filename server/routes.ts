import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMenuItemSchema, insertMenuCategorySchema } from "@shared/schema";
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
            priceValue: item.priceValue,
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
      const id = parseInt(req.params.id);
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

  // ===== TABLE SCAN (Customer entry point) =====
  app.post("/api/table/:tableNumber/scan", async (req, res) => {
    try {
      const tableNumber = parseInt(req.params.tableNumber);
      let table = await storage.getTableByNumber(tableNumber);

      if (!table) {
        table = await storage.createTable({ tableNumber, status: "available" });
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

      res.json({
        table: { id: table.id, tableNumber: table.tableNumber, status: table.status },
        session: { id: session.id, sessionCode: session.sessionCode, status: session.status },
      });
    } catch (error) {
      console.error("Error scanning table:", error);
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
        const unitPrice = menuItem.priceValue;
        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;
        resolvedItems.push({
          menuItemId: menuItem.id,
          menuItemName: menuItem.name,
          quantity: item.quantity,
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
      const id = parseInt(req.params.id);
      const { status } = req.body;
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
  app.get("/api/session/:sessionId/bill", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const session = await storage.getSessionById(sessionId);
      if (!session) { res.status(404).json({ message: "Session not found" }); return; }

      const sessionOrders = await storage.getOrdersBySession(sessionId);
      const ordersWithItems = await Promise.all(
        sessionOrders.map(async (order) => {
          const items = await storage.getOrderItemsByOrder(order.id);
          return { ...order, items };
        })
      );

      const subtotal = sessionOrders.reduce((sum, o) => sum + o.subtotal, 0);
      const tax = sessionOrders.reduce((sum, o) => sum + o.tax, 0);
      const total = sessionOrders.reduce((sum, o) => sum + o.total, 0);

      const existingPayments = await storage.getPaymentsBySession(sessionId);
      const isPaid = existingPayments.some(p => p.paymentStatus === "completed");

      res.json({
        session,
        orders: ordersWithItems,
        bill: { subtotal, tax, total },
        isPaid,
        payments: existingPayments,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate bill" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const { sessionId, amount, paymentMethod } = req.body;
      const payment = await storage.createPayment({
        sessionId,
        amount,
        paymentMethod: paymentMethod || "upi",
        paymentStatus: "pending",
      });
      res.status(201).json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.patch("/api/payments/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { paymentMethod, transactionRef } = req.body;

      const payment = await storage.updatePayment(id, {
        paymentStatus: "completed",
        paymentMethod: paymentMethod || "cash",
        transactionRef: transactionRef || `CASH-${Date.now()}`,
        paidAt: new Date(),
      });

      if (!payment) { res.status(404).json({ message: "Payment not found" }); return; }

      await storage.updateSession(payment.sessionId, { status: "paid" });

      const expiresAt = new Date(Date.now() + 3 * 60 * 1000);
      const tokenHash = crypto.randomBytes(32).toString("hex");
      const exitToken = await storage.createExitToken({
        sessionId: payment.sessionId,
        paymentId: payment.id,
        tokenHash,
        expiresAt,
      });

      broadcast("payment_complete", { sessionId: payment.sessionId, paymentId: payment.id });

      res.json({ payment, exitToken });
    } catch (error) {
      console.error("Error completing payment:", error);
      res.status(500).json({ message: "Failed to complete payment" });
    }
  });

  // ===== EXIT TOKEN ROUTES =====
  app.get("/api/exit-token/:sessionId", async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      const token = await storage.getExitTokenBySession(sessionId);
      if (!token) { res.status(404).json({ message: "No exit token found" }); return; }

      const isExpired = new Date() > new Date(token.expiresAt);
      res.json({ ...token, isExpired });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exit token" });
    }
  });

  app.post("/api/exit-token/verify", async (req, res) => {
    try {
      const { token: tokenValue, tokenHash: tokenHashValue } = req.body;
      const lookupHash = tokenValue || tokenHashValue;
      if (!lookupHash) {
        res.status(400).json({ valid: false, reason: "Token required" });
        return;
      }
      const token = await storage.getExitTokenByHash(lookupHash);

      if (!token) {
        await storage.createDoorAccessLog({ exitTokenId: 0, result: "failed", reason: "Token not found" });
        res.status(400).json({ valid: false, reason: "Invalid token" });
        return;
      }

      if (token.isUsed) {
        await storage.createDoorAccessLog({ exitTokenId: token.id, result: "failed", reason: "Token already used" });
        res.status(400).json({ valid: false, reason: "Token already used" });
        return;
      }

      if (new Date() > new Date(token.expiresAt)) {
        await storage.createDoorAccessLog({ exitTokenId: token.id, result: "failed", reason: "Token expired" });
        res.status(400).json({ valid: false, reason: "Token expired" });
        return;
      }

      await storage.updateExitToken(token.id, { isUsed: true, usedAt: new Date() });
      await storage.createDoorAccessLog({ exitTokenId: token.id, result: "success" });

      const session = await storage.getSessionById(token.sessionId);
      if (session) {
        await storage.updateSession(session.id, { status: "exited", closedAt: new Date() });
        const table = await storage.getTableByNumber(session.tableId);
        if (table) {
          await storage.updateTable(table.id, { status: "available", activeSessionId: null });
        }
      }

      broadcast("exit_verified", { sessionId: token.sessionId, tokenId: token.id });

      res.json({
        valid: true,
        message: "Exit authorized. Door unlocked.",
        sessionId: token.sessionId,
        tableNumber: session?.tableId || null,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify exit token" });
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
      const tableId = parseInt(req.params.tableId);
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
