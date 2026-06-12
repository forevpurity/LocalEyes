import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { register, registerDoc } from "./register.js";
import { login, loginDoc } from "./login.js";
import { refresh, refreshDoc } from "./refresh.js";
import { logout, logoutDoc } from "./logout.js";
import { me, meDoc, updateMeDoc } from "./me.js";
import { changePassword, changePasswordDoc } from "./change-password.js";

export const authRouter = Router();

register(authRouter);
login(authRouter);
refresh(authRouter);
logout(authRouter);
me(authRouter);
changePassword(authRouter);

export const authPaths = {
  "/auth/register": { post: registerDoc },
  "/auth/login": { post: loginDoc },
  "/auth/refresh": { post: refreshDoc },
  "/auth/logout": { post: logoutDoc },
  "/auth/me": { get: meDoc, patch: updateMeDoc },
  "/auth/password": { patch: changePasswordDoc },
} satisfies ZodOpenApiPathsObject;
