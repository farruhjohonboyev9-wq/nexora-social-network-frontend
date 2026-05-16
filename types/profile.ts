export type SetupProfilePayload = {
  username: string;
  fullName: string;
  bio?: string;
  location?: string;
  birthday?: string;
  skipForNow?: boolean;
};

export type ProfileSetupResponse = {
  userId: string;
  username: string;
  fullName: string;
  bio?: string | null;
  location?: string | null;
  birthday?: string | null;
  avatarUrl?: string | null;
  completionPercentage: number;
  profileCompleted: boolean;
  limitedAccessMode: boolean;
};

export type AvatarPresignResponse = {
  objectKey: string;
  uploadUrl: string;
  publicUrl: string;
  expiresAt: string;
};
