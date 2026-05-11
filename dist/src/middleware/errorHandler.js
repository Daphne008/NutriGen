"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (error, _req, res, _next) => {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    res.status(500).json({ success: false, error: message });
};
exports.errorHandler = errorHandler;
