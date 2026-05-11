"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/equivalences", async (_req, res, next) => {
    try {
        const equivalences = await db_1.prisma.foodEquivalence.findMany({
            include: { foodA: true, foodB: true },
            orderBy: { id: "desc" }
        });
        res.json({ success: true, data: equivalences });
    }
    catch (error) {
        next(error);
    }
});
router.get("/equivalences/:foodId", async (req, res, next) => {
    try {
        const foodId = Number(req.params.foodId);
        if (!foodId || Number.isNaN(foodId)) {
            res.status(400).json({ success: false, error: "Invalid food id." });
            return;
        }
        const equivalences = await db_1.prisma.foodEquivalence.findMany({
            where: {
                OR: [{ foodAId: foodId }, { foodBId: foodId }]
            },
            include: { foodA: true, foodB: true }
        });
        res.json({ success: true, data: equivalences });
    }
    catch (error) {
        next(error);
    }
});
router.post("/admin/equivalences", (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const { foodAId, foodBId, equivalentRatio, group } = req.body;
        if (!foodAId || !foodBId || !equivalentRatio) {
            res.status(400).json({ success: false, error: "foodAId, foodBId and equivalentRatio are required." });
            return;
        }
        const created = await db_1.prisma.foodEquivalence.create({
            data: {
                foodAId: Number(foodAId),
                foodBId: Number(foodBId),
                equivalentRatio: Number(equivalentRatio),
                group: group ? String(group) : null
            }
        });
        res.status(201).json({ success: true, data: created });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
