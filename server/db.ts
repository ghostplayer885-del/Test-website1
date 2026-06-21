import { eq, desc, count, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, teams, InsertTeam, tournamentStatus, bracketMatches } from "../drizzle/schema";
import { ENV } from './_core/env';
import type { MySql2Database } from "drizzle-orm/mysql2";
import type * as schema from "../drizzle/schema";

type DbInstance = MySql2Database<typeof schema>;
type TeamRecord = Awaited<ReturnType<typeof getAllTeams>>[number];

let _db: DbInstance | null = null;
let _migrationPromise: Promise<void> | null = null;

async function ensureTeamsSchema(db: DbInstance): Promise<void> {
  if (_migrationPromise) {
    return _migrationPromise;
  }

  _migrationPromise = (async () => {
    try {
      const columnsResult = await db.execute(sql`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'teams'
          AND COLUMN_NAME IN ('rejectionReason', 'selectedAt')
      `);

      const rows = Array.isArray((columnsResult as any)?.rows)
        ? (columnsResult as any).rows
        : Array.isArray(columnsResult)
          ? columnsResult
          : [];

      const existingColumns = new Set(
        rows
          .map((row: any) => row?.COLUMN_NAME ?? row?.column_name ?? Object.values(row ?? {})[0])
          .filter(Boolean),
      );

      if (!existingColumns.has("rejectionReason")) {
        await db.execute(sql.raw("ALTER TABLE teams ADD COLUMN rejectionReason VARCHAR(500) DEFAULT NULL"));
      }

      if (!existingColumns.has("selectedAt")) {
        await db.execute(sql.raw("ALTER TABLE teams ADD COLUMN selectedAt TIMESTAMP NULL DEFAULT NULL"));
      }

      await db.execute(
        sql.raw("ALTER TABLE teams MODIFY COLUMN status ENUM('pending','verified','rejected','wheel_selected') NOT NULL DEFAULT 'pending'"),
      );
    } catch (error) {
      console.warn("[Database] Teams schema auto-migration skipped:", error);
    }
  })();

  return _migrationPromise;
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb(): Promise<DbInstance | null> {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const mysql = await import("mysql2/promise");
      const dbUrl = new URL(process.env.DATABASE_URL);
      const pool = mysql.default.createPool({
        host: dbUrl.hostname,
        port: parseInt(dbUrl.port) || 3306,
        user: decodeURIComponent(dbUrl.username),
        password: decodeURIComponent(dbUrl.password),
        database: dbUrl.pathname.replace(/^\//, ""),
        waitForConnections: true,
        connectionLimit: 10,
        enableKeepAlive: true,
        keepAliveInitialDelay: 0,
        connectTimeout: 30000,
      });
      _db = drizzle(pool);
      await ensureTeamsSchema(_db);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Team queries
// In-memory store for tests ONLY
const teamsStore: any[] = [];
let nextTeamId = 1;

export async function getAllTeams() {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      return [...teamsStore].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return [];
  }

  try {
    const result = await db.select().from(teams).orderBy(desc(teams.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get teams:", error);
    return [];
  }
}

export async function getVerifiedTeams() {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      return teamsStore
        .filter(t => t.status === "verified" || t.status === "wheel_selected")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return [];
  }

  try {
    const result = await db.select().from(teams).orderBy(desc(teams.createdAt));
    return result.filter((team: TeamRecord) => team.status === "verified" || team.status === "wheel_selected");
  } catch (error) {
    console.error("[Database] Failed to get verified teams:", error);
    return [];
  }
}

export async function getWheelSelectedTeams() {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      return teamsStore
        .filter(t => t.status === "wheel_selected")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return [];
  }

  try {
    const result = await db.select().from(teams).where(eq(teams.status, "wheel_selected")).orderBy(desc(teams.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get wheel selected teams:", error);
    return [];
  }
}

export async function getWheelEligibleTeams() {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      return teamsStore
        .filter(t => t.status === "verified")
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    return [];
  }

  try {
    const result = await db.select().from(teams).where(eq(teams.status, "verified")).orderBy(desc(teams.createdAt));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get wheel eligible teams:", error);
    return [];
  }
}

export async function createTeam(team: InsertTeam) {
  const teamValues: InsertTeam = {
    ...team,
    rejectionReason: team.rejectionReason ?? null,
    selectedAt: team.selectedAt ?? null,
  };

  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      const newTeam = { ...teamValues, id: nextTeamId++, createdAt: new Date(), updatedAt: new Date() };
      teamsStore.push(newTeam);
      return [{ insertId: newTeam.id }];
    }
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(teams).values(teamValues);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create team:", error);
    throw error;
  }
}

export async function getTeamById(id: number) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      return teamsStore.find(t => t.id === id) || null;
    }
    throw new Error("Database not available");
  }

  try {
    const result = await db.select().from(teams).where(eq(teams.id, id)).limit(1);
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error("[Database] Failed to get team:", error);
    return null;
  }
}

export async function updateTeamStatus(
  id: number,
  status: "pending" | "verified" | "rejected" | "wheel_selected",
  rejectionReason?: string | null,
) {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      const team = teamsStore.find(t => t.id === id);
      if (team) {
        team.status = status;
        team.rejectionReason = rejectionReason ?? null;
        team.selectedAt = status === "wheel_selected" ? new Date() : null;
        team.updatedAt = new Date();
      }
      return team || null;
    }
    throw new Error("Database not available");
  }

  try {
    await db.update(teams).set({
      status,
      rejectionReason: rejectionReason ?? null,
      selectedAt: status === "wheel_selected" ? new Date() : null,
    }).where(eq(teams.id, id));
    return await getTeamById(id);
  } catch (error) {
    console.error("[Database] Failed to update team status:", error);
    throw error;
  }
}

export async function markTeamWheelSelected(teamId: number) {
  return await updateTeamStatus(teamId, "wheel_selected");
}

export async function banTeamFromWheel(teamId: number) {
  return await updateTeamStatus(teamId, "rejected", "Banned by Aqrix from the Wheel");
}

export async function getTotalRegisteredTeams() {
  const db = await getDb();
  if (!db) {
    if (process.env.NODE_ENV === "test") {
      return teamsStore.length;
    }
    return 0;
  }

  try {
    const result = await db.select({ value: count() }).from(teams);
    return result[0]?.value ?? 0;
  } catch (error) {
    console.error("[Database] Failed to count registered teams:", error);
    return 0;
  }
}


// Bracket generation
export async function generateBracketMatches(verifiedTeamIds: number[]) {
  // Use new 64-team bracket generation
  return generateBracket64(verifiedTeamIds);
}

export async function generateBracket64(verifiedTeamIds: number[]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Delete existing matches
    await db.delete(bracketMatches);

    if (verifiedTeamIds.length === 0) {
      return { success: true, matchCount: 0 };
    }

    // Calculate bracket size (next power of 2)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(verifiedTeamIds.length)));
    const numRounds = Math.log2(bracketSize);
    const byesNeeded = bracketSize - verifiedTeamIds.length;

    // Seed teams (sort by ID for consistent seeding)
    const seededTeams = [...verifiedTeamIds].sort((a, b) => a - b);

    // Create Round 1 matches with bye handling
    const round1Matches = [];
    let teamIndex = 0;

    for (let i = 0; i < bracketSize / 2; i++) {
      const team1Id = teamIndex < seededTeams.length ? seededTeams[teamIndex] : null;
      teamIndex++;
      const team2Id = teamIndex < seededTeams.length ? seededTeams[teamIndex] : null;
      teamIndex++;

      round1Matches.push({
        bracket: "left" as const,
        round: 1,
        matchNumber: i + 1,
        team1Id: team1Id as any,
        team2Id: team2Id as any,
        team1Score: null,
        team2Score: null,
        winnerId: null,
      });
    }

    // Create placeholder matches for subsequent rounds
    let allMatches = [...round1Matches];
    let matchesPerRound = bracketSize / 2;

    for (let round = 2; round <= numRounds; round++) {
      matchesPerRound = matchesPerRound / 2;
      for (let i = 0; i < matchesPerRound; i++) {
        allMatches.push({
          bracket: "left" as const,
          round,
          matchNumber: i + 1,
          team1Id: undefined as any,
          team2Id: undefined as any,
          team1Score: null,
          team2Score: null,
          winnerId: null,
        });
      }
    }

    // Insert all matches
    if (allMatches.length > 0) {
      await db.insert(bracketMatches).values(allMatches);
    }

    console.log(`[Database] Generated bracket: ${verifiedTeamIds.length} teams, ${bracketSize} bracket size, ${numRounds} rounds, ${byesNeeded} byes`);
    return { success: true, matchCount: allMatches.length, rounds: numRounds, bracketSize, byesNeeded };
  } catch (error) {
    console.error("[Database] Failed to generate bracket:", error);
    throw error;
  }
}

export async function getBracketWithTeamNames() {
  const db = await getDb();
  if (!db) {
    return { rounds: [] };
  }

  try {
    const matches = await db.select().from(bracketMatches).orderBy(bracketMatches.round, bracketMatches.matchNumber);
    
    // Group by bracket + round (not just round)
    const roundsMap = new Map<string, any[]>();
    for (const match of matches) {
      const key = `${match.bracket}-${match.round}`;
      if (!roundsMap.has(key)) {
        roundsMap.set(key, []);
      }
      roundsMap.get(key)!.push(match);
    }

    // Get all team names
    const allTeams = await getAllTeams();
    const teamMap = new Map(allTeams.map((t: TeamRecord) => [t.id, t.teamName]));

    // Build rounds with team names
    const rounds = Array.from(roundsMap.entries())
      .sort((a, b) => {
        // Sort by bracket order (left, right, finals) then by round number
        const [keyA] = a;
        const [keyB] = b;
        const bracketOrder = { 'left': 0, 'right': 1, 'finals': 2 };
        const [bracketA, roundA] = keyA.split('-');
        const [bracketB, roundB] = keyB.split('-');
        const bracketOrderA = bracketOrder[bracketA as keyof typeof bracketOrder] || 0;
        const bracketOrderB = bracketOrder[bracketB as keyof typeof bracketOrder] || 0;
        if (bracketOrderA !== bracketOrderB) return bracketOrderA - bracketOrderB;
        return parseInt(roundA) - parseInt(roundB);
      })
      .map(([key, roundMatches]) => {
        const roundNames: Record<string, string> = {
          'left-1': 'Round 1 - Left Bracket (16 Matches)',
          'left-2': 'Round 2 - Left Bracket (8 Matches)',
          'left-3': 'Round 3 - Left Bracket (4 Matches)',
          'left-4': 'Round 4 - Left Bracket (2 Matches)',
          'left-5': 'Semifinals - Left Bracket (1 Match)',
          'right-1': 'Round 1 - Right Bracket (16 Matches)',
          'right-2': 'Round 2 - Right Bracket (8 Matches)',
          'right-3': 'Round 3 - Right Bracket (4 Matches)',
          'right-4': 'Round 4 - Right Bracket (2 Matches)',
          'right-5': 'Semifinals - Right Bracket (1 Match)',
          'finals-1': 'Grand Finals (1 Match)',
        };
        const name = roundNames[key] || `Round ${key}`
        return {
          name,
          matches: roundMatches.map(m => ({
            id: m.id,
            bracket: m.bracket,
            round: m.round,
            matchNumber: m.matchNumber,
            team1: m.team1Id ? teamMap.get(m.team1Id) || "TBD" : "TBD",
            team2: m.team2Id ? teamMap.get(m.team2Id) || "TBD" : "TBD",
            team1Id: m.team1Id,
            team2Id: m.team2Id,
            team1Score: m.team1Score,
            team2Score: m.team2Score,
            winnerId: m.winnerId,
          })),
        };
      });

    // Flatten all matches into a single array
    const allMatches = rounds.flatMap(r => r.matches);
    return { rounds, matches: allMatches };
  } catch (error) {
    console.error("[Database] Failed to get bracket:", error);
    return { rounds: [], matches: [] };
  }
}

export async function updateMatchResult(matchId: number, team1Score: number, team2Score: number, winnerId: number) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    await db.update(bracketMatches)
      .set({ team1Score, team2Score, winnerId })
      .where(eq(bracketMatches.id, matchId));
    return { success: true };
  } catch (error) {
    console.error("[Database] Failed to update match:", error);
    throw error;
  }
}
