"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function JoinCodePage() {
  const params = useParams<{ code: string }>();
  const code = (params?.code || "").toString().toUpperCase();
  const { user } = useUser();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [classInfo, setClassInfo] = useState<{ class_id: string; class_title: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!code) return;
      try {
        const res = await fetch(`/api/class/invitation/check?code=${encodeURIComponent(code)}${user?.id ? `&user_id=${encodeURIComponent(user.id)}` : ""}`);
        const data = await res.json();
        if (!res.ok || !data.valid) {
          alert("Ungültiger oder abgelaufener Code.");
          router.replace("/join");
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
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, user?.id]);

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

  if (loading) return <div className="px-4 md:px-6 pb-4 md:pb-6">Lade…</div>;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Klasse beitreten?</DialogTitle>
          <DialogDescription>
            Möchten Sie der Klasse &quot;{classInfo?.class_title}&quot; beitreten?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-row gap-2 justify-end">
          <Button variant="outline" onClick={() => router.replace("/join")}>Abbrechen</Button>
          <Button onClick={accept} disabled={loading}>Beitreten</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
