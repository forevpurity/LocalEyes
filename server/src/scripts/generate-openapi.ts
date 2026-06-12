import { createDocument } from "zod-openapi";
import { writeFileSync } from "node:fs";
import { authPaths } from "../features/auth/index.js";
import { healthPaths } from "../features/health/index.js";
import { categoriesPaths } from "../features/categories/index.js";
import { departmentsPaths } from "../features/departments/index.js";
import { reportsPaths } from "../features/reports/index.js";
import { staffPaths } from "../features/staff/index.js";
import { citizensPaths } from "../features/citizens/index.js";
import { notificationsPaths } from "../features/notifications/index.js";

const doc = createDocument({
  openapi: "3.1.0",
  servers: [{ url: "/api" }],
  info: {
    title: "LocalEyes API",
    version: "0.1.0",
  },
  paths: {
    ...healthPaths,
    ...authPaths,
    ...categoriesPaths,
    ...departmentsPaths,
    ...reportsPaths,
    ...staffPaths,
    ...citizensPaths,
    ...notificationsPaths,
  },
});

writeFileSync("openapi.json", JSON.stringify(doc, null, 2));

console.log("openapi.json generated");
