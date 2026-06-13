"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type Theme = "light" | "dark" | "system";
type LayoutMode = "modern" | "classic";
type TableSize = "compact" | "standard" | "large";

export const DEFAULT_PRIMARY_COLOR = "#3b82f6";
export const DEFAULT_FONT_FAMILY = "system-ui, Avenir, Helvetica, Arial, sans-serif";
export const DEFAULT_FONT_SIZE = "16px";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
  fontFamily: string;
  setFontFamily: (font: string) => void;
  fontSize: string;
  setFontSize: (size: string) => void;
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
  tableSize: TableSize;
  setTableSize: (size: TableSize) => void;
}

interface ThemeProviderProps {
  children: ReactNode;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme | undefined>(undefined);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  
  const [primaryColor, setPrimaryColor] = useState<string>(DEFAULT_PRIMARY_COLOR);
  const [fontFamily, setFontFamily] = useState<string>(DEFAULT_FONT_FAMILY);
  const [fontSize, setFontSize] = useState<string>(DEFAULT_FONT_SIZE);
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("modern");
  const [tableSize, setTableSize] = useState<TableSize>("standard");
  const [isLoaded, setIsLoaded] = useState(false);

  // Read from localStorage on initial mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as Theme;
    setTheme(savedTheme || "light");
    
    const savedPrimaryColor = localStorage.getItem("primaryColor");
    if (savedPrimaryColor) setPrimaryColor(savedPrimaryColor);
    
    const savedFontFamily = localStorage.getItem("fontFamily");
    if (savedFontFamily) setFontFamily(savedFontFamily);
    
    const savedFontSize = localStorage.getItem("fontSize");
    if (savedFontSize) setFontSize(savedFontSize);

    const savedLayoutMode = localStorage.getItem("layoutMode") as LayoutMode;
    if (savedLayoutMode) setLayoutMode(savedLayoutMode);

    const savedTableSize = localStorage.getItem("tableSize") as TableSize;
    if (savedTableSize) setTableSize(savedTableSize);
    
    setIsLoaded(true);
  }, []);

  // Apply base theme to DOM
  useEffect(() => {
    if (theme === undefined) return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      setResolvedTheme(systemTheme);

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        const newSystemTheme = mediaQuery.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(newSystemTheme);
        setResolvedTheme(newSystemTheme);
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      root.classList.add(theme);
      setResolvedTheme(theme);
    }
  }, [theme]);

  // Apply Appearance Settings to DOM
  useEffect(() => {
    if (!isLoaded) return;
    const root = window.document.documentElement;
    
    // Override CSS variables
    root.style.setProperty("--primary", primaryColor);
    root.style.setProperty("--ring", primaryColor);
    root.style.setProperty("--sidebar-primary", primaryColor);
    // Setting font-family and font-size
    root.style.setProperty("font-family", fontFamily);
    root.style.setProperty("font-size", fontSize);

    // Apply classic-mode class
    if (layoutMode === "classic") {
      root.classList.add("classic-mode");
    } else {
      root.classList.remove("classic-mode");
    }
    
    // Apply table size data attribute
    root.setAttribute("data-table-size", tableSize);
    
    localStorage.setItem("primaryColor", primaryColor);
    localStorage.setItem("fontFamily", fontFamily);
    localStorage.setItem("fontSize", fontSize);
    localStorage.setItem("layoutMode", layoutMode);
    localStorage.setItem("tableSize", tableSize);
  }, [primaryColor, fontFamily, fontSize, layoutMode, tableSize, isLoaded]);

  // Update localStorage when theme changes
  useEffect(() => {
    if (theme !== undefined) {
      localStorage.setItem("theme", theme);
    }
  }, [theme]);

  if (!isLoaded || theme === undefined) {
    return null;
  }

  const value: ThemeContextType = {
    theme,
    setTheme,
    resolvedTheme,
    primaryColor,
    setPrimaryColor,
    fontFamily,
    setFontFamily,
    fontSize,
    setFontSize,
    layoutMode,
    setLayoutMode,
    tableSize,
    setTableSize,
  };

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
