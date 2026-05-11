"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const signToken = (userId, role) => {
    return jsonwebtoken_1.default.sign({ sub: userId, role }, env_1.env.jwtSecret, {
        expiresIn: "7d"
    });
};
exports.signToken = signToken;
const verifyToken = (token) => {
    const decoded = jsonwebtoken_1.default.verify(token, env_1.env.jwtSecret);
    if (!decoded.sub || !decoded.role) {
        throw new Error("Invalid token payload");
    }
    return {
        sub: Number(decoded.sub),
        role: decoded.role
    };
};
exports.verifyToken = verifyToken;
