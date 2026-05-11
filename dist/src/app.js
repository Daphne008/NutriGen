"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const env_1 = require("./config/env");
const auth_1 = require("./middleware/auth");
const errorHandler_1 = require("./middleware/errorHandler");
const auth_2 = __importDefault(require("./routes/auth"));
const dietPlans_1 = __importDefault(require("./routes/dietPlans"));
const equivalences_1 = __importDefault(require("./routes/equivalences"));
const foods_1 = __importDefault(require("./routes/foods"));
const reports_1 = __importDefault(require("./routes/reports"));
const users_1 = __importDefault(require("./routes/users"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)({
    origin: env_1.env.corsOrigin,
    credentials: true
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
app.get("/health", (_req, res) => {
    res.json({ success: true, data: { status: "ok" } });
});
app.use("/api/auth", auth_2.default);
app.use("/api", auth_1.requireAuth);
app.use("/api", foods_1.default);
app.use("/api", equivalences_1.default);
app.use("/api", reports_1.default);
app.use("/api", dietPlans_1.default);
app.use("/api", users_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
