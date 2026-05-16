"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { Button } from "@/components/auth/Button";
import { InputField } from "@/components/auth/InputField";
import { isDemoAuthMode, resendVerification, verifyEmail } from "@/lib/api/auth";

type VerifyErrors = {
  email?: string;
  otpCode?: string;
  form?: string;
};

export default function VerifyEmailPage() {
  const demoMode = isDemoAuthMode();
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errors, setErrors] = useState<VerifyErrors>({});

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const initialEmail = search.get("email")?.trim();
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, []);

  const validate = (): VerifyErrors => {
    const nextErrors: VerifyErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Email kiritilishi shart.";
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      nextErrors.email = "To'g'ri email manzil kiriting.";
    }

    if (!otpCode.trim()) {
      nextErrors.otpCode = "Tasdiqlash kodi kiritilishi shart.";
    } else if (!/^\d{6}$/.test(otpCode.trim())) {
      nextErrors.otpCode = "6 xonali kodni kiriting.";
    }

    return nextErrors;
  };

  const onVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsVerifying(true);

    try {
      const result = await verifyEmail({
        email: email.trim(),
        otpCode: otpCode.trim()
      });

      if (!result.success) {
        setErrors({ form: result.message ?? "Kod noto'g'ri yoki muddati o'tgan." });
        return;
      }

      setErrors({ form: "Email muvaffaqiyatli tasdiqlandi. Endi kirishingiz mumkin." });
    } catch {
      setErrors({ form: "Kutilmagan xatolik. Qayta urinib ko'ring." });
    } finally {
      setIsVerifying(false);
    }
  };

  const onResend = async () => {
    const nextErrors: VerifyErrors = {};

    if (!email.trim()) {
      nextErrors.email = "Kodni qayta yuborish uchun email kiriting.";
      setErrors(nextErrors);
      return;
    }

    setIsResending(true);

    try {
      const result = await resendVerification({ email: email.trim() });

      if (!result.success) {
        setErrors({ form: result.message ?? "Tasdiqlash kodini qayta yuborib bo'lmadi." });
        return;
      }

      setErrors({ form: "Kod yuborildi. Pochtangizni tekshiring." });
    } catch {
      setErrors({ form: "Kutilmagan xatolik. Qayta urinib ko'ring." });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main className="container d-flex min-vh-100 items-center justify-center px-4 py-10">
      <AuthCard
        title="Emailni tasdiqlang"
        subtitle="Hisobni faollashtirish uchun emailingizga yuborilgan 6 xonali OTP kodni kiriting."
        footerText="Kirishga qaytasizmi?"
        footerLinkLabel="Login sahifasi"
        footerLinkHref="/login"
      >
        <form onSubmit={onVerify} className="space-y-1">
          {demoMode ? (
            <div className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              <p className="font-semibold">Demo tasdiqlash yoqilgan</p>
              <p className="mt-1">OTP kodi: 123456</p>
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
            id="otpCode"
            name="otpCode"
            label="6 xonali kod"
            value={otpCode}
            onChange={setOtpCode}
            placeholder="123456"
            error={errors.otpCode}
          />

          <p className="min-h-5 pt-1 text-xs text-rose-500" role="alert">
            {errors.form ?? " "}
          </p>

          <div className="pt-2">
            <Button type="submit" isLoading={isVerifying}>
              Emailni tasdiqlash
            </Button>
          </div>
        </form>

        <button
          type="button"
          onClick={onResend}
          disabled={isResending}
          className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          {isResending ? "Yuborilmoqda..." : "Kodni qayta yuborish"}
        </button>

        <Link
          href="#"
          className="mt-3 block text-center text-xs font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100"
        >
          Kod kelmadimi? Spam papkasini ham tekshiring.
        </Link>
      </AuthCard>
    </main>
  );
}

