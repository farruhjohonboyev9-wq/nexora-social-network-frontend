"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/auth/Button";
import { InputField } from "@/components/auth/InputField";
import { isDemoAuthMode, login } from "@/lib/api/auth";
import { saveSession } from "@/lib/session";

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const demoMode = isDemoAuthMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<LoginErrors>({});

  const validate = (): LoginErrors => {
    const nextErrors: LoginErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email kiritilishi shart.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "To'g'ri email manzil kiriting.";
    }

    if (!password) {
      nextErrors.password = "Parol kiritilishi shart.";
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
      const result = await login({
        email: email.trim(),
        password,
        rememberMe
      });

      if (!result.success) {
        const message = result.message ?? "Login yoki parol noto'g'ri.";
        if (message.toLowerCase().includes("verification")) {
          setErrors({ form: "Email hali tasdiqlanmagan. OTP kiritib tasdiqlang." });
          return;
        }

        setErrors({ form: message });
        return;
      }

      if (!result.data?.accessToken) {
        setErrors({ form: "Kirish bajarildi, lekin sessiya ma'lumoti topilmadi." });
        return;
      }

      saveSession(result.data, rememberMe);
      router.push(result.data.profileCompleted ? "/home" : "/profile-setup");
    } catch {
      setErrors({ form: "Kutilmagan xatolik. Qayta urinib ko'ring." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="container d-flex min-vh-100 items-center justify-center px-4 py-10">
      <AuthCard
        title="Qaytganingizdan xursandmiz"
        subtitle="Lentangizga kirish uchun hisobingizga kiring."
        footerText="Yangi foydalanuvchimisiz?"
        footerLinkLabel="Hisob yaratish"
        footerLinkHref="/register"
      >
        <form onSubmit={onSubmit} className="space-y-1">
          {demoMode ? (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <p className="font-semibold">Demo auth mode active</p>
              <p className="mt-1">Test user: ali@nexora.dev / Ali@1234</p>
            </div>
          ) : null}

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
            autoComplete="current-password"
            placeholder="Parolingizni kiriting"
            error={errors.password}
            showPasswordToggle
          />

          <label className="mt-1 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-sky-500 focus:ring-sky-500"
            />
            Meni eslab qol
          </label>

          <p className="min-h-5 pt-1 text-xs text-rose-500" role="alert">
            {errors.form ?? " "}
          </p>

          <div className="pt-2">
            <Button type="submit" isLoading={isLoading}>
              Kirish
            </Button>
          </div>
        </form>

        <Link
          href={`/verify-email?email=${encodeURIComponent(email.trim())}`}
          className="mt-3 block text-center text-xs font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
        >
          Emailni OTP bilan tasdiqlash
        </Link>
      </AuthCard>
    </main>
  );
}
