import { Toaster } from "sonner";
import { useTheme } from "./use-theme";

export function ThemedToaster() {
  const { resolved } = useTheme();
  return (
    <Toaster position="top-right" richColors closeButton theme={resolved} />
  );
}
