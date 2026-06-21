import { drizzle } from "drizzle-orm/mysql2";
import { bracketMatches } from "../drizzle/schema";

export async function generateBracket64(db: any, verifiedTeamIds: number[]) {
  try {
    // Delete existing matches
    await db.delete(bracketMatches);

    if (verifiedTeamIds.length === 0) {
      return { success: true, matchCount: 0 };
    }

    // For 64-team bracket, take only first 64 teams
    const teams64 = verifiedTeamIds.slice(0, 64);
    const bracketSize = 64;
    const numRounds = 6; // log2(64) = 6

    // Seed teams (sort by ID for consistent seeding)
    const seededTeams = [...teams64].sort((a, b) => a - b);

    // Create all matches structure first
    const allMatches: any[] = [];
    const matchIdMap: { [key: string]: number } = {}; // Track match IDs by round and number

    // First pass: assign match IDs
    let matchId = 1;
    let matchesPerRound = 32; // Round 1 has 32 matches

    for (let round = 1; round <= numRounds; round++) {
      for (let i = 0; i < matchesPerRound; i++) {
        const key = `${round}-${i + 1}`;
        matchIdMap[key] = matchId;
        matchId++;
      }
      matchesPerRound = matchesPerRound / 2;
    }

    // Second pass: create Round 1 matches with teams
    const round1Matches = [];
    let teamIndex = 0;

    for (let i = 0; i < 32; i++) {
      const team1Id = teamIndex < seededTeams.length ? seededTeams[teamIndex] : null;
      teamIndex++;
      const team2Id = teamIndex < seededTeams.length ? seededTeams[teamIndex] : null;
      teamIndex++;

      // Calculate next match (Round 2)
      const nextMatchNumber = Math.floor(i / 2) + 1;
      const nextMatchPosition = (i % 2) + 1;
      const nextMatchKey = `2-${nextMatchNumber}`;
      const nextMatchId = matchIdMap[nextMatchKey];

      round1Matches.push({
        round: 1,
        matchNumber: i + 1,
        team1Id: team1Id as any,
        team2Id: team2Id as any,
        team1Score: 0,
        team2Score: 0,
        winnerId: null,
        nextMatchId: nextMatchId || null,
        nextMatchPosition: nextMatchPosition,
      });
    }

    allMatches.push(...round1Matches);

    // Third pass: create placeholder matches for subsequent rounds with bracket linking
    matchesPerRound = 32;
    for (let round = 2; round <= numRounds; round++) {
      matchesPerRound = matchesPerRound / 2;
      for (let i = 0; i < matchesPerRound; i++) {
        let nextMatchId = null;
        let nextMatchPosition = null;

        if (round < numRounds) {
          const nextMatchNumber = Math.floor(i / 2) + 1;
          nextMatchPosition = (i % 2) + 1;
          const nextMatchKey = `${round + 1}-${nextMatchNumber}`;
          nextMatchId = matchIdMap[nextMatchKey];
        }

        allMatches.push({
          round,
          matchNumber: i + 1,
          team1Id: null,
          team2Id: null,
          team1Score: 0,
          team2Score: 0,
          winnerId: null,
          nextMatchId: nextMatchId,
          nextMatchPosition: nextMatchPosition,
        });
      }
    }

    // Insert all matches
    if (allMatches.length > 0) {
      await db.insert(bracketMatches).values(allMatches);
    }

    console.log(
      `[Database] Generated 64-team bracket: ${teams64.length} teams, ${allMatches.length} total matches, ${numRounds} rounds`
    );
    return { success: true, matchCount: allMatches.length, rounds: numRounds, bracketSize, teamsUsed: teams64.length };
  } catch (error) {
    console.error("[Database] Failed to generate 64-team bracket:", error);
    throw error;
  }
}
