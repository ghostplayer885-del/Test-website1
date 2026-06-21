import { nanoid } from "nanoid";
import { getDb } from "./db";
import { adminAccessTokens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import type { InferSelectModel } from "drizzle-orm";

type AdminAccessToken = InferSelectModel<typeof adminAccessTokens>;

/**
 * Generate a random alphanumeric token (16 characters)
 * Format: Mix of uppercase, lowercase, and numbers
 */
function generateRandomToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 16; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Generate a moderator token and send it via notification
 * Token expires in 5 minutes
 */
export async function generateAndSendModeratorToken(ownerEmail: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const token = generateRandomToken();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

  try {
    // Save token to database
    await db.insert(adminAccessTokens).values({
      token,
      createdBy: ownerEmail,
      isActive: 1,
      expiresAt,
    });

    // Send notification to owner
    const notificationSent = await notifyOwner({
      title: "Moderator Access Token Generated",
      content: `A new moderator access token has been generated:\n\n${token}\n\nThis token expires in 5 minutes. Share this token with your moderators so they can log in to the admin panel.`,
    });

    if (!notificationSent) {
      console.warn("[Moderator Token] Notification failed, but token was created");
    }

    return {
      success: true,
      token,
      expiresAt: expiresAt.toISOString(),
      message: "Token generated and sent to your email",
    };
  } catch (error) {
    console.error("[Moderator Token] Failed to generate token:", error);
    throw new Error("Failed to generate moderator token");
  }
}

/**
 * Verify a moderator token and mark it as used
 */
export async function verifyModeratorToken(token: string): Promise<string> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Find the token
    const result = await db
      .select()
      .from(adminAccessTokens)
      .where(
        and(
          eq(adminAccessTokens.token, token),
          eq(adminAccessTokens.isActive, 1)
        )
      )
      .limit(1);

    if (result.length === 0) {
      throw new Error("Invalid or expired token");
    }

    const tokenRecord = result[0];

    // Check if token has expired
    if (tokenRecord.expiresAt && new Date(tokenRecord.expiresAt) < new Date()) {
      throw new Error("Token has expired");
    }

    // Check if token was already used
    if (tokenRecord.usedAt) {
      throw new Error("Token has already been used");
    }

    // Mark token as used
    await db
      .update(adminAccessTokens)
      .set({
        usedAt: new Date(),
        isActive: 0,
      })
      .where(eq(adminAccessTokens.id, tokenRecord.id));

    // Return the creator's email (owner email)
    return tokenRecord.createdBy;
  } catch (error) {
    console.error("[Moderator Token] Verification failed:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to verify moderator token");
  }
}

/**
 * Get all active tokens created by an owner
 */
export async function getOwnerTokens(ownerEmail: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const tokens = await db
      .select()
      .from(adminAccessTokens)
      .where(eq(adminAccessTokens.createdBy, ownerEmail));

    return tokens.map((t: AdminAccessToken) => ({
      id: t.id,
      token: t.token,
      isActive: t.isActive === 1,
      usedBy: t.usedBy,
      usedAt: t.usedAt,
      expiresAt: t.expiresAt,
      createdAt: t.createdAt,
    }));
  } catch (error) {
    console.error("[Moderator Token] Failed to get tokens:", error);
    throw new Error("Failed to retrieve tokens");
  }
}

/**
 * Revoke a token
 */
export async function revokeToken(tokenId: number, ownerEmail: string) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Verify ownership
    const token = await db
      .select()
      .from(adminAccessTokens)
      .where(eq(adminAccessTokens.id, tokenId))
      .limit(1);

    if (token.length === 0 || token[0].createdBy !== ownerEmail) {
      throw new Error("Unauthorized");
    }

    // Revoke token
    await db
      .update(adminAccessTokens)
      .set({ isActive: 0 })
      .where(eq(adminAccessTokens.id, tokenId));

    return { success: true };
  } catch (error) {
    console.error("[Moderator Token] Failed to revoke token:", error);
    throw error instanceof Error ? error : new Error("Failed to revoke token");
  }
}
