"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Week = {
  week_id: string;
  week_title: string;
};

export default function Manage() {
  const [weeks, setWeeks] = useState<Week[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleEdit = (id: string, name: string) => {
    setEditId(id);
    setEditName(name);
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
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/timetable/week?weekId=${id}`, { method: "DELETE" });
    fetchWeeks();
  };

  return (
    <div className="max-w-xl mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4">Importierte Wochen</h2>
      {loading ? (
        <div>Lade...</div>
      ) : weeks.length === 0 ? (
        <div>Keine Wochen gefunden.</div>
      ) : (
        <ul className="space-y-2">
          {weeks.map((week) => (
            <li
              key={week.week_id}
              className="flex items-center gap-2 border rounded px-3 py-2 bg-background"
            >
              {editId === week.week_id ? (
                <>
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleEditSave} size="sm">
                    Speichern
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setEditId(null)}
                    size="sm"
                  >
                    Abbrechen
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate" title={week.week_title}>
                    {week.week_title}
                  </span>
                  <Button
                    onClick={() => handleEdit(week.week_id, week.week_title)}
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(week.week_id)}
                    size="sm"
                  >
                    Löschen
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
