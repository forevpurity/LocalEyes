import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";
import { clearAuthCookies } from "./auth-cookies.js";

export const logoutDoc = {
  summary: "Log out",
  tags: ["Auth"],
  operationId: "logout",
  responses: {
    200: {
      description: "Logged out",
    },
  },
} satisfies ZodOpenApiOperationObject;

export function logout(router: Router) {
  router.post("/logout", (_req, res) => {
    clearAuthCookies(res);
    res.status(200).json({ message: "Logged out" });
  });
}
