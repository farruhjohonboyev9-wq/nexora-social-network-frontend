import type { UserSessionData } from "@/types/auth";

const MEDIA_API_BASE = process.env.NEXT_PUBLIC_MEDIA_API_URL ?? "";

export type StoryReactionType = "like" | "love" | "fire" | "clap" | "wow" | "sad";

type StoryReactionSummaryResponse = {
  storyId: string;
  totalReactions: number;
  counts: Record<string, number>;
  myReaction: string | null;
};

type ErrorShape = {
  message?: string;
  detail?: string;
  title?: string;
};

function buildUrl(path: string): string {
  if (!MEDIA_API_BASE.trim()) {
    return "";
  }

  return `${MEDIA_API_BASE}${path}`;
}

export function isMediaApiEnabled(): boolean {
  return MEDIA_API_BASE.trim().length > 0;
}

export function isGuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function authHeaders(session: UserSessionData): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.accessToken}`
  };
}

export async function reactToStory(
  storyId: string,
  reactionType: StoryReactionType,
  session: UserSessionData
): Promise<{ success: boolean; message?: string }> {
  const url = buildUrl(`/internal/media/stories/${encodeURIComponent(storyId)}/reactions`);
  if (!url) {
    return { success: false, message: "Media API is not configured." };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(session),
    credentials: "include",
    body: JSON.stringify({ reactionType })
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ErrorShape | null;
    return {
      success: false,
      message: error?.message ?? error?.detail ?? error?.title ?? "Failed to submit reaction."
    };
  }

  return { success: true };
}

export async function getStoryReactionSummary(
  storyId: string,
  session: UserSessionData
): Promise<{ success: true; counts: Record<string, number>; myReaction: string | null } | { success: false; message?: string }> {
  const url = buildUrl(`/internal/media/stories/${encodeURIComponent(storyId)}/reactions`);
  if (!url) {
    return { success: false, message: "Media API is not configured." };
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.accessToken}`
    },
    credentials: "include"
  });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ErrorShape | null;
    return {
      success: false,
      message: error?.message ?? error?.detail ?? error?.title ?? "Failed to load reactions."
    };
  }

  const payload = (await response.json()) as StoryReactionSummaryResponse;
  return {
    success: true,
    counts: payload.counts ?? {},
    myReaction: payload.myReaction ?? null
  };
}
