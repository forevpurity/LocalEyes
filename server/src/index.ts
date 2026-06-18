import "dotenv/config";
import { mkdirSync } from "fs";
import { createServer } from "node:http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { pool } from "./db/client.js";
import { healthRouter } from "./features/health/index.js";
import { authRouter } from "./features/auth/index.js";
import { departmentsRouter } from "./features/departments/index.js";
import { categoriesRouter } from "./features/categories/index.js";
import { reportsRouter } from "./features/reports/index.js";
import { staffRouter } from "./features/staff/index.js";
import { citizensRouter } from "./features/citizens/index.js";
import { notificationsRouter } from "./features/notifications/index.js";
import { analyticsRouter } from "./features/analytics/index.js";
import { exportsRouter } from "./features/exports/index.js";
import { errorHandler, notFoundHandler } from "./common/middleware.js";
import { initSocket } from "./services/socket.js";
import { globalLimiter, authLimiter } from "./common/rate-limit.js";
import { corsOptions } from "./common/cors.js";
import { storage } from "./services/storage.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// With the local storage driver, the server serves uploads off disk. With R2
// (or any object-storage driver) files are served by the bucket/CDN directly.
if (storage.servesLocally) {
  const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "uploads";
  mkdirSync(UPLOAD_DIR, { recursive: true });
  app.use("/uploads", express.static(UPLOAD_DIR));
}

const api = express.Router();

// Rate limiting — specific limiters first, then global
api.use("/auth", authLimiter);
api.use(globalLimiter);

api.use(healthRouter);
api.use("/auth", authRouter);
api.use("/departments", departmentsRouter);
api.use("/categories", categoriesRouter);
api.use("/reports", reportsRouter);
api.use("/admin/staff", staffRouter);
api.use("/admin/citizens", citizensRouter);
api.use("/admin/analytics", analyticsRouter);
api.use("/admin/exports", exportsRouter);
api.use("/notifications", notificationsRouter);
app.use("/api", api);

if (process.env.NODE_ENV !== "production") {
  app.use("/openapi.json", express.static("openapi.json"));
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(null, { swaggerUrl: "/openapi.json" }));
}

app.use(notFoundHandler);
app.use(errorHandler);

pool.query("SELECT 1")
  .then(() => console.log("✓ Database connected"))
  .catch((err: Error) => console.warn("✗ Database connection failed:", err.message));

const server = createServer(app);
initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
