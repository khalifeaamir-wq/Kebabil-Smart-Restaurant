import fs from "fs";
import path from "path";
import csv from "csv-parse/sync";
import { db, storage } from "./storage";
import { menuCategories, menuItems } from "../shared/schema";
import { eq } from "drizzle-orm";

interface MenuRow {
  Category: string;
  Name: string;
  Description: string;
  Price: string;
  Variants: string;
  Addons: string;
  Badge: string;
}

async function importMenuFromCSV() {
  try {
    console.log("Reading CSV file...");
    const csvPath = path.join(process.cwd(), "menu_items.csv");
    const fileContent = fs.readFileSync(csvPath, "utf-8");

    const records = csv.parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    }) as MenuRow[];

    console.log(`Found ${records.length} menu items to import`);

    // Group items by category
    const categoriesMap = new Map<
      string,
      MenuRow[]
    >();
    for (const record of records) {
      if (!categoriesMap.has(record.Category)) {
        categoriesMap.set(record.Category, []);
      }
      categoriesMap.get(record.Category)!.push(record);
    }

    console.log(`Found ${categoriesMap.size} categories`);

    // Insert categories and items
    let itemCount = 0;
    for (const [categoryName, items] of categoriesMap.entries()) {
      console.log(`\nProcessing category: ${categoryName}`);

      // Check if category exists
      const existingCategory = db
        .select()
        .from(menuCategories)
        .where(eq(menuCategories.name, categoryName))
        .get();

      let categoryId: number;
      if (existingCategory) {
        categoryId = existingCategory.id;
        console.log(`  Category already exists (ID: ${categoryId})`);
      } else {
        const result = db
          .insert(menuCategories)
          .values({
            name: categoryName,
            sortOrder: Array.from(categoriesMap.keys()).indexOf(categoryName),
            isActive: true,
          })
          .run();
        categoryId = result.lastInsertRowid as number;
        console.log(`  Created new category (ID: ${categoryId})`);
      }

      // Insert menu items
      for (const item of items) {
        const priceValue = parseInt(item.Price) || 0;
        const variants = item.Variants
          ? item.Variants.split("|").map((v) => v.trim())
          : [];
        const addons = item.Addons
          ? item.Addons.split("|").map((a) => a.trim())
          : [];

        db.insert(menuItems)
          .values({
            categoryId,
            name: item.Name,
            description: item.Description,
            price: `₹${item.Price}`,
            priceValue,
            variants: JSON.stringify(variants),
            addons: JSON.stringify(addons),
            badge: item.Badge || "",
            type: "non_veg",
            spiceLevel: 1,
            isAvailable: true,
            prepTimeMinutes: 15,
            sortOrder: items.indexOf(item),
            isActive: true,
          })
          .run();

        itemCount++;
        console.log(`  ✓ Added: ${item.Name} (₹${item.Price})`);
      }
    }

    console.log(`\n✅ Successfully imported ${itemCount} menu items!`);
  } catch (error) {
    console.error("❌ Error importing CSV:", error);
    process.exit(1);
  }
}

importMenuFromCSV();
