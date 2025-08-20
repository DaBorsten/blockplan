"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, KeyRound, RefreshCw, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUser } from "@clerk/nextjs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ClassItem = {
  class_id: string;
  class_title: string;
};

export default function ManageClass() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [inviteOpen, setInviteOpen] = useState<string | null>(null);
  type ExpiryPreset = "30m"|"1h"|"6h"|"12h"|"1d"|"7d"|"never";
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("never");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invites, setInvites] = useState<Record<string, Array<{ id: string; expiration_date: string; active: boolean }>>>({});
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteInviteId, setDeleteInviteId] = useState<string | null>(null);

  const { user } = useUser();

  const fetchClasses = async (userId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/class/classes?user_id=${encodeURIComponent(userId)}`);
      const data = await res.json();
      const result: ClassItem[] = data.data || [];
      setClasses(result || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvites = async (userId: string, classId: string) => {
    try {
      const res = await fetch(`/api/class/invitation?user_id=${encodeURIComponent(userId)}&class_id=${encodeURIComponent(classId)}`);
      if (!res.ok) return;
      const data = await res.json();
      const list: Array<{ id: string; expiration_date: string; active: boolean }> = data.data || [];
      setInvites((prev) => ({ ...prev, [classId]: list }));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (user?.id) fetchClasses(user.id);
  }, [user?.id]);

  const handleEdit = (id: string, name: string) => {
    setEditId(id);
    setEditName(name);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (editId) {
      await fetch("/api/class/className", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classID: editId, newClassName: editName }),
      });
      setEditId(null);
      setEditName("");
      if (user?.id) fetchClasses(user.id);
      setEditOpen(false);
    }
  };

  const handleCreateSave = async () => {
    const owner_id = user?.id;
    if (!createName.trim() || !owner_id) return;

    try {
      setLoading(true);

      // create class
      const res = await fetch("/api/class", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ class: createName, owner_id }),
      });

      const data = await res.json();
      const class_id =
        data?.class_id || data?.id || (data?.data && data.data.class_id);

      if (!class_id) {
        console.error("Kein class_id in Antwort:", data);
        // optional: show user-facing error
        return;
      }

      // add user to user_class (adjust payload keys if your API expects different names)
      const memberRes = await fetch("/api/class/member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: owner_id, class_id, role: "owner" }),
      });

      if (!memberRes.ok) {
        console.error(
          "Fehler beim Hinzufügen des Users zur Klasse",
          await memberRes.text(),
        );
        // optional: handle error (rollback, notify user, ...)
      }

      // refresh list / close dialog
  if (user?.id) await fetchClasses(user.id);
      setCreateOpen(false);
      setCreateName("");
    } catch (err) {
      console.error("Fehler beim Erstellen der Klasse:", err);
    } finally {
      setLoading(false);
    }
  };

  const openInvite = async (classId: string) => {
    setInviteOpen(classId);
    setExpiryPreset("never");
    if (user?.id) await fetchInvites(user.id, classId);
  };

  type InviteCreateBody = { user_id: string; class_id: string; expires: boolean; expiration_date?: string };

  const handleCreateInvite = async () => {
    if (!user?.id || !inviteOpen) return;
    try {
      setInviteLoading(true);
      const body: InviteCreateBody = { user_id: user.id, class_id: inviteOpen, expires: expiryPreset !== "never" };
      if (expiryPreset !== "never") {
        const now = Date.now();
        const addMs: Record<Exclude<ExpiryPreset, "never">, number> = {
          "30m": 30 * 60 * 1000,
          "1h": 60 * 60 * 1000,
          "6h": 6 * 60 * 60 * 1000,
          "12h": 12 * 60 * 60 * 1000,
          "1d": 24 * 60 * 60 * 1000,
          "7d": 7 * 24 * 60 * 60 * 1000,
        };
        const iso = new Date(now + addMs[expiryPreset as Exclude<ExpiryPreset, "never">]).toISOString();
        body.expiration_date = iso;
      }
      const res = await fetch("/api/class/invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        console.error("Invite creation failed", await res.text());
        return;
      }
      await fetchInvites(user.id, inviteOpen);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteInvite = async (id: string) => {
    if (!user?.id || !inviteOpen) return;
    try {
      setInviteLoading(true);
      const res = await fetch(`/api/class/invitation?id=${encodeURIComponent(id)}&user_id=${encodeURIComponent(user.id)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        console.error("Invite delete failed", await res.text());
        return;
      }
      await fetchInvites(user.id, inviteOpen);
    } finally {
      setInviteLoading(false);
    }
  };

  // Optional: Delete/leave class can be wired here when an API exists.

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6">
      <div className="flex flex-row justify-between items-center mb-8">
        <div className="hidden md:flex flex-col">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
            Klasse verwalten
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            Verwalten Sie Ihre erstellten Klassen
          </p>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Button
            className="whitespace-nowrap"
            onClick={() => setCreateOpen(true)}
          >
            Klasse erstellen
          </Button>
        </div>
      </div>
      {loading ? (
        <div>Lade...</div>
      ) : classes.length === 0 ? (
        <div>Keine Klassen gefunden.</div>
      ) : (
        <ul className="grid gap-3">
          {classes.map((cls) => (
            <li key={cls.class_id} className="block">
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card/60 dark:bg-card border-border shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className="w-10 h-10 rounded-md flex items-center justify-center font-semibold text-sm"
                    title={cls.class_title}
                    aria-hidden
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground border border-border dark:bg-sidebar-accent dark:text-sidebar-accent-foreground">
                      {cls.class_title ? cls.class_title.split(" ")[0] : "C"}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-sm font-medium text-slate-900 dark:text-white truncate"
                      title={cls.class_title}
                    >
                      {cls.class_title}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleEdit(cls.class_id, cls.class_title)}
                    size="sm"
                    className="p-2 rounded-md w-9 h-9 md:w-auto md:h-auto md:px-3 cursor-pointer"
                    aria-label="Bearbeiten"
                  >
                    <Pencil className="w-4 h-4" />
                    <span className="hidden md:inline">Bearbeiten</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => openInvite(cls.class_id)}
                    size="sm"
                    className="p-2 rounded-md w-9 h-9 md:w-auto md:h-auto md:px-3 cursor-pointer"
                    aria-label="Einladungslinks"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span className="hidden md:inline">Einladungen</span>
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Invite Dialog */}
      <Dialog
        open={!!inviteOpen}
        onOpenChange={(o) => {
          if (!o) {
            setInviteOpen(null);
            setExpiryPreset("never");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Einladungslinks verwalten</DialogTitle>
            <DialogDescription>
              Erstellen Sie Einladungslinks und sehen Sie bestehende.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="flex items-center gap-2">
          <Select value={expiryPreset} onValueChange={(v: ExpiryPreset) => setExpiryPreset(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Ablauf" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30m">30 Minuten</SelectItem>
                  <SelectItem value="1h">1 Stunde</SelectItem>
                  <SelectItem value="6h">6 Stunden</SelectItem>
                  <SelectItem value="12h">12 Stunden</SelectItem>
                  <SelectItem value="1d">1 Tag</SelectItem>
                  <SelectItem value="7d">7 Tage</SelectItem>
                  <SelectItem value="never">Nie</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleCreateInvite} disabled={inviteLoading} size="sm" className="cursor-pointer">
                <Check className="w-4 h-4" />
                Erstellen
              </Button>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="text-sm font-medium">Erstellte Einladungen</div>
              {inviteOpen && user?.id && (
                <Button variant="ghost" size="sm" className="cursor-pointer" onClick={() => fetchInvites(user.id!, inviteOpen!)}>
                  <RefreshCw className="w-4 h-4" /> Aktualisieren
                </Button>
              )}
            </div>

            <div className="border rounded-md divide-y">
              {(inviteOpen && invites[inviteOpen]) && invites[inviteOpen].length > 0 ? (
                invites[inviteOpen].map((inv) => (
                  <div key={inv.id} className="px-3 py-2 flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="font-mono text-xs break-all">{inv.id}</span>
                      <span className="text-muted-foreground">
                        {inv.expiration_date === "9999-12-31T23:59:59.000Z" ? "Kein Ablauf" : new Date(inv.expiration_date).toLocaleString()}
                      </span>
                    </div>
                    <span className={`text-xs ${inv.active ? "text-green-600" : "text-rose-600"}`}>
                      {inv.active ? "Aktiv" : "Abgelaufen"}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer"
                      onClick={() => { setDeleteInviteId(inv.id); setDeleteOpen(true); }}
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">Keine Einladungen vorhanden.</div>
              )}
            </div>
          </div>

          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setInviteOpen(null)}
              size="sm"
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(o) => {
          setEditOpen(o);
          if (!o) {
            setEditId(null);
            setEditName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klasse umbenennen</DialogTitle>
            <DialogDescription>
              Bitte geben Sie einen neuen Namen für die Klasse ein.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Neuer Wochenname"
              autoFocus
            />
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              size="sm"
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button
              onClick={handleEditSave}
              size="sm"
              className="cursor-pointer"
            >
              <Check className="w-4 h-4" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Class Dialog */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          setCreateOpen(o);
          if (!o) setCreateName("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Klasse erstellen</DialogTitle>
            <DialogDescription>
              Bitte geben Sie den Titel der Klasse ein.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              placeholder="Klassentitel"
              autoFocus
            />
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              size="sm"
              className="cursor-pointer"
            >
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button
              onClick={handleCreateSave}
              size="sm"
              className="cursor-pointer"
              disabled={!createName.trim()}
            >
              <Check className="w-4 h-4" />
              Erstellen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Invite Confirmation Dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={(o) => { setDeleteOpen(o); if (!o) setDeleteInviteId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Löschen bestätigen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie den Einladungs-Code {deleteInviteId ? `"${deleteInviteId}"` : ""} löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { if (deleteInviteId) handleDeleteInvite(deleteInviteId); setDeleteOpen(false); }}
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
