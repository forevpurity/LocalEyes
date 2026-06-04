import { createDocument } from "zod-openapi";
import { writeFileSync } from "node:fs";
import { authPaths } from "../features/auth/index.js";
import { healthPaths } from "../features/health/index.js";

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
  },
});

writeFileSync("openapi.json", JSON.stringify(doc, null, 2));

console.log("openapi.json generated");
