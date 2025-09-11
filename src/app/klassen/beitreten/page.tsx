"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
// Dialog removed in favor of info card
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { GraduationCap, Users } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { ROUTE_STUNDENPLAN } from "@/constants/routes";
import { useClassStore } from "@/store/useClassStore";

export default function ClassJoinPage() {
  const [code, setCode] = useState("");
  const [classInfo, setClassInfo] = useState<{
    class_id: string;
    class_title: string;
  } | null>(null);
  const [classMeta, setClassMeta] = useState<{
    ownerNickname: string | null;
    memberCount: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillHandled = useRef(false);

  const { setClass } = useClassStore();

  const checkCode = useCallback(
    async (override?: string) => {
      const codeToUse = (override ?? code).trim();
      if (!codeToUse) return;
      try {
        setLoading(true);
        const res = await fetch(
          `/api/class/invitation/check?code=${encodeURIComponent(codeToUse)}`,
        );
        if (!res.ok) {
          setClassInfo(null);
          setClassMeta(null);
          if (res.status === 404) {
            toast.error("Ungültiger Code");
          } else if (res.status === 401) {
            toast.error("Nicht autorisiert");
          } else {
            toast.error("Fehler beim Überprüfen des Codes");
          }
          return;
        }
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
        setClassInfo({
          class_id: data.class_id,
          class_title: data.class_title,
        });
        // fetch members to show owner and count
        const memRes = await fetch(
          `/api/class/member?class_id=${encodeURIComponent(data.class_id)}`,
        );
        if (!memRes.ok) {
          console.error("Fehler beim Abrufen der Klassenmitglieder");
          setClassMeta({
            ownerNickname: null,
            memberCount: 0,
          });
          return;
        }
        const mem = await memRes.json();
        const members: Array<{ role: string; nickname: string | null }> =
          mem?.members || [];
        const owner = members.find((m) => m.role === "owner");
        setClassMeta({
          ownerNickname: owner?.nickname ?? null,
          memberCount: members.length,
        });
      } catch (error) {
        // network or other error: clear previous result
        setClassInfo(null);
        setClassMeta(null);
        if (error instanceof TypeError && error.message.includes("fetch")) {
          toast.error(
            "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.",
          );
        } else {
          console.error("Fehler beim Überprüfen des Codes:", error);
          toast.error("Prüfung fehlgeschlagen");
        }
      } finally {
        setLoading(false);
      }
    },
    [code, router],
  );

  // Prefill code from ?code= and auto-check when valid
  useEffect(() => {
    if (prefillHandled.current) return;
    const q = (searchParams.get("code") || "").toUpperCase();
    if (!q) return;
    prefillHandled.current = true;
    setCode(q);
    if (q.length === 6) {
      const controller = new AbortController();
      void (async () => {
        if (!user?.id) return;
        if (!controller.signal.aborted) {
          await checkCode(q);
        }
      })();
      return () => controller.abort();
    }
  }, [searchParams, checkCode, user?.id]);

  const accept = async () => {
    if (!classInfo || !user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/class/invitation/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Beitritt fehlgeschlagen");
        return;
      }
      toast.success("Klasse beigetreten");
      setClass(data.class_id);
      // Trigger sidebar refresh by navigating with the new class in query
      router.replace(`${ROUTE_STUNDENPLAN}?class=${data.class_id}`);
    } catch (error) {
      console.error("Fehler beim Beitreten:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-6 pb-4 md:pb-6">
      <h1 className="text-2xl font-semibold mb-4">Klasse beitreten</h1>
      <form
        className="flex gap-3 items-center flex-wrap"
        onSubmit={(e) => {
          e.preventDefault();
          if (!loading && code.length === 6) void checkCode();
        }}
      >
        <InputOTP
          maxLength={6}
          pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
          value={code}
          onChange={(v) => {
            const up = v.toUpperCase();
            setCode(up);
            if (up.length === 6 && !loading) void checkCode(up);
          }}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        <Button type="submit" disabled={loading || code.length !== 6}>
          Prüfen
        </Button>
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
                <CardTitle className="text-lg leading-tight">
                  {classInfo.class_title}
                </CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  Besitzer:{" "}
                  <span className="font-medium">
                    {classMeta.ownerNickname ?? "Unbekannt"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {classMeta.memberCount}{" "}
                  {classMeta.memberCount === 1 ? "Mitglied" : "Mitglieder"}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={() => accept()} disabled={loading}>
                Beitreten
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
