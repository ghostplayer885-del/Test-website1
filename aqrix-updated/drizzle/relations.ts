import { relations } from "drizzle-orm";
import { tournamentStatus, bracketMatches, teams } from "./schema";

export const bracketMatchesRelations = relations(bracketMatches, ({ one }) => ({
  team1: one(teams, {
    fields: [bracketMatches.team1Id],
    references: [teams.id],
  }),
  team2: one(teams, {
    fields: [bracketMatches.team2Id],
    references: [teams.id],
  }),
  winner: one(teams, {
    fields: [bracketMatches.winnerId],
    references: [teams.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  bracketMatches1: many(bracketMatches, { relationName: "team1" }),
  bracketMatches2: many(bracketMatches, { relationName: "team2" }),
  bracketMatchesWon: many(bracketMatches, { relationName: "winner" }),
}));
