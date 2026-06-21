import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, tinyint, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Teams table for the 2v2 tournament
export const teams = mysqlTable("teams", {
  id: int("id").autoincrement().primaryKey(),
  teamName: varchar("teamName", { length: 255 }).notNull(),
  player1Name: varchar("player1Name", { length: 255 }).notNull(),
  player1TrackerLink: varchar("player1TrackerLink", { length: 500 }).notNull(),
  player1TwitchName: varchar("player1TwitchName", { length: 255 }).notNull(),
  player1YouTubeName: varchar("player1YouTubeName", { length: 255 }).notNull(),
  player1InstagramName: varchar("player1InstagramName", { length: 255 }).notNull(),
  player1DiscordName: varchar("player1DiscordName", { length: 255 }).notNull(),
  player1TikTokName: varchar("player1TikTokName", { length: 255 }).notNull(),
  player2Name: varchar("player2Name", { length: 255 }).notNull(),
  player2TrackerLink: varchar("player2TrackerLink", { length: 500 }).notNull(),
  player2TwitchName: varchar("player2TwitchName", { length: 255 }).notNull(),
  player2YouTubeName: varchar("player2YouTubeName", { length: 255 }).notNull(),
  player2InstagramName: varchar("player2InstagramName", { length: 255 }).notNull(),
  player2DiscordName: varchar("player2DiscordName", { length: 255 }).notNull(),
  player2TikTokName: varchar("player2TikTokName", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "verified", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Team = typeof teams.$inferSelect;
export type InsertTeam = typeof teams.$inferInsert;

// Admin users table for managing multiple admin accounts
export const admins = mysqlTable("admins", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(), // bcrypt hash
  isActive: tinyint("isActive").default(1).notNull(), // 1 = true, 0 = false
  createdBy: int("createdBy"), // Admin who created this account
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type InsertAdmin = typeof admins.$inferInsert;

// Admin access tokens for sharing with moderators
export const adminAccessTokens = mysqlTable("admin_access_tokens", {
  id: int("id").autoincrement().primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(), // Random alphanumeric token
  createdBy: varchar("createdBy", { length: 320 }).notNull(), // Email of who created it
  isActive: tinyint("isActive").default(1).notNull(), // 1 = true, 0 = false
  usedBy: varchar("usedBy", { length: 320 }), // Email of who used it
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AdminAccessToken = typeof adminAccessTokens.$inferSelect;
export type InsertAdminAccessToken = typeof adminAccessTokens.$inferInsert;

// 2FA secrets table for persistent TOTP storage
export const admin2FASecrets = mysqlTable("admin_2fa_secrets", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  totpSecret: varchar("totpSecret", { length: 255 }).notNull(),
  backupCodes: json("backupCodes").$type<string[]>().notNull(),
  enabled: tinyint("enabled").default(0).notNull(), // 1 = true, 0 = false
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Admin2FASecret = typeof admin2FASecrets.$inferSelect;
export type InsertAdmin2FASecret = typeof admin2FASecrets.$inferInsert;

// Tournament status table for managing tournament lifecycle
export const tournamentStatus = mysqlTable("tournament_status", {
  id: int("id").autoincrement().primaryKey(),
  status: mysqlEnum("status", ["registration", "live", "completed"]).default("registration").notNull(),
  startTime: timestamp("startTime"), // When tournament goes live
  endTime: timestamp("endTime"), // When tournament ends
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TournamentStatus = typeof tournamentStatus.$inferSelect;
export type InsertTournamentStatus = typeof tournamentStatus.$inferInsert;

// Bracket matches table for tracking tournament results
// Supports dual 32-team single elimination brackets (left and right) with grand finals
export const bracketMatches = mysqlTable("bracket_matches", {
  id: int("id").autoincrement().primaryKey(),
  bracket: mysqlEnum("bracket", ["left", "right", "finals"]).notNull(), // Which bracket: left (32), right (32), or finals
  round: int("round").notNull(), // 1-5 for left/right brackets, 1 for finals
  matchNumber: int("matchNumber").notNull(), // Match number in the round (1-indexed)
  team1Id: int("team1Id"), // First team ID or null if TBD
  team2Id: int("team2Id"), // Second team ID or null if TBD
  team1Score: int("team1Score").default(0), // Score for team 1
  team2Score: int("team2Score").default(0), // Score for team 2
  winnerId: int("winnerId"), // ID of winning team
  nextMatchId: int("nextMatchId"), // ID of next match (winner goes here)
  nextMatchPosition: int("nextMatchPosition"), // Position in next match (1 or 2)
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BracketMatch = typeof bracketMatches.$inferSelect;
export type InsertBracketMatch = typeof bracketMatches.$inferInsert;
