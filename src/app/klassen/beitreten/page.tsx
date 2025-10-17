"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
// Dialog removed in favor of info card
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Crown, GraduationCap, Users } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { ROUTE_STUNDENPLAN } from "@/constants/routes";
import { parseAsString, useQueryState } from "nuqs";
import { useClassStore } from "@/store/useClassStore";
import { Id } from "../../../../convex/_generated/dataModel";

export default function ClassJoinPage() {
  // Code direkt mit nuqs aus Query-Param (?code=) synchronisieren
  const [code, setCode] = useQueryState(
    "code",
    parseAsString.withDefault("").withOptions({ shallow: true }), // kein voller Reload, nur shallow replace
  );
  const [classInfo, setClassInfo] = useState<{
    class_id: Id<"classes"> | null;
    class_title: string;
  } | null>(null);
  const [classMeta, setClassMeta] = useState<{
    ownerNickname: string | null;
    memberCount: number;
  } | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);
  const [error, setError] = useState<boolean>(false);
  // Separate state: checking = verifying invitation code, accepting = joining class
  const [checking, setChecking] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const { user } = useUser();
  const router = useRouter();
  // Tracking ob initialer Auto-Check bereits lief (um Doppel-Check zu verhindern)
  const initialChecked = useRef(false);

  const { setClass } = useClassStore();

  const acceptMutation = useMutation(api.invitations.acceptInvitation);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const lastProcessedCode = useRef<string | null>(null);
  const checked = useQuery(
    api.invitations.checkInvitation,
    pendingCode ? { code: pendingCode } : { code: "__NO_CODE__" },
  );

  const checkCode = useCallback(
    (override?: string) => {
      const codeToUse = (override ?? code).trim();
      if (codeToUse.length !== 6) return;
      setAlreadyMember(false);
      setChecking(true);
      setClassInfo(null);
      setClassMeta(null);
      // allow re-processing same code by resetting last processed marker
      lastProcessedCode.current = null;
      setPendingCode(codeToUse);
    },
    [code],
  );

  // React to query result
  useEffect(() => {
    if (!checking) return;
    if (pendingCode && checked !== undefined) {
      // Avoid double-processing same code result
      if (lastProcessedCode.current === pendingCode) return;
      lastProcessedCode.current = pendingCode;
      setChecking(false);
      if (!checked.valid) {
        setClassInfo(null);
        setClassMeta(null);
        setError(true);
        return;
      }
      setError(false);
      // Immer Klasseninfos setzen, auch wenn schon Mitglied, damit UI Button-Status anzeigen kann
      setAlreadyMember(!!checked.isMember);
      setClassInfo({
        class_id: checked.class_id,
        class_title: checked.class_title,
      });
      setClassMeta({
        ownerNickname: checked.owner_nickname ?? null,
        memberCount: checked.member_count ?? 0,
      });
    }
  }, [checked, pendingCode, checking, router]);

  // Auto-Check beim initialen Mount, falls Param bereits vorhanden & valide Länge
  useEffect(() => {
    if (initialChecked.current) return;
    if (code && code.length === 6) {
      initialChecked.current = true;
      checkCode(code);
    }
  }, [code, checkCode]);

  const accept = async () => {
    if (!classInfo || !user?.id || !pendingCode || accepting || alreadyMember)
      return;
    setAccepting(true);
    try {
      const res = await acceptMutation({ code: pendingCode });
      if (!res.joined && !res.alreadyMember) {
        toast.error("Beitritt fehlgeschlagen");
        return;
      }
      if (res.alreadyMember) {
        toast.info("Bereits Mitglied");
        setAlreadyMember(true);
      } else {
        toast.success("Klasse beigetreten");
      }
      setClass(res.class_id);
      router.replace(`${ROUTE_STUNDENPLAN}?class=${res.class_id}`);
    } catch (error) {
      console.error("Fehler beim Beitreten:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setAccepting(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-8">
      <Card
        className={`w-full max-w-xl border  shadow-sm bg-gradient-to-br from-background to-background/70 ${error ? "border-destructive" : "border-border/60"}`}
      >
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Klasse beitreten</CardTitle>
          <p className="text-sm text-muted-foreground">
            Gib den 6-stelligen Einladungscode ein.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex flex-col gap-2 items-center w-full">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
              value={code}
              onChange={(v) => {
                if (v.length < 6) {
                  setError(false);
                }
                const up = v.toUpperCase();
                void setCode(up.length ? up : null);
                setClassInfo(null);
                setClassMeta(null);
                setAlreadyMember(false);
                if (up.length === 6 && !checking && !accepting) {
                  checkCode(up);
                }
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
          </div>

          {classInfo && classMeta && !error && (
            <Card className="w-full mt-2 border border-border/60 bg-background/70 p-0">
              <div className="flex items-center gap-4 p-4">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <GraduationCap className="h-6 w-6" />
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="text-base font-medium leading-tight truncate">
                    {classInfo.class_title}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Crown className="h-3.5 w-3.5" />
                      <span className="font-medium">
                        {classMeta.ownerNickname ?? "Unbekannt"}
                      </span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {classMeta.memberCount}{" "}
                      {classMeta.memberCount === 1 ? "Mitglied" : "Mitglieder"}
                    </span>
                  </div>
                </div>
                <Button
                  onClick={accept}
                  disabled={accepting || checking || alreadyMember}
                  variant={alreadyMember ? "secondary" : undefined}
                  className="self-center shrink-0"
                >
                  {alreadyMember
                    ? "Beigetreten"
                    : accepting
                      ? "Beitreten…"
                      : "Beitreten"}
                </Button>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
