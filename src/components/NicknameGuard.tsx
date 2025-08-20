"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function NicknameGuard() {
  const { user, isSignedIn } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const run = async () => {
      if (!isSignedIn) return;
      if (!user?.id) return;
      // Allow the setup page itself
      if (pathname === "/setup") {
        // If already has nickname, push to home
        const res = await fetch(`/api/user?user_id=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        if (data?.data?.nickname) {
          router.replace("/");
        }
        return;
      }
      try {
        const res = await fetch(`/api/user?user_id=${encodeURIComponent(user.id)}`);
        const data = await res.json();
        const hasNickname = Boolean(data?.data?.nickname);
        if (!hasNickname) {
          router.replace("/setup");
        }
      } catch {
        // if profile query fails, be safe and route to setup
        router.replace("/setup");
      }
    };
    run();
  }, [isSignedIn, user?.id, pathname, router]);

  return null;
}
