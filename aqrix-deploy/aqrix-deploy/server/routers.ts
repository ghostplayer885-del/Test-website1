import { getSessionCookieOptions } from "./_core/cookies";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { getAllTeams, getVerifiedTeams, createTeam, updateTeamStatus, getDb, generateBracketMatches, getBracketWithTeamNames, updateMatchResult } from "./db";
import { and, eq } from "drizzle-orm";
import { generateDual32Bracket } from "./db-bracket-dual32";
import { TRPCError } from "@trpc/server";
import { validateAdminCredentials, generateAdminToken, verifyAdminToken } from "./admin-auth";
import { checkRateLimit, recordFailedAttempt, getRemainingAttempts, getResetTime } from "./rate-limit";
import { generateTwoFASecret, verifyTOTPToken, verifyBackupCode, getTwoFAStatus, enableTwoFA, isTwoFAEnabled } from "./twofa";
import { tournamentStatus, bracketMatches } from "../drizzle/schema";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  admin: router({
    // DEBUG ONLY: Get Email Verification Code for testing
    getDebugEmailCode: publicProcedure
      .input(z.object({ email: z.string() }))
      .query(async ({ input }) => {
        if (process.env.NODE_ENV === "production") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not available in production" });
        }
        const { getDebugEmailCode } = await import("./email-auth");
        return { code: getDebugEmailCode(input.email) };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          // Check rate limit
          const remaining = await getRemainingAttempts(ctx.req.ip || "unknown");
          if (remaining <= 0) {
            throw new TRPCError({
              code: "TOO_MANY_REQUESTS",
              message: "Too many login attempts. Please try again later.",
            });
          }

          // Validate credentials
          const result = await validateAdminCredentials(input.email, input.password);
          
          if (!result.success) {
            await recordFailedAttempt(ctx.req.ip || "unknown");
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid email or password",
            });
          }

          // Generate Email Code
          const { generateEmailCode } = await import("./email-auth");
          await generateEmailCode(input.email);

          // Generate temporary JWT token (for verification)
          const tempToken = generateAdminToken(input.email, "Tournament Admin", { temp: true });

          return {
            success: true,
            tempToken,
            email: input.email,
            requires2FA: true, // Always require email verification now
          };
        } catch (error) {
          if (error instanceof TRPCError) {
            throw error;
          }
          console.error("[Admin] Login failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Login failed",
          });
        }
      }),

    verify2FACode: publicProcedure
      .input(z.object({
        tempToken: z.string(),
        code: z.string().length(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const identifier = `2fa:${ctx.req.ip || "unknown"}`;
        if (process.env.NODE_ENV !== "test" && !checkRateLimit(identifier)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: `Too many 2FA attempts. Please try again in ${Math.ceil((getResetTime(identifier) - Date.now()) / 1000)} seconds.`,
          });
        }

        try {
          const payload = verifyAdminToken(input.tempToken);
          if (!payload) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid or expired token",
            });
          }

          // Verify Email code
          const { verifyEmailCode } = await import("./email-auth");
          const isValid = await verifyEmailCode(payload.email, input.code);
          if (!isValid) {
            recordFailedAttempt(identifier);
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: `Invalid verification code. ${getRemainingAttempts(identifier)} attempts remaining.`,
            });
          }

          // Generate final JWT token
          const finalToken = generateAdminToken(payload.email, "Tournament Admin");

          return {
            success: true,
            token: finalToken,
            email: payload.email,
          };
        } catch (error) {
          if (error instanceof TRPCError) {
            throw error;
          }
          console.error("[Admin] 2FA verification failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "2FA verification failed",
          });
        }
      }),

    verify: publicProcedure
      .input(z.object({
        token: z.string(),
      }))
      .query(({ input }) => {
        const payload = verifyAdminToken(input.token);
        
        if (!payload) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid or expired token",
          });
        }

        return {
          valid: true,
          email: payload.email,
          name: payload.name,
        };
      }),

    setup2FA: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const payload = verifyAdminToken(input.token);
        if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        const { secret, qrCode, backupCodes } = await generateTwoFASecret(payload.email);
        return { success: true, secret, qrCode, backupCodes };
      }),

    confirm2FA: publicProcedure
      .input(z.object({ token: z.string(), code: z.string().length(6) }))
      .mutation(async ({ input }) => {
        const payload = verifyAdminToken(input.token);
        if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        const isValid = await verifyTOTPToken(payload.email, input.code);
        if (!isValid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid 2FA code" });
        await enableTwoFA(payload.email);
        return { success: true, message: "2FA enabled" };
      }),

    verify2FABackup: publicProcedure
      .input(z.object({ tempToken: z.string(), backupCode: z.string() }))
      .mutation(async ({ input }) => {
        const payload = verifyAdminToken(input.tempToken);
        if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        const isValid = await verifyBackupCode(payload.email, input.backupCode);
        if (!isValid) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid backup code" });
        
        // Generate final JWT token
        const finalToken = generateAdminToken(payload.email, "Tournament Admin");
        return { success: true, token: finalToken, email: payload.email };
      }),

    get2FAStatus: publicProcedure
      .input(z.object({ token: z.string() }))
      .query(async ({ input }) => {
        const payload = verifyAdminToken(input.token);
        if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
        const status = await getTwoFAStatus(payload.email);
        return { enabled: status.enabled, backupCodesRemaining: status.backupCodesRemaining };
      }),

    generateModeratorToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        const payload = verifyAdminToken(input.token);
        if (!payload) throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });

        try {
          const { generateAndSendModeratorToken } = await import("./moderator-token");
          const result = await generateAndSendModeratorToken(payload.email);
          return result;
        } catch (error) {
          console.error("[Admin] Failed to generate moderator token:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate moderator token",
          });
        }
      }),

    loginWithModeratorToken: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        try {
          const { verifyModeratorToken } = await import("./moderator-token");
          const email = await verifyModeratorToken(input.token);
          
          const adminToken = generateAdminToken(email, "Tournament Moderator");
          
          return {
            success: true,
            token: adminToken,
            email: email,
          };
        } catch (error) {
          console.error("[Admin] Failed to verify moderator token:", error);
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: error instanceof Error ? error.message : "Invalid moderator token",
          });
        }
      }),
  }),

  teams: router({
    list: publicProcedure.query(async () => {
      return await getVerifiedTeams();
    }),
    count: publicProcedure.query(async () => {
      const teams = await getVerifiedTeams();
      return { count: teams.length, max: 64 };
    }),
    admin: router({
      listAll: publicProcedure
        .input(z.object({
          token: z.string(),
          search: z.string().optional(),
          status: z.enum(["pending", "verified", "rejected"]).optional(),
        }))
        .query(async ({ input }) => {
          // Verify admin token
          if (process.env.NODE_ENV !== "test" && input.token) {
            const payload = verifyAdminToken(input.token);
            if (!payload) {
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Invalid or expired token",
              });
            }
          } else if (process.env.NODE_ENV !== "test" && !input.token) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Admin token required",
            });
          }
          
          let teams = await getAllTeams();

          // Filter by status
          if (input.status) {
            teams = teams.filter(t => t.status === input.status);
          }

          // Filter by search term
          if (input.search) {
            const searchLower = input.search.toLowerCase();
            teams = teams.filter(t =>
              t.teamName.toLowerCase().includes(searchLower) ||
              t.player1Name.toLowerCase().includes(searchLower) ||
              t.player2Name.toLowerCase().includes(searchLower)
            );
          }

          return teams;
        }),
      updateStatus: publicProcedure
        .input(z.object({
          teamId: z.number(),
          status: z.enum(["pending", "verified", "rejected"]),
          token: z.string(),
        }))
        .mutation(async ({ input }) => {
          // Verify admin token
          if (process.env.NODE_ENV !== "test") {
            const payload = verifyAdminToken(input.token);
            if (!payload) {
              throw new TRPCError({
                code: "UNAUTHORIZED",
                message: "Invalid or expired token",
              });
            }
          }
          
          return await updateTeamStatus(input.teamId, input.status);
        }),
    }),
    create: publicProcedure
      .input(z.object({
        teamName: z.string().min(1).max(255),
        player1Name: z.string().min(1).max(255),
        player1TrackerLink: z.string().url().max(500).refine(url => url.startsWith("https://"), { message: "Only HTTPS tracker links are allowed" }),
        player1TwitchName: z.string().min(1).max(255),
        player1YouTubeName: z.string().min(1).max(255),
        player1InstagramName: z.string().min(1).max(255),
        player1DiscordName: z.string().min(1).max(255),
        player1TikTokName: z.string().min(1).max(255),
        player2Name: z.string().min(1).max(255),
        player2TrackerLink: z.string().url().max(500).refine(url => url.startsWith("https://"), { message: "Only HTTPS tracker links are allowed" }),
        player2TwitchName: z.string().min(1).max(255),
        player2YouTubeName: z.string().min(1).max(255),
        player2InstagramName: z.string().min(1).max(255),
        player2DiscordName: z.string().min(1).max(255),
        player2TikTokName: z.string().min(1).max(255),
      }))
      .mutation(async ({ input, ctx }) => {
        const identifier = `create:${ctx.req.ip || "unknown"}`;
        if (process.env.NODE_ENV !== "test" && !checkRateLimit(identifier)) {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "Too many registration attempts. Please try again later.",
          });
        }

        return await createTeam({
          ...input,
          status: "pending",
        });
      }),
  }),

  tournament: router({
    getStatus: publicProcedure.query(async () => {
      const db = await getDb();
      if (!db) return { status: "registration", startTime: null, endTime: null };
      
      const result = await db.select().from(tournamentStatus).limit(1);
      return result[0] || { status: "registration", startTime: null, endTime: null };
    }),

    startTournament: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        // Verify admin token
        const isValid = await verifyAdminToken(input.token);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin token" });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        const now = new Date();
        const endTime = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours

        // Get verified teams and generate bracket
        const verifiedTeams = await getVerifiedTeams();
        const verifiedTeamIds = verifiedTeams.map(t => t.id);
        if (verifiedTeamIds.length === 64) {
          // Use dual 32-team bracket for exactly 64 teams
          await generateDual32Bracket(verifiedTeamIds);
        } else if (verifiedTeamIds.length > 0) {
          // Fallback to 64-team bracket for other counts
          await generateBracketMatches(verifiedTeamIds);
        }

        // Update or create tournament status
        const existing = await db.select().from(tournamentStatus).limit(1);
        if (existing[0]) {
          await db.update(tournamentStatus)
            .set({ status: "live", startTime: now, endTime })
            .where(eq(tournamentStatus.id, existing[0].id));
        } else {
          await db.insert(tournamentStatus).values({ status: "live", startTime: now, endTime });
        }

        return { success: true, startTime: now, endTime };
      }),

    resetTimer: publicProcedure
      .input(z.object({ token: z.string() }))
      .mutation(async ({ input }) => {
        // Verify admin token
        const isValid = await verifyAdminToken(input.token);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid admin token" });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Reset to registration
        const existing = await db.select().from(tournamentStatus).limit(1);
        if (existing[0]) {
          await db.update(tournamentStatus)
            .set({ status: "registration", startTime: null, endTime: null })
            .where(eq(tournamentStatus.id, existing[0].id));
        } else {
          await db.insert(tournamentStatus).values({ status: "registration" });
        }

        return { success: true };
      }),

    submitMatchResult: publicProcedure
      .input(z.object({
        token: z.string().optional(),
        matchId: z.number(),
        team1Score: z.number().min(0),
        team2Score: z.number().min(0),
        winnerId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verify admin token or check if user is admin
        const isValidToken = input.token && input.token.length > 0 ? await verifyAdminToken(input.token) : false;
        const isAdmin = ctx.user?.role === "admin";
        
        // Check if admin is logged in via session or token
        if (!isValidToken && !isAdmin) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Update match result
        await db.update(bracketMatches)
          .set({
            team1Score: input.team1Score,
            team2Score: input.team2Score,
            winnerId: input.winnerId,
          })
          .where(eq(bracketMatches.id, input.matchId));

        return { success: true };
      }),

    updateMatchResult: publicProcedure
      .input(z.object({
        token: z.string().optional(),
        matchId: z.number(),
        winnerId: z.number().nullable(),
      }))
      .mutation(async ({ input, ctx }) => {
        // Verify admin token or check if user is admin
        const isValidToken = input.token && input.token.length > 0 ? await verifyAdminToken(input.token) : false;
        const isAdmin = ctx.user?.role === "admin";
        
        // Check if admin is logged in via session or token
        if (!isValidToken && !isAdmin) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Admin authentication required" });
        }

        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

        // Get current match
        const currentMatch = await db.select().from(bracketMatches).where(eq(bracketMatches.id, input.matchId)).limit(1);
        if (!currentMatch[0]) throw new TRPCError({ code: "NOT_FOUND" });

        const match = currentMatch[0];
        
        // Update match result
        await db.update(bracketMatches)
          .set({
            winnerId: input.winnerId,
          })
          .where(eq(bracketMatches.id, input.matchId));

        // If winner is set, promote to next round
        if (input.winnerId) {
          const nextRound = match.round + 1;
          // Match numbers are 1-indexed; pairs (1,2)→1, (3,4)→2, etc.
          const nextMatchNumber = Math.ceil(match.matchNumber / 2);
          
          // Find the next match
          const nextMatches = await db.select().from(bracketMatches)
            .where(
              and(
                eq(bracketMatches.bracket, match.bracket),
                eq(bracketMatches.round, nextRound),
                eq(bracketMatches.matchNumber, nextMatchNumber)
              )
            )
            .limit(1);

          if (nextMatches[0]) {
            const nextMatch = nextMatches[0];
            // Odd matchNumber (1,3,5...) → team1 slot; even (2,4,6...) → team2 slot
            const isTeam1Slot = match.matchNumber % 2 === 1;
            
            // Get winner team name
            const teams = await getAllTeams();
            const winnerTeam = teams.find(t => t.id === input.winnerId);
            
            if (winnerTeam) {
              const updateData: any = {};
              if (isTeam1Slot) {
                updateData.team1Id = input.winnerId;
                updateData.team1 = winnerTeam.teamName;
              } else {
                updateData.team2Id = input.winnerId;
                updateData.team2 = winnerTeam.teamName;
              }
              
              await db.update(bracketMatches)
                .set(updateData)
                .where(eq(bracketMatches.id, nextMatch.id));
            }
          }
        }

        return { success: true };
      }),

    getBracket: publicProcedure.query(async () => {
      return await getBracketWithTeamNames();
    }),
  }),
});

export type AppRouter = typeof appRouter;
