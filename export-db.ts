import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as fs from "fs";
import {
  menuCategories, menuItems, restaurantTables, diningSessions,
  orders, orderItems, payments, exitTokens, exitPins,
  doorAccessLogs, adminUsers
} from "./shared/schema.js";

const sqlite = new Database("kebabil.db");
const db = drizzle(sqlite);

const tables = [
  { name: "menu_categories", schema: menuCategories },
  { name: "menu_items", schema: menuItems },
  { name: "restaurant_tables", schema: restaurantTables },
  { name: "dining_sessions", schema: diningSessions },
  { name: "orders", schema: orders },
  { name: "order_items", schema: orderItems },
  { name: "payments", schema: payments },
  { name: "exit_tokens", schema: exitTokens },
  { name: "exit_pins", schema: exitPins },
  { name: "door_access_logs", schema: doorAccessLogs },
  { name: "admin_users", schema: adminUsers },
];

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

async function exportToCSV() {
  // Collect all data from all tables
  const allData: Array<{ table: string; record: any }> = [];
  const allColumns = new Set<string>();
  
  allColumns.add("table_name"); // Add table_name column

  for (const table of tables) {
    const data = await db.select().from(table.schema);
    
    for (const record of data) {
      allData.push({ table: table.name, record });
      Object.keys(record).forEach(col => allColumns.add(col));
    }
  }

  if (allData.length === 0) {
    console.log("No data found in any tables");
    return;
  }

  // Sort columns for consistent output
  const sortedColumns = Array.from(allColumns).sort();
  
  // Create CSV header
  const header = sortedColumns.map(col => `"${col}"`).join(",");
  
  // Create CSV rows
  const rows = allData.map(({ table, record }) => {
    return sortedColumns.map(col => {
      if (col === "table_name") {
        return `"${table}"`;
      }
      return escapeCSVValue(record[col]);
    }).join(",");
  }).join("\n");

  const csv = `${header}\n${rows}`;
  const filePath = "./database_export.csv";
  fs.writeFileSync(filePath, csv);
  
  console.log(`Exported all data to ${filePath}`);
  console.log(`Total records: ${allData.length}`);
  console.log(`Total columns: ${sortedColumns.length}`);
}

exportToCSV().catch(console.error);