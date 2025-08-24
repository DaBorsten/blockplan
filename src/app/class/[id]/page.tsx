"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, X, RefreshCw, Trash2, Copy as CopyIcon, Crown, Swords, User } from "lucide-react";
import { toast } from "sonner";

type Member = { user_id: string; role: "owner" | "admin" | "member"; nickname?: string | null };

export default function ClassMembersPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useUser();
  const [members, setMembers] = useState<Member[]>([]);
  const [currentRole, setCurrentRole] = useState<Member["role"] | null>(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [classTitle, setClassTitle] = useState<string>("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  type ExpiryPreset = "30m"|"1h"|"6h"|"12h"|"1d"|"7d"|"never";
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>("never");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [invites, setInvites] = useState<Array<{ id: string; expiration_date: string; active: boolean }>>([]);
  // Refresh spinner control: ensure at least one full rotation and stop at cycle boundary
  const [invitesSpinning, setInvitesSpinning] = useState(false);
  const [invitesFetching, setInvitesFetching] = useState(false);
  const [spinStartTs, setSpinStartTs] = useState<number | null>(null);
  // Weeks management state
  type Week = { week_id: string; week_title: string };
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [weeksLoading, setWeeksLoading] = useState(false);
  const [weekEditId, setWeekEditId] = useState<string | null>(null);
  const [weekEditName, setWeekEditName] = useState("");
  const [weekEditOpen, setWeekEditOpen] = useState(false);

  const loadMembers = async () => {
    if (!id) return;
    setMembersLoading(true);
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
      setMembersLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
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
    if (invitesFetching) return; // avoid overlapping fetches
    setInvitesFetching(true);
    if (!invitesSpinning) {
      setInvitesSpinning(true);
      setSpinStartTs(performance.now());
    }
    try {
      const res = await fetch(`/api/class/invitation?user_id=${encodeURIComponent(user.id)}&class_id=${encodeURIComponent(id as string)}`);
      if (!res.ok) return;
      const data = await res.json();
      setInvites(data.data || []);
    } finally {
      // compute remaining time to finish current spin cycle and ensure min 1s total
      const cycleMs = 1000; // matches Tailwind animate-spin default
      const started = spinStartTs ?? performance.now();
      const elapsed = performance.now() - started;
      const ensureMin = Math.max(cycleMs - elapsed, 0);
      const toCycleEnd = (cycleMs - (elapsed % cycleMs)) % cycleMs;
      const delay = Math.max(ensureMin, toCycleEnd);
      window.setTimeout(() => {
        setInvitesSpinning(false);
        setSpinStartTs(null);
        setInvitesFetching(false);
      }, Math.ceil(delay));
    }
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

  const copyInviteLink = async (code: string) => {
    const origin = typeof window !== "undefined" && window.location ? window.location.origin : "";
    const url = `${origin}/class/join?code=${encodeURIComponent(code)}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link kopiert");
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = url;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      try {
        const ok = document.execCommand("copy");
        if (ok) {
          toast.success("Link kopiert");
        } else {
          toast.error("Kopieren fehlgeschlagen");
        }
      } finally {
        document.body.removeChild(ta);
      }
    }
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
    loadMembers();
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
  loadMembers();
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

  const [activeTab, setActiveTab] = useState<"wochen" | "mitglieder">("mitglieder");

  // Weeks fetch (requires class id + user id similar to manage page logic which used search param 'class')
  const fetchWeeks = useCallback(async () => {
    if (!id || !user?.id) {
      setWeeks([]);
      return;
    }
    setWeeksLoading(true);
    try {
      const params = new URLSearchParams({ user_id: user.id, class_id: id as string });
      const res = await fetch(`/api/week/weeks?${params.toString()}`);
      const data = await res.json();
      setWeeks((data.data as Week[]) || []);
    } finally {
      setWeeksLoading(false);
    }
  }, [id, user?.id]);

  useEffect(() => {
    if (activeTab === "wochen") fetchWeeks();
  }, [activeTab, fetchWeeks]);

  const groupedWeeks = useMemo(() => {
    const map: Record<string, Week[]> = {};
    for (const w of weeks) {
      const title = w.week_title || "";
      const idx = title.lastIndexOf("_");
      const key = idx > 0 ? title.slice(0, idx) : title;
      (map[key] ||= []).push(w);
    }
    const sections: Array<[string, Week[]]> = Object.entries(map);
    const gradeFrom = (s: string) => { const m = s.match(/^(\d{1,2})/); return m ? parseInt(m[1], 10) : -Infinity; };
    const kwFrom = (s: string) => { const m = s.match(/KW\s*(\d{1,3})/i) || s.match(/KW(\d{1,3})/i); return m ? parseInt(m[1], 10) : -Infinity; };
    sections.sort((a, b) => {
      const ga = gradeFrom(a[0]);
      const gb = gradeFrom(b[0]);
      if (ga !== gb) return gb - ga;
      const kwa = kwFrom(a[0]);
      const kwb = kwFrom(b[0]);
      if (kwa !== kwb) return kwb - kwa;
      return a[0].localeCompare(b[0]);
    });
    for (const [, items] of sections) {
      items.sort((x, y) => {
        const mx = x.week_title.match(/_(\d+)$/);
        const my = y.week_title.match(/_(\d+)$/);
        const nx = mx ? parseInt(mx[1], 10) : -Infinity;
        const ny = my ? parseInt(my[1], 10) : -Infinity;
        return ny - nx;
      });
    }
    return sections;
  }, [weeks]);

  const handleWeekEdit = (wid: string, title: string) => {
    setWeekEditId(wid);
    setWeekEditName(title);
    setWeekEditOpen(true);
  };

  const saveWeekEdit = async () => {
    if (!weekEditId) return;
    await fetch("/api/week/weekName", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weekID: weekEditId, newWeekName: weekEditName }),
    });
    setWeekEditOpen(false);
    setWeekEditId(null);
    setWeekEditName("");
    fetchWeeks();
  };

  const deleteWeek = async (wid: string) => {
    await fetch(`/api/timetable/week?weekId=${wid}`, { method: "DELETE" });
    fetchWeeks();
  };

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="text-2xl font-semibold truncate">Klasse {classTitle || ""}</h1>
          {currentRole === "owner" && (
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0"
              onClick={() => {
                setEditName(classTitle || "");
                setEditOpen(true);
              }}
              aria-label="Klasse umbenennen"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4"
              >
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </Button>
          )}
        </div>
        {(currentRole === "owner" || currentRole === "admin") && activeTab === "mitglieder" && (
          <Button onClick={() => setInviteOpen(true)} variant="outline" size="sm">
            Einladungen
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b pb-2">
        <Button
          variant={activeTab === "mitglieder" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("mitglieder")}
          className={activeTab === "mitglieder" ? "" : "opacity-70"}
        >
          Mitglieder
        </Button>
        <Button
          variant={activeTab === "wochen" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("wochen")}
          className={activeTab === "wochen" ? "" : "opacity-70"}
        >
          Wochen
        </Button>
      </div>

      {activeTab === "mitglieder" && (
        <>
          {membersLoading ? (
            <div>Lade…</div>
          ) : (
            <ul className="divide-y rounded-md border">
              {members.map((m) => (
                <li key={m.user_id} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs">
                      {(m.nickname || m.user_id).substring(0, 2)}
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">{m.nickname || m.user_id}</div>
                      <div className="text-muted-foreground text-xs flex items-center gap-1">
                        {m.role === "owner" && (
                          <>
                            <Crown className="w-3.5 h-3.5" />
                            <span>Besitzer</span>
                          </>
                        )}
                        {m.role === "admin" && (
                          <>
                            <Swords className="w-3.5 h-3.5" />
                            <span>Admin</span>
                          </>
                        )}
                        {m.role === "member" && (
                          <>
                            <User className="w-3.5 h-3.5" />
                            <span>Mitglied</span>
                          </>
                        )}
                      </div>
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
          )}
        </>
      )}

      {activeTab === "wochen" && (
        <div>
          {weeksLoading ? (
            <div>Lade…</div>
          ) : weeks.length === 0 ? (
            <div className="text-sm text-muted-foreground">Keine Wochen gefunden.</div>
          ) : (
            <div className="space-y-6">
              {groupedWeeks.map(([section, items]) => (
                <section key={section}>
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">{section}</h3>
                  <ul className="grid gap-3">
                    {items.map((week) => (
                      <li key={week.week_id} className="block">
                        <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card/60 border-border shadow-sm">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-md flex items-center justify-center font-semibold text-sm" aria-hidden>
                              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground border border-border">
                                {week.week_title ? week.week_title.split(" ")[0] : "W"}
                              </div>
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate" title={week.week_title}>{week.week_title}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button onClick={() => handleWeekEdit(week.week_id, week.week_title)} size="sm" className="p-2 rounded-md w-9 h-9 md:w-auto md:h-auto md:px-3 cursor-pointer">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                              <span className="hidden md:inline">Bearbeiten</span>
                            </Button>
                            <Button variant="destructive" onClick={() => deleteWeek(week.week_id)} size="sm" className="p-2 rounded-md w-9 h-9 md:w-auto md:h-auto md:px-3 cursor-pointer">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                              <span className="hidden md:inline">Löschen</span>
                            </Button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>
      )}

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
      <Dialog
        open={weekEditOpen}
        onOpenChange={(o) => {
          setWeekEditOpen(o);
          if (!o) {
            setWeekEditId(null);
            setWeekEditName("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Woche umbenennen</DialogTitle>
            <DialogDescription>Bitte geben Sie einen neuen Namen für die Woche ein.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Input value={weekEditName} onChange={(e) => setWeekEditName(e.target.value)} placeholder="Neuer Wochenname" autoFocus />
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" onClick={() => setWeekEditOpen(false)} size="sm" className="cursor-pointer">
              <X className="w-4 h-4" />
              Abbrechen
            </Button>
            <Button onClick={saveWeekEdit} size="sm" className="cursor-pointer">
              <Check className="w-4 h-4" />
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
              <Button variant="ghost" size="sm" onClick={fetchInvites} disabled={invitesSpinning || invitesFetching}>
                <RefreshCw className={`w-4 h-4 ${invitesSpinning ? "animate-spin" : ""}`} /> Aktualisieren
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
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="cursor-pointer"
                      onClick={() => copyInviteLink(inv.id)}
                      title="Link kopieren"
                      aria-label="Link kopieren"
                    >
                      <CopyIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => handleDeleteInvite(inv.id)} title="Löschen">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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
