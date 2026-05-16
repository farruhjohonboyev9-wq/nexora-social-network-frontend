export type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SendVerificationEmailPayload = {
  email: string;
};

export type VerifyEmailPayload = {
  email: string;
  otpCode: string;
};

export type UserSessionData = {
  userId: string;
  email: string;
  username: string;
  role: string;
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
  profileCompleted?: boolean;
  profileCompletionPercentage?: number;
  limitedAccessMode?: boolean;
};

export type AuthApiResponse = {
  success: boolean;
  message?: string;
  data?: UserSessionData;
};
