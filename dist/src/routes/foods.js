"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get("/foods", async (req, res, next) => {
    try {
        const search = String(req.query.search ?? "").trim();
        const foods = await db_1.prisma.food.findMany({
            where: search
                ? {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { category: { contains: search, mode: "insensitive" } }
                    ]
                }
                : undefined,
            orderBy: { name: "asc" }
        });
        res.json({ success: true, data: foods });
    }
    catch (error) {
        next(error);
    }
});
router.post("/admin/foods", (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const { name, category, calories, protein, carbs, fat, portionGram } = req.body;
        if (!name || !category) {
            res.status(400).json({ success: false, error: "Food name and category are required." });
            return;
        }
        const food = await db_1.prisma.food.create({
            data: {
                name: String(name),
                category: String(category),
                calories: Number(calories),
                protein: Number(protein),
                carbs: Number(carbs),
                fat: Number(fat),
                portionGram: Number(portionGram)
            }
        });
        res.status(201).json({ success: true, data: food });
    }
    catch (error) {
        next(error);
    }
});
router.put("/admin/foods/:id", (0, auth_1.requireRole)(client_1.Role.ADMIN), async (req, res, next) => {
    try {
        const id = Number(req.params.id);
        const { calories, protein, carbs, fat, portionGram } = req.body;
        if (!id || Number.isNaN(id)) {
            res.status(400).json({ success: false, error: "Invalid food id." });
            return;
        }
        const updated = await db_1.prisma.food.update({
            where: { id },
            data: {
                calories: calories === undefined ? undefined : Number(calories),
                protein: protein === undefined ? undefined : Number(protein),
                carbs: carbs === undefined ? undefined : Number(carbs),
                fat: fat === undefined ? undefined : Number(fat),
                portionGram: portionGram === undefined ? undefined : Number(portionGram)
            }
        });
        res.json({ success: true, data: updated });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
