/*
  CODE_RABBIT_REVIEW: Security notes
  - This file implements admin authentication (JWT, bcrypt).
  - Please review: secret management, token expiry, password storage, and any hard-coded defaults.
  - Do NOT leave production secrets in code; ensure `process.env.JWT_SECRET` is set in your deployment.
  - If you change cryptographic settings, validate compatibility with existing tokens.
*/
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET || "aqrix-secret-key-2026";

if (!JWT_SECRET) {
  console.error("[Admin Auth] FATAL: JWT_SECRET environment variable is not set!");
}

// Default admin credentials from environment
const DEFAULT_ADMIN_EMAIL = "admin@aqrix.local";
const DEFAULT_ADMIN_PASSWORD = "K9xL2mQ5vN8p7R3";

if (!DEFAULT_ADMIN_EMAIL || !DEFAULT_ADMIN_PASSWORD) {
  console.error("[Admin Auth] FATAL: ADMIN_EMAIL or ADMIN_PASSWORD environment variables are not set!");
}

// Pre-computed bcrypt hash of the default password (computed once at startup)
let DEFAULT_ADMIN_PASSWORD_HASH: string | null = null;

export interface AdminTokenPayload {
  email: string;
  name: string;
  temp?: boolean;
  iat: number;
  exp: number;
}

export function generateAdminToken(email: string, name: string, options?: { temp?: boolean }): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
  const payload: Omit<AdminTokenPayload, "iat" | "exp"> = {
    email,
    name,
    ...(options?.temp && { temp: true }),
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: options?.temp ? "15m" : "7d", // 15 minutes for temp tokens, 7 days for final
    algorithm: "HS256",
  });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  if (!JWT_SECRET) return null;
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ["HS256"],
    }) as AdminTokenPayload;
    return decoded;
  } catch (error) {
    console.error("[Admin Auth] Token verification failed:", error);
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12); // 12 rounds for strong hashing
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function validateAdminCredentials(
  email: string,
  password: string
): Promise<{ success: boolean; adminName?: string }> {
  try {
    // Simple string comparison for fixed credentials
    if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD) {
      console.log("[Admin Auth] Admin login successful");
      return {
        success: true,
        adminName: "Admin",
      };
    }

    console.warn(`[Admin Auth] Invalid credentials for email: ${email}`);
    return { success: false };
  } catch (error) {
    console.error("[Admin Auth] Credential validation error:", error);
    return { success: false };
  }
}

// Initialize password hash on module load
async function initializePasswordHash(): Promise<void> {
  try {
    if (!DEFAULT_ADMIN_PASSWORD_HASH && DEFAULT_ADMIN_PASSWORD) {
      console.log("[Admin Auth] Initializing password hash...");
      DEFAULT_ADMIN_PASSWORD_HASH = await hashPassword(DEFAULT_ADMIN_PASSWORD);
      console.log("[Admin Auth] Password hash initialized");
    }
  } catch (error) {
    console.error("[Admin Auth] Failed to initialize password hash:", error);
  }
}

// Initialize on module load
initializePasswordHash().catch(err => {
  console.error("[Admin Auth] Initialization error:", err);
});

export const DEFAULT_ADMIN_CREDENTIALS = {
  email: DEFAULT_ADMIN_EMAIL,
  password: DEFAULT_ADMIN_PASSWORD,
};

export async function getPasswordHash(): Promise<string | null> {
  if (!DEFAULT_ADMIN_PASSWORD_HASH) {
    await initializePasswordHash();
  }
  return DEFAULT_ADMIN_PASSWORD_HASH;
}
