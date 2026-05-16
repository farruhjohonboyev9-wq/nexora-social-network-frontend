import Link from "next/link";

type AuthCardProps = {
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkLabel: string;
  footerLinkHref: string;
  children: React.ReactNode;
};

export function AuthCard({
  title,
  subtitle,
  footerText,
  footerLinkLabel,
  footerLinkHref,
  children
}: AuthCardProps) {
  return (
    <section className="animate-rise w-full max-w-md rounded-3xl border border-slate-200/70 bg-white/85 p-6 shadow-auth backdrop-blur-md dark:border-slate-700/70 dark:bg-slate-900/85 sm:p-8">
      <header className="mb-6 text-center sm:mb-7">
        <h1 className="font-[var(--font-display)] text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
      </header>

      {children}

      <footer className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
        {footerText}{" "}
        <Link
          href={footerLinkHref}
          className="font-semibold text-sky-600 transition hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-300"
        >
          {footerLinkLabel}
        </Link>
      </footer>
    </section>
  );
}
