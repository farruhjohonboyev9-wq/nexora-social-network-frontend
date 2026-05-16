"use client";

import { ChangeEvent, FormEvent, use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession, saveSession } from "@/lib/session";
import { finalizeAvatar, presignAvatar, setupProfile } from "@/lib/api/profile";

export default function ProfileSetupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [birthday, setBirthday] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    if (session.profileCompleted) {
      router.replace("/home");
    }
  }, [router]);

  const onAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAvatarFile(file);
    if (file) {
      const prev = URL.createObjectURL(file);
      setAvatarPreview(prev);
    } else {
      setAvatarPreview(null);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    const session = getSession();
    if (!session?.accessToken) {
      router.replace("/login");
      return;
    }

    setLoading(true);
    const result = await setupProfile(
      {
        username,
        fullName,
        bio: bio || undefined,
        location: location || undefined,
        birthday: birthday || undefined,
        skipForNow: false
      },
      session.accessToken
    );

    if (!result.success) {
      setError(result.message);
      setLoading(false);
      return;
    }

    saveSession(
      {
        ...session,
        username: result.data.username,
        profileCompleted: result.data.profileCompleted,
        profileCompletionPercentage: result.data.completionPercentage,
        limitedAccessMode: result.data.limitedAccessMode
      },
      true
    );

    // Upload avatar if one was selected
    if (avatarFile) {
      setAvatarUploading(true);
      const presign = await presignAvatar(avatarFile.type, avatarFile.size, session.accessToken);
      if (presign.success) {
        try {
          await fetch(presign.data.uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": avatarFile.type },
            body: avatarFile
          });
          await finalizeAvatar(
            presign.data.objectKey,
            presign.data.publicUrl,
            avatarFile.size,
            avatarFile.type,
            session.accessToken
          );
        } catch {
          // non-blocking — profile setup already succeeded
        }
      }
      setAvatarUploading(false);
    }

    router.replace("/home");
  };

  const onSkip = () => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }

    saveSession({ ...session, profileCompleted: false, limitedAccessMode: true }, true);
    router.replace("/home");
  };

  return (
    <main className="container d-flex min-vh-100 items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-slate-900">Profil sozlamalari</h1>
        <p className="mt-2 text-sm text-slate-600">Asosiy lentaga kirishdan oldin profilingizni to'ldiring.</p>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {/* Avatar picker */}
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-50 hover:border-slate-500"
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-slate-400">Rasm</span>
              )}
            </button>
            <div>
              <p className="text-sm font-medium text-slate-700">Profil rasmi</p>
              <p className="text-xs text-slate-500">JPEG yoki PNG, maksimum 5 MB</p>
              {avatarFile && (
                <button
                  type="button"
                  onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                  className="mt-1 text-xs text-rose-500 hover:underline"
                >
                  Olib tashlash
                </button>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onAvatarChange}
            />
          </div>

          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
          />
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="To'liq ism"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            minLength={2}
          />
          <textarea
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Bio (ixtiyoriy)"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={150}
          />
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            placeholder="Manzil (ixtiyoriy)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={128}
          />
          <input
            className="w-full rounded-xl border border-slate-300 px-3 py-2"
            type="date"
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
          />

          {error ? <p className="text-sm text-rose-600">{error}</p> : null}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading || avatarUploading}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {avatarUploading ? "Rasm yuklanmoqda..." : loading ? "Saqlanmoqda..." : "Sozlashni yakunlash"}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Hozircha o'tkazib yuborish
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
