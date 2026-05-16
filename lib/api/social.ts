import type { SocialNotification, SocialSyncEvent } from "@/types/social";

const SOCIAL_API_BASE = process.env.NEXT_PUBLIC_SOCIAL_API_URL ?? "";
const SOCIAL_WS_URL = process.env.NEXT_PUBLIC_SOCIAL_WS_URL ?? "";

const SOCIAL_STATE_KEY_PREFIX = "nexora_home_social_state_";
const SOCIAL_NOTIFICATIONS_KEY_PREFIX = "nexora_social_notifications_";
const SOCIAL_SYNC_CHANNEL = "nexora-social-sync";
const SOCIAL_SYNC_STORAGE_KEY = "nexora_social_sync_event";

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined";
}

function buildUrl(path: string): string {
  if (!SOCIAL_API_BASE.trim()) {
    return "";
  }
  return `${SOCIAL_API_BASE}${path}`;
}

export function getSocialStateKey(userId: string): string {
  return `${SOCIAL_STATE_KEY_PREFIX}${userId}`;
}

export function getSocialNotificationsKey(userId: string): string {
  return `${SOCIAL_NOTIFICATIONS_KEY_PREFIX}${userId}`;
}

export function getDefaultSocialNotifications(): SocialNotification[] {
  return [
    {
      id: "n1",
      type: "follow",
      actor: { name: "Dilnoza Zarifova", username: "dilnoza", avatar: "👩‍💻" },
      action: "started following you",
      timestamp: "2 minutes ago",
      isRead: false
    },
    {
      id: "n2",
      type: "like",
      actor: { name: "Ali Rakhmonov", username: "ali", avatar: "👨‍💼" },
      action: "liked your post",
      targetContent: "Launch day! So excited for Nexora!",
      timestamp: "15 minutes ago",
      isRead: false
    },
    {
      id: "n3",
      type: "comment",
      actor: { name: "Javohir Mirzaev", username: "javohir", avatar: "👨‍🎨" },
      action: "commented on your post",
      targetContent: "UI design mockups ready",
      timestamp: "1 hour ago",
      isRead: false
    }
  ];
}

export function loadLocalSocialState<T>(userId: string): T | null {
  if (!canUseBrowserStorage()) {
    return null;
  }

  const raw = localStorage.getItem(getSocialStateKey(userId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveLocalSocialState<T>(userId: string, state: T): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  localStorage.setItem(getSocialStateKey(userId), JSON.stringify(state));
}

export function loadLocalNotifications(userId: string): SocialNotification[] {
  if (!canUseBrowserStorage()) {
    return [];
  }

  const key = getSocialNotificationsKey(userId);
  const raw = localStorage.getItem(key);
  if (!raw) {
    const defaults = getDefaultSocialNotifications();
    localStorage.setItem(key, JSON.stringify(defaults));
    return defaults;
  }

  try {
    const parsed = JSON.parse(raw) as SocialNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalNotifications(userId: string, notifications: SocialNotification[]): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  localStorage.setItem(getSocialNotificationsKey(userId), JSON.stringify(notifications));
}

export async function loadSocialState<T>(userId: string): Promise<T | null> {
  const local = loadLocalSocialState<T>(userId);

  const url = buildUrl(`/internal/social/state/${encodeURIComponent(userId)}`);
  if (!url) {
    return local;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      return local;
    }

    const payload = (await response.json().catch(() => null)) as { state?: T } | null;
    if (!payload?.state) {
      return local;
    }

    saveLocalSocialState(userId, payload.state);
    return payload.state;
  } catch {
    return local;
  }
}

export async function saveSocialState<T>(userId: string, state: T): Promise<void> {
  saveLocalSocialState(userId, state);

  const url = buildUrl(`/internal/social/state/${encodeURIComponent(userId)}`);
  if (!url) {
    return;
  }

  try {
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ state })
    });
  } catch {
    // Keep local state as source of truth when backend is unavailable.
  }
}

export async function loadSocialNotifications(userId: string): Promise<SocialNotification[]> {
  const local = loadLocalNotifications(userId);

  const url = buildUrl(`/internal/social/notifications/${encodeURIComponent(userId)}`);
  if (!url) {
    return local;
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "include"
    });

    if (!response.ok) {
      return local;
    }

    const payload = (await response.json().catch(() => null)) as { notifications?: SocialNotification[] } | null;
    const notifications = Array.isArray(payload?.notifications) ? payload.notifications : local;
    saveLocalNotifications(userId, notifications);
    return notifications;
  } catch {
    return local;
  }
}

export async function saveSocialNotifications(userId: string, notifications: SocialNotification[]): Promise<void> {
  saveLocalNotifications(userId, notifications);

  const url = buildUrl(`/internal/social/notifications/${encodeURIComponent(userId)}`);
  if (!url) {
    return;
  }

  try {
    await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ notifications })
    });
  } catch {
    // Ignore backend write failures in demo mode.
  }
}

export function emitSocialSyncEvent(event: SocialSyncEvent): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  try {
    const channel = new BroadcastChannel(SOCIAL_SYNC_CHANNEL);
    channel.postMessage(event);
    channel.close();
  } catch {
    // Ignore BroadcastChannel issues and fallback to storage event.
  }

  try {
    localStorage.setItem(SOCIAL_SYNC_STORAGE_KEY, JSON.stringify(event));
    localStorage.removeItem(SOCIAL_SYNC_STORAGE_KEY);
  } catch {
    // Ignore storage write failures.
  }
}

export function subscribeSocialSyncEvents(
  onEvent: (event: SocialSyncEvent) => void
): () => void {
  if (!canUseBrowserStorage()) {
    return () => undefined;
  }

  let channel: BroadcastChannel | null = null;

  try {
    channel = new BroadcastChannel(SOCIAL_SYNC_CHANNEL);
    channel.onmessage = (message) => {
      const payload = message.data as SocialSyncEvent;
      if (payload?.type && payload?.userId) {
        onEvent(payload);
      }
    };
  } catch {
    channel = null;
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== SOCIAL_SYNC_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      const payload = JSON.parse(event.newValue) as SocialSyncEvent;
      if (payload?.type && payload?.userId) {
        onEvent(payload);
      }
    } catch {
      // Ignore invalid storage payloads.
    }
  };

  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener("storage", onStorage);
    if (channel) {
      channel.close();
    }
  };
}

export function openSocialSyncSocket(
  userId: string,
  onEvent: (event: SocialSyncEvent) => void
): { publish: (event: SocialSyncEvent) => void; close: () => void } {
  if (!canUseBrowserStorage() || !SOCIAL_WS_URL.trim()) {
    return {
      publish: () => undefined,
      close: () => undefined
    };
  }

  let socket: WebSocket | null = null;

  try {
    socket = new WebSocket(SOCIAL_WS_URL);
  } catch {
    return {
      publish: () => undefined,
      close: () => undefined
    };
  }

  socket.onopen = () => {
    try {
      socket?.send(JSON.stringify({ type: "SUBSCRIBE_SOCIAL", userId }));
    } catch {
      // Ignore subscription send failures.
    }
  };

  socket.onmessage = (message) => {
    try {
      const payload = JSON.parse(String(message.data ?? "")) as SocialSyncEvent;
      if (payload?.type && payload?.userId) {
        onEvent(payload);
      }
    } catch {
      // Ignore non-json realtime frames.
    }
  };

  return {
    publish: (event: SocialSyncEvent) => {
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        return;
      }

      try {
        socket.send(JSON.stringify(event));
      } catch {
        // Ignore transient websocket send errors.
      }
    },
    close: () => {
      if (socket) {
        socket.close();
        socket = null;
      }
    }
  };
}
