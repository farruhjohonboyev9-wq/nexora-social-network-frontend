"use client";

type HomeNavbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  notificationCount: number;
  username: string;
  onLogout: () => void;
};

function IconShell({ children, badge }: { children: React.ReactNode; badge?: number }) {
  return (
    <button
      type="button"
      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/60 bg-white/80 text-slate-700 shadow-[0_12px_35px_rgba(15,23,42,0.08)] transition duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-950 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:text-white"
    >
      {children}
      {badge && badge > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function HomeNavbar({ search, onSearchChange, notificationCount, username, onLogout }: HomeNavbarProps) {
  return (
    <header className="nexora-panel sticky top-3 z-30 flex flex-col gap-4 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#0f172a_0%,#1d4ed8_52%,#67e8f9_100%)] text-lg font-black tracking-[0.2em] text-white shadow-[0_22px_50px_rgba(29,78,216,0.35)]">
          NX
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 dark:text-sky-300">Nexora social</p>
          <h1 className="font-[var(--font-display)] text-xl font-bold text-slate-950 dark:text-white">Asosiy lenta</h1>
        </div>
      </div>

      <label className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl border border-white/70 bg-white/80 px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900/75 lg:mx-8 lg:max-w-xl">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Odamlar, postlar yoki trendlarni qidiring"
          className="auth-ring w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
        />
      </label>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <div className="flex items-center gap-2">
          <IconShell badge={notificationCount}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" />
              <path d="M10 20a2 2 0 0 0 4 0" />
            </svg>
          </IconShell>
          <IconShell>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 6h16v10H7l-3 3V6Z" />
            </svg>
          </IconShell>
          <IconShell>
            <span className="text-xs font-bold uppercase">{username.slice(0, 2)}</span>
          </IconShell>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          Chiqish
        </button>
      </div>
    </header>
  );
}