import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import authRoutes from "./modules/auth/auth.routes";

const app = express();

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

// Other modules (artisans, associations, payments, etc.) get mounted here
// as they're built out:
// app.use("/api/artisans", artisanRoutes);
// app.use("/api/associations", associationRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;