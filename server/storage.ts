import {
  type MenuCategory, type InsertMenuCategory,
  type MenuItem, type InsertMenuItem,
  type RestaurantTable, type InsertTable,
  type DiningSession, type InsertSession,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Payment, type InsertPayment,
  type ExitToken, type InsertExitToken,
  type ExitPin, type InsertExitPin,
  type DoorAccessLog, type InsertDoorAccessLog,
  type AdminUser, type InsertAdminUser,
  menuCategories, menuItems,
  restaurantTables, diningSessions, orders, orderItems,
  payments, exitTokens, exitPins, doorAccessLogs, adminUsers,
} from "../shared/schema.js";
import { eq, asc, desc, and, inArray, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";

const sqlite = new Database("kebabil.db");
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS exit_pins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    table_id INTEGER NOT NULL,
    payment_id INTEGER NOT NULL,
    pin_hash TEXT NOT NULL,
    pin_code TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'active',
    expires_at INTEGER NOT NULL,
    used_at INTEGER,
    attempts INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    created_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
  CREATE INDEX IF NOT EXISTS idx_exit_pins_table_status ON exit_pins(table_id, status);
  CREATE INDEX IF NOT EXISTS idx_exit_pins_order ON exit_pins(order_id);
`);

const paymentColumns = sqlite.prepare("PRAGMA table_info(payments)").all() as Array<{ name: string }>;
if (!paymentColumns.some((c) => c.name === "verified_by_admin_id")) {
  sqlite.exec("ALTER TABLE payments ADD COLUMN verified_by_admin_id INTEGER");
}
if (!paymentColumns.some((c) => c.name === "verified_by_name")) {
  sqlite.exec("ALTER TABLE payments ADD COLUMN verified_by_name TEXT NOT NULL DEFAULT ''");
}

const exitPinColumns = sqlite.prepare("PRAGMA table_info(exit_pins)").all() as Array<{ name: string }>;
if (!exitPinColumns.some((c) => c.name === "pin_code")) {
  sqlite.exec("ALTER TABLE exit_pins ADD COLUMN pin_code TEXT NOT NULL DEFAULT ''");
}
export const db = drizzle(sqlite);

export class DatabaseStorage {
  async getMenuCategories(): Promise<MenuCategory[]> {
    return db.select().from(menuCategories).orderBy(asc(menuCategories.sortOrder));
  }
  async getMenuItems(): Promise<MenuItem[]> {
    const items = await db.select().from(menuItems).orderBy(asc(menuItems.sortOrder));
    return items.map(item => ({ ...item, variants: JSON.parse(item.variants), addons: JSON.parse(item.addons) }));
  }
  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    const items = await db.select().from(menuItems).where(eq(menuItems.categoryId, categoryId)).orderBy(asc(menuItems.sortOrder));
    return items.map(item => ({ ...item, variants: JSON.parse(item.variants), addons: JSON.parse(item.addons) }));
  }
  async getMenuItemById(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    if (item) {
      return { ...item, variants: JSON.parse(item.variants), addons: JSON.parse(item.addons) };
    }
    return undefined;
  }
  async createMenuCategory(cat: InsertMenuCategory): Promise<MenuCategory> {
    const [created] = await db.insert(menuCategories).values(cat).returning();
    return created;
  }
  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const itemToInsert = { ...item, variants: JSON.stringify(item.variants), addons: JSON.stringify(item.addons) };
    const [created] = await db.insert(menuItems).values(itemToInsert).returning();
    return { ...created, variants: JSON.parse(created.variants), addons: JSON.parse(created.addons) };
  }
  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const itemToUpdate = { ...item };
    if (item.variants) itemToUpdate.variants = JSON.stringify(item.variants);
    if (item.addons) itemToUpdate.addons = JSON.stringify(item.addons);
    const [updated] = await db.update(menuItems).set(itemToUpdate).where(eq(menuItems.id, id)).returning();
    if (updated) {
      return { ...updated, variants: JSON.parse(updated.variants), addons: JSON.parse(updated.addons) };
    }
    return undefined;
  }
  async deleteMenuItem(id: number): Promise<boolean> {
    const result = await db.delete(menuItems).where(eq(menuItems.id, id)).returning();
    return result.length > 0;
  }

  async getTables(): Promise<RestaurantTable[]> {
    return db.select().from(restaurantTables).orderBy(asc(restaurantTables.tableNumber));
  }
  async getTableByNumber(tableNumber: number): Promise<RestaurantTable | undefined> {
    const [table] = await db.select().from(restaurantTables).where(eq(restaurantTables.tableNumber, tableNumber));
    return table;
  }
  async getTableById(id: number): Promise<RestaurantTable | undefined> {
    const [table] = await db.select().from(restaurantTables).where(eq(restaurantTables.id, id));
    return table;
  }
  async createTable(table: InsertTable): Promise<RestaurantTable> {
    const [created] = await db.insert(restaurantTables).values(table).returning();
    return created;
  }
  async updateTable(id: number, data: Partial<InsertTable>): Promise<RestaurantTable | undefined> {
    const [updated] = await db.update(restaurantTables).set(data).where(eq(restaurantTables.id, id)).returning();
    return updated;
  }

  async createSession(session: InsertSession): Promise<DiningSession> {
    const [created] = await db.insert(diningSessions).values(session).returning();
    return created;
  }
  async getSessionById(id: number): Promise<DiningSession | undefined> {
    const [session] = await db.select().from(diningSessions).where(eq(diningSessions.id, id));
    return session;
  }
  async getSessionByCode(code: string): Promise<DiningSession | undefined> {
    const [session] = await db.select().from(diningSessions).where(eq(diningSessions.sessionCode, code));
    return session;
  }
  async getActiveSessionForTable(tableId: number): Promise<DiningSession | undefined> {
    const [session] = await db.select().from(diningSessions)
      .where(and(eq(diningSessions.tableId, tableId), eq(diningSessions.status, "active")));
    return session;
  }
  async updateSession(id: number, data: Partial<InsertSession>): Promise<DiningSession | undefined> {
    const [updated] = await db.update(diningSessions).set(data).where(eq(diningSessions.id, id)).returning();
    return updated;
  }

  async createOrder(order: InsertOrder): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    return created;
  }
  async getOrderById(id: number): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  async getOrdersBySession(sessionId: number): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.sessionId, sessionId)).orderBy(desc(orders.createdAt));
  }
  async getActiveOrders(): Promise<Order[]> {
    return db.select().from(orders)
      .where(inArray(orders.status, ["new", "accepted", "preparing", "ready"]))
      .orderBy(asc(orders.createdAt));
  }
  async updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ ...data, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const [created] = await db.insert(orderItems).values(item).returning();
    return created;
  }
  async getOrderItemsByOrder(orderId: number): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }

  async createPayment(payment: InsertPayment): Promise<Payment> {
    const [created] = await db.insert(payments).values(payment).returning();
    return created;
  }
  async getPaymentById(id: number): Promise<Payment | undefined> {
    const [p] = await db.select().from(payments).where(eq(payments.id, id));
    return p;
  }
  async getPaymentsBySession(sessionId: number): Promise<Payment[]> {
    return db.select().from(payments).where(eq(payments.sessionId, sessionId)).orderBy(desc(payments.createdAt));
  }
  async updatePayment(id: number, data: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [updated] = await db.update(payments).set(data).where(eq(payments.id, id)).returning();
    return updated;
  }

  async createExitToken(token: InsertExitToken): Promise<ExitToken> {
    const [created] = await db.insert(exitTokens).values(token).returning();
    return created;
  }
  async getExitTokenByHash(hash: string): Promise<ExitToken | undefined> {
    const [token] = await db.select().from(exitTokens).where(eq(exitTokens.tokenHash, hash));
    return token;
  }
  async getExitTokenBySession(sessionId: number): Promise<ExitToken | undefined> {
    const [token] = await db.select().from(exitTokens)
      .where(and(eq(exitTokens.sessionId, sessionId), eq(exitTokens.isUsed, false)))
      .orderBy(desc(exitTokens.issuedAt));
    return token;
  }
  async updateExitToken(id: number, data: Partial<InsertExitToken>): Promise<ExitToken | undefined> {
    const [updated] = await db.update(exitTokens).set(data).where(eq(exitTokens.id, id)).returning();
    return updated;
  }

  async createExitPin(pin: InsertExitPin): Promise<ExitPin> {
    const [created] = await db.insert(exitPins).values(pin).returning();
    return created;
  }
  async getLatestExitPinByTable(tableId: number): Promise<ExitPin | undefined> {
    const [pin] = await db.select().from(exitPins).where(eq(exitPins.tableId, tableId)).orderBy(desc(exitPins.createdAt));
    return pin;
  }
  async getActiveExitPinsByTable(tableId: number): Promise<ExitPin[]> {
    return db.select().from(exitPins)
      .where(and(eq(exitPins.tableId, tableId), eq(exitPins.status, "active")))
      .orderBy(desc(exitPins.createdAt));
  }
  async expireActiveExitPinsByTable(tableId: number): Promise<void> {
    await db.update(exitPins)
      .set({ status: "expired" })
      .where(and(eq(exitPins.tableId, tableId), eq(exitPins.status, "active")));
  }
  async updateExitPin(id: number, data: Partial<InsertExitPin>): Promise<ExitPin | undefined> {
    const [updated] = await db.update(exitPins).set(data).where(eq(exitPins.id, id)).returning();
    return updated;
  }

  async createDoorAccessLog(log: InsertDoorAccessLog): Promise<DoorAccessLog> {
    const [created] = await db.insert(doorAccessLogs).values(log).returning();
    return created;
  }
  async getDoorAccessLogs(): Promise<DoorAccessLog[]> {
    return db.select().from(doorAccessLogs).orderBy(desc(doorAccessLogs.scanTime));
  }

  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  async getAllSessions(): Promise<DiningSession[]> {
    return db.select().from(diningSessions).orderBy(desc(diningSessions.openedAt));
  }
  async getAllPayments(): Promise<Payment[]> {
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }
  async getAllOrderItems(): Promise<OrderItem[]> {
    return db.select().from(orderItems);
  }

  async getAdminByUsername(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }
  async getAdminById(id: number): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.id, id));
    return user;
  }
  async createAdminUser(data: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db.insert(adminUsers).values(data).returning();
    return user;
  }
  async updateAdminUser(id: number, data: Partial<InsertAdminUser>): Promise<AdminUser | undefined> {
    const [user] = await db.update(adminUsers).set(data).where(eq(adminUsers.id, id)).returning();
    return user;
  }
  async updateAdminLastLogin(id: number): Promise<void> {
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, id));
  }
  async getAdminUsers(): Promise<AdminUser[]> {
    return db.select().from(adminUsers).orderBy(asc(adminUsers.username));
  }
  async getAdminCount(): Promise<number> {
    const result = await db.select().from(adminUsers);
    return result.length;
  }
}

export const storage = new DatabaseStorage();
