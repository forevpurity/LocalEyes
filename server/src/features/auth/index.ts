import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { register, registerDoc } from "./register.js";
import { login, loginDoc } from "./login.js";
import { refresh, refreshDoc } from "./refresh.js";
import { logout, logoutDoc } from "./logout.js";
import { me, meDoc } from "./me.js";

export const authRouter = Router();

register(authRouter);
login(authRouter);
refresh(authRouter);
logout(authRouter);
me(authRouter);

export const authPaths = {
  "/auth/register": { post: registerDoc },
  "/auth/login": { post: loginDoc },
  "/auth/refresh": { post: refreshDoc },
  "/auth/logout": { post: logoutDoc },
  "/auth/me": { get: meDoc },
} satisfies ZodOpenApiPathsObject;
