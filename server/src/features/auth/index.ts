import { Router } from "express";
import type { ZodOpenApiPathsObject } from "zod-openapi";
import { register, registerDoc } from "./register.js";
import { login, loginDoc } from "./login.js";
import { refresh, refreshDoc } from "./refresh.js";
import { logout, logoutDoc } from "./logout.js";
import { getMe, getMeDoc } from "./get-me.js";
import { updateMe, updateMeDoc } from "./update-me.js";
import { changePassword, changePasswordDoc } from "./change-password.js";
import {
  forgotPassword,
  forgotPasswordDoc,
} from "./forgot-password.js";
import { resetPassword, resetPasswordDoc } from "./reset-password.js";

export const authRouter = Router();

register(authRouter);
login(authRouter);
refresh(authRouter);
logout(authRouter);
getMe(authRouter);
updateMe(authRouter);
changePassword(authRouter);
forgotPassword(authRouter);
resetPassword(authRouter);

export const authPaths = {
  "/auth/register": { post: registerDoc },
  "/auth/login": { post: loginDoc },
  "/auth/refresh": { post: refreshDoc },
  "/auth/logout": { post: logoutDoc },
  "/auth/me": { get: getMeDoc, patch: updateMeDoc },
  "/auth/password": { patch: changePasswordDoc },
  "/auth/forgot-password": { post: forgotPasswordDoc },
  "/auth/reset-password": { post: resetPasswordDoc },
} satisfies ZodOpenApiPathsObject;
