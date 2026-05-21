import { MealType, PatientCategory } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../config/db";
import { defaultAgeForCategory, getDietAccuracyFlags } from "../services/accuracyService";
import { evaluateDietPlan } from "../services/dietEvaluationService";

const router = Router();

type CreateDietPlanPayload = {
  patientCategory: PatientCategory;
  requiredCalories?: number;
  patientReportId?: number;
  items: Array<{
    foodId: number;
    mealType: MealType;
    portionMultiplier?: number;
  }>;
};

router.post("/diet-plans", async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }

    const payload = req.body as CreateDietPlanPayload;
    if (!payload?.items?.length || !payload.patientCategory) {
      res.status(400).json({ success: false, error: "patientCategory and items are required." });
      return;
    }

    const foodIds = [...new Set(payload.items.map((item) => Number(item.foodId)))];
    const foods = await prisma.food.findMany({ where: { id: { in: foodIds } } });
    const foodById = new Map(foods.map((food) => [food.id, food]));

    const patientReport = payload.patientReportId
      ? await prisma.patientReport.findFirst({
          where: { id: Number(payload.patientReportId), userId: req.user.id }
        })
      : null;

    const requiredCalories =
      payload.requiredCalories ??
      Number((patientReport?.data as { requiredCalories?: number } | null)?.requiredCalories ?? 2000);

    const macroTargets = (patientReport?.data as { macroTargets?: { proteinPercent: number; carbsPercent: number; fatPercent: number } } | null)
      ?.macroTargets;

    const evaluatedFoods = payload.items.map((item) => {
      const food = foodById.get(Number(item.foodId));
      if (!food) {
        throw new Error(`Food with id ${item.foodId} not found.`);
      }
      return {
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        portionMultiplier: Number(item.portionMultiplier ?? 1)
      };
    });

    const evaluation = evaluateDietPlan({
      foods: evaluatedFoods,
      requiredCalories,
      macroTargets
    });

    const reportData = patientReport?.data as {
      age?: number;
      bmi?: number;
      bloodGlucose?: number;
      healthRisks?: string[];
    } | null;

    const accuracyFlags = getDietAccuracyFlags(
      {
        patientCategory: payload.patientCategory,
        age: reportData?.age ?? defaultAgeForCategory(payload.patientCategory),
        bmi: reportData?.bmi ?? 25,
        bloodGlucose: reportData?.bloodGlucose ?? 100,
        healthRisks: reportData?.healthRisks ?? [],
        requiredCalories
      },
      payload.items.map((item) => {
        const food = foodById.get(Number(item.foodId))!;
        return {
          name: food.name,
          category: food.category,
          calories: food.calories,
          carbs: food.carbs,
          fat: food.fat,
          portionMultiplier: Number(item.portionMultiplier ?? 1)
        };
      })
    );

    const created = await prisma.dietPlan.create({
      data: {
        userId: req.user.id,
        patientCategory: payload.patientCategory,
        patientReportId: payload.patientReportId ? Number(payload.patientReportId) : null,
        requiredCalories,
        totalCalories: evaluation.totals.calories,
        totalProtein: evaluation.totals.protein,
        totalCarbs: evaluation.totals.carbs,
        totalFat: evaluation.totals.fat,
        score: evaluation.score,
        items: {
          create: payload.items.map((item) => ({
            foodId: Number(item.foodId),
            mealType: item.mealType,
            portionMultiplier: Number(item.portionMultiplier ?? 1)
          }))
        }
      },
      include: { items: { include: { food: true } } }
    });

    res.status(201).json({
      success: true,
      data: {
        ...created,
        evaluation,
        accuracyFlags
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get("/diet-plans", async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }

    const plans = await prisma.dietPlan.findMany({
      where: { userId: req.user.id },
      include: { items: { include: { food: true } } },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
});

router.get("/diet-plans/:id", async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }

    const id = Number(req.params.id);
    const plan = await prisma.dietPlan.findFirst({
      where: { id, userId: req.user.id },
      include: { items: { include: { food: true } }, patientReport: true }
    });

    if (!plan) {
      res.status(404).json({ success: false, error: "Diet plan not found." });
      return;
    }

    const reportData = plan.patientReport?.data as {
      age?: number;
      bmi?: number;
      bloodGlucose?: number;
      healthRisks?: string[];
    } | null;

    const accuracyFlags = getDietAccuracyFlags(
      {
        patientCategory: plan.patientCategory,
        age: reportData?.age ?? defaultAgeForCategory(plan.patientCategory),
        bmi: reportData?.bmi ?? 25,
        bloodGlucose: reportData?.bloodGlucose ?? 100,
        healthRisks: reportData?.healthRisks ?? [],
        requiredCalories: plan.requiredCalories
      },
      plan.items.map((item) => ({
        name: item.food.name,
        category: item.food.category,
        calories: item.food.calories,
        carbs: item.food.carbs,
        fat: item.food.fat,
        portionMultiplier: item.portionMultiplier
      }))
    );

    res.json({
      success: true,
      data: {
        ...plan,
        evaluation: {
          score: plan.score,
          totals: {
            calories: plan.totalCalories,
            protein: plan.totalProtein,
            carbs: plan.totalCarbs,
            fat: plan.totalFat
          },
          suggestions: evaluateDietPlan({
            foods: plan.items.map((item) => ({
              calories: item.food.calories,
              protein: item.food.protein,
              carbs: item.food.carbs,
              fat: item.food.fat,
              portionMultiplier: item.portionMultiplier
            })),
            requiredCalories: plan.requiredCalories,
            macroTargets: (reportData as { macroTargets?: { proteinPercent: number; carbsPercent: number; fatPercent: number } } | null)
              ?.macroTargets
          }).suggestions
        },
        accuracyFlags
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
