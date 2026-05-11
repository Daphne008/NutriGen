"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const client_1 = require("@prisma/client");
const express_1 = require("express");
const db_1 = require("../config/db");
const env_1 = require("../config/env");
const auth_1 = require("../middleware/auth");
const jwt_1 = require("../utils/jwt");
const router = (0, express_1.Router)();
const buildAuthCookie = (token) => ({
    httpOnly: true,
    secure: env_1.isProduction,
    sameSite: env_1.isProduction ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000
});
router.post("/register", async (req, res, next) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password || password.length < 6) {
            res.status(400).json({ success: false, error: "Name, email and a 6+ char password are required." });
            return;
        }
        const existing = await db_1.prisma.user.findUnique({ where: { email } });
        if (existing) {
            res.status(409).json({ success: false, error: "Email already exists." });
            return;
        }
        const passwordHash = await bcrypt_1.default.hash(password, 10);
        const user = await db_1.prisma.user.create({
            data: { name, email, passwordHash, role: client_1.Role.DIETITIAN },
            select: { id: true, name: true, email: true, role: true }
        });
        res.status(201).json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
router.post("/login", async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, error: "Email and password are required." });
            return;
        }
        const user = await db_1.prisma.user.findUnique({ where: { email } });
        if (!user || !(await bcrypt_1.default.compare(password, user.passwordHash))) {
            res.status(401).json({ success: false, error: "Invalid credentials." });
            return;
        }
        const token = (0, jwt_1.signToken)(user.id, user.role);
        res.cookie(auth_1.authCookieName, token, buildAuthCookie(token));
        res.json({
            success: true,
            data: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    }
    catch (error) {
        next(error);
    }
});
router.post("/logout", async (_req, res) => {
    res.clearCookie(auth_1.authCookieName);
    res.json({ success: true, data: { message: "Logged out." } });
});
router.get("/me", auth_1.requireAuth, async (req, res, next) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, error: "Authentication required." });
            return;
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, name: true, email: true, role: true }
        });
        if (!user) {
            res.status(404).json({ success: false, error: "User not found." });
            return;
        }
        res.json({ success: true, data: user });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
