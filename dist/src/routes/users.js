"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/admin/users", (0, auth_1.requireRole)(client_1.Role.ADMIN), async (_req, res, next) => {
    try {
        const users = await db_1.prisma.user.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
router.get("/admin/diet-plans", (0, auth_1.requireRole)(client_1.Role.ADMIN), async (_req, res, next) => {
    try {
        const dietPlans = await db_1.prisma.dietPlan.findMany({
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
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
