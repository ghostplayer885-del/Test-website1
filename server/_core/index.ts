import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import jwt from "jsonwebtoken";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  
  // Admin login endpoint
  app.post("/api/admin/login", (req, res) => {
    const { email, password } = req.body;
    // Simple hardcoded admin credentials
    if (email === "admin@aqrix.local" && password === "K9xL2mQ5vN8p7R3") {
      const jwtSecret = process.env.JWT_SECRET || "aqrix-secret-key-2026";
      const token = jwt.sign(
        { email, name: "Admin" },
        jwtSecret,
        { expiresIn: "30d", algorithm: "HS256" }
      );
      res.json({ token });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });
  // Temporary seed endpoint
  app.get("/api/seed-teams", async (req, res) => {
    try {
      const { getDb } = await import("../db.js");
      const { teams: teamsTable, bracketMatches } = await import("../../drizzle/schema.js");
      const { sql } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("DB not available");
      // Create tables if not exist
      await db.execute(sql`CREATE TABLE IF NOT EXISTS bracket_matches (id INT AUTO_INCREMENT PRIMARY KEY, bracket ENUM('left','right','finals') NOT NULL, round INT NOT NULL, matchNumber INT NOT NULL, team1Id INT, team2Id INT, team1Score INT DEFAULT 0, team2Score INT DEFAULT 0, winnerId INT, nextMatchId INT, nextMatchPosition INT, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
      await db.execute(sql`CREATE TABLE IF NOT EXISTS teams (id INT AUTO_INCREMENT PRIMARY KEY, teamName VARCHAR(255) NOT NULL, player1Name VARCHAR(255) NOT NULL, player1TrackerLink VARCHAR(500) NOT NULL, player1TwitchName VARCHAR(255) NOT NULL, player1YouTubeName VARCHAR(255) NOT NULL, player1InstagramName VARCHAR(255) NOT NULL, player1DiscordName VARCHAR(255) NOT NULL, player1TikTokName VARCHAR(255) NOT NULL, player2Name VARCHAR(255) NOT NULL, player2TrackerLink VARCHAR(500) NOT NULL, player2TwitchName VARCHAR(255) NOT NULL, player2YouTubeName VARCHAR(255) NOT NULL, player2InstagramName VARCHAR(255) NOT NULL, player2DiscordName VARCHAR(255) NOT NULL, player2TikTokName VARCHAR(255) NOT NULL, status ENUM('pending','verified','rejected','wheel_selected') NOT NULL DEFAULT 'pending', rejectionReason VARCHAR(500) NULL, selectedAt TIMESTAMP NULL, createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
      await db.execute(sql`DELETE FROM bracket_matches`);
      await db.execute(sql`DELETE FROM teams`);
      const teamData = [
        ["NightStalkers_A","ShadowX1","GhostBlade1"],["NightStalkers_B","ShadowX2","GhostBlade2"],
        ["IronFury_A","IronWolf1","SteelFang1"],["IronFury_B","IronWolf2","SteelFang2"],
        ["BlazePeak_A","FireStorm1","AshRider1"],["BlazePeak_B","FireStorm2","AshRider2"],
        ["VoidWalkers_A","VoidKing1","DarkMatter1"],["VoidWalkers_B","VoidKing2","DarkMatter2"],
        ["StormChasers_A","ThunderBolt1","LightningX1"],["StormChasers_B","ThunderBolt2","LightningX2"],
        ["CrimsonEdge_A","RedViper1","CrimsonAce1"],["CrimsonEdge_B","RedViper2","CrimsonAce2"],
        ["FrostBite_A","IcePick1","FrostWolf1"],["FrostBite_B","IcePick2","FrostWolf2"],
        ["NeonPhantom_A","NeonGhost1","CyberBlade1"],["NeonPhantom_B","NeonGhost2","CyberBlade2"],
        ["ArcadeKings_A","PixelPro1","ArcadeBoss1"],["ArcadeKings_B","PixelPro2","ArcadeBoss2"],
        ["SilverBullet_A","SilverFox1","QuickShot1"],["SilverBullet_B","SilverFox2","QuickShot2"],
        ["GoldenEagle_A","EagleEye1","GoldRush1"],["GoldenEagle_B","EagleEye2","GoldRush2"],
        ["DarkHornet_A","Hornet1","NightBuzz1"],["DarkHornet_B","Hornet2","NightBuzz2"],
        ["TurboLegend_A","TurboAce1","LegendX1"],["TurboLegend_B","TurboAce2","LegendX2"],
        ["PhantomStrike_A","PhantomX1","StrikeForce1"],["PhantomStrike_B","PhantomX2","StrikeForce2"],
        ["SonicBoom_A","SonicX1","BoomShot1"],["SonicBoom_B","SonicX2","BoomShot2"],
        ["ViperNest_A","ViperX1","CobraFang1"],["ViperNest_B","ViperX2","CobraFang2"],
        ["MidnightCrew_A","MidnightX1","ShadowRun1"],["MidnightCrew_B","MidnightX2","ShadowRun2"],
        ["RocketRiders_A","RocketX1","BoostKing1"],["RocketRiders_B","RocketX2","BoostKing2"],
        ["AlphaWolves_A","AlphaX1","WolfPack1"],["AlphaWolves_B","AlphaX2","WolfPack2"],
        ["BetaForce_A","BetaX1","ForceField1"],["BetaForce_B","BetaX2","ForceField2"],
        ["OmegaSquad_A","OmegaX1","SquadUp1"],["OmegaSquad_B","OmegaX2","SquadUp2"],
        ["ZenMasters_A","ZenX1","MasterMind1"],["ZenMasters_B","ZenX2","MasterMind2"],
        ["DiamondDuo_A","DiamondX1","PureGem1"],["DiamondDuo_B","DiamondX2","PureGem2"],
        ["TitanPair_A","TitanX1","TitanY1"],["TitanPair_B","TitanX2","TitanY2"],
        ["CosmicDuo_A","CosmicX1","StarBurst1"],["CosmicDuo_B","CosmicX2","StarBurst2"],
        ["LunarTeam_A","LunarX1","MoonShot1"],["LunarTeam_B","LunarX2","MoonShot2"],
        ["SolarFlare_A","FlareX1","SunBurn1"],["SolarFlare_B","FlareX2","SunBurn2"],
        ["GalacticAce_A","GalaxX1","StarAce1"],["GalacticAce_B","GalaxX2","StarAce2"],
        ["NebulaForce_A","NebulaX1","CloudBurst1"],["NebulaForce_B","NebulaX2","CloudBurst2"],
        ["AstroTeam_A","AstroX1","SpaceAce1"],["AstroTeam_B","AstroX2","SpaceAce2"],
        ["QuantumDuo_A","QuantumX1","QuantumY1"],["QuantumDuo_B","QuantumX2","QuantumY2"],
        ["NanoForce_A","NanoX1","MicroBlade1"],["NanoForce_B","NanoX2","MicroBlade2"],
      ];
      for (const [teamName, p1, p2] of teamData) {
        await db!.insert(teamsTable).values({ teamName, player1Name: p1, player1TrackerLink: "https://tracker.gg", player1TwitchName: p1, player1YouTubeName: "", player1InstagramName: "", player1DiscordName: p1+"#001", player1TikTokName: "", player2Name: p2, player2TrackerLink: "https://tracker.gg", player2TwitchName: p2, player2YouTubeName: "", player2InstagramName: "", player2DiscordName: p2+"#001", player2TikTokName: "", status: "verified", rejectionReason: null, selectedAt: null });
      }
      res.json({ success: true, message: "64 Teams eingefuegt!" });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      res.status(500).json({ error: message });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
