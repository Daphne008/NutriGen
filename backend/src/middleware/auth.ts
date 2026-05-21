import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";
import { verifyToken } from "../utils/jwt";

const COOKIE_NAME = "token";

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const token = req.cookies?.[COOKIE_NAME];

    if (!token) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }

    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: "Invalid or expired token." });
  }
};

export const requireRole = (role: Role) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: "Authentication required." });
      return;
    }

    if (req.user.role !== role) {
      res.status(403).json({ success: false, error: "Insufficient permissions." });
      return;
    }

    next();
  };
};

export const authCookieName = COOKIE_NAME;
