import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { applyTheme, toggleTheme } from "@/theme";

export function ThemeToggle() {
  const [theme, setTheme] = useState(applyTheme);
  return (
    <Button variant="outline" size="icon" onClick={() => setTheme(toggleTheme())} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
