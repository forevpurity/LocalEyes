import { Sun, Moon } from "lucide-react";
import { useTheme, type Theme } from "./use-theme";

const iconMap: Record<Theme, typeof Sun> = {
  light: Sun,
  dark: Moon,
};

const labels: Record<Theme, string> = {
  light: "Light mode",
  dark: "Dark mode",
};

const next: Record<Theme, Theme> = {
  light: "dark",
  dark: "light",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = iconMap[theme];

  return (
    <button
      onClick={() => setTheme(next[theme])}
      className="rounded-lg p-2 text-on-surface-variant hover:text-primary transition-colors"
      aria-label={`Current: ${labels[theme]}. Click to switch to ${labels[next[theme]]}.`}
      title={labels[theme]}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}
