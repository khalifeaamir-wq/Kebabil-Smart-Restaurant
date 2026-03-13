import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMenuItemSchema, insertMenuCategorySchema } from "@shared/schema";
import { broadcast } from "./websocket";
import crypto from "crypto";

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

  app.get("/api/orders/active", async (_req, res) => {
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

  app.patch("/api/orders/:id/status", async (req, res) => {
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

  return httpServer;
}
