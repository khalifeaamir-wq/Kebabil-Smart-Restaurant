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

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  transactionRef: text("transaction_ref").notNull().default(""),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const exitTokens = pgTable("exit_tokens", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull(),
  paymentId: integer("payment_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  isUsed: boolean("is_used").notNull().default(false),
  usedAt: timestamp("used_at"),
});

export const doorAccessLogs = pgTable("door_access_logs", {
  id: serial("id").primaryKey(),
  exitTokenId: integer("exit_token_id").notNull(),
  scanTime: timestamp("scan_time").notNull().defaultNow(),
  result: text("result").notNull().default("success"),
  reason: text("reason").notNull().default(""),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("staff"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

export const insertAdminUserSchema = createInsertSchema(adminUsers).omit({ id: true, createdAt: true, lastLoginAt: true });

export const insertMenuCategorySchema = createInsertSchema(menuCategories).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export const insertTableSchema = createInsertSchema(restaurantTables).omit({ id: true });
export const insertSessionSchema = createInsertSchema(diningSessions).omit({ id: true });
export const insertOrderSchema = createInsertSchema(orders).omit({ id: true });
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true });
export const insertExitTokenSchema = createInsertSchema(exitTokens).omit({ id: true });
export const insertDoorAccessLogSchema = createInsertSchema(doorAccessLogs).omit({ id: true });

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
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type ExitToken = typeof exitTokens.$inferSelect;
export type InsertExitToken = z.infer<typeof insertExitTokenSchema>;
export type DoorAccessLog = typeof doorAccessLogs.$inferSelect;
export type InsertDoorAccessLog = z.infer<typeof insertDoorAccessLogSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
