"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/auth/Button";
import { InputField } from "@/components/auth/InputField";
import { isDemoAuthMode, register } from "@/lib/api/auth";

type RegisterErrors = {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  form?: string;
};

export default function HomePage() {
  const router = useRouter();
  const demoMode = isDemoAuthMode();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<RegisterErrors>({});

  const passwordHints = useMemo(
    () => [
      { label: "Kamida 8 ta belgi", ok: password.length >= 8 },
      { label: "Kamida 1 ta katta harf", ok: /[A-Z]/.test(password) },
      { label: "Kamida 1 ta raqam", ok: /\d/.test(password) }
    ],
    [password]
  );

  const validate = (): RegisterErrors => {
    const nextErrors: RegisterErrors = {};

    if (!username.trim()) {
      nextErrors.username = "Username kiritilishi shart.";
    } else if (username.trim().length < 3) {
      nextErrors.username = "Username kamida 3 ta belgidan iborat bo'lsin.";
    }

    if (!email.trim()) {
      nextErrors.email = "Email kiritilishi shart.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "To'g'ri email manzil kiriting.";
    }

    if (!password) {
      nextErrors.password = "Parol kiritilishi shart.";
    } else if (password.length < 8) {
      nextErrors.password = "Parol kamida 8 ta belgidan iborat bo'lsin.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Parolni tasdiqlang.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Parollar mos kelmadi.";
    }

    return nextErrors;
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({
        username: username.trim(),
        email: email.trim(),
        password,
        confirmPassword
      });

      if (!result.success) {
        setErrors({ form: result.message ?? "Hisob yaratib bo'lmadi." });
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch {
      setErrors({ form: "Kutilmagan xatolik. Qayta urinib ko'ring." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container min-vh-100 px-4 py-8 lg:py-12">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden lg:block">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">Nexora social</p>
          <h1 className="mt-4 font-[var(--font-display)] text-6xl font-bold leading-[0.95] text-slate-950">
            Nexora ga xush kelibsiz
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            O'zingizni taniting, do'stlar bilan bog'laning va bir necha soniyada post joylang.
            Ijtimoiy tarmoqdagi yangi profilingiz shu yerdan boshlanadi.
          </p>
          <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-2xl font-bold text-slate-950">Tez</p>
              <p className="mt-1 text-xs text-slate-500">2 daqiqada ro'yxatdan o'ting</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-2xl font-bold text-slate-950">Ishonchli</p>
              <p className="mt-1 text-xs text-slate-500">Email tasdiqlash bilan himoya</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-2xl font-bold text-slate-950">Jonli</p>
              <p className="mt-1 text-xs text-slate-500">Realtime chat va story</p>
            </div>
          </div>
        </section>

        <AuthCard
          title="Hisob yarating"
          subtitle="Lentaga o'tish uchun ro'yxatdan o'ting"
          footerText="Hisobingiz bormi?"
          footerLinkLabel="Kirish"
          footerLinkHref="/login"
        >
          <form onSubmit={onSubmit} className="space-y-1">
            {demoMode ? (
              <div className="mb-3 rounded-xl border border-sky-200 bg-sky-50 p-3 text-xs text-sky-900">
                <p className="font-semibold">Demo rejim yoqilgan</p>
                <p className="mt-1">Ro'yxatdan so'ng OTP: 123456 orqali tasdiqlang.</p>
              </div>
            ) : null}

            <InputField
              id="username"
              name="username"
              label="Username"
              value={username}
              onChange={setUsername}
              autoComplete="username"
              placeholder="username_uz"
              error={errors.username}
            />

            <InputField
              id="email"
              name="email"
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              placeholder="siz@example.com"
              error={errors.email}
            />

            <InputField
              id="password"
              name="password"
              label="Parol"
              type="password"
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              placeholder="Kuchli parol yarating"
              error={errors.password}
              showPasswordToggle
            />

            <InputField
              id="confirmPassword"
              name="confirmPassword"
              label="Parolni tasdiqlang"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
              placeholder="Parolni qayta kiriting"
              error={errors.confirmPassword}
              showPasswordToggle
            />

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800/60">
              <p className="mb-2 font-semibold text-slate-700 dark:text-slate-200">Parol talablari:</p>
              <ul className="space-y-1">
                {passwordHints.map((hint) => (
                  <li key={hint.label} className={hint.ok ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-300"}>
                    {hint.ok ? "Bajarildi" : "-"} {hint.label}
                  </li>
                ))}
              </ul>
            </div>

            <p className="min-h-5 pt-1 text-xs text-rose-500" role="alert">
              {errors.form ?? " "}
            </p>

            <div className="pt-2">
              <Button type="submit" isLoading={isLoading}>
                Hisob yaratish
              </Button>
            </div>

            <p className="pt-3 text-center text-xs text-slate-500">
              Ro'yxatdan o'tish orqali Nexora qoidalari va maxfiylik siyosatiga rozilik bildirasiz.
              <span className="mx-1">|</span>
              <Link href="/login" className="font-semibold text-slate-700 hover:text-slate-950">
                Kirish sahifasiga o'tish
              </Link>
            </p>
          </form>
        </AuthCard>
      </div>
    </main>
  );
}
