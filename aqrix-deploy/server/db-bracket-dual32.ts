import { getDb } from "./db";
import { bracketMatches } from "../drizzle/schema";

/**
 * Generate dual 32-team single elimination brackets
 * Left bracket: 32 teams (32→16→8→4→2→1)
 * Right bracket: 32 teams (32→16→8→4→2→1)
 * Grand Finals: Winner from left vs Winner from right
 */
export async function generateDual32Bracket(verifiedTeamIds: number[]) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    // Delete existing matches
    await db.delete(bracketMatches);

    if (verifiedTeamIds.length < 64) {
      throw new Error(`Need exactly 64 teams, got ${verifiedTeamIds.length}`);
    }

    // Split teams into left and right brackets
    const leftTeams = verifiedTeamIds.slice(0, 32).sort((a, b) => a - b);
    const rightTeams = verifiedTeamIds.slice(32, 64).sort((a, b) => a - b);

    const allMatches: any[] = [];
    let matchIdCounter = 1;
    const matchIdMap = new Map<string, number>(); // key: "bracket-round-matchNumber" -> id

    // Generate LEFT BRACKET (32 teams, 5 rounds)
    const leftMatches = generateSingleEliminationBracket(leftTeams, "left");
    allMatches.push(...leftMatches);
    
    // Map left bracket match IDs for nextMatchId references
    for (const match of leftMatches) {
      const key = `left-${match.round}-${match.matchNumber}`;
      matchIdMap.set(key, matchIdCounter);
      matchIdCounter++;
    }

    // Generate RIGHT BRACKET (32 teams, 5 rounds)
    const rightMatches = generateSingleEliminationBracket(rightTeams, "right");
    allMatches.push(...rightMatches);
    
    // Map right bracket match IDs
    for (const match of rightMatches) {
      const key = `right-${match.round}-${match.matchNumber}`;
      matchIdMap.set(key, matchIdCounter);
      matchIdCounter++;
    }

    // Generate GRAND FINALS (1 match)
    const grandFinal = {
      bracket: "finals",
      round: 1,
      matchNumber: 1,
      team1Id: null,
      team2Id: null,
      team1Score: null,
      team2Score: null,
      winnerId: null,
      nextMatchId: null,
      nextMatchPosition: null,
    };
    allMatches.push(grandFinal);
    const grandFinalId = matchIdCounter;

    // Update nextMatchId references for left bracket
    for (let i = 0; i < leftMatches.length; i++) {
      const match = leftMatches[i];
      if (match.round < 5) {
        // Point to next round in same bracket
        const nextRound = match.round + 1;
        const nextMatchNumber = Math.ceil(match.matchNumber / 2);
        const key = `left-${nextRound}-${nextMatchNumber}`;
        allMatches[i].nextMatchId = matchIdMap.get(key);
        allMatches[i].nextMatchPosition = match.matchNumber % 2 === 1 ? 1 : 2;
      } else if (match.round === 5) {
        // Point to grand finals
        allMatches[i].nextMatchId = grandFinalId;
        allMatches[i].nextMatchPosition = 1;
      }
    }

    // Update nextMatchId references for right bracket
    const rightStartIndex = leftMatches.length;
    for (let i = 0; i < rightMatches.length; i++) {
      const match = rightMatches[i];
      if (match.round < 5) {
        // Point to next round in same bracket
        const nextRound = match.round + 1;
        const nextMatchNumber = Math.ceil(match.matchNumber / 2);
        const key = `right-${nextRound}-${nextMatchNumber}`;
        allMatches[rightStartIndex + i].nextMatchId = matchIdMap.get(key);
        allMatches[rightStartIndex + i].nextMatchPosition = match.matchNumber % 2 === 1 ? 1 : 2;
      } else if (match.round === 5) {
        // Point to grand finals
        allMatches[rightStartIndex + i].nextMatchId = grandFinalId;
        allMatches[rightStartIndex + i].nextMatchPosition = 2;
      }
    }

    // Insert all matches
    if (allMatches.length > 0) {
      await db.insert(bracketMatches).values(allMatches);
    }

    console.log(`[Database] Generated dual 32-team bracket: ${verifiedTeamIds.length} teams, ${allMatches.length} total matches`);
    return { success: true, matchCount: allMatches.length };
  } catch (error) {
    console.error("[Database] Failed to generate dual 32 bracket:", error);
    throw error;
  }
}

/**
 * Generate a single 32-team single elimination bracket
 * Returns 32→16→8→4→2→1 = 63 matches total
 */
function generateSingleEliminationBracket(teamIds: number[], bracket: "left" | "right") {
  const matches: any[] = [];

  // Round 1: 32 teams → 16 matches
  for (let i = 0; i < 16; i++) {
    matches.push({
      bracket,
      round: 1,
      matchNumber: i + 1,
      team1Id: teamIds[i * 2],
      team2Id: teamIds[i * 2 + 1],
      team1Score: null,
      team2Score: null,
      winnerId: null,
      nextMatchId: null,
      nextMatchPosition: null,
    });
  }

  // Round 2: 16 teams → 8 matches
  for (let i = 0; i < 8; i++) {
    matches.push({
      bracket,
      round: 2,
      matchNumber: i + 1,
      team1Id: null,
      team2Id: null,
      team1Score: null,
      team2Score: null,
      winnerId: null,
      nextMatchId: null,
      nextMatchPosition: null,
    });
  }

  // Round 3: 8 teams → 4 matches
  for (let i = 0; i < 4; i++) {
    matches.push({
      bracket,
      round: 3,
      matchNumber: i + 1,
      team1Id: null,
      team2Id: null,
      team1Score: null,
      team2Score: null,
      winnerId: null,
      nextMatchId: null,
      nextMatchPosition: null,
    });
  }

  // Round 4: 4 teams → 2 matches
  for (let i = 0; i < 2; i++) {
    matches.push({
      bracket,
      round: 4,
      matchNumber: i + 1,
      team1Id: null,
      team2Id: null,
      team1Score: null,
      team2Score: null,
      winnerId: null,
      nextMatchId: null,
      nextMatchPosition: null,
    });
  }

  // Round 5: 2 teams → 1 match (Finals of this bracket)
  matches.push({
    bracket,
    round: 5,
    matchNumber: 1,
    team1Id: null,
    team2Id: null,
    team1Score: null,
    team2Score: null,
    winnerId: null,
    nextMatchId: null,
    nextMatchPosition: null,
  });

  return matches;
}
