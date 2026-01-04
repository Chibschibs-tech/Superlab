"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";

export type ViewMode = "owner" | "lab";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  toggleViewMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(
  undefined
);

const STORAGE_KEY = "superlab-view-mode";

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewModeState] = useState<ViewMode>("owner");
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "owner" || stored === "lab") {
      setViewModeState(stored);
    }
    setMounted(true);
  }, []);

  // Save to localStorage when changed
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem(STORAGE_KEY, mode);
  };

  const toggleViewMode = () => {
    const newMode = viewMode === "owner" ? "lab" : "owner";
    setViewMode(newMode);
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <ViewModeContext.Provider
        value={{ viewMode: "owner", setViewMode, toggleViewMode }}
      >
        {children}
      </ViewModeContext.Provider>
    );
  }

  return (
    <ViewModeContext.Provider value={{ viewMode, setViewMode, toggleViewMode }}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error("useViewMode must be used within a ViewModeProvider");
  }
  return context;
}

