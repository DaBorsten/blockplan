"use client";

import { useEffect, useState } from "react";
import { ModeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

export default function Settings() {
  const { user } = useUser();
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/user?user_id=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        if (data?.data?.nickname) setNickname(data.data.nickname);
      } catch {
        // ignore
      }
    };
    run();
  }, [user?.id]);

  const save = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, nickname }),
      });
      if (!res.ok) alert("Fehler beim Speichern");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6 h-full w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Einstellungen
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Webseite Einstellungen
        </p>
      </div>

      <div className="grid gap-6 max-w-xl">
        <section>
          <h3 className="text-lg font-medium mb-2">Profil</h3>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={32}
            />
            <Button onClick={save} disabled={loading} className="cursor-pointer">Speichern</Button>
          </div>
        </section>

        <section>
          <h3 className="text-lg font-medium mb-2">Darstellung</h3>
          <ModeToggle />
        </section>
      </div>
    </div>
  );
}
