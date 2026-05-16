"use client";

import Link from "next/link";
import type { SuggestedUser, TrendItem } from "@/components/home/home-data";
import type { UserSessionData } from "@/types/auth";

type RightRailProps = {
  session: UserSessionData | null;
  lastLoginAt: string | null;
  suggestedUsers: SuggestedUser[];
  trends: TrendItem[];
  followedHandles: Set<string>;
  onToggleFollow: (handle: string) => void;
  socialStats: {
    follows: number;
    likesGiven: number;
    commentsSent: number;
  };
};

function formatExpiry(value?: string): string {
  if (!value) {
    return "Mavjud emas";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Mavjud emas";
  }

  return parsed.toLocaleString();
}

function formatDateTime(value: string | null): string {
  if (!value) {
    return "Mavjud emas";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Mavjud emas";
  }

  return parsed.toLocaleString();
}

function buildSecurityScore(session: UserSessionData | null): number {
  if (!session) {
    return 0;
  }

  let score = 42;

  if (session.profileCompleted) {
    score += 20;
  }

  if (!session.limitedAccessMode) {
    score += 12;
  }

  if (session.email.includes("@")) {
    score += 8;
  }

  const expiry = new Date(session.accessTokenExpiresAt);
  if (!Number.isNaN(expiry.getTime()) && expiry.getTime() > Date.now()) {
    score += 10;
  }

  if ((session.role ?? "").toLowerCase() === "admin") {
    score += 6;
  }

  return Math.max(0, Math.min(100, score));
}

export function RightRail({
  session,
  lastLoginAt,
  suggestedUsers,
  trends,
  followedHandles,
  onToggleFollow,
  socialStats
}: RightRailProps) {
  const completion = Math.max(0, Math.min(100, session?.profileCompletionPercentage ?? 0));
  const roleLabel = (session?.role ?? "user").toUpperCase();
  const isAdmin = roleLabel === "ADMIN";
  const securityScore = buildSecurityScore(session);
  const twoFactorStatus = isAdmin ? "Majburiy (hali sozlanmagan)" : "Ixtiyoriy (tavsiya etiladi)";

  return (
    <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
      <section className="nexora-panel p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 dark:text-sky-300">Profil markazi</p>
            <h2 className="mt-1 font-[var(--font-display)] text-xl font-bold text-slate-950 dark:text-white">{session?.username ?? "Mehmon"}</h2>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${
              isAdmin
                ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300"
                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}
          >
            {roleLabel}
          </span>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(140deg,#0f172a_0%,#2563eb_52%,#67e8f9_100%)] text-sm font-bold text-white">
            {(session?.username ?? "NX").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-950 dark:text-white">{session?.email ?? "Faol sessiya yo'q"}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">ID: {session?.userId ?? "-"}</p>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Profil to'ldirilishi</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{completion}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-[linear-gradient(90deg,#0284c7_0%,#06b6d4_100%)]"
              style={{ width: `${completion}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">Rejim</p>
              <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                {session?.limitedAccessMode ? "Cheklangan" : "To'liq"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">Token muddati</p>
              <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{formatExpiry(session?.accessTokenExpiresAt)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">Oxirgi kirish</p>
              <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{formatDateTime(lastLoginAt)}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white/80 px-2.5 py-2 dark:border-slate-700 dark:bg-slate-900/70">
              <p className="text-slate-500 dark:text-slate-400">2FA</p>
              <p className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">{twoFactorStatus}</p>
            </div>
          </div>
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200/70 bg-white/70 p-3 dark:border-slate-700 dark:bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Xavfsizlik reytingi</span>
            <span className="font-semibold text-slate-700 dark:text-slate-200">{securityScore}/100</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700">
            <div
              className="h-2 rounded-full bg-[linear-gradient(90deg,#16a34a_0%,#22c55e_50%,#06b6d4_100%)]"
              style={{ width: `${securityScore}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href="/profile-setup"
            className="rounded-xl border border-slate-300 px-3 py-2 text-center text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:text-slate-900 dark:border-slate-600 dark:text-slate-200"
          >
            Profilni tahrirlash
          </Link>
          <Link
            href="/chat"
            className="rounded-xl bg-slate-900 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-slate-700"
          >
            Chatni ochish
          </Link>
        </div>
      </section>

      <section className="nexora-panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-xl font-bold text-slate-950 dark:text-white">Siz uchun tavsiyalar</h2>
          <button type="button" className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">Yangilash</button>
        </div>
        <div className="mt-4 space-y-3">
          {suggestedUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/60 p-3 transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-500">
              <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${user.accent} text-sm font-bold text-white`}>
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-950 dark:text-white">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.handle}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{user.bio}</p>
              </div>
              <button
                type="button"
                onClick={() => onToggleFollow(user.handle)}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${
                  followedHandles.has(user.handle)
                    ? "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                    : "bg-slate-950 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
                }`}
              >
                {followedHandles.has(user.handle) ? "Kuzatilmoqda" : "Kuzatish"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="nexora-panel p-5">
        <h2 className="font-[var(--font-display)] text-xl font-bold text-slate-950 dark:text-white">Trendlar</h2>
        <div className="mt-4 space-y-3">
          {trends.map((trend) => (
            <article key={trend.id} className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 transition hover:border-slate-300 hover:bg-white/90 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-500 dark:hover:bg-slate-900/70">
              <p className="text-sm font-semibold text-slate-950 dark:text-white">{trend.title}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{trend.posts}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="nexora-panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-[var(--font-display)] text-xl font-bold text-slate-950 dark:text-white">Activity pulse</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">Live</span>
        </div>
        <div className="mt-4 space-y-3">
          {[
            { id: "a1", label: "Kuzatilayotganlar", value: `${socialStats.follows}`, delta: "jonli" },
            { id: "a2", label: "Bosilgan layklar", value: `${socialStats.likesGiven}`, delta: "+1 har bosishda" },
            { id: "a3", label: "Yuborilgan izohlar", value: `${socialStats.commentsSent}`, delta: "+1 har yuborishda" }
          ].map((activity) => (
            <div key={activity.id} className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500 dark:text-slate-400">{activity.label}</p>
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-300">{activity.delta}</span>
              </div>
              <p className="mt-2 font-[var(--font-display)] text-3xl font-bold text-slate-950 dark:text-white">{activity.value}</p>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
}