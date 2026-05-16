"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";  
import { clearSession, getSession } from "@/lib/session";
import { logout } from "@/lib/api/auth";
import {
  compactText,
  dmTargetFromThreadId,
  RealtimeSocketClient,
  roomPathFromThreadId,
  type ReceiptStatus,
  type RealtimeConnectionState
} from "@/lib/api/realtime";

type ChatMessage = {
  id: string;
  author: "me" | "them" | "system";
  text: string;
  createdAt: string;
  receipt?: ReceiptStatus;
  replyToId?: string;
  forwardedFromId?: string;
  pinned?: boolean;
  edited?: boolean;
  deleted?: boolean;
  failed?: boolean;
};

type ChatThread = {
  id: string;
  title: string;
  handle: string;
  presence: "online" | "away" | "offline";
  unread: number;
  typing: boolean;
  messages: ChatMessage[];
};

const seedThreads: ChatThread[] = [
  {
    id: "dm:u2:u7",
    title: "Dilnoza",
    handle: "@dilnoza",
    presence: "online",
    unread: 2,
    typing: true,
    messages: [
      { id: "m1", author: "them", text: "Salom! Demo callga tayyormisan?", createdAt: "09:12" },
      { id: "m2", author: "me", text: "Ha, 10 da kiraman.", createdAt: "09:13" },
      { id: "m3", author: "them", text: "Zo'r, chatga link tashlayman.", createdAt: "09:14" }
    ]
  },
  {
    id: "dm:u2:u9",
    title: "Bekzod",
    handle: "@bekzod",
    presence: "away",
    unread: 0,
    typing: false,
    messages: [
      { id: "m4", author: "me", text: "Media service branchini merge qildim.", createdAt: "Kecha" },
      { id: "m5", author: "them", text: "Super, men testlarni yuritaman.", createdAt: "Kecha" }
    ]
  },
  {
    id: "room:ops",
    title: "Ops Room",
    handle: "#ops-room",
    presence: "online",
    unread: 1,
    typing: false,
    messages: [
      { id: "m6", author: "system", text: "System: Realtime node-2 qayta ishga tushdi.", createdAt: "08:05" },
      { id: "m7", author: "them", text: "Deployment yashil holatga qaytdi.", createdAt: "08:07" }
    ]
  }
];

function presenceClass(presence: ChatThread["presence"]) {
  if (presence === "online") {
    return "bg-emerald-500";
  }
  if (presence === "away") {
    return "bg-amber-500";
  }
  return "bg-slate-400";
}

export default function ChatPage() {
  const router = useRouter();
  const [session] = useState(() => getSession());
  const wsClientRef = useRef<RealtimeSocketClient | null>(null);
  const typingStartedAtRef = useRef<number>(0);
  const typingStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [threads, setThreads] = useState<ChatThread[]>(seedThreads);
  const [activeThreadId, setActiveThreadId] = useState(seedThreads[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [replyingToMessageId, setReplyingToMessageId] = useState<string | null>(null);
  const [forwardingMessageId, setForwardingMessageId] = useState<string | null>(null);
  const [messageQuery, setMessageQuery] = useState("");
  const [adminTargetUserId, setAdminTargetUserId] = useState("");
  const [inviteTargetUserId, setInviteTargetUserId] = useState("");
  const [blockTargetUserId, setBlockTargetUserId] = useState("");
  const [reportMessageId, setReportMessageId] = useState("");
  const [reportReason, setReportReason] = useState("");
  const [resolveReportId, setResolveReportId] = useState("");
  const [resolveNote, setResolveNote] = useState("");
  const [wsState, setWsState] = useState<RealtimeConnectionState>("disconnected");
  const [backendStatus, setBackendStatus] = useState("Not connected");

  const sendTypingStop = () => {
    const client = wsClientRef.current;
    if (!client || !activeThread) {
      return;
    }

    client.sendCommand(`TYPE ${roomPathFromThreadId(activeThread.id)} stop`);
  };

  const reconnectSocket = async () => {
    const client = wsClientRef.current;
    if (!client) {
      return;
    }

    setBackendStatus("Reconnecting...");
    const ok = await client.connect();
    setBackendStatus(ok ? "Reconnected to realtime" : "Reconnect failed");
  };

  useEffect(() => {
    if (!session) {
      router.replace("/login");
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_REALTIME_WS_URL ?? "ws://localhost:7007";
    const client = new RealtimeSocketClient(wsUrl, session.userId, setWsState);
    wsClientRef.current = client;

    client
      .connect()
      .then((ok) => {
        setBackendStatus(ok ? `Connected to ${wsUrl}` : `Connect failed: ${wsUrl}`);
      })
      .catch(() => {
        setBackendStatus(`Connect failed: ${wsUrl}`);
      });

    return () => {
      if (typingStopTimerRef.current) {
        clearTimeout(typingStopTimerRef.current);
      }
      client.close();
      wsClientRef.current = null;
    };
  }, [router, session]);

  const activeThread = threads.find((item) => item.id === activeThreadId) ?? threads[0];
  const userId = session?.userId ?? "";

  const filteredMessages = useMemo(() => {
    if (!activeThread) {
      return [] as ChatMessage[];
    }

    const q = messageQuery.trim().toLowerCase();
    if (!q) {
      return activeThread.messages;
    }

    return activeThread.messages.filter((message) => message.text.toLowerCase().includes(q));
  }, [activeThread, messageQuery]);

  const filteredThreads = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return threads;
    }

    return threads.filter((item) =>
      item.title.toLowerCase().includes(q) || item.handle.toLowerCase().includes(q)
    );
  }, [threads, query]);

  const totalUnread = useMemo(() => {
    return threads.reduce((acc, item) => acc + item.unread, 0);
  }, [threads]);

  const sendMessage = () => {
    const text = compactText(draft);
    if (!text || !activeThread) {
      return;
    }

    if (typingStopTimerRef.current) {
      clearTimeout(typingStopTimerRef.current);
      typingStopTimerRef.current = null;
    }
    sendTypingStop();

    if (editingMessageId) {
      const client = wsClientRef.current;
      if (client) {
        client
          .sendCommand(`EDIT ${roomPathFromThreadId(activeThread.id)} ${editingMessageId} ${text}`)
          .then((ok) => setBackendStatus(ok ? "Message edited on backend" : "Edit failed on backend"));
      }

      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== activeThread.id) {
            return thread;
          }

          return {
            ...thread,
            messages: thread.messages.map((msg) =>
              msg.id === editingMessageId
                ? { ...msg, text, edited: true, deleted: false }
                : msg
            )
          };
        })
      );
      setEditingMessageId(null);
      setReplyingToMessageId(null);
      setDraft("");
      return;
    }

    if (replyingToMessageId) {
      const client = wsClientRef.current;
      if (client) {
        client
          .reply(roomPathFromThreadId(activeThread.id), replyingToMessageId, text)
          .then((ok) => setBackendStatus(ok ? "Reply delivered to backend" : "Reply failed on backend"));
      }

      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== activeThread.id) {
            return thread;
          }

          const nextMessage: ChatMessage = {
            id: `m-${Date.now()}`,
            author: "me",
            text,
            createdAt: "Hozir",
            replyToId: replyingToMessageId,
            receipt: "sent"
          };

          return {
            ...thread,
            typing: false,
            messages: [...thread.messages, nextMessage]
          };
        })
      );

      setReplyingToMessageId(null);
      setDraft("");
      return;
    }

    if (forwardingMessageId) {
      const client = wsClientRef.current;
      if (client) {
        client
          .forward(roomPathFromThreadId(activeThread.id), roomPathFromThreadId(activeThread.id), forwardingMessageId)
          .then((ok) => setBackendStatus(ok ? "Message forwarded" : "Forward failed"));
      }

      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id !== activeThread.id) {
            return thread;
          }

          const source = thread.messages.find((m) => m.id === forwardingMessageId);
          if (!source) {
            return thread;
          }

          const nextMessage: ChatMessage = {
            id: `m-${Date.now()}`,
            author: "me",
            text: source.text,
            createdAt: "Hozir",
            forwardedFromId: forwardingMessageId,
            receipt: "sent"
          };

          return {
            ...thread,
            typing: false,
            messages: [...thread.messages, nextMessage]
          };
        })
      );

      setForwardingMessageId(null);
      setDraft("");
      return;
    }

    const isDm = activeThread.id.startsWith("dm:");
    const frame = isDm
      ? (() => {
          const target = dmTargetFromThreadId(activeThread.id, userId);
          if (!target) {
            return "";
          }
          return `DM /ws/dm/${target} ${text}`;
        })()
      : `CHAT ${roomPathFromThreadId(activeThread.id)} ${text}`;

    if (!frame) {
      setBackendStatus("DM target invalid");
      return;
    }

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== activeThread.id) {
          return thread;
        }

        const nextMessage: ChatMessage = {
          id: `m-${Date.now()}`,
          author: "me",
          text,
          createdAt: "Hozir",
          receipt: "sent"
        };

        return {
          ...thread,
          typing: false,
          messages: [...thread.messages, nextMessage]
        };
      })
    );
    setDraft("");

    const client = wsClientRef.current;
    if (client) {
      client.sendCommand(frame).then((ok) => {
        setBackendStatus(ok ? "Delivered to backend" : "Delivery failed on backend");

        if (!ok) {
          setThreads((prev) =>
            prev.map((thread) => {
              if (thread.id !== activeThread.id || thread.messages.length === 0) {
                return thread;
              }

              const copy = [...thread.messages];
              const last = copy[copy.length - 1];
              if (last.author === "me") {
                copy[copy.length - 1] = { ...last, failed: true, receipt: "sent" };
              }
              return { ...thread, messages: copy };
            })
          );
        } else {
          setThreads((prev) =>
            prev.map((thread) => {
              if (thread.id !== activeThread.id || thread.messages.length === 0) {
                return thread;
              }

              const copy = [...thread.messages];
              const last = copy[copy.length - 1];
              if (last.author === "me") {
                copy[copy.length - 1] = { ...last, receipt: "delivered" };
              }
              return { ...thread, messages: copy };
            })
          );
        }
      });
    }
  };

  const openThread = (threadId: string) => {
    setActiveThreadId(threadId);
    const roomPath = roomPathFromThreadId(threadId);
    const client = wsClientRef.current;
    if (client) {
      const current = threads.find((t) => t.id === threadId);
      if (current) {
        current.messages
          .filter((msg) => msg.author !== "me" && !msg.deleted)
          .forEach((msg) => {
            client.sendReceipt(roomPath, msg.id, "read");
          });
      }
    }

    setThreads((prev) =>
      prev.map((thread) => (thread.id === threadId ? { ...thread, unread: 0 } : thread))
    );
  };

  const beginEdit = (message: ChatMessage) => {
    if (message.author !== "me" || message.deleted) {
      return;
    }
    setEditingMessageId(message.id);
    setReplyingToMessageId(null);
    setForwardingMessageId(null);
    setDraft(message.text);
  };

  const beginReply = (message: ChatMessage) => {
    if (!activeThread || message.deleted) {
      return;
    }

    setEditingMessageId(null);
    setForwardingMessageId(null);
    setReplyingToMessageId(message.id);
    setDraft(`@${message.author === "me" ? "me" : "them"} `);
  };

  const beginForward = (message: ChatMessage) => {
    if (message.deleted) {
      return;
    }

    setEditingMessageId(null);
    setReplyingToMessageId(null);
    setForwardingMessageId(message.id);
    setDraft(message.text);
  };

  const togglePin = (message: ChatMessage) => {
    if (!activeThread || message.deleted) {
      return;
    }

    const client = wsClientRef.current;
    if (client) {
      const action = message.pinned ? client.unpin(roomPathFromThreadId(activeThread.id), message.id) : client.pin(roomPathFromThreadId(activeThread.id), message.id);
      action.then((ok) => setBackendStatus(ok ? (message.pinned ? "Message unpinned" : "Message pinned") : "Pin action failed"));
    }

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== activeThread.id) {
          return thread;
        }
        return {
          ...thread,
          messages: thread.messages.map((msg) =>
            msg.id === message.id ? { ...msg, pinned: !msg.pinned } : msg
          )
        };
      })
    );
  };

  const deleteMessage = (messageId: string) => {
    if (!activeThread) {
      return;
    }

    const client = wsClientRef.current;
    if (client) {
      client
        .sendCommand(`DELETE ${roomPathFromThreadId(activeThread.id)} ${messageId}`)
        .then((ok) => setBackendStatus(ok ? "Message deleted on backend" : "Delete failed on backend"));
    }

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id !== activeThread.id) {
          return thread;
        }

        return {
          ...thread,
          messages: thread.messages.map((msg) =>
            msg.id === messageId && msg.author === "me"
              ? { ...msg, text: "[deleted]", deleted: true }
              : msg
          )
        };
      })
    );
  };

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      clearSession();
      router.replace("/login");
    }
  };

  const runAdminAction = async (
    action: "promoteAdmin" | "mute" | "unmute" | "invite" | "block" | "unblock" | "report" | "resolve"
  ) => {
    if (!activeThread) {
      return;
    }

    const client = wsClientRef.current;
    if (!client) {
      return;
    }

    let ok = false;
    if (action === "promoteAdmin" && adminTargetUserId) {
      ok = await client.promote(activeThread.id, adminTargetUserId, "admin");
    } else if (action === "mute" && adminTargetUserId) {
      ok = await client.mute(activeThread.id, adminTargetUserId);
    } else if (action === "unmute" && adminTargetUserId) {
      ok = await client.unmute(activeThread.id, adminTargetUserId);
    } else if (action === "invite" && inviteTargetUserId) {
      ok = await client.invite(activeThread.id, inviteTargetUserId);
    } else if (action === "block" && blockTargetUserId) {
      ok = await client.block(blockTargetUserId);
    } else if (action === "unblock" && blockTargetUserId) {
      ok = await client.unblock(blockTargetUserId);
    } else if (action === "report" && reportMessageId && reportReason) {
      ok = await client.report(roomPathFromThreadId(activeThread.id), reportMessageId, reportReason);
    } else if (action === "resolve" && resolveReportId && resolveNote) {
      ok = await client.resolveReport(resolveReportId, resolveNote);
    }

    setBackendStatus(ok ? `Action ${action} success` : `Action ${action} failed`);
  };

  if (!session) {
    return null;
  }

  return (
    <main className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6">
        <header className="nexora-panel flex flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="nexora-chip w-fit">Realtime workspace</p>
            <h1 className="mt-3 font-[var(--font-display)] text-3xl font-bold text-slate-950 dark:text-white">
              Live chat orchestration
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Presence, typing, unread, edit/delete va DM oqimini bitta ekranda boshqarish uchun UX prototip.
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Backend: {backendStatus}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] ${
                wsState === "connected"
                  ? "bg-emerald-100 text-emerald-700"
                  : wsState === "connecting"
                  ? "bg-amber-100 text-amber-700"
                  : wsState === "error"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {wsState}
            </span>
            {wsState !== "connected" ? (
              <button
                type="button"
                onClick={reconnectSocket}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-600 dark:text-slate-200"
              >
                Reconnect
              </button>
            ) : null}
            <Link href="/home" className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-600 dark:text-slate-200">
              Home
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.42fr_1fr]">
          <aside className="nexora-panel flex flex-col px-4 py-4 sm:px-5">
            <div className="rounded-2xl bg-slate-900 px-4 py-3 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Unread</p>
              <p className="mt-1 font-[var(--font-display)] text-3xl">{totalUnread}</p>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Search thread</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ism yoki handle"
                className="auth-ring w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100"
              />
            </label>

            <div className="mt-4 space-y-2 overflow-y-auto pr-1">
              {filteredThreads.map((thread) => {
                const active = thread.id === activeThread?.id;
                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => openThread(thread.id)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      active
                        ? "border-sky-400 bg-sky-50/70 dark:border-sky-500 dark:bg-sky-900/20"
                        : "border-slate-200 bg-white/70 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-900 dark:text-white">{thread.title}</p>
                      {thread.unread > 0 ? (
                        <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white dark:bg-sky-500">
                          {thread.unread}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{thread.handle}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className={`h-2 w-2 rounded-full ${presenceClass(thread.presence)}`} />
                      <span>{thread.presence}</span>
                      {thread.typing ? <span className="ml-1 text-sky-700 dark:text-sky-300">typing...</span> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <section className="nexora-panel flex min-h-[66vh] flex-col px-4 py-4 sm:px-6">
            {activeThread ? (
              <>
                <div className="border-b border-slate-200 pb-4 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-[var(--font-display)] text-2xl font-bold text-slate-950 dark:text-white">{activeThread.title}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{activeThread.handle}</p>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                      {activeThread.typing ? "Typing active" : "Stable"}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
                  <div className="mb-3">
                    <input
                      value={messageQuery}
                      onChange={(e) => setMessageQuery(e.target.value)}
                      placeholder="Message qidirish"
                      className="auth-ring w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100"
                    />
                  </div>

                  {filteredMessages.map((message) => {
                    const mine = message.author === "me";
                    const receiptText = message.receipt === "read" ? "\u2713\u2713 read" : message.receipt === "delivered" ? "\u2713\u2713" : message.receipt === "sent" ? "\u2713" : "";
                    return (
                      <article key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            message.author === "system"
                              ? "border border-amber-200 bg-amber-50 text-amber-900"
                              : mine
                              ? "bg-slate-900 text-white"
                              : "border border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                          }`}
                        >
                          <p className="text-sm leading-6">{message.text}</p>
                          {message.replyToId ? <p className="mt-1 text-[11px] opacity-75">reply to: {message.replyToId}</p> : null}
                          {message.forwardedFromId ? <p className="mt-1 text-[11px] opacity-75">forwarded from: {message.forwardedFromId}</p> : null}
                          {message.pinned ? <p className="mt-1 text-[11px] font-semibold">Pinned</p> : null}
                          <div className="mt-2 flex items-center gap-2 text-[11px] opacity-80">
                            <span>{message.createdAt}</span>
                            {receiptText ? <span>{receiptText}</span> : null}
                            {message.edited ? <span>(edited)</span> : null}
                            {message.deleted ? <span>(deleted)</span> : null}
                            {message.failed ? <span>(failed)</span> : null}
                          </div>

                          {!message.deleted ? (
                            <div className="mt-3 flex gap-2 text-xs">
                              {mine ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => beginEdit(message)}
                                    className="rounded-lg border border-white/20 px-2 py-1 hover:bg-white/10"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => deleteMessage(message.id)}
                                    className="rounded-lg border border-white/20 px-2 py-1 hover:bg-white/10"
                                  >
                                    Delete
                                  </button>
                                </>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => beginReply(message)}
                                className="rounded-lg border border-white/20 px-2 py-1 hover:bg-white/10"
                              >
                                Reply
                              </button>
                              <button
                                type="button"
                                onClick={() => beginForward(message)}
                                className="rounded-lg border border-white/20 px-2 py-1 hover:bg-white/10"
                              >
                                Forward
                              </button>
                              <button
                                type="button"
                                onClick={() => togglePin(message)}
                                className="rounded-lg border border-white/20 px-2 py-1 hover:bg-white/10"
                              >
                                {message.pinned ? "Unpin" : "Pin"}
                              </button>
                            </div>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Admin & Moderation</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input value={adminTargetUserId} onChange={(e) => setAdminTargetUserId(e.target.value)} placeholder="member user id" className="auth-ring rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-900/70" />
                    <input value={inviteTargetUserId} onChange={(e) => setInviteTargetUserId(e.target.value)} placeholder="invite user id" className="auth-ring rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-900/70" />
                    <input value={blockTargetUserId} onChange={(e) => setBlockTargetUserId(e.target.value)} placeholder="block user id" className="auth-ring rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-900/70" />
                    <input value={reportMessageId} onChange={(e) => setReportMessageId(e.target.value)} placeholder="report message id" className="auth-ring rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-900/70" />
                    <input value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="report reason" className="auth-ring rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-900/70" />
                    <input value={resolveReportId} onChange={(e) => setResolveReportId(e.target.value)} placeholder="resolve report id" className="auth-ring rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-900/70" />
                  </div>
                  <input value={resolveNote} onChange={(e) => setResolveNote(e.target.value)} placeholder="resolve note" className="auth-ring mt-2 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-xs dark:border-slate-600 dark:bg-slate-900/70" />
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <button type="button" onClick={() => runAdminAction("promoteAdmin")} className="rounded-lg border border-slate-300 px-2 py-1">Promote</button>
                    <button type="button" onClick={() => runAdminAction("mute")} className="rounded-lg border border-slate-300 px-2 py-1">Mute</button>
                    <button type="button" onClick={() => runAdminAction("unmute")} className="rounded-lg border border-slate-300 px-2 py-1">Unmute</button>
                    <button type="button" onClick={() => runAdminAction("invite")} className="rounded-lg border border-slate-300 px-2 py-1">Invite</button>
                    <button type="button" onClick={() => runAdminAction("block")} className="rounded-lg border border-slate-300 px-2 py-1">Block</button>
                    <button type="button" onClick={() => runAdminAction("unblock")} className="rounded-lg border border-slate-300 px-2 py-1">Unblock</button>
                    <button type="button" onClick={() => runAdminAction("report")} className="rounded-lg border border-slate-300 px-2 py-1">Report</button>
                    <button type="button" onClick={() => runAdminAction("resolve")} className="rounded-lg border border-slate-300 px-2 py-1">Resolve</button>
                  </div>
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-700">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{editingMessageId ? "Editing mode" : replyingToMessageId ? `Reply mode (${replyingToMessageId})` : forwardingMessageId ? `Forward mode (${forwardingMessageId})` : "New message"}</span>
                    <span>Enter bilan yuboriladi</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => {
                        const next = e.target.value;
                        setDraft(next);

                        if (!activeThread) {
                          return;
                        }

                        const compact = compactText(next);
                        const client = wsClientRef.current;
                        if (!client) {
                          return;
                        }

                        if (compact.length === 0) {
                          if (typingStopTimerRef.current) {
                            clearTimeout(typingStopTimerRef.current);
                            typingStopTimerRef.current = null;
                          }
                          sendTypingStop();
                          return;
                        }

                        const now = Date.now();
                        if (now - typingStartedAtRef.current > 1500) {
                          client.sendCommand(`TYPE ${roomPathFromThreadId(activeThread.id)} start`);
                          typingStartedAtRef.current = now;
                        }

                        if (typingStopTimerRef.current) {
                          clearTimeout(typingStopTimerRef.current);
                        }

                        typingStopTimerRef.current = setTimeout(() => {
                          sendTypingStop();
                        }, 1200);
                      }}
                      onBlur={sendTypingStop}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      placeholder={editingMessageId ? "Xabarni tahrirlang" : "Xabar yozing..."}
                      className="auth-ring w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 dark:border-slate-600 dark:bg-slate-900/70 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={sendMessage}
                      className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                    >
                      {editingMessageId ? "Save" : "Send"}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-500">Thread tanlang</div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
