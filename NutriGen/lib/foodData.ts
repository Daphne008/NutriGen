import fs from "fs";
import path from "path";
import type { Food } from "@/lib/types";

function inferCategory(desc: string): string {
  const d = desc.toLowerCase();
  if (/beef|chicken|pork|turkey|lamb|fish|salmon|tuna|shrimp|meat|bacon|sausage|steak/i.test(d)) return "Protein";
  if (/milk|cheese|yogurt|butter|cream|whey/i.test(d)) return "Dairy";
  if (/apple|banana|orange|grape|berry|melon|fruit|peach|pear|plum|cherry/i.test(d)) return "Fruit";
  if (/broccoli|carrot|spinach|lettuce|onion|garlic|tomato|potato|vegetable|pepper|celery|salad|corn|pea/i.test(d)) return "Vegetable";
  if (/rice|bread|pasta|noodle|oat|cereal|wheat|grain|flour|bun|crust/i.test(d)) return "Grain";
  if (/bean|lentil|chickpea|soy|tofu|edamame/i.test(d)) return "Legume";
  if (/nut|almond|peanut|walnut|seed|pecan|cashew/i.test(d)) return "Nuts/Seeds";
  if (/oil|fat|dressing|mayo|margarine/i.test(d)) return "Fat/Oil";
  if (/sugar|candy|syrup|chocolate|cookie|cake|pie|pastry|muffin|brownie|dessert|ice cream/i.test(d)) return "Sweet";
  if (/water|juice|soda|coffee|tea|beverage|drink|beer|wine|liquor/i.test(d)) return "Beverage";
  return "General";
}

let loadedFoods: Food[] | null = null;

export function getFoodData(): Food[] {
  if (loadedFoods) return loadedFoods;

  try {
    const filePath = path.join(process.cwd(), '..', 'foods_clean.json');
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const rawData = JSON.parse(fileContents);
    
    loadedFoods = rawData.map((item: any) => ({
      id: item.id,
      name: item.description,
      category: inferCategory(item.description),
      calories: item.calories,
      protein: item.protein_g,
      fat: item.fat_g,
      carbs: item.carbs_g,
      portionGram: 100 // Data is per 100g
    }));
    return loadedFoods!;
  } catch (error) {
    console.error("Failed to load foods_clean.json:", error);
    return [];
  }
}
