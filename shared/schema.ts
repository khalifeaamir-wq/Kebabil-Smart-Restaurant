import { sql } from "drizzle-orm";
import { pgTable, text, varchar, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const menuCategories = pgTable("menu_categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const menuItems = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: text("price").notNull(),
  priceValue: integer("price_value").notNull().default(0),
  variants: text("variants").array().notNull().default(sql`'{}'::text[]`),
  addons: text("addons").array().notNull().default(sql`'{}'::text[]`),
  badge: text("badge").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  type: text("type").notNull().default("non_veg"),
  spiceLevel: integer("spice_level").notNull().default(1),
  isAvailable: boolean("is_available").notNull().default(true),
  prepTimeMinutes: integer("prep_time_minutes").notNull().default(15),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
});

export const restaurantTables = pgTable("restaurant_tables", {
  id: serial("id").primaryKey(),
  tableNumber: integer("table_number").notNull().unique(),
  status: text("status").notNull().default("available"),
  activeSessionId: integer("active_session_id"),
});

export const diningSessions = pgTable("dining_sessions", {
  id: serial("id").primaryKey(),
  tableId: integer("table_id").notNull(),
  sessionCode: text("session_code").notNull().unique(),
  status: text("status").notNull().default("active"),
  openedAt: timestamp("opened_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  tableId: integer("table_id").notNull(),
  orderNumber: text("order_number").notNull(),
  status: text("status").notNull().default("new"),
  subtotal: integer("subtotal").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  total: integer("total").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  menuItemName: text("menu_item_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  itemNote: text("item_note").notNull().default(""),
  variant: text("variant").notNull().default(""),
});

export const insertMenuCategorySchema = createInsertSchema(menuCategories).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export const insertTableSchema = createInsertSchema(restaurantTables).omit({ id: true });
export const insertSessionSchema = createInsertSchema(diningSessions).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });

export type MenuCategory = typeof menuCategories.$inferSelect;
export type InsertMenuCategory = z.infer<typeof insertMenuCategorySchema>;
export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type RestaurantTable = typeof restaurantTables.$inferSelect;
export type InsertTable = z.infer<typeof insertTableSchema>;
export type DiningSession = typeof diningSessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
