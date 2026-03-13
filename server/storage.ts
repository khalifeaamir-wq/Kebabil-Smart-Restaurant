import {
  type MenuCategory, type InsertMenuCategory,
  type MenuItem, type InsertMenuItem,
  type RestaurantTable, type InsertTable,
  type DiningSession, type InsertSession,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  menuCategories, menuItems,
  restaurantTables, diningSessions, orders, orderItems,
} from "@shared/schema";
import { eq, asc, desc, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

export interface IStorage {
  getMenuCategories(): Promise<MenuCategory[]>;
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]>;
  getMenuItemById(id: number): Promise<MenuItem | undefined>;
  createMenuCategory(cat: InsertMenuCategory): Promise<MenuCategory>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;

  getTables(): Promise<RestaurantTable[]>;
  getTableByNumber(tableNumber: number): Promise<RestaurantTable | undefined>;
  createTable(table: InsertTable): Promise<RestaurantTable>;
  updateTable(id: number, data: Partial<InsertTable>): Promise<RestaurantTable | undefined>;

  createSession(session: InsertSession): Promise<DiningSession>;
  getSessionById(id: number): Promise<DiningSession | undefined>;
  getSessionByCode(code: string): Promise<DiningSession | undefined>;
  getActiveSessionForTable(tableId: number): Promise<DiningSession | undefined>;
  updateSession(id: number, data: Partial<InsertSession>): Promise<DiningSession | undefined>;

  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersBySession(sessionId: number): Promise<Order[]>;
  getActiveOrders(): Promise<Order[]>;
  updateOrder(id: number, data: Partial<InsertOrder>): Promise<Order | undefined>;

  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItemsByOrder(orderId: number): Promise<OrderItem[]>;
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool);

export class DatabaseStorage implements IStorage {
  async getMenuCategories(): Promise<MenuCategory[]> {
    return db.select().from(menuCategories).orderBy(asc(menuCategories.sortOrder));
  }

  async getMenuItems(): Promise<MenuItem[]> {
    return db.select().from(menuItems).orderBy(asc(menuItems.sortOrder));
  }

  async getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]> {
    return db.select().from(menuItems).where(eq(menuItems.categoryId, categoryId)).orderBy(asc(menuItems.sortOrder));
  }

  async getMenuItemById(id: number): Promise<MenuItem | undefined> {
    const [item] = await db.select().from(menuItems).where(eq(menuItems.id, id));
    return item;
  }

  async createMenuCategory(cat: InsertMenuCategory): Promise<MenuCategory> {
    const [created] = await db.insert(menuCategories).values(cat).returning();
    return created;
  }

  async createMenuItem(item: InsertMenuItem): Promise<MenuItem> {
    const [created] = await db.insert(menuItems).values(item).returning();
    return created;
  }

  async updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined> {
    const [updated] = await db.update(menuItems).set(item).where(eq(menuItems.id, id)).returning();
    return updated;
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
}

export const storage = new DatabaseStorage();
