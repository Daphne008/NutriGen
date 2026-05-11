import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { requireAuth } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import authRoutes from "./routes/auth";
import dietPlansRoutes from "./routes/dietPlans";
import equivalencesRoutes from "./routes/equivalences";
import foodsRoutes from "./routes/foods";
import reportsRoutes from "./routes/reports";
import usersRoutes from "./routes/users";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok" } });
});

app.use("/api/auth", authRoutes);
app.use("/api", requireAuth);
app.use("/api", foodsRoutes);
app.use("/api", equivalencesRoutes);
app.use("/api", reportsRoutes);
app.use("/api", dietPlansRoutes);
app.use("/api", usersRoutes);

app.use(errorHandler);

export default app;
