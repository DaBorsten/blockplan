"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";

export default function Dev() {
  const user = useUser();
  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6 h-full w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Dev
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Developer Einstellungen
        </p>
      </div>

      <Button
        onClick={async () => {
          await fetch("/api/initialize", { method: "POST" });
        }}
        className="cursor-pointer"
      >
        Datenbank initialisieren
      </Button>
      <Button
        onClick={async () => {
          await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.user?.id }),
          });
        }}
        className="cursor-pointer"
      >
        User erstellen
      </Button>
    </div>
  );
}
