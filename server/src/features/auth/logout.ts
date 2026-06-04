import { Router } from "express";
import type { ZodOpenApiOperationObject } from "zod-openapi";

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
    res.clearCookie("access_token", { path: "/" });
    res.clearCookie("refresh_token", { path: "/api/auth" });
    res.status(200).json({ message: "Logged out" });
  });
}
