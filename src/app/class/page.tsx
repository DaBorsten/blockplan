"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUser } from "@clerk/nextjs";

type Week = {
  week_id: string;
  week_title: string;
};

export default function ManageClass() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");

  const { user } = useUser();

  const fetchWeeks = async () => {
    setLoading(true);
    const res = await fetch("/api/week/weeks");
    const data = await res.json();
    const result = data.data || [];

    setWeeks(result || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchWeeks();
  }, []);

  const grouped = useMemo(() => {
    // Group by prefix before the last '_' in the title, or the full title if none
    const map: Record<string, Week[]> = {};
    for (const w of weeks) {
      const title = w.week_title || "";
      const idx = title.lastIndexOf("_");
      const key = idx > 0 ? title.slice(0, idx) : title;
      if (!map[key]) map[key] = [];
      map[key].push(w);
    }

    // Convert to sorted array of [section, items]
    const sections: Array<[string, Week[]]> = Object.entries(map).map(
      ([k, v]) => [k, v],
    );

    // Helper to extract numeric grade from section (e.g., '12A' -> 12)
    const gradeFrom = (s: string) => {
      const m = s.match(/^(\d{1,2})/);
      return m ? parseInt(m[1], 10) : -Infinity;
    };

    // Helper to extract KW number from strings like 'KW 22' or 'KW22'
    const kwFrom = (s: string) => {
      const m = s.match(/KW\s*(\d{1,3})/i) || s.match(/KW(\d{1,3})/i);
      return m ? parseInt(m[1], 10) : -Infinity;
    };

    sections.sort((a, b) => {
      const [sa] = a;
      const [sb] = b;
      // Try to parse grade from the start of the section (e.g., '12A')
      const ga = gradeFrom(sa);
      const gb = gradeFrom(sb);
      if (ga !== gb) return gb - ga; // higher grades first
      // if grades equal or not found, sort by KW number
      const kwa = kwFrom(sa);
      const kwb = kwFrom(sb);
      if (kwa !== kwb) return kwb - kwa; // higher KW first
      return sa.localeCompare(sb);
    });

    // Also sort items within each section by trailing suffix number (e.g., '_2' > '_1')
    for (const [, items] of sections) {
      items.sort((x, y) => {
        const sx = x.week_title || "";
        const sy = y.week_title || "";
        const mx = sx.match(/_(\d+)$/);
        const my = sy.match(/_(\d+)$/);
        const nx = mx ? parseInt(mx[1], 10) : -Infinity;
        const ny = my ? parseInt(my[1], 10) : -Infinity;
        return ny - nx;
      });
    }

    return sections;
  }, [weeks]);

  const handleEdit = (id: string, name: string) => {
    setEditId(id);
    setEditName(name);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (editId) {
      await fetch("/api/week/weekName", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekID: editId, newWeekName: editName }),
      });
      setEditId(null);
      setEditName("");
      fetchWeeks();
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
      await fetchWeeks();
      setCreateOpen(false);
      setCreateName("");
    } catch (err) {
      console.error("Fehler beim Erstellen der Klasse:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/timetable/week?weekId=${id}`, { method: "DELETE" });
    fetchWeeks();
  };

  /* onst handleCreateSave = async () => {
    // Currently only opens dialog to enter a class title as requested.
    // Hook up API call here when backend is ready.
    // Example (commented due to missing owner context):
    // await fetch('/api/class', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ class: createName, owner_id: 'OWNER_ID_HERE' }),
    // });

    const owner_id = user?.id;

    await fetch("/api/class", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ class: createName, owner_id: owner_id }),
    });

    setCreateOpen(false);
    setCreateName("");
  }; */

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
      ) : weeks.length === 0 ? (
        <div>Keine Klassen gefunden.</div>
      ) : (
        <div className="space-y-6">
          {grouped.map(([section, items]) => (
            <section key={section}>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {section}
              </h3>
              <ul className="grid gap-3">
                {items.map((week) => (
                  <li key={week.week_id} className="block">
                    <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card/60 dark:bg-card border-border shadow-sm">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-md flex items-center justify-center font-semibold text-sm"
                          title={week.week_title}
                          aria-hidden
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent text-sidebar-accent-foreground border border-border dark:bg-sidebar-accent dark:text-sidebar-accent-foreground">
                            {week.week_title
                              ? week.week_title.split(" ")[0]
                              : "W"}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div
                            className="text-sm font-medium text-slate-900 dark:text-white truncate"
                            title={week.week_title}
                          >
                            {week.week_title}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() =>
                            handleEdit(week.week_id, week.week_title)
                          }
                          size="sm"
                          className="p-2 rounded-md w-9 h-9 md:w-auto md:h-auto md:px-3 cursor-pointer"
                          aria-label="Bearbeiten"
                        >
                          <Pencil className="w-4 h-4" />
                          <span className="hidden md:inline">Bearbeiten</span>
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(week.week_id)}
                          size="sm"
                          className="p-2 rounded-md w-9 h-9 md:w-auto md:h-auto md:px-3 cursor-pointer"
                          aria-label="Löschen"
                        >
                          <Trash2 className="w-4 h-4" />
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
            <DialogTitle>Woche umbenennen</DialogTitle>
            <DialogDescription>
              Bitte geben Sie einen neuen Namen für die Woche ein.
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
    </div>
  );
}
