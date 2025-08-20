"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// Dialog removed in favor of info card
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, Users } from "lucide-react";

export default function ClassJoinPage() {
  const [code, setCode] = useState("");
  const [classInfo, setClassInfo] = useState<{ class_id: string; class_title: string } | null>(null);
  const [classMeta, setClassMeta] = useState<{ ownerNickname: string | null; memberCount: number } | null>(null);
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
    // clear previous result if any
    setClassInfo(null);
    setClassMeta(null);
    toast.error("Ungültiger oder abgelaufener Code");
        return;
      }
      if (data.isMember) {
        toast.info("Sie sind bereits Mitglied dieser Klasse");
        router.replace(`/?class=${data.class_id}`);
        return;
      }
  setClassInfo({ class_id: data.class_id, class_title: data.class_title });
  // fetch members to show owner and count
      const memRes = await fetch(`/api/class/member?class_id=${encodeURIComponent(data.class_id)}`);
      const mem = await memRes.json();
      const members: Array<{ role: string; nickname: string | null }> = mem?.members || [];
      const owner = members.find((m) => m.role === "owner");
      setClassMeta({ ownerNickname: owner?.nickname ?? null, memberCount: members.length });
  } catch {
    // network or other error: clear previous result
    setClassInfo(null);
    setClassMeta(null);
    toast.error("Prüfung fehlgeschlagen");
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
  // Trigger sidebar refresh by navigating with the new class in query
  router.replace(`/?class=${data.class_id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6">
      <h1 className="text-2xl font-semibold mb-4">Klasse beitreten</h1>
      <form
        className="flex gap-2 items-center"
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading && code.length === 6) void checkCode();
        }}
      >
        <Input
          placeholder="Einladungscode (6 Zeichen)"
          value={code}
          maxLength={6}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="max-w-xs"
        />
        <Button type="submit" disabled={loading || code.length !== 6}>Prüfen</Button>
      </form>

  {/* Ergebnis-Kachel */}
      {classInfo && classMeta && (
        <div className="mt-6 max-w-xl">
          <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-background to-background/60">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-lg leading-tight">{classInfo.class_title}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  Besitzer: <span className="font-medium">{classMeta.ownerNickname ?? "Unbekannt"}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {classMeta.memberCount} {classMeta.memberCount === 1 ? "Mitglied" : "Mitglieder"}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => accept()} disabled={loading}>Beitreten</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
