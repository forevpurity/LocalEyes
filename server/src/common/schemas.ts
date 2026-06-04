import { z } from "zod";

export function zEmail() {
  return z.email().meta({ example: "user@example.com" });
}
