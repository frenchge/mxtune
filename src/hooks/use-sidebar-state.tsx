"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface SidebarStateContextType {
  isRightSidebarCollapsed: boolean;
  setRightSidebarCollapsed: (collapsed: boolean) => void;
  toggleRightSidebar: () => void;
}

const SidebarStateContext = createContext<SidebarStateContextType | undefined>(undefined);

const STORAGE_KEY = "mxtune-right-sidebar-collapsed";

export function SidebarStateProvider({ children }: { children: ReactNode }) {
  const [isRightSidebarCollapsed, setIsRightSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? false : stored === "true";
  });

  // Save to localStorage when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isRightSidebarCollapsed));
  }, [isRightSidebarCollapsed]);

  const setRightSidebarCollapsed = (collapsed: boolean) => {
    setIsRightSidebarCollapsed(collapsed);
  };

  const toggleRightSidebar = () => {
    setIsRightSidebarCollapsed((prev) => !prev);
  };

  return (
    <SidebarStateContext.Provider
      value={{
        isRightSidebarCollapsed,
        setRightSidebarCollapsed,
        toggleRightSidebar,
      }}
    >
      {children}
    </SidebarStateContext.Provider>
  );
}

export function useSidebarState() {
  const context = useContext(SidebarStateContext);
  if (context === undefined) {
    throw new Error("useSidebarState must be used within a SidebarStateProvider");
  }
  return context;
}
