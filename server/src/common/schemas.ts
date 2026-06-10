import { z } from "zod";

export function zEmail() {
  return z.email().meta({ example: "user@example.com" });
}

export const queryBoolean = z.preprocess((v) => {
  if (typeof v === "string") return v === "true";
  if (typeof v === "boolean") return v;
  return false;
}, z.boolean());
