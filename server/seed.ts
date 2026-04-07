import { db } from "./storage.js";
import { menuCategories, menuItems, restaurantTables } from "../shared/schema.js";

const menuData = [
  {
    category: "Signature Kebabs",
    items: [
      { name: "Arabic Shawarma", description: "Authentic Middle Eastern spiced chicken, slow-roasted and thinly sliced, wrapped in fresh pita with garlic toum.", price: "₹249", priceValue: 24900, variants: ["Chicken", "Mutton"], addons: ["Extra Cheese", "Extra Toum"], badge: "MUST TRY", type: "non_veg", spiceLevel: 2, prepTimeMinutes: 12 },
      { name: "Angara Shawarma", description: "Spicy Indian-fusion shawarma with fiery charcoal-smoked marinade and mint chutney.", price: "₹229", priceValue: 22900, variants: ["Chicken", "Paneer"], addons: ["Extra Spicy", "Cheese"], badge: "HOT", type: "non_veg", spiceLevel: 4, prepTimeMinutes: 12 },
      { name: "Peshawari Kebab", description: "Tender morsels of meat marinated in rich cream, cashew paste, and mild Peshawari spices, grilled to perfection.", price: "₹349", priceValue: 34900, variants: ["Chicken", "Mutton"], addons: [], badge: "MUST TRY", type: "non_veg", spiceLevel: 2, prepTimeMinutes: 18 },
      { name: "Changezi Kebab", description: "Bold, rustic flavors from the streets of Old Delhi, marinated in yogurt and fiery red chilies.", price: "₹329", priceValue: 32900, variants: ["Chicken"], addons: [], badge: "", type: "non_veg", spiceLevel: 4, prepTimeMinutes: 18 },
    ],
  },
  {
    category: "Seekh Kebabs",
    items: [
      { name: "Mutton Seekh Kebab", description: "Minced mutton blended with aromatic spices, fresh coriander, and green chilies, skewered and char-grilled.", price: "₹399", priceValue: 39900, variants: ["Mutton"], addons: ["Roomali Roti"], badge: "MUST TRY", type: "non_veg", spiceLevel: 3, prepTimeMinutes: 20 },
      { name: "Chicken Seekh Kebab", description: "Succulent minced chicken skewers with a delicate blend of cumin, ginger, and garlic.", price: "₹349", priceValue: 34900, variants: ["Chicken"], addons: ["Roomali Roti"], badge: "", type: "non_veg", spiceLevel: 2, prepTimeMinutes: 18 },
    ],
  },
  {
    category: "Tandoori (Half)",
    items: [
      { name: "Tandoori Chicken", description: "The classic. Half chicken marinated in yogurt, Kashmiri chili, and secret spices, roasted in the tandoor.", price: "₹399", priceValue: 39900, variants: ["Chicken"], addons: [], badge: "MUST TRY", type: "non_veg", spiceLevel: 3, prepTimeMinutes: 25 },
      { name: "Afghani Chicken", description: "Creamy, mildly spiced half chicken roasted over charcoal, infused with cardamom and fenugreek.", price: "₹429", priceValue: 42900, variants: ["Chicken"], addons: [], badge: "", type: "non_veg", spiceLevel: 1, prepTimeMinutes: 25 },
    ],
  },
  {
    category: "Gravy & Rice",
    items: [
      { name: "Butter Chicken", description: "Char-grilled chicken tikka simmered in a rich, velvety tomato and butter gravy.", price: "₹449", priceValue: 44900, variants: ["Chicken", "Paneer"], addons: ["Garlic Naan"], badge: "MUST TRY", type: "non_veg", spiceLevel: 2, prepTimeMinutes: 20 },
      { name: "Yemeni Mandi", description: "Aromatic long-grain basmati rice slow-cooked with proprietary Middle Eastern spices and tender slow-roasted meat.", price: "₹599", priceValue: 59900, variants: ["Chicken", "Mutton"], addons: ["Extra Rice", "Spicy Salsa"], badge: "MUST TRY", type: "non_veg", spiceLevel: 2, prepTimeMinutes: 30 },
    ],
  },
  {
    category: "Breads",
    items: [
      { name: "Roomali Roti", description: "Paper-thin soft bread, perfect for wrapping and dipping.", price: "₹40", priceValue: 4000, variants: [], addons: [], badge: "", type: "veg", spiceLevel: 0, prepTimeMinutes: 5 },
      { name: "Garlic Naan", description: "Tandoor-baked flatbread brushed with butter and minced garlic.", price: "₹70", priceValue: 7000, variants: [], addons: [], badge: "", type: "veg", spiceLevel: 0, prepTimeMinutes: 8 },
    ],
  },
];

export async function seedIfEmpty() {
  console.log("Checking menu data...");

  const existingCategories = await db.select().from(menuCategories);
  if (existingCategories.length > 0) {
    console.log("Menu data already exists, skipping seed.");
  } else {
    console.log("Seeding menu data...");
    for (let i = 0; i < menuData.length; i++) {
      const catData = menuData[i];
      const [cat] = await db.insert(menuCategories).values({ name: catData.category, sortOrder: i }).returning();

      for (let j = 0; j < catData.items.length; j++) {
        const item = catData.items[j];
        await db.insert(menuItems).values({
          categoryId: cat.id,
          name: item.name,
          description: item.description,
          price: item.price,
          priceValue: item.priceValue,
          variants: JSON.stringify(item.variants),
          addons: JSON.stringify(item.addons),
          badge: item.badge,
          type: item.type,
          spiceLevel: item.spiceLevel,
          prepTimeMinutes: item.prepTimeMinutes,
          sortOrder: j,
        });
      }
    }
    console.log("Menu seeded successfully!");
  }

  const existingTables = await db.select().from(restaurantTables);
  if (existingTables.length === 0) {
    console.log("Seeding restaurant tables...");
    for (let i = 1; i <= 15; i++) {
      await db.insert(restaurantTables).values({ tableNumber: i, status: "available" });
    }
    console.log("Tables seeded successfully!");
  }
}
