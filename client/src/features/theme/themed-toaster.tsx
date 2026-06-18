import { Toaster } from "sonner";
import { useTheme } from "./theme-context";

export function ThemedToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster position="top-right" richColors closeButton theme={resolved} />
  );
}
