import type { AvatarPresignResponse, ProfileSetupResponse, SetupProfilePayload } from "@/types/profile";

const USER_BASE_URL = process.env.NEXT_PUBLIC_USER_API_URL ?? "http://localhost:5010";

type ErrorShape = {
  message?: string;
  detail?: string;
  title?: string;
};

export async function setupProfile(
  payload: SetupProfilePayload,
  accessToken: string
): Promise<{ success: true; data: ProfileSetupResponse } | { success: false; message: string }> {
  const response = await fetch(`${USER_BASE_URL}/api/user/profile/setup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify(payload)
  });

  const maybeJson = (await response.json().catch(() => null)) as ErrorShape | ProfileSetupResponse | null;

  if (!response.ok) {
    const error = maybeJson as ErrorShape | null;
    return {
      success: false,
      message: error?.message ?? error?.detail ?? error?.title ?? "Profile setup failed."
    };
  }

  return { success: true, data: maybeJson as ProfileSetupResponse };
}

export async function presignAvatar(
  contentType: string,
  sizeBytes: number,
  accessToken: string
): Promise<{ success: true; data: AvatarPresignResponse } | { success: false; message: string }> {
  const response = await fetch(`${USER_BASE_URL}/api/user/profile/avatar/presign`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ contentType, sizeBytes })
  });

  const maybeJson = (await response.json().catch(() => null)) as AvatarPresignResponse | ErrorShape | null;

  if (!response.ok) {
    const error = maybeJson as ErrorShape | null;
    return {
      success: false,
      message: error?.message ?? error?.detail ?? error?.title ?? "Failed to get upload URL."
    };
  }

  return { success: true, data: maybeJson as AvatarPresignResponse };
}

export async function finalizeAvatar(
  objectKey: string,
  publicUrl: string,
  sizeBytes: number,
  contentType: string,
  accessToken: string
): Promise<{ success: boolean; message?: string }> {
  const response = await fetch(`${USER_BASE_URL}/api/user/profile/avatar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`
    },
    body: JSON.stringify({ objectKey, publicUrl, sizeBytes, contentType })
  });

  if (!response.ok) {
    const maybeJson = (await response.json().catch(() => null)) as ErrorShape | null;
    return {
      success: false,
      message: maybeJson?.message ?? maybeJson?.detail ?? "Failed to save avatar."
    };
  }

  return { success: true };
}
