"use client";

import Link from "next/link";

import type { NavItem } from "@/components/home/home-data";

type SidebarNavProps = {
  items: NavItem[];
  activeItem: string;
};

function iconFor(label: string) {
  const common = "h-5 w-5";
  switch (label) {
    case "Home":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>;
    case "Explore":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="m14.8 9.2-4.4 1.8-1.8 4.4 4.4-1.8 1.8-4.4Z" /></svg>;
    case "Notifications":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" /><path d="M10 20a2 2 0 0 0 4 0" /></svg>;
    case "Messages":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 6h16v10H7l-3 3V6Z" /></svg>;
    case "Stories":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="7" height="16" rx="1" /><rect x="14" y="4" width="7" height="16" rx="1" /></svg>;
    case "Profile":
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="8" r="4" /><path d="M4 20a8 8 0 0 1 16 0" /></svg>;
    default:
      return <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v18" /><path d="M3 12h18" /></svg>;
  }
}

export function SidebarNav({ items, activeItem }: SidebarNavProps) {
  const localizedLabel = (label: string) => {
    if (label === "Home") return "Asosiy";
    if (label === "Explore") return "Kashf etish";
    if (label === "Notifications") return "Bildirishnomalar";
    if (label === "Messages") return "Xabarlar";
    if (label === "Stories") return "Stories";
    if (label === "Profile") return "Profil";
    if (label === "Settings") return "Sozlamalar";
    return label;
  };

  return (
    <aside className="hidden xl:block">
      <div className="nexora-panel sticky top-24 p-4">
        <nav className="space-y-2">
          {items.map((item) => {
            const active = item.id === activeItem;
            return (
              <Link
                key={item.id}
                href={
                  item.id === "messages"
                    ? "/chat"
                    : item.id === "notifications"
                    ? "/notifications"
                    : item.id === "stories"
                    ? "/stories"
                    : item.id === "profile"
                    ? "/profile-setup"
                    : "/home"
                }
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-300 ${
                  active
                    ? "bg-slate-950 text-white shadow-[0_20px_50px_rgba(15,23,42,0.2)] dark:bg-white dark:text-slate-950"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-900/70 dark:hover:text-white"
                }`}
              >
                <span className="transition duration-300 group-hover:scale-110">{iconFor(item.label)}</span>
                <span>{localizedLabel(item.label)}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 rounded-3xl bg-[linear-gradient(135deg,rgba(15,23,42,0.98)_0%,rgba(14,116,144,0.92)_100%)] p-5 text-white shadow-[0_25px_70px_rgba(8,47,73,0.4)]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-sky-200">Creator mode</p>
          <h2 className="mt-2 font-[var(--font-display)] text-2xl font-bold">Kontentingizni yorqin ko'rsating.</h2>
          <p className="mt-2 text-sm leading-6 text-sky-100/90">Feed kartalari, story ring va live badge lar ijtimoiy tarmoq tajribasi uchun sozlangan.</p>
        </div>
      </div>
    </aside>
  );
}