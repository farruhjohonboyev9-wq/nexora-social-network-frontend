"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  emitSocialSyncEvent,
  loadSocialNotifications,
  openSocialSyncSocket,
  saveSocialNotifications,
  subscribeSocialSyncEvents
} from "@/lib/api/social";
import type { SocialNotification, NotificationType } from "@/types/social";


function getNotificationIcon(type: NotificationType): string {
  switch (type) {
    case "like":
      return "❤️";
    case "follow":
      return "👤";
    case "comment":
      return "💬";
    case "share":
      return "🔄";
    case "mention":
      return "@";
    case "story-view":
      return "👁️";
    default:
      return "📢";
  }
}

function getNotificationColor(type: NotificationType): string {
  switch (type) {
    case "like":
      return "bg-red-500/20 border-red-500/30";
    case "follow":
      return "bg-blue-500/20 border-blue-500/30";
    case "comment":
      return "bg-green-500/20 border-green-500/30";
    case "share":
      return "bg-purple-500/20 border-purple-500/30";
    case "mention":
      return "bg-yellow-500/20 border-yellow-500/30";
    case "story-view":
      return "bg-cyan-500/20 border-cyan-500/30";
    default:
      return "bg-slate-500/20 border-slate-500/30";
  }
}

export default function NotificationsPage() {
  const router = useRouter();
  const sourceIdRef = useRef(`notifications-${Math.random().toString(36).slice(2, 10)}`);
  const socialSocketRef = useRef<{ publish: (event: { type: "notifications-updated"; userId: string; source: string; at: string }) => void; close: () => void } | null>(null);
  const [session] = useState(() => getSession());
  const [notifications, setNotifications] = useState<SocialNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  if (!session?.userId) {
    router.push("/login");
    return null;
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filteredNotifications =
    filter === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  useEffect(() => {
    if (!session?.userId) {
      return;
    }

    let alive = true;

    const refresh = async () => {
      const loaded = await loadSocialNotifications(session.userId);
      if (!alive) {
        return;
      }
      setNotifications(loaded);
    };

    void refresh();

    const handleSync = (event: { type: string; userId: string; source: string }) => {
      if (
        event.userId !== session.userId
        || event.type !== "notifications-updated"
        || event.source === sourceIdRef.current
      ) {
        return;
      }

      void refresh();
    };

    const unsubscribe = subscribeSocialSyncEvents(handleSync);
    const socket = openSocialSyncSocket(session.userId, handleSync);
    socialSocketRef.current = socket;

    return () => {
      alive = false;
      unsubscribe();
      socket.close();
      socialSocketRef.current = null;
    };
  }, [session?.userId]);

  const persistAndBroadcast = (next: SocialNotification[]) => {
    if (!session?.userId) {
      setNotifications(next);
      return;
    }

    setNotifications(next);
    void saveSocialNotifications(session.userId, next);

    const event = {
      type: "notifications-updated" as const,
      userId: session.userId,
      source: sourceIdRef.current,
      at: new Date().toISOString()
    };
    emitSocialSyncEvent(event);
    socialSocketRef.current?.publish(event);
  };

  const markAsRead = (id: string) => {
    persistAndBroadcast(notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllAsRead = () => {
    persistAndBroadcast(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: string) => {
    persistAndBroadcast(notifications.filter((n) => n.id !== id));
  };

  return (
    <main className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-700 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Link href="/home" className="text-white hover:opacity-70 transition-opacity">
                ←
              </Link>
              <h1 className="text-2xl font-bold text-white">Bildirishnomalar</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Barchasini o'qilgan qilish
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Barchasi
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === "unread"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              O'qilmagan
            </button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-w-2xl mx-auto">
        {filteredNotifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-5xl mb-4">🔔</div>
            <p className="text-slate-400 text-lg">
              {filter === "unread" ? "O'qilmagan bildirishnoma yo'q" : "Hozircha bildirishnoma yo'q"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`p-4 border-l-4 transition-colors cursor-pointer hover:bg-slate-800/50 ${
                  notification.isRead ? "border-slate-700" : "border-blue-500 bg-slate-800/30"
                }`}
              >
                <div className="flex gap-4">
                  {/* Avatar Icon */}
                  <div
                    className={`relative flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-xl border ${getNotificationColor(
                      notification.type
                    )}`}
                  >
                    {notification.actor.avatar}
                    <div className="absolute bottom-0 right-0 bg-slate-900 rounded-full p-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>

                  {/* Notification Content */}
                  <div className="flex-1">
                    <p className="text-white">
                      <span className="font-semibold">{notification.actor.name}</span>
                      <span className="text-slate-400"> {notification.action}</span>
                    </p>

                    {notification.targetContent && (
                      <p className="mt-2 text-slate-300 text-sm line-clamp-2 italic">
                        "{notification.targetContent}"
                      </p>
                    )}

                    <p className="mt-2 text-slate-500 text-xs">{notification.timestamp}</p>
                  </div>

                  {/* Unread Indicator & Delete Button */}
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    {!notification.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-slate-500 hover:text-slate-300 transition-colors"
                      title="Bildirishnomani o'chirish"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty State Tips */}
      {notifications.length > 0 && filteredNotifications.length === 0 && (
        <div className="max-w-2xl mx-auto mt-12 p-8 rounded-lg bg-slate-800/50 border border-slate-700">
          <h3 className="text-white font-semibold mb-2">💡 Eslatma</h3>
          <ul className="text-slate-400 text-sm space-y-2">
            <li>• Kimdir postingizga layk bossa, izoh qoldirsa yoki ulashsa bildirishnoma keladi</li>
            <li>• Yangi follower paydo bo'lsa, alohida xabar ko'rasiz</li>
            <li>• Story ko'rishlar ham shu sahifada ko'rsatiladi</li>
            <li>• Sizni mention qilishsa, tezkor ogohlantirish chiqadi</li>
          </ul>
        </div>
      )}
    </main>
  );
}
