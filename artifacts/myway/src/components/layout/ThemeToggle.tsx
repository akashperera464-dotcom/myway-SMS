import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-1.5 w-8 h-8 rounded-md bg-muted/50 animate-pulse" />
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-1.5 rounded-md text-muted-foreground hover:bg-muted transition-all duration-200 hover:text-foreground"
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun className="w-5 h-5 transition-all duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="w-5 h-5 transition-all duration-300 rotate-0 scale-100" />
      )}
    </button>
  );
}
