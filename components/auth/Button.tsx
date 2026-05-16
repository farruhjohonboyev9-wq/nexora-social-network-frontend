type ButtonProps = {
  children: React.ReactNode;
  isLoading?: boolean;
  type?: "button" | "submit";
};

export function Button({ children, isLoading = false, type = "button" }: ButtonProps) {
  return (
    <button
      type={type}
      disabled={isLoading}
      className="auth-ring inline-flex h-11 w-full items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-sky-500 dark:text-slate-950 dark:hover:bg-sky-400"
    >
      {isLoading ? "Please wait..." : children}
    </button>
  );
}
