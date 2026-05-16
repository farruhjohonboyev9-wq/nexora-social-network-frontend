"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";

export default function FeedPage() {
  const router = useRouter();

  useEffect(() => {
    const current = getSession();
    if (!current) {
      router.replace("/login");
      return;
    }

    router.replace("/home");
  }, [router]);

  return null;
}

