import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import associationRoutes from "./modules/associations/associations.routes";
import auditRoutes from "./modules/audit/audit.routes";
import authRoutes from "./modules/auth/auth.routes";
import dashboardRoutes from "./modules/dashboard/dashboard.routes";
import settingsRoutes from "./modules/settings/settings.routes";
import staffRoutes from "./modules/staff/staff.routes";

const app = express();

// Needed so rate limiting and req.ip see the real client IP behind a proxy/load balancer.
if (env.isProduction) app.set("trust proxy", 1);

app.use(
    cors({
        origin: env.clientUrl,
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/audit", auditRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/associations", associationRoutes);

// Other modules (artisans, associations, payments, etc.) get mounted here
// as they're built out:
// app.use("/api/artisans", artisanRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;