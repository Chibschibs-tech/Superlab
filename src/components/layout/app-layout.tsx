"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { ViewModeProvider } from "@/contexts/view-mode-context";
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
    <ViewModeProvider>
      <div className="relative min-h-screen bg-neutral-950">
        {/* Background Pattern */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-950/20 via-neutral-950 to-neutral-950" />
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>

        <Sidebar userRole={userRole} userId={user?.id} />
        
        {/* Main Content */}
        <main
          className={cn(
            "min-h-screen transition-all duration-300",
            "pt-14 lg:pt-0",
            "lg:pl-64",
            sidebarCollapsed && "lg:pl-16"
          )}
        >
          <div className="mx-auto max-w-7xl p-4 md:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </ViewModeProvider>
  );
}
