import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(
    localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches)
      ? "dark"
      : "light"
  );

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === "dark") {
      root.classList.add("dark");
      localStorage.theme = "dark";
    } else {
      root.classList.remove("dark");
      localStorage.theme = "light";
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div 
      onClick={toggleTheme}
      className="fixed z-50 top-4 right-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg cursor-pointer"
    >
      <Sun className="h-5 w-5 text-yellow-400 hidden dark:block" />
      <Moon className="h-5 w-5 text-gray-700 dark:hidden" />
    </div>
  );
}
