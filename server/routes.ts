import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMenuItemSchema, insertMenuCategorySchema } from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

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
            variants: item.variants,
            addons: item.addons,
            badge: item.badge,
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

  return httpServer;
}
