"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutGrid,
  FlaskConical,
  CircleCheckBig,
  BarChart3,
  DollarSign,
  Menu,
  ChevronLeft,
  Plus,
  Users,
  LogOut,
  Target,
} from "lucide-react";

const SUPERMEDIA_LOGO = "https://xek79n9xg5vqweia.public.blob.vercel-storage.com/Content/Logo%20white%2050%20px.png";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ViewModeToggle } from "./view-mode-toggle";
import { CreateProjectModal } from "@/components/projects/create-project-modal";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types";

// Roles that can create projects
const CREATOR_ROLES: UserRole[] = ["Owner", "Admin", "LabAdmin", "Editor"];
// Roles that can access admin features
const ADMIN_ROLES: UserRole[] = ["Owner", "Admin", "LabAdmin"];

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  roles: UserRole[] | "all"; // "all" means any authenticated user
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  {
    label: "Showroom",
    href: "/showroom",
    icon: <LayoutGrid className="h-5 w-5" />,
    roles: "all",
  },
  {
    label: "Lab",
    href: "/lab",
    icon: <FlaskConical className="h-5 w-5" />,
    roles: "all",
  },
  {
    label: "Revenue",
    href: "/revenue",
    icon: <DollarSign className="h-5 w-5" />,
    roles: "all", // Visible to ALL authenticated users
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: <BarChart3 className="h-5 w-5" />,
    roles: ["Owner", "Admin", "LabAdmin"],
  },
  {
    label: "Décisions",
    href: "/decisions",
    icon: <CircleCheckBig className="h-5 w-5" />,
    roles: ["Owner", "Admin", "LabAdmin"],
  },
  {
    label: "Besoins",
    href: "/needs",
    icon: <Target className="h-5 w-5" />,
    roles: ["Owner", "Admin", "LabAdmin"],
  },
  {
    label: "Utilisateurs",
    href: "/admin/users",
    icon: <Users className="h-5 w-5" />,
    roles: ["Owner", "Admin", "LabAdmin"],
    adminOnly: true,
  },
];

interface SidebarProps {
  userRole: UserRole;
  userId?: string;
  userName?: string;
  userEmail?: string;
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
        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-white ring-1 ring-white/10"
          : "text-neutral-400 hover:bg-white/5 hover:text-white",
        collapsed && "justify-center px-2"
      )}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
    >
      <span className={cn(isActive && "text-violet-400")}>{item.icon}</span>
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

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
        "flex items-center gap-3 rounded-xl px-3 py-3 text-base font-medium transition-colors",
        isActive
          ? "bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 text-white"
          : "text-neutral-400 hover:bg-white/5 hover:text-white"
      )}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
    >
      <span className={cn(isActive && "text-violet-400")}>{item.icon}</span>
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar({ userRole, userId, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter nav items based on role
  const filteredNavItems = navItems.filter((item) => {
    if (item.roles === "all") return true;
    return item.roles.includes(userRole);
  });

  const canCreate = CREATOR_ROLES.includes(userRole);

  const handleLogout = async () => {
    // This will be handled by form action
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/auth/logout";
    document.body.appendChild(form);
    form.submit();
  };

  return (
    <TooltipProvider>
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b border-white/5 bg-neutral-950/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-neutral-950/80 lg:hidden">
        <div className="flex items-center gap-4">
          {mounted ? (
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-neutral-400 hover:bg-white/5 hover:text-white lg:hidden"
                  aria-label="Ouvrir le menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 border-white/5 bg-neutral-950 p-0">
                <SheetHeader className="border-b border-white/5 px-6 py-4">
                  <SheetTitle className="flex items-center gap-3 text-left text-white">
                    <Image
                      src={SUPERMEDIA_LOGO}
                      alt="Supermedia"
                      width={32}
                      height={32}
                      className="h-8 w-auto"
                    />
                    <span className="font-bold tracking-tight">Supermedia Lab</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-1 p-4" aria-label="Navigation principale">
                  {filteredNavItems.map((item) => (
                    <MobileNavLink
                      key={item.href}
                      item={item}
                      isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                      onClose={() => setMobileOpen(false)}
                    />
                  ))}
                </nav>
                {/* Mobile View Mode Toggle */}
                <div className="border-t border-white/5 p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Mode d&apos;affichage
                  </p>
                  <ViewModeToggle />
                </div>
                {/* Mobile User Info & Logout */}
                <div className="border-t border-white/5 p-4">
                  {userEmail && (
                    <p className="mb-2 truncate text-xs text-neutral-500">{userEmail}</p>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full justify-start gap-2 text-neutral-400 hover:bg-white/5 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-400 hover:bg-white/5 hover:text-white lg:hidden"
              aria-label="Ouvrir le menu"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Image
              src={SUPERMEDIA_LOGO}
              alt="Supermedia"
              width={28}
              height={28}
              className="h-7 w-auto"
            />
            <span className="font-bold tracking-tight text-white">Supermedia Lab</span>
          </div>
        </div>
        {/* Mobile Actions */}
        <div className="flex items-center gap-2">
          {canCreate && (
            <CreateProjectModal
              userRole={userRole}
              userId={userId}
              trigger={
                <Button
                  size="icon"
                  className="h-8 w-8 bg-violet-600 hover:bg-violet-700"
                  aria-label="Nouveau projet"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              }
            />
          )}
          <ViewModeToggle />
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-white/5 bg-neutral-950 transition-all duration-300 lg:flex",
          collapsed ? "w-16" : "w-64"
        )}
        aria-label="Navigation latérale"
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-14 items-center border-b border-white/5 px-4",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <Image
            src={SUPERMEDIA_LOGO}
            alt="Supermedia"
            width={32}
            height={32}
            className="h-8 w-auto shrink-0"
          />
          {!collapsed && (
            <span className="font-bold tracking-tight text-white">Supermedia Lab</span>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className={cn("border-b border-white/5 p-3", collapsed && "px-2")}>
          {!collapsed && (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-600">
              Mode
            </p>
          )}
          <ViewModeToggle collapsed={collapsed} />
        </div>

        {/* Create Project Button */}
        {canCreate && (
          <div className={cn("border-b border-white/5 p-3", collapsed && "px-2")}>
            <CreateProjectModal
              userRole={userRole}
              userId={userId}
              trigger={
                <Button
                  className={cn(
                    "w-full gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700",
                    collapsed && "px-2"
                  )}
                  aria-label="Créer un nouveau projet"
                >
                  <Plus className="h-4 w-4" />
                  {!collapsed && <span>Nouveau projet</span>}
                </Button>
              }
            />
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Navigation principale">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="border-t border-white/5 p-3">
          {!collapsed && userEmail && (
            <p className="mb-2 truncate text-xs text-neutral-500">{userEmail}</p>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className={cn(
              "w-full text-neutral-400 hover:bg-white/5 hover:text-white",
              collapsed ? "justify-center px-2" : "justify-start gap-2"
            )}
            aria-label="Déconnexion"
            title="Déconnexion"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Déconnexion</span>}
          </Button>
        </div>

        {/* Collapse Toggle */}
        <div className="border-t border-white/5 p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "w-full text-neutral-400 hover:bg-white/5 hover:text-white",
              collapsed && "px-2"
            )}
            aria-label={collapsed ? "Agrandir" : "Réduire"}
            title={collapsed ? "Agrandir" : "Réduire"}
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                collapsed && "rotate-180"
              )}
            />
            {!collapsed && <span className="ml-2">Réduire</span>}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  );
}
