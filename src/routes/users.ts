import { Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../config/db";
import { requireRole } from "../middleware/auth";

const router = Router();

router.get("/admin/users", requireRole(Role.ADMIN), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            reports: true,
            dietPlans: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/diet-plans", requireRole(Role.ADMIN), async (_req, res, next) => {
  try {
    const dietPlans = await prisma.dietPlan.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true }
        },
        patientReport: {
          select: { id: true, patientCategory: true, createdAt: true }
        },
        items: {
          include: {
            food: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      success: true,
      data: dietPlans.map((plan) => ({
        ...plan,
        evaluation: {
          score: plan.score,
          totals: {
            calories: plan.totalCalories,
            protein: plan.totalProtein,
            carbs: plan.totalCarbs,
            fat: plan.totalFat
          },
          suggestions: []
        }
      }))
    });
  } catch (error) {
    next(error);
  }
});

export default router;
