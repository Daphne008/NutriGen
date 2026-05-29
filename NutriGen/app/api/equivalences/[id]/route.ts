import { NextResponse } from "next/server";
import { getFoodData } from "@/lib/foodData";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const foodId = Number(params.id);
  const foodSeeds = getFoodData();
  
  const foodA = foodSeeds.find(f => f.id === foodId);
  if (!foodA) {
    return NextResponse.json({ success: false, error: "Food not found" }, { status: 404 });
  }

  // 1. Category Matching: find foods in same category (exclude self)
  let candidates = foodSeeds.filter(f => f.category === foodA.category && f.id !== foodA.id);

  // If no candidates in same category, just take everything (fallback)
  if (candidates.length === 0) {
    candidates = foodSeeds.filter(f => f.id !== foodA.id);
  }

  // 2. Caloric Proximity Sorting
  candidates.sort((a, b) => {
    const diffA = Math.abs(a.calories - foodA.calories);
    const diffB = Math.abs(b.calories - foodA.calories);
    return diffA - diffB;
  });

  // 3. Take top 5
  const topMatches = candidates.slice(0, 5);

  // 4. Map to FoodEquivalence format
  const mapped = topMatches.map((foodB, index) => {
    // Prevent divide by zero if foodB has 0 calories
    const ratio = foodB.calories > 0 ? (foodA.calories / foodB.calories) : 1;
    
    return {
      id: Number(`${foodA.id}${foodB.id}${index}`), // Unique ID for React keys
      foodAId: foodA.id,
      foodBId: foodB.id,
      equivalentRatio: Number(ratio.toFixed(2)),
      group: foodA.category.toLowerCase(),
      foodA,
      foodB
    };
  });

  return NextResponse.json({ success: true, data: mapped });
}
