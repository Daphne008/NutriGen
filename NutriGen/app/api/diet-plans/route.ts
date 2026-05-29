import { NextResponse } from "next/server";
import { getFoodData } from "@/lib/foodData";
import prisma from "@/lib/prisma";

import { evaluateDietPlan } from "@/lib/dietEvaluation";

export async function POST(req: Request) {
  try {
    const foodSeeds = getFoodData();
    const body = await req.json();
    const { patientCategory, patientReportId, items } = body;
    
    const patientReport = patientReportId ? await prisma.patientReport.findUnique({ where: { id: patientReportId } }) : null;
    const reportData = patientReport?.data as any;
    const requiredCalories = reportData?.requiredCalories || 2000;
    const macroTargets = reportData?.macroTargets;

    const populatedItems = (items || []).map((item: any, i: number) => {
      const food = foodSeeds.find(f => f.id === item.foodId) || foodSeeds[0];
      return {
        id: i + 1,
        dietPlanId: 0,
        ...item,
        food
      };
    });

    const evaluatedFoods = populatedItems.map((item: any) => ({
      calories: item.food.calories,
      protein: item.food.protein,
      carbs: item.food.carbs,
      fat: item.food.fat,
      portionMultiplier: Number(item.portionMultiplier || 1)
    }));

    const evaluation = evaluateDietPlan({
      foods: evaluatedFoods,
      requiredCalories,
      macroTargets
    });

    const user = await prisma.user.findFirst();
    if (!user) throw new Error("No user found in database");

    const plan = await prisma.dietPlan.create({
      data: {
        userId: user.id,
        patientReportId: patientReportId || null,
        patientCategory: patientCategory || "PEDIATRIC",
        requiredCalories,
        totalCalories: evaluation.totals.calories,
        totalProtein: evaluation.totals.protein,
        totalCarbs: evaluation.totals.carbs,
        totalFat: evaluation.totals.fat,
        score: evaluation.score,
        DietPlanItem: {
          create: items.map((item: any) => ({
            foodId: item.foodId,
            mealType: item.mealType,
            snackSlot: item.snackSlot,
            portionMultiplier: Number(item.portionMultiplier || 1)
          }))
        }
      }
    });

    return NextResponse.json({ success: true, data: { id: plan.id } });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
