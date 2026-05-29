import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getFoodData } from "@/lib/foodData";
import { evaluateDietPlan } from "@/lib/dietEvaluation";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const planId = Number(params.id);
    const plan = await prisma.dietPlan.findUnique({
      where: { id: planId },
      include: {
        DietPlanItem: true,
        PatientReport: true
      }
    });

    if (!plan) {
      return NextResponse.json({ success: false, error: "Diet plan not found." }, { status: 404 });
    }

    const foodSeeds = getFoodData();
    const items = plan.DietPlanItem.map((item, i) => {
      const food = foodSeeds.find(f => f.id === item.foodId) || foodSeeds[0];
      return {
        ...item,
        food
      };
    });

    const evaluatedFoods = items.map((item) => ({
      calories: item.food.calories,
      protein: item.food.protein,
      carbs: item.food.carbs,
      fat: item.food.fat,
      portionMultiplier: item.portionMultiplier
    }));

    const reportData = plan.PatientReport?.data as any;
    const requiredCalories = reportData?.requiredCalories || 2000;
    const macroTargets = reportData?.macroTargets;

    const evaluation = evaluateDietPlan({
      foods: evaluatedFoods,
      requiredCalories,
      macroTargets
    });

    const populatedPlan = {
      ...plan,
      items,
      patientReport: plan.PatientReport,
      evaluation
    };

    return NextResponse.json({ success: true, data: populatedPlan });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
