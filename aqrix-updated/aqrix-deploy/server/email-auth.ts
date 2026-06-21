import { getDb } from "./db";
import { admin2FASecrets } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

// In-memory store for simulation (in production this would be sent via email)
const emailCodeStore = new Map<string, { code: string; expires: number }>();

/**
 * Generate a 6-digit verification code and store it
 */
export async function generateEmailCode(email: string): Promise<string> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

  emailCodeStore.set(email, { code, expires });
  console.log(`[Email Auth] Code for ${email}: ${code}`);
  
  return code;
}

/**
 * Verify the email code
 */
export async function verifyEmailCode(email: string, code: string): Promise<boolean> {
  const entry = emailCodeStore.get(email);
  
  if (!entry) return false;
  if (Date.now() > entry.expires) {
    emailCodeStore.delete(email);
    return false;
  }
  
  if (entry.code === code) {
    emailCodeStore.delete(email);
    return true;
  }
  
  return false;
}

/**
 * Get the current active code for debug/test purposes
 */
export function getDebugEmailCode(email: string): string | null {
  const entry = emailCodeStore.get(email);
  if (entry && Date.now() <= entry.expires) {
    return entry.code;
  }
  return null;
}
