"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, RefreshCw, Trash2 } from "lucide-react";

type Member = { user_id: string; role: "owner" | "admin" | "member"; nickname?: string | null };

export default function ClassMembersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [currentRole, setCurrentRole] = useState<Member["role"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [classTitle, setClassTitle] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  type ExpiryPreset = "30m"|"1h"|"6h"|"12h"|"1d"|"7d"|"never";
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("never");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invites, setInvites] = useState<Array<{ id: string; expiration_date: string; active: boolean }>>([]);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/class/member?class_id=${encodeURIComponent(id)}${user?.id ? `&current_user_id=${encodeURIComponent(user.id)}` : ""}`);
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Fehler beim Laden");
        return;
      }
      setMembers(data.members || []);
      setCurrentRole(data.currentRole || null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  useEffect(() => {
    const getTitle = async () => {
      if (!id) return;
      try {
        const res = await fetch(`/api/class?id=${encodeURIComponent(id)}`);
        const data = await res.json();
        if (res.ok && data?.data) setClassTitle((data.data.title as string) || "");
      } catch {
        /* ignore */
      }
    };
    getTitle();
  }, [id]);

  // Load invites when dialog opens
  useEffect(() => {
    if (inviteOpen) {
      fetchInvites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteOpen]);

  const fetchInvites = async () => {
    if (!user?.id || !id) return;
    const res = await fetch(`/api/class/invitation?user_id=${encodeURIComponent(user.id)}&class_id=${encodeURIComponent(id as string)}`);
    if (!res.ok) return;
    const data = await res.json();
    setInvites(data.data || []);
  };

  const handleEditSave = async () => {
    if (!id) return;
    await fetch("/api/class/className", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classID: id, newClassName: editName }),
    });
    setEditOpen(false);
  setClassTitle(editName);
  };

  const handleCreateInvite = async () => {
    if (!user?.id || !id) return;
    try {
      setInviteLoading(true);
      const body: { user_id: string; class_id: string; expires: boolean; expiration_date?: string } = {
        user_id: user.id, class_id: id as string, expires: expiryPreset !== "never",
      };
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
        body.expiration_date = new Date(now + addMs[expiryPreset as Exclude<ExpiryPreset, "never">]).toISOString();
      }
      const res = await fetch("/api/class/invitation", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (res.ok) fetchInvites();
    } finally {
      setInviteLoading(false);
    }
  };

  const handleDeleteInvite = async (inviteId: string) => {
    if (!user?.id) return;
    const res = await fetch(`/api/class/invitation?id=${encodeURIComponent(inviteId)}&user_id=${encodeURIComponent(user.id)}`, { method: "DELETE" });
    if (res.ok) fetchInvites();
  };

  const canRemove = (target: Member) => {
    if (!currentRole) return false;
    if (user?.id === target.user_id) return true; // self leave allowed except owner, handled on server
    if (currentRole === "owner") return target.role !== "owner";
    if (currentRole === "admin") return target.role === "member";
    return false;
  };

  const removeOrLeave = async (target: Member) => {
    if (!id || !user?.id) return;
    const res = await fetch(`/api/class/member?class_id=${encodeURIComponent(id)}&target_user_id=${encodeURIComponent(target.user_id)}&requester_id=${encodeURIComponent(user.id)}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Aktion fehlgeschlagen");
      return;
    }
    if (target.user_id === user.id) {
      router.replace("/");
      return;
    }
    load();
  };

  const changeRole = async (target: Member, role: "admin" | "member") => {
    if (!id || !user?.id) return;
    const res = await fetch(`/api/class/member`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class_id: id, target_user_id: target.user_id, requester_id: user.id, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data?.error || "Rollenänderung fehlgeschlagen");
      return;
    }
    load();
  };

  const canPromote = (target: Member) => {
    if (!currentRole) return false;
    if (target.role !== "member") return false;
    return currentRole === "owner" || currentRole === "admin";
  };
  const canDemote = (target: Member) => {
    if (!currentRole) return false;
    if (target.role !== "admin") return false;
    return currentRole === "owner";
  };

  if (loading) return <div className="px-4 md:px-6 pb-4 md:pb-6">Lade…</div>;

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-2xl font-semibold truncate">
            Klasse {classTitle || ""}
          </h1>
          {currentRole === "owner" && (
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => { setEditName(classTitle || ""); setEditOpen(true); }} aria-label="Klasse umbenennen">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </Button>
          )}
        </div>
        {(currentRole === "owner" || currentRole === "admin") && (
          <Button onClick={() => setInviteOpen(true)} variant="outline" size="sm">Einladungen</Button>
        )}
      </div>

      <h2 className="text-lg font-medium mb-2">Mitglieder</h2>
      <ul className="divide-y rounded-md border">
  {members.map((m) => (
          <li key={m.user_id} className="flex items-center justify-between p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs">
    {(m.nickname || m.user_id).substring(0, 2)}
              </div>
              <div className="text-sm">
    <div className="font-medium">{m.nickname || m.user_id}</div>
                <div className="text-muted-foreground text-xs">{m.role}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canPromote(m) && (
                <Button variant="secondary" size="sm" onClick={() => changeRole(m, "admin")}>Zu Admin machen</Button>
              )}
              {canDemote(m) && (
                <Button variant="secondary" size="sm" onClick={() => changeRole(m, "member")}>Zu Member machen</Button>
              )}
              {canRemove(m) && (
                <Button variant="outline" size="sm" onClick={() => removeOrLeave(m)}>
                  {user?.id === m.user_id ? "Klasse verlassen" : "Entfernen"}
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klasse umbenennen</DialogTitle>
            <DialogDescription>Bitte geben Sie einen neuen Namen für die Klasse ein.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Neuer Name" />
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" onClick={() => setEditOpen(false)}><X className="w-4 h-4"/>Abbrechen</Button>
            <Button onClick={handleEditSave}><Check className="w-4 h-4"/>Speichern</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Einladungslinks verwalten</DialogTitle>
            <DialogDescription>Erstellen Sie Einladungslinks und sehen Sie bestehende.</DialogDescription>
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
              <Button variant="ghost" size="sm" onClick={fetchInvites}>
                <RefreshCw className="w-4 h-4" /> Aktualisieren
              </Button>
            </div>

            <div className="border rounded-md divide-y">
              {invites.length > 0 ? invites.map((inv) => (
                <div key={inv.id} className="px-3 py-2 flex items-center justify-between text-sm">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs break-all">{inv.id}</span>
                    <span className="text-muted-foreground">
                      {inv.expiration_date === "9999-12-31T23:59:59.000Z" ? "Kein Ablauf" : new Date(inv.expiration_date).toLocaleString()}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => handleDeleteInvite(inv.id)} title="Löschen">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">Keine Einladungen vorhanden.</div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
