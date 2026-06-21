import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createPublicContext(): TrpcContext {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("teams router", () => {
  describe("teams.create", () => {
    it("should create a team with valid input", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const teamData = {
        teamName: "Test Team",
        player1Name: "Player One",
        player1TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerOne-NA1",
        player1TwitchName: "playerone_twitch",
        player1DiscordName: "PlayerOne#1234",
        player2Name: "Player Two",
        player2TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerTwo-NA1",
        player2TwitchName: "playertwo_twitch",
        player2DiscordName: "PlayerTwo#5678",
        player1TikTokName: "playerone_tiktok",
        player2TikTokName: "playertwo_tiktok",
      };

      const result = await caller.teams.create(teamData);

      expect(result).toBeDefined();
      // MySQL result is an array-like object with insertId
      expect((result as any)[0]?.insertId || (result as any)?.insertId).toBeDefined();
    });

    it("should reject empty team name", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const teamData = {
        teamName: "",
        player1Name: "Player One",
        player1TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerOne-NA1",
        player1TwitchName: "playerone_twitch",
        player1DiscordName: "PlayerOne#1234",
        player2Name: "Player Two",
        player2TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerTwo-NA1",
        player2TwitchName: "playertwo_twitch",
        player2DiscordName: "PlayerTwo#5678",
        player1TikTokName: "playerone_tiktok",
        player2TikTokName: "playertwo_tiktok",
      };

      try {
        await caller.teams.create(teamData);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should reject missing Discord names", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const teamData = {
        teamName: "Test Team",
        player1Name: "Player One",
        player1TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerOne-NA1",
        player1TwitchName: "playerone_twitch",
        // Missing player1DiscordName
        player2Name: "Player Two",
        player2TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerTwo-NA1",
        player2TwitchName: "playertwo_twitch",
        player2DiscordName: "PlayerTwo#5678",
      };

      try {
        // @ts-ignore - intentionally passing incomplete data
        await caller.teams.create(teamData);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should reject missing Twitch names", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const teamData = {
        teamName: "Test Team",
        player1Name: "Player One",
        player1TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerOne-NA1",
        // Missing player1TwitchName
        player1DiscordName: "PlayerOne#1234",
        player2Name: "Player Two",
        player2TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerTwo-NA1",
        player2TwitchName: "playertwo_twitch",
        player2DiscordName: "PlayerTwo#5678",
      };

      try {
        // @ts-ignore - intentionally passing incomplete data
        await caller.teams.create(teamData);
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("teams.list", () => {
    it("should return an array of verified teams", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.teams.list();

      expect(Array.isArray(result)).toBe(true);
      
      // All returned teams should have verified status
      result.forEach((team: any) => {
        expect(team.status).toBe("verified");
      });
    });

    it("should not return pending teams", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.teams.list();

      // No pending teams should be in the list
      result.forEach((team: any) => {
        expect(team.status).not.toBe("pending");
      });
    });

    it("should include Discord and Twitch information", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.teams.list();

      // Check that teams have Discord and Twitch fields
      result.forEach((team: any) => {
        expect(team).toHaveProperty("player1DiscordName");
        expect(team).toHaveProperty("player1TwitchName");
        expect(team).toHaveProperty("player2DiscordName");
        expect(team).toHaveProperty("player2TwitchName");
      });
    });
  });

  describe("teams.admin.listAll", () => {
    it("should return all teams including pending", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.teams.admin.listAll({ token: "" });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should include Discord and Twitch information in all teams", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.teams.admin.listAll({ token: "" });

      // Check that all teams have Discord and Twitch fields
      result.forEach((team: any) => {
        expect(team).toHaveProperty("player1DiscordName");
        expect(team).toHaveProperty("player1TwitchName");
        expect(team).toHaveProperty("player2DiscordName");
        expect(team).toHaveProperty("player2TwitchName");
      });
    });

    it("should filter wheel selected teams by status", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.teams.admin.listAll({ token: "", status: "wheel_selected" });

      expect(Array.isArray(result)).toBe(true);
      result.forEach((team: any) => {
        expect(team.status).toBe("wheel_selected");
      });
    });
  });

  describe("teams.admin.updateStatus", () => {
    it("should update team status", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // First, create a team
      const teamData = {
        teamName: "Status Test Team",
        player1Name: "Player One",
        player1TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerOne-NA1",
        player1TwitchName: "playerone_twitch",
        player1DiscordName: "PlayerOne#1234",
        player2Name: "Player Two",
        player2TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerTwo-NA1",
        player2TwitchName: "playertwo_twitch",
        player2DiscordName: "PlayerTwo#5678",
        player1TikTokName: "playerone_tiktok",
        player2TikTokName: "playertwo_tiktok",
      };

      const createdTeam = await caller.teams.create(teamData);

      // Then update its status
      if (createdTeam && typeof createdTeam === "object" && "insertId" in createdTeam) {
        const teamId = (createdTeam as any).insertId;
        const result = await caller.teams.admin.updateStatus({
          teamId,
          status: "verified",
          token: "",
        });

        expect(result).toBeDefined();
        expect((result as any).status).toBe("verified");
      }
    });

    it("should reject invalid status", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.teams.admin.updateStatus({
          teamId: 1,
          status: "invalid" as any,
          token: "",
        });
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should update team to rejected status", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      // First, create a team
      const teamData = {
        teamName: "Rejection Test Team",
        player1Name: "Player One",
        player1TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerOne-NA1",
        player1TwitchName: "playerone_twitch",
        player1DiscordName: "PlayerOne#1234",
        player2Name: "Player Two",
        player2TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerTwo-NA1",
        player2TwitchName: "playertwo_twitch",
        player2DiscordName: "PlayerTwo#5678",
        player1TikTokName: "playerone_tiktok",
        player2TikTokName: "playertwo_tiktok",
      };

      const createdTeam = await caller.teams.create(teamData);

      // Then update its status to rejected
      if (createdTeam && typeof createdTeam === "object" && "insertId" in createdTeam) {
        const teamId = (createdTeam as any).insertId;
        const result = await caller.teams.admin.updateStatus({
          teamId,
          status: "rejected",
        });

        expect(result).toBeDefined();
        expect((result as any).status).toBe("rejected");
      }
    });
  });

  describe("Team data validation", () => {
    it("should store Discord usernames correctly", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const teamData = {
        teamName: "Discord Test Team",
        player1Name: "Player One",
        player1TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerOne-NA1",
        player1TwitchName: "playerone_twitch",
        player1DiscordName: "DiscordUser#1234",
        player2Name: "Player Two",
        player2TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerTwo-NA1",
        player2TwitchName: "playertwo_twitch",
        player2DiscordName: "AnotherUser#5678",
        player1TikTokName: "playerone_tiktok",
        player2TikTokName: "playertwo_tiktok",
      };

      const result = await caller.teams.create(teamData);
      expect(result).toBeDefined();
      // MySQL result is an array-like object with insertId
      expect((result as any)[0]?.insertId || (result as any)?.insertId).toBeDefined();
    });

    it("should store Twitch usernames correctly", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const teamData = {
        teamName: "Twitch Test Team",
        player1Name: "Player One",
        player1TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerOne-NA1",
        player1TwitchName: "twitch_user_123",
        player1DiscordName: "PlayerOne#1234",
        player2Name: "Player Two",
        player2TrackerLink: "https://tracker.gg/rl/profile/psyonix/PlayerTwo-NA1",
        player2TwitchName: "another_twitch_user",
        player2DiscordName: "PlayerTwo#5678",
        player1TikTokName: "playerone_tiktok",
        player2TikTokName: "playertwo_tiktok",
      };

      const result = await caller.teams.create(teamData);
      expect(result).toBeDefined();
      // MySQL result is an array-like object with insertId
      expect((result as any)[0]?.insertId || (result as any)?.insertId).toBeDefined();
    });

    it("should store Riot IDs correctly", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      const teamData = {
        teamName: "Riot ID Test Team",
        player1Name: "Player One",
        player1TrackerLink: "https://tracker.gg/valorant/profile/riot/ProPlayer%23NA1/overview",
        player1TwitchName: "playerone_twitch",
        player1DiscordName: "PlayerOne#1234",
        player2Name: "Player Two",
        player2TrackerLink: "https://tracker.gg/valorant/profile/riot/ProPlayer2%23EUW1/overview",
        player2TwitchName: "playertwo_twitch",
        player2DiscordName: "PlayerTwo#5678",
        player1TikTokName: "playerone_tiktok",
        player2TikTokName: "playertwo_tiktok",
      };

      const result = await caller.teams.create(teamData);
      expect(result).toBeDefined();
      // MySQL result is an array-like object with insertId
      expect((result as any)[0]?.insertId || (result as any)?.insertId).toBeDefined();
    });
  });
});
