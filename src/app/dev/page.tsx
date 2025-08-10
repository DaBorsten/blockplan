"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { InitializeDatabase } from "@/utils/db";

export default function Dev() {
  return (
    <div className="w-full mx-auto p-4">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">
          Dev
        </h2>
        <p className="text-slate-600 dark:text-slate-400">
          Developer Einstellungen
        </p>
      </div>

      <Button onClick={async () => await InitializeDatabase()}>
        Datenbank initialisieren
      </Button>
    </div>
  );
}
