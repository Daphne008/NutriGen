import bcrypt from "bcrypt";
import { Role } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../config/db";
import { isProduction } from "../config/env";
import { authCookieName, requireAuth } from "../middleware/auth";
import { signToken } from "../utils/jwt";

const router = Router();

const buildAuthCookie = (token: string) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? ("none" as const) : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000
});

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
    if (!name || !email || !password || password.length < 6) {
      res.status(400).json({ success: false, error: "Name, email and a 6+ char password are required." });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, error: "Email already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, role: Role.DIETITIAN },
      select: { id: true, name: true, email: true, role: true }
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ success: false, error: "Email and password are required." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ success: false, error: "Invalid credentials." });
      return;
    }

    const token = signToken(user.id, user.role);
    res.cookie(authCookieName, token, buildAuthCookie(token));
    res.json({
      success: true,
      data: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (_req, res) => {
  res.clearCookie(authCookieName);
  res.json({ success: true, data: { message: "Logged out." } });
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      res.status(404).json({ success: false, error: "User not found." });
      return;
    }

    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

export default router;
