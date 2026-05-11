"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authCookieName = exports.requireRole = exports.requireAuth = void 0;
const jwt_1 = require("../utils/jwt");
const COOKIE_NAME = "token";
const requireAuth = (req, res, next) => {
    try {
        const token = req.cookies?.[COOKIE_NAME];
        if (!token) {
            res.status(401).json({ success: false, error: "Authentication required." });
            return;
        }
        const payload = (0, jwt_1.verifyToken)(token);
        req.user = { id: payload.sub, role: payload.role };
        next();
    }
    catch (error) {
        res.status(401).json({ success: false, error: "Invalid or expired token." });
    }
};
exports.requireAuth = requireAuth;
const requireRole = (role) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
exports.authCookieName = COOKIE_NAME;
