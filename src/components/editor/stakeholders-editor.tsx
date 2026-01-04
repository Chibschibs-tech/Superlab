"use client";

import { useState, useTransition } from "react";
import {
  Users,
  Plus,
  Mail,
  Phone,
  Building,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
import type { ProjectContact, ContactType } from "@/types";

interface StakeholdersEditorProps {
  projectId: string;
  contacts: ProjectContact[];
}

const contactTypeConfig: Record<ContactType, { label: string; color: string }> = {
  stakeholder: { label: "Partie prenante", color: "bg-violet-500/20 text-violet-400" },
  sponsor: { label: "Sponsor", color: "bg-amber-500/20 text-amber-400" },
  partner: { label: "Partenaire", color: "bg-emerald-500/20 text-emerald-400" },
  vendor: { label: "Fournisseur", color: "bg-cyan-500/20 text-cyan-400" },
  advisor: { label: "Conseiller", color: "bg-rose-500/20 text-rose-400" },
  client: { label: "Client", color: "bg-blue-500/20 text-blue-400" },
};

export function StakeholdersEditor({ projectId, contacts }: StakeholdersEditorProps) {
  const [localContacts, setLocalContacts] = useState<ProjectContact[]>(contacts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<ProjectContact | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSave = async (formData: FormData) => {
    const newContact: Partial<ProjectContact> = {
      name: formData.get("name") as string,
      email: formData.get("email") as string || null,
      phone: formData.get("phone") as string || null,
      company: formData.get("company") as string || null,
      role: formData.get("role") as string || null,
      type: formData.get("type") as ContactType,
      notes: formData.get("notes") as string || null,
    };

    startTransition(async () => {
      // TODO: Implement server action
      if (editingContact) {
        setLocalContacts((prev) =>
          prev.map((c) => (c.id === editingContact.id ? { ...c, ...newContact } : c))
        );
        toast.success("Contact mis à jour");
      } else {
        const fakeContact: ProjectContact = {
          id: crypto.randomUUID(),
          project_id: projectId,
          ...newContact,
          user_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as ProjectContact;
        setLocalContacts((prev) => [...prev, fakeContact]);
        toast.success("Contact ajouté");
      }
      setIsDialogOpen(false);
      setEditingContact(null);
    });
  };

  const handleDelete = (contactId: string) => {
    startTransition(async () => {
      // TODO: Implement server action
      setLocalContacts((prev) => prev.filter((c) => c.id !== contactId));
      toast.success("Contact supprimé");
    });
  };

  return (
    <Card className="border-white/5 bg-neutral-900/50">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5 text-amber-400" />
          Contacts & Parties Prenantes
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 bg-amber-600 hover:bg-amber-700">
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="border-white/10 bg-neutral-900">
            <DialogHeader>
              <DialogTitle className="text-white">
                {editingContact ? "Modifier le contact" : "Ajouter un contact"}
              </DialogTitle>
            </DialogHeader>
            <form action={handleSave} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    name="name"
                    required
                    defaultValue={editingContact?.name}
                    className="border-white/10 bg-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type *</Label>
                  <Select name="type" defaultValue={editingContact?.type || "stakeholder"}>
                    <SelectTrigger className="border-white/10 bg-white/5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(contactTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    defaultValue={editingContact?.email ?? ""}
                    className="border-white/10 bg-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    defaultValue={editingContact?.phone ?? ""}
                    className="border-white/10 bg-white/5"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="company">Entreprise</Label>
                  <Input
                    id="company"
                    name="company"
                    defaultValue={editingContact?.company ?? ""}
                    className="border-white/10 bg-white/5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Rôle / Fonction</Label>
                  <Input
                    id="role"
                    name="role"
                    defaultValue={editingContact?.role ?? ""}
                    className="border-white/10 bg-white/5"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  defaultValue={editingContact?.notes ?? ""}
                  className="border-white/10 bg-white/5"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingContact(null);
                  }}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isPending} className="bg-amber-600 hover:bg-amber-700">
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {localContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-neutral-600" />
            <p className="mt-4 text-lg font-medium text-white">Aucun contact</p>
            <p className="mt-1 text-sm text-neutral-400">
              Ajoutez des parties prenantes, sponsors, partenaires...
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {localContacts.map((contact) => {
              const typeConfig = contactTypeConfig[contact.type] || contactTypeConfig.stakeholder;
              return (
                <div
                  key={contact.id}
                  className="group relative rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-white">{contact.name}</p>
                      {contact.role && (
                        <p className="text-sm text-neutral-400">{contact.role}</p>
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("border-transparent text-xs", typeConfig.color)}
                    >
                      {typeConfig.label}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-1">
                    {contact.company && (
                      <p className="flex items-center gap-2 text-sm text-neutral-400">
                        <Building className="h-3 w-3" />
                        {contact.company}
                      </p>
                    )}
                    {contact.email && (
                      <p className="flex items-center gap-2 text-sm text-neutral-400">
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </p>
                    )}
                    {contact.phone && (
                      <p className="flex items-center gap-2 text-sm text-neutral-400">
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </p>
                    )}
                  </div>
                  {/* Actions */}
                  <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-neutral-400 hover:text-white"
                      onClick={() => {
                        setEditingContact(contact);
                        setIsDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-neutral-400 hover:text-rose-400"
                      onClick={() => handleDelete(contact.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

