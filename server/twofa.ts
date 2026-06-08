import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { getDb } from "./db";
import { admin2FASecrets } from "../drizzle/schema";
import { eq } from "drizzle-orm";

const APP_NAME = "Aqrix 2v2 Tournament";
const ISSUER = "Aqrix";

/**
 * Generate a new 2FA secret and backup codes
 */
import crypto from "crypto";

// In-memory store for tests ONLY
const memoryStore = new Map<string, any>();

export async function generateTwoFASecret(email: string): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> {
  // Generate TOTP secret
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${email})`,
    issuer: ISSUER,
    length: 32, // 256-bit secret
  });

  if (!secret.base32) {
    throw new Error("Failed to generate 2FA secret");
  }

  // Generate cryptographically secure backup codes (10 codes, 12 characters each)
  const backupCodes = Array.from({ length: 10 }, () =>
    crypto.randomBytes(6).toString("hex").toUpperCase()
  );

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url || "");

  // Store the secret and backup codes in database
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      memoryStore.set(email, {
        totpSecret: secret.base32,
        backupCodes: [...backupCodes],
        enabled: 0,
      });
      return { secret: secret.base32, qrCode, backupCodes };
    }
    throw new Error("Database not available for 2FA storage");
  }

  try {
    await db.insert(admin2FASecrets).values({
      email,
      totpSecret: secret.base32,
      backupCodes,
      enabled: 0, // Not enabled until confirmed
    }).onDuplicateKeyUpdate({
      set: {
        totpSecret: secret.base32,
        backupCodes,
        enabled: 0,
      },
    });
  } catch (error) {
    console.error("[2FA] Failed to store 2FA secret in database:", error);
    throw error;
  }

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify a TOTP token
 */
export async function verifyTOTPToken(email: string, token: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      const entry = memoryStore.get(email);
      if (!entry) return false;
      const verified = speakeasy.totp.verify({
        secret: entry.totpSecret,
        encoding: "base32",
        token,
        window: 1,
      });
      return verified === true;
    }
    throw new Error("Database not available for 2FA verification");
  }

  try {
    const result = await db
      .select()
      .from(admin2FASecrets)
      .where(eq(admin2FASecrets.email, email))
      .limit(1);

    if (result.length === 0) {
      console.warn(`[2FA] No 2FA secret found for ${email}`);
      return false;
    }

    const entry = result[0];

    const verified = speakeasy.totp.verify({
      secret: entry.totpSecret,
      encoding: "base32",
      token,
      window: 1, // Reduced window for better security (±30 seconds)
    });

    return verified === true;
  } catch (error) {
    console.error("[2FA] TOTP verification error:", error);
    return false;
  }
}

/**
 * Verify a backup code and remove it from the list
 */
export async function verifyBackupCode(email: string, code: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      const entry = memoryStore.get(email);
      if (!entry) return false;
      const index = entry.backupCodes.indexOf(code.toUpperCase());
      if (index === -1) return false;
      entry.backupCodes.splice(index, 1);
      return true;
    }
    throw new Error("Database not available for backup code verification");
  }

  try {
    const result = await db
      .select()
      .from(admin2FASecrets)
      .where(eq(admin2FASecrets.email, email))
      .limit(1);

    if (result.length === 0) {
      console.warn(`[2FA] No 2FA secret found for ${email}`);
      return false;
    }

    const entry = result[0];
    const backupCodes = Array.isArray(entry.backupCodes) ? entry.backupCodes : [];
    const index = backupCodes.indexOf(code.toUpperCase());

    if (index === -1) {
      console.warn(`[2FA] Invalid backup code for ${email}`);
      return false;
    }

    // Remove the used backup code
    backupCodes.splice(index, 1);

    // Update database
    await db
      .update(admin2FASecrets)
      .set({ backupCodes })
      .where(eq(admin2FASecrets.email, email));

    console.log(`[2FA] Backup code used for ${email}. Remaining: ${backupCodes.length}`);
    return true;
  } catch (error) {
    console.error("[2FA] Backup code verification error:", error);
    return false;
  }
}

/**
 * Check if 2FA is enabled for an email
 */
export async function isTwoFAEnabled(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      const entry = memoryStore.get(email);
      return entry ? entry.enabled === 1 : false;
    }
    return false;
  }

  try {
    const result = await db
      .select()
      .from(admin2FASecrets)
      .where(eq(admin2FASecrets.email, email))
      .limit(1);

    if (result.length === 0) return false;
    return result[0].enabled === 1;
  } catch (error) {
    console.error("[2FA] Error checking 2FA status:", error);
    return false;
  }
}

/**
 * Enable 2FA for an email (after verification)
 */
export async function enableTwoFA(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      const entry = memoryStore.get(email);
      if (entry) {
        entry.enabled = 1;
        return true;
      }
    }
    return false;
  }

  try {
    await db
      .update(admin2FASecrets)
      .set({ enabled: 1 })
      .where(eq(admin2FASecrets.email, email));
    return true;
  } catch (error) {
    console.error("[2FA] Error enabling 2FA:", error);
    return false;
  }
}

/**
 * Disable 2FA for an email
 */
export async function disableTwoFA(email: string): Promise<boolean> {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      return memoryStore.delete(email);
    }
    return false;
  }

  try {
    await db.delete(admin2FASecrets).where(eq(admin2FASecrets.email, email));
    return true;
  } catch (error) {
    console.error("[2FA] Error disabling 2FA:", error);
    return false;
  }
}

/**
 * Get 2FA status for an email
 */
export async function getTwoFAStatus(
  email: string
): Promise<{
  enabled: boolean;
  backupCodesRemaining: number;
}> {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      const entry = memoryStore.get(email);
      if (!entry) return { enabled: false, backupCodesRemaining: 0 };
      return {
        enabled: entry.enabled === 1,
        backupCodesRemaining: entry.backupCodes.length,
      };
    }
    return { enabled: false, backupCodesRemaining: 0 };
  }

  try {
    const result = await db
      .select()
      .from(admin2FASecrets)
      .where(eq(admin2FASecrets.email, email))
      .limit(1);

    if (result.length === 0) {
      return { enabled: false, backupCodesRemaining: 0 };
    }

    const entry = result[0];
    const backupCodes = Array.isArray(entry.backupCodes) ? entry.backupCodes : [];

    return {
      enabled: entry.enabled === 1,
      backupCodesRemaining: backupCodes.length,
    };
  } catch (error) {
    console.error("[2FA] Error getting 2FA status:", error);
    return { enabled: false, backupCodesRemaining: 0 };
  }
}
