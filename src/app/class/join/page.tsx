"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function ClassJoinPage() {
  const [code, setCode] = useState("");
  const [open, setOpen] = useState(false);
  const [classInfo, setClassInfo] = useState<{ class_id: string; class_title: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillHandled = useRef(false);

  const checkCode = async (override?: string) => {
    const codeToUse = (override ?? code).trim();
    if (!codeToUse) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/class/invitation/check?code=${encodeURIComponent(codeToUse)}${user?.id ? `&user_id=${encodeURIComponent(user.id)}` : ""}`);
      const data = await res.json();
      if (!data.valid) {
        toast.error("Ungültiger oder abgelaufener Code");
        return;
      }
      if (data.isMember) {
        toast.info("Sie sind bereits Mitglied dieser Klasse");
        router.replace(`/?class=${data.class_id}`);
        return;
      }
      setClassInfo({ class_id: data.class_id, class_title: data.class_title });
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // Prefill code from ?code= and auto-check when valid
  useEffect(() => {
    if (prefillHandled.current) return;
    const q = (searchParams.get("code") || "").toUpperCase();
    if (!q) return;
    prefillHandled.current = true;
    setCode(q);
    if (q.length === 6) {
      // fire-and-forget check for prefilled code
      void checkCode(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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
        toast.error(data?.error || "Beitritt fehlgeschlagen");
        return;
      }
      toast.success("Klasse beigetreten");
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
  <Button onClick={() => checkCode()} disabled={loading || code.length !== 6}>Prüfen</Button>
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
