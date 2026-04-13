import { supabase } from "./supabase";

export interface MenuItemData {
  id: number;
  name: string;
  description: string;
  price: string;
  priceValue: number;
  variants: string[];
  addons: string[];
  badge: string;
  type: string;
  spiceLevel: number;
  isAvailable: boolean;
  prepTimeMinutes: number;
}

export interface MenuCategoryData {
  category: string;
  categoryId: number;
  items: MenuItemData[];
}

const toPriceLabel = (price: unknown, priceValue: unknown) => {
  if (typeof price === "string" && price.trim()) return price;
  const numeric = Number(priceValue);
  if (Number.isFinite(numeric) && numeric >= 0) {
    return numeric > 1000 ? `₹${Math.round(numeric / 100)}` : `₹${Math.round(numeric)}`;
  }
  return "₹0";
};

const toMenuItem = (row: Record<string, unknown>, fallbackId: number): MenuItemData => {
  const rawPriceValue = Number(row.priceValue ?? row.price_value ?? row.price);
  const safePriceValue = Number.isFinite(rawPriceValue)
    ? rawPriceValue > 0 && rawPriceValue < 1000
      ? Math.round(rawPriceValue * 100)
      : Math.round(rawPriceValue)
    : 0;

  return {
    id: Number(row.id) || fallbackId,
    name: String(row.name ?? "Untitled"),
    description: String(row.description ?? ""),
    price: toPriceLabel(row.price, row.priceValue ?? row.price_value ?? row.price),
    priceValue: safePriceValue,
    variants: Array.isArray(row.variants) ? (row.variants as string[]) : [],
    addons: Array.isArray(row.addons) ? (row.addons as string[]) : [],
    badge: String(row.badge ?? ""),
    type: String(row.type ?? "veg"),
    spiceLevel: Number(row.spiceLevel ?? row.spice_level ?? 0) || 0,
    isAvailable: row.isAvailable === false ? false : row.is_available === false ? false : true,
    prepTimeMinutes: Number(row.prepTimeMinutes ?? row.prep_time_minutes ?? 0) || 0,
  };
};

const normalizeMenu = (rows: unknown[]): MenuCategoryData[] => {
  const data = Array.isArray(rows) ? rows : [];
  if (data.length === 0) return [];

  const first = data[0] as Record<string, unknown>;
  if (Array.isArray(first.items)) {
    return data.map((cat, index) => {
      const category = cat as Record<string, unknown>;
      const items = Array.isArray(category.items) ? category.items : [];
      return {
        category: String(category.category ?? category.name ?? `Category ${index + 1}`),
        categoryId: Number(category.categoryId ?? category.category_id ?? category.id ?? index + 1),
        items: items.map((item, itemIndex) => toMenuItem(item as Record<string, unknown>, itemIndex + 1)),
      };
    });
  }

  const grouped = new Map<string, MenuCategoryData>();
  data.forEach((entry, index) => {
    const row = entry as Record<string, unknown>;
    const categoryName = String(row.category ?? row.category_name ?? "Menu");
    const categoryId = Number(row.categoryId ?? row.category_id ?? 1) || 1;
    const existing = grouped.get(categoryName);
    const item = toMenuItem(row, index + 1);

    if (existing) {
      existing.items.push(item);
      return;
    }

    grouped.set(categoryName, {
      category: categoryName,
      categoryId,
      items: [item],
    });
  });

  return Array.from(grouped.values());
};

export async function fetchMenuFromSupabase(): Promise<MenuCategoryData[]> {
  const { data, error } = await supabase
    .from("menu")
    .select("*");

  if (error) {
    throw error;
  }

  const formattedMenu = (data ?? []).map((item: Record<string, unknown>) => ({
    id: item.id,
    category: item.Category,
    name: item.Name,
    description: item.Description,
    price: item.Price,
    variants: item.Variants,
    addons: item.Addons,
    badge: item.Badge,
  }));

  console.log("FINAL MENU DATA:", formattedMenu);

  return normalizeMenu(formattedMenu);
}
