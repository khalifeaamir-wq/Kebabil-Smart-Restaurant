import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const menuCategories = sqliteTable("menu_categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const menuItems = sqliteTable("menu_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  categoryId: integer("category_id").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  price: text("price").notNull(),
  priceValue: integer("price_value").notNull().default(0),
  variants: text("variants").notNull().default("[]"),
  addons: text("addons").notNull().default("[]"),
  badge: text("badge").notNull().default(""),
  imageUrl: text("image_url").notNull().default(""),
  type: text("type").notNull().default("non_veg"),
  spiceLevel: integer("spice_level").notNull().default(1),
  isAvailable: integer("is_available", { mode: "boolean" }).notNull().default(true),
  prepTimeMinutes: integer("prep_time_minutes").notNull().default(15),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const restaurantTables = sqliteTable("restaurant_tables", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableNumber: integer("table_number").notNull().unique(),
  capacity: integer("capacity").notNull().default(4),
  status: text("status").notNull().default("available"),
  activeSessionId: integer("active_session_id"),
});

export const diningSessions = sqliteTable("dining_sessions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  tableId: integer("table_id").notNull(),
  sessionCode: text("session_code").notNull().unique(),
  status: text("status").notNull().default("active"),
  openedAt: integer("opened_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  closedAt: integer("closed_at", { mode: "timestamp" }),
});

export const orders = sqliteTable("orders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull(),
  tableId: integer("table_id").notNull(),
  orderNumber: text("order_number").notNull(),
  status: text("status").notNull().default("new"),
  subtotal: integer("subtotal").notNull().default(0),
  tax: integer("tax").notNull().default(0),
  total: integer("total").notNull().default(0),
  notes: text("notes").notNull().default(""),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const orderItems = sqliteTable("order_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  menuItemId: integer("menu_item_id").notNull(),
  menuItemName: text("menu_item_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  itemNote: text("item_note").notNull().default(""),
  variant: text("variant").notNull().default(""),
});

export const payments = sqliteTable("payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull(),
  amount: integer("amount").notNull(),
  paymentMethod: text("payment_method").notNull().default("pending"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  transactionRef: text("transaction_ref").notNull().default(""),
  verifiedByAdminId: integer("verified_by_admin_id"),
  verifiedByName: text("verified_by_name").notNull().default(""),
  paidAt: integer("paid_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const exitTokens = sqliteTable("exit_tokens", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: integer("session_id").notNull(),
  paymentId: integer("payment_id").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  issuedAt: integer("issued_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  isUsed: integer("is_used", { mode: "boolean" }).notNull().default(false),
  usedAt: integer("used_at", { mode: "timestamp" }),
});

export const exitPins = sqliteTable("exit_pins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  orderId: integer("order_id").notNull(),
  tableId: integer("table_id").notNull(),
  paymentId: integer("payment_id").notNull(),
  pinHash: text("pin_hash").notNull(),
  pinCode: text("pin_code").notNull().default(""),
  status: text("status").notNull().default("active"), // active | used | expired
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(5),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
});

export const doorAccessLogs = sqliteTable("door_access_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  exitTokenId: integer("exit_token_id").notNull(),
  scanTime: integer("scan_time", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  result: text("result").notNull().default("success"),
  reason: text("reason").notNull().default(""),
});

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role").notNull().default("staff"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().default(sql`(unixepoch())`),
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
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
export const insertExitPinSchema = createInsertSchema(exitPins).omit({ id: true });
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
export type ExitPin = typeof exitPins.$inferSelect;
export type InsertExitPin = z.infer<typeof insertExitPinSchema>;
export type DoorAccessLog = typeof doorAccessLogs.$inferSelect;
export type InsertDoorAccessLog = z.infer<typeof insertDoorAccessLogSchema>;
export type AdminUser = typeof adminUsers.$inferSelect;
export type InsertAdminUser = z.infer<typeof insertAdminUserSchema>;
