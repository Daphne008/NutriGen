import { PatientCategory, Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../config/db";
import { requireRole } from "../middleware/auth";
import { generatePatientReportData } from "../services/patientReportService";

const router = Router();

router.post("/reports/generate", async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }

    const patientCategory = req.body?.patientCategory as PatientCategory | undefined;
    if (!patientCategory || !Object.values(PatientCategory).includes(patientCategory)) {
      res.status(400).json({ success: false, error: "Valid patientCategory is required." });
      return;
    }

    const data = generatePatientReportData(patientCategory);
    const report = await prisma.patientReport.create({
      data: {
        userId: req.user.id,
        patientCategory,
        data
      }
    });

    res.status(201).json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
});

router.get("/reports", async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }

    const reports = await prisma.patientReport.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

router.get("/admin/reports", requireRole(Role.ADMIN), async (_req, res, next) => {
  try {
    const reports = await prisma.patientReport.findMany({
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: "desc" }
    });

    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
});

export default router;
