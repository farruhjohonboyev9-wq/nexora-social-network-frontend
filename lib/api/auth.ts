import type {
  AuthApiResponse,
  LoginPayload,
  RegisterPayload,
  SendVerificationEmailPayload,
  VerifyEmailPayload
} from "@/types/auth";

const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_API_URL ?? "";
const DEMO_AUTH_USERS_KEY = "nexora_demo_auth_users";
const DEMO_AUTH_PENDING_KEY = "nexora_demo_auth_pending_users";
const DEMO_OTP_CODE = "123456";

type DemoAuthUser = {
  userId: string;
  username: string;
  email: string;
  password: string;
  role: string;
  profileCompleted: boolean;
};

const DEMO_AUTH_USERS: DemoAuthUser[] = [
  {
    userId: "demo-ali",
    username: "ali",
    email: "ali@nexora.dev",
    password: "Ali@1234",
    role: "admin",
    profileCompleted: true
  }
];

type ErrorShape = {
  message?: string;
  detail?: string;
  title?: string;
};

type RefreshTokenPayload = {
  refreshToken: string;
};

function isDemoModeEnabled(): boolean {
  return AUTH_BASE_URL.trim().length === 0;
}

function canUseBrowserStorage(): boolean {
  return typeof window !== "undefined";
}

function normalizeDemoUsers(users: DemoAuthUser[]): DemoAuthUser[] {
  const primary = DEMO_AUTH_USERS[0];
  const matched = users.find((entry) => entry.email.toLowerCase() === primary.email.toLowerCase());
  return [matched ?? primary];
}

function loadDemoUsers(key: string, fallback: DemoAuthUser[]): DemoAuthUser[] {
  if (!canUseBrowserStorage()) {
    return key === DEMO_AUTH_USERS_KEY ? normalizeDemoUsers(fallback) : fallback;
  }
   
  const raw = window.localStorage.getItem(key);
  if (!raw) {
    const initial = key === DEMO_AUTH_USERS_KEY ? normalizeDemoUsers(fallback) : fallback;
    window.localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }

  try {
    const parsed = JSON.parse(raw) as DemoAuthUser[];
    if (!Array.isArray(parsed)) {
      const initial = key === DEMO_AUTH_USERS_KEY ? normalizeDemoUsers(fallback) : fallback;
      window.localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }

    if (key === DEMO_AUTH_USERS_KEY) {
      const normalized = normalizeDemoUsers(parsed);
      window.localStorage.setItem(key, JSON.stringify(normalized));
      return normalized;
    }

    return parsed;
  } catch {
    const initial = key === DEMO_AUTH_USERS_KEY ? normalizeDemoUsers(fallback) : fallback;
    window.localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
}

function saveDemoUsers(key: string, users: DemoAuthUser[]): void {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(users));
}

function buildDemoSession(user: DemoAuthUser): NonNullable<AuthApiResponse["data"]> {
  const now = Date.now();
  return {
    userId: user.userId,
    email: user.email,
    username: user.username,
    role: user.role,
    accessToken: `demo-token-${user.userId}`,
    accessTokenExpiresAt: new Date(now + 1000 * 60 * 60 * 12).toISOString(),
    refreshToken: `demo-refresh-${user.userId}`,
    refreshTokenExpiresAt: new Date(now + 1000 * 60 * 60 * 24 * 7).toISOString(),
    profileCompleted: user.profileCompleted,
    profileCompletionPercentage: user.profileCompleted ? 100 : 40,
    limitedAccessMode: !user.profileCompleted
  };
}

function demoLogin(payload: LoginPayload): AuthApiResponse {
  const users = loadDemoUsers(DEMO_AUTH_USERS_KEY, DEMO_AUTH_USERS);
  const user = users.find(
    (entry) => entry.email.toLowerCase() === payload.email.trim().toLowerCase() && entry.password === payload.password
  );

  if (!user) {
    return {
      success: false,
      message: "Demo user topilmadi. Masalan: ali@nexora.dev / Ali@1234"
    };
  }

  return {
    success: true,
    message: "Demo login successful.",
    data: buildDemoSession(user)
  };
}

function demoRegister(payload: RegisterPayload): AuthApiResponse {
  const users = loadDemoUsers(DEMO_AUTH_USERS_KEY, DEMO_AUTH_USERS);
  const pendingUsers = loadDemoUsers(DEMO_AUTH_PENDING_KEY, []);
  const email = payload.email.trim().toLowerCase();
  const username = payload.username.trim();

  const exists = users.some((entry) => entry.email.toLowerCase() === email || entry.username.toLowerCase() === username.toLowerCase());
  const pendingExists = pendingUsers.some(
    (entry) => entry.email.toLowerCase() === email || entry.username.toLowerCase() === username.toLowerCase()
  );

  if (exists || pendingExists) {
    return {
      success: false,
      message: "Bu email yoki username allaqachon mavjud."
    };
  }

  const nextPendingUser: DemoAuthUser = {
    userId: `demo-${username.toLowerCase()}`,
    username,
    email,
    password: payload.password,
    role: "user",
    profileCompleted: false
  };

  pendingUsers.push(nextPendingUser);
  saveDemoUsers(DEMO_AUTH_PENDING_KEY, pendingUsers);

  return {
    success: true,
    message: `Demo register successful. OTP: ${DEMO_OTP_CODE}`
  };
}

function demoVerifyEmail(payload: VerifyEmailPayload): AuthApiResponse {
  const email = payload.email.trim().toLowerCase();
  const pendingUsers = loadDemoUsers(DEMO_AUTH_PENDING_KEY, []);
  const pendingUserIndex = pendingUsers.findIndex((entry) => entry.email.toLowerCase() === email);

  if (pendingUserIndex === -1) {
    return {
      success: false,
      message: "Bu email uchun demo registration topilmadi."
    };
  }

  if (payload.otpCode.trim() !== DEMO_OTP_CODE) {
    return {
      success: false,
      message: "Demo OTP noto'g'ri. 123456 ni ishlating."
    };
  }

  const users = loadDemoUsers(DEMO_AUTH_USERS_KEY, DEMO_AUTH_USERS);
  users.push(pendingUsers[pendingUserIndex]);
  pendingUsers.splice(pendingUserIndex, 1);

  saveDemoUsers(DEMO_AUTH_USERS_KEY, users);
  saveDemoUsers(DEMO_AUTH_PENDING_KEY, pendingUsers);

  return {
    success: true,
    message: "Demo email verified successfully."
  };
}

function demoResendVerification(payload: SendVerificationEmailPayload): AuthApiResponse {
  const pendingUsers = loadDemoUsers(DEMO_AUTH_PENDING_KEY, []);
  const email = payload.email.trim().toLowerCase();
  const found = pendingUsers.some((entry) => entry.email.toLowerCase() === email);

  if (!found) {
    return {
      success: false,
      message: "Bu email uchun kutayotgan demo account yo'q."
    };
  }

  return {
    success: true,
    message: `Demo verification code: ${DEMO_OTP_CODE}`
  };
}

function demoLogout(): AuthApiResponse {
  return {
    success: true,
    message: "Demo logout successful."
  };
}

export function getDemoAuthUsers(): Array<Pick<DemoAuthUser, "email" | "password" | "username">> {
  return DEMO_AUTH_USERS.map(({ email, password, username }) => ({ email, password, username }));
}

export function isDemoAuthMode(): boolean {
  return isDemoModeEnabled();
}

async function request<TPayload>(
  endpoint: string,
  payload: TPayload
): Promise<AuthApiResponse> {
  const response = await fetch(`${AUTH_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  const maybeJson = (await response.json().catch(() => null)) as ErrorShape | null;

  if (!response.ok) {
    return {
      success: false,
      message: maybeJson?.message ?? maybeJson?.detail ?? maybeJson?.title ?? "Request failed. Please try again."
    };
  }

  return {
    success: true,
    message: maybeJson?.message,
    data: maybeJson as AuthApiResponse["data"]
  };
}

export function login(payload: LoginPayload): Promise<AuthApiResponse> {
  if (isDemoModeEnabled()) {
    return Promise.resolve(demoLogin(payload));
  }

  return request("/api/auth/login", payload);
}

export function register(payload: RegisterPayload): Promise<AuthApiResponse> {
  if (isDemoModeEnabled()) {
    return Promise.resolve(demoRegister(payload));
  }

  return request("/api/auth/register", payload);
}

export function sendVerificationEmail(payload: SendVerificationEmailPayload): Promise<AuthApiResponse> {
  if (isDemoModeEnabled()) {
    return Promise.resolve(demoResendVerification(payload));
  }

  return request("/api/auth/send-verification-email", payload);
}

export function verifyEmail(payload: VerifyEmailPayload): Promise<AuthApiResponse> {
  if (isDemoModeEnabled()) {
    return Promise.resolve(demoVerifyEmail(payload));
  }

  return request("/api/auth/verify-email", payload);
}

export function resendVerification(payload: SendVerificationEmailPayload): Promise<AuthApiResponse> {
  if (isDemoModeEnabled()) {
    return Promise.resolve(demoResendVerification(payload));
  }

  return request("/api/auth/resend-verification", payload);
}

export function logout(): Promise<AuthApiResponse> {
  if (isDemoModeEnabled()) {
    return Promise.resolve(demoLogout());
  }

  const payload: RefreshTokenPayload = { refreshToken: "" };
  return request("/api/auth/logout", payload);
}
