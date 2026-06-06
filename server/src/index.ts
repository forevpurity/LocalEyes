import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import swaggerUi from "swagger-ui-express";
import { pool } from "./db/client.js";
import { healthRouter } from "./features/health/index.js";
import { authRouter } from "./features/auth/index.js";
import { departmentsRouter } from "./features/departments/index.js";
import { categoriesRouter } from "./features/categories/index.js";
import { errorHandler, notFoundHandler } from "./common/middleware.js";

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const api = express.Router();
api.use(healthRouter);
api.use("/auth", authRouter);
api.use("/departments", departmentsRouter);
api.use("/categories", categoriesRouter);
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
