"use client";

import React from "react";
import { Button } from "@/components/ui/button";

export default function Dev() {
  return (
    <div className="px-6">
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
      >
        Datenbank initialisieren
      </Button>
    </div>
  );
}
