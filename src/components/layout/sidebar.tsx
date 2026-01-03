"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutGrid,
  FlaskConical,
  CircleCheckBig,
  Menu,
  X,
  ChevronLeft,
  Beaker,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Showroom",
    href: "/showroom",
    icon: <LayoutGrid className="h-5 w-5" />,
    roles: ["Owner", "Admin", "Viewer"],
  },
  {
    label: "Lab View",
    href: "/lab",
    icon: <FlaskConical className="h-5 w-5" />,
    roles: ["Owner", "Admin", "Viewer"],
  },
  {
    label: "Decisions",
    href: "/decisions",
    icon: <CircleCheckBig className="h-5 w-5" />,
    roles: ["Owner"],
  },
];

interface SidebarProps {
  userRole: UserRole;
}

function NavLink({
  item,
  isActive,
  collapsed,
}: {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
}) {
  const linkContent = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground",
        collapsed && "justify-center px-2"
      )}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
    >
      {item.icon}
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
        <TooltipContent side="right" className="font-medium">
          {item.label}
        </TooltipContent>
      </Tooltip>
    );
  }

  return linkContent;
}

function MobileNavLink({
  item,
  isActive,
  onClose,
}: {
  item: NavItem;
  isActive: boolean;
  onClose: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors",
        "hover:bg-accent hover:text-accent-foreground",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground"
      )}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
    >
      {item.icon}
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <TooltipProvider>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="border-b px-6 py-4">
              <SheetTitle className="flex items-center gap-2 text-left">
                <Beaker className="h-6 w-6 text-primary" />
                <span className="font-bold tracking-tight">Supermedia Lab</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 p-4" aria-label="Main navigation">
              {filteredNavItems.map((item) => (
                <MobileNavLink
                  key={item.href}
                  item={item}
                  isActive={pathname === item.href}
                  onClose={() => setMobileOpen(false)}
                />
              ))}
            </nav>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Beaker className="h-5 w-5 text-primary" />
          <span className="font-bold tracking-tight">Supermedia Lab</span>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r bg-background transition-all duration-300 lg:flex",
          collapsed ? "w-16" : "w-64"
        )}
        aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-14 items-center border-b px-4",
            collapsed ? "justify-center" : "gap-2"
          )}
        >
          <Beaker className="h-6 w-6 shrink-0 text-primary" />
          {!collapsed && (
            <span className="font-bold tracking-tight">Supermedia Lab</span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3" aria-label="Main navigation">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <Separator />

        {/* Collapse Toggle */}
        <div className="p-3">
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCollapsed(!collapsed)}
                className={cn("w-full", collapsed && "px-2")}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <ChevronLeft
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    collapsed && "rotate-180"
                  )}
                />
                {!collapsed && <span className="ml-2">Collapse</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && (
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export function SidebarTrigger() {
  return null;
}

