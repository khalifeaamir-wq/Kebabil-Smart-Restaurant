import {
  type MenuCategory, type InsertMenuCategory,
  type MenuItem, type InsertMenuItem,
  menuCategories, menuItems,
} from "@shared/schema";
import { eq, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

export interface IStorage {
  getMenuCategories(): Promise<MenuCategory[]>;
  getMenuItems(): Promise<MenuItem[]>;
  getMenuItemsByCategory(categoryId: number): Promise<MenuItem[]>;
  createMenuCategory(cat: InsertMenuCategory): Promise<MenuCategory>;
  createMenuItem(item: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(id: number, item: Partial<InsertMenuItem>): Promise<MenuItem | undefined>;
  deleteMenuItem(id: number): Promise<boolean>;
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
}

export const storage = new DatabaseStorage();
