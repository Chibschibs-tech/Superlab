"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { cn } from "@/lib/utils";
import type { User, UserRole } from "@/types";

interface AppLayoutProps {
  children: React.ReactNode;
  user?: User | null;
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Default to Viewer if no user, for demo purposes
  const userRole: UserRole = user?.role ?? "Viewer";

  // Listen for sidebar collapse state changes via CSS
  useEffect(() => {
    const checkSidebarState = () => {
      const sidebar = document.querySelector("aside");
      if (sidebar) {
        setSidebarCollapsed(sidebar.classList.contains("w-16"));
      }
    };

    const observer = new MutationObserver(checkSidebarState);
    const sidebar = document.querySelector("aside");
    
    if (sidebar) {
      observer.observe(sidebar, { attributes: true, attributeFilter: ["class"] });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative min-h-screen bg-background">
      <Sidebar userRole={userRole} />
      
      {/* Main Content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          "pt-14 lg:pt-0", // Account for mobile header
          "lg:pl-64", // Default sidebar width
          sidebarCollapsed && "lg:pl-16" // Collapsed sidebar width
        )}
      >
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

