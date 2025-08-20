"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function JoinPage() {
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(false);
  const [classInfo, setClassInfo] = useState<{ class_id: string; class_title: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  const checkCode = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/class/invitation/check?code=${encodeURIComponent(code)}${user?.id ? `&user_id=${encodeURIComponent(user.id)}` : ""}`);
      const data = await res.json();
      if (!res.ok || !data.valid) {
        alert("Ungültiger oder abgelaufener Code.");
        return;
      }
      if (data.isMember) {
        alert("Sie sind bereits Mitglied dieser Klasse.");
        router.replace(`/?class=${data.class_id}`);
        return;
      }
      setClassInfo({ class_id: data.class_id, class_title: data.class_title });
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const accept = async () => {
    if (!classInfo || !user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/class/invitation/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, user_id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data?.error || "Beitritt fehlgeschlagen");
        return;
      }
      router.replace(`/?class=${data.class_id}`);
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6">
      <h1 className="text-2xl font-semibold mb-4">Klasse beitreten</h1>
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Einladungscode (6 Zeichen)"
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="max-w-xs"
        />
        <Button onClick={checkCode} disabled={loading || code.length !== 6}>Prüfen</Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Klasse beitreten?</DialogTitle>
            <DialogDescription>
              Möchten Sie der Klasse &quot;{classInfo?.class_title}&quot; beitreten?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
            <Button onClick={accept} disabled={loading}>Beitreten</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
