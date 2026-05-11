"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const db_1 = require("../config/db");
const auth_1 = require("../middleware/auth");
const patientReportService_1 = require("../services/patientReportService");
const router = (0, express_1.Router)();
router.post("/reports/generate", async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Authentication required." });
            return;
        }
        const patientCategory = req.body?.patientCategory;
        if (!patientCategory || !Object.values(client_1.PatientCategory).includes(patientCategory)) {
            res.status(400).json({ success: false, error: "Valid patientCategory is required." });
            return;
        }
        const data = (0, patientReportService_1.generatePatientReportData)(patientCategory);
        const report = await db_1.prisma.patientReport.create({
            data: {
                userId: req.user.id,
                patientCategory,
                data
            }
        });
        res.status(201).json({ success: true, data: report });
    }
    catch (error) {
        next(error);
    }
});
router.get("/reports", async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Authentication required." });
            return;
        }
        const reports = await db_1.prisma.patientReport.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: "desc" }
        });
        res.json({ success: true, data: reports });
    }
    catch (error) {
        next(error);
    }
});
router.get("/admin/reports", (0, auth_1.requireRole)(client_1.Role.ADMIN), async (_req, res, next) => {
    try {
        const reports = await db_1.prisma.patientReport.findMany({
            include: { user: { select: { id: true, name: true, email: true, role: true } } },
            orderBy: { createdAt: "desc" }
        });
        res.json({ success: true, data: reports });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
