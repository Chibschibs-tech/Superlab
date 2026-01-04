"use client";

import { useState, useTransition } from "react";
import {
  Search,
  Plus,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  MoreHorizontal,
  Pencil,
  Ban,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createUser, updateUserRole, toggleUserActive } from "@/lib/actions/users";
import type { User, UserRole } from "@/types";

interface UsersManagementProps {
  users: User[];
  currentUserId: string;
  currentUserRole: UserRole;
}

const roleConfig: Record<UserRole, { label: string; color: string; bg: string; icon: typeof Shield }> = {
  Owner: { label: "Propriétaire", color: "text-amber-400", bg: "bg-amber-500/20", icon: ShieldAlert },
  Admin: { label: "Administrateur", color: "text-violet-400", bg: "bg-violet-500/20", icon: ShieldCheck },
  LabAdmin: { label: "Lab Admin", color: "text-cyan-400", bg: "bg-cyan-500/20", icon: Shield },
  Editor: { label: "Éditeur", color: "text-emerald-400", bg: "bg-emerald-500/20", icon: Pencil },
  Viewer: { label: "Lecteur", color: "text-neutral-400", bg: "bg-neutral-500/20", icon: UserIcon },
};

const ALL_ROLES: UserRole[] = ["Owner", "Admin", "LabAdmin", "Editor", "Viewer"];

export function UsersManagement({ users, currentUserId, currentUserRole }: UsersManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isPending, startTransition] = useTransition();

  // Filter users
  const filteredUsers = users.filter((user) => {
    // Search filter
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower);

    // Role filter
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    // Status filter
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && user.is_active !== false) ||
      (statusFilter === "inactive" && user.is_active === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async (formData: FormData) => {
    startTransition(async () => {
      const result = await createUser(formData);
      if (result.success) {
        toast.success("Utilisateur créé avec succès");
        setIsCreateDialogOpen(false);
      } else {
        toast.error(result.error || "Erreur lors de la création");
      }
    });
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (result.success) {
        toast.success("Rôle mis à jour");
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    });
  };

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const result = await toggleUserActive(userId, !currentStatus);
      if (result.success) {
        toast.success(currentStatus ? "Utilisateur désactivé" : "Utilisateur réactivé");
      } else {
        toast.error(result.error || "Erreur lors de la mise à jour");
      }
    });
  };

  // Determine which roles current user can assign
  const assignableRoles = currentUserRole === "Owner" 
    ? ALL_ROLES 
    : ALL_ROLES.filter(r => r !== "Owner");

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <Input
              type="search"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-white/10 bg-white/5 pl-9 text-white placeholder:text-neutral-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <Select
              value={roleFilter}
              onValueChange={(v) => setRoleFilter(v as UserRole | "all")}
            >
              <SelectTrigger className="w-[140px] border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                {ALL_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {roleConfig[role].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}
            >
              <SelectTrigger className="w-[120px] border-white/10 bg-white/5 text-white">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Create User Button */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-violet-600 hover:bg-violet-700">
              <Plus className="h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-neutral-900">
            <DialogHeader>
              <DialogTitle className="text-white">Créer un utilisateur</DialogTitle>
              <DialogDescription className="text-neutral-400">
                L&apos;utilisateur recevra un email avec un mot de passe temporaire.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-neutral-300">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="border-white/10 bg-white/5 text-white"
                  placeholder="utilisateur@supermedia.fr"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-neutral-300">Nom complet</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  required
                  className="border-white/10 bg-white/5 text-white"
                  placeholder="Jean Dupont"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-neutral-300">Mot de passe temporaire</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  className="border-white/10 bg-white/5 text-white"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-neutral-300">Rôle</Label>
                <Select name="role" defaultValue="Viewer">
                  <SelectTrigger className="border-white/10 bg-white/5 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {roleConfig[role].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="text-neutral-400"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Création...
                    </>
                  ) : (
                    "Créer"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <p className="text-2xl font-bold text-white">{users.length}</p>
          <p className="text-sm text-neutral-400">Total utilisateurs</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <p className="text-2xl font-bold text-emerald-400">
            {users.filter((u) => u.is_active !== false).length}
          </p>
          <p className="text-sm text-neutral-400">Actifs</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <p className="text-2xl font-bold text-amber-400">
            {users.filter((u) => ["Owner", "Admin", "LabAdmin"].includes(u.role)).length}
          </p>
          <p className="text-sm text-neutral-400">Administrateurs</p>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/5 p-4">
          <p className="text-2xl font-bold text-violet-400">
            {users.filter((u) => u.role === "Editor").length}
          </p>
          <p className="text-sm text-neutral-400">Éditeurs</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="overflow-hidden rounded-xl border border-white/5 bg-white/5">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Utilisateur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Rôle
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Créé le
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => {
                const config = roleConfig[user.role as UserRole] || roleConfig.Viewer;
                const Icon = config.icon;
                const isCurrentUser = user.id === currentUserId;
                const isActive = user.is_active !== false;

                return (
                  <tr
                    key={user.id}
                    className={cn(
                      "transition-colors hover:bg-white/5",
                      !isActive && "opacity-60"
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt={user.full_name || "Avatar"}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-5 w-5 text-neutral-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-white">
                            {user.full_name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-neutral-500">(vous)</span>
                            )}
                          </p>
                          <p className="flex items-center gap-1 text-sm text-neutral-400">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 border-transparent",
                          config.bg,
                          config.color
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={cn(
                          "border-transparent",
                          isActive
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-rose-500/20 text-rose-400"
                        )}
                      >
                        {isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-400">
                      {new Date(user.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isCurrentUser && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-neutral-400 hover:bg-white/5 hover:text-white"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="border-white/10 bg-neutral-900">
                            {/* Role submenu */}
                            <div className="px-2 py-1.5 text-xs font-medium text-neutral-500">
                              Changer le rôle
                            </div>
                            {assignableRoles.map((role) => {
                              const roleConf = roleConfig[role];
                              return (
                                <DropdownMenuItem
                                  key={role}
                                  onClick={() => handleUpdateRole(user.id, role)}
                                  disabled={user.role === role || isPending}
                                  className={cn(
                                    "gap-2",
                                    user.role === role && "bg-white/5"
                                  )}
                                >
                                  <roleConf.icon className={cn("h-4 w-4", roleConf.color)} />
                                  {roleConf.label}
                                  {user.role === role && (
                                    <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-400" />
                                  )}
                                </DropdownMenuItem>
                              );
                            })}
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(user.id, isActive)}
                              disabled={isPending}
                              className={cn(
                                "gap-2",
                                isActive ? "text-rose-400" : "text-emerald-400"
                              )}
                            >
                              {isActive ? (
                                <>
                                  <Ban className="h-4 w-4" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="h-4 w-4" />
                                  Réactiver
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserIcon className="h-12 w-12 text-neutral-600" />
            <p className="mt-4 text-lg font-medium text-white">Aucun utilisateur trouvé</p>
            <p className="mt-1 text-sm text-neutral-400">
              {searchQuery || roleFilter !== "all" || statusFilter !== "all"
                ? "Essayez de modifier vos filtres"
                : "Créez le premier utilisateur"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

