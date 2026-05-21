import { Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../config/db";
import { requireRole } from "../middleware/auth";

const router = Router();

router.get("/equivalences", async (_req, res, next) => {
  try {
    const equivalences = await prisma.foodEquivalence.findMany({
      include: { foodA: true, foodB: true },
      orderBy: { id: "desc" }
    });
    res.json({ success: true, data: equivalences });
  } catch (error) {
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

    const equivalences = await prisma.foodEquivalence.findMany({
      where: {
        OR: [{ foodAId: foodId }, { foodBId: foodId }]
      },
      include: { foodA: true, foodB: true }
    });

    res.json({ success: true, data: equivalences });
  } catch (error) {
    next(error);
  }
});

router.post("/admin/equivalences", requireRole(Role.ADMIN), async (req, res, next) => {
  try {
    const { foodAId, foodBId, equivalentRatio, group } = req.body as Record<string, unknown>;
    if (!foodAId || !foodBId || !equivalentRatio) {
      res.status(400).json({ success: false, error: "foodAId, foodBId and equivalentRatio are required." });
      return;
    }

    const created = await prisma.foodEquivalence.create({
      data: {
        foodAId: Number(foodAId),
        foodBId: Number(foodBId),
        equivalentRatio: Number(equivalentRatio),
        group: group ? String(group) : null
      }
    });
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

export default router;
