import { useState } from "react";
import { Brackets, Trophy, Clock, Users, Edit2, Zap } from "lucide-react";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function Bracket() {
  const { data: allTeams } = trpc.teams.list.useQuery();
  const { data: bracketData, refetch: refetchBracket } = trpc.tournament.getBracket.useQuery(undefined, {
    refetchInterval: 2000,
  });
  const { data: tournamentStatus } = trpc.tournament.getStatus.useQuery();

  const registeredCount = allTeams?.length || 0;
  const maxTeams = 64;

  return (
    <Layout>
      {/* Bracket Header */}
      <section className="relative py-20 border-b-2 border-border bg-card/10 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary/40 bg-primary/10 text-primary font-mono text-xs uppercase tracking-widest mb-6">
              <Brackets className="h-4 w-4" />
              Live Tournament Bracket
            </div>

            <h1 className="font-mono text-5xl md:text-6xl font-black uppercase tracking-tight text-foreground mb-4">
              Tournament <span className="text-primary">Bracket</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Track the progress of the Aqrix 2v2 Community Cup. See match results, upcoming pairings, and follow your favorite teams to the finals. Updates refresh automatically every 2 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-b-2 border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border-2 border-border bg-card p-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Current Status</p>
                <p className="font-mono text-2xl font-black text-primary">
                  {tournamentStatus?.status === "live" ? "🔴 LIVE" : "⏳ Registration"}
                </p>
              </div>
            </div>

            <div className="border-2 border-border bg-card p-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/0 via-secondary/5 to-secondary/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Teams Registered</p>
                <p className="font-mono text-2xl font-black text-secondary">{registeredCount} / {maxTeams}</p>
              </div>
            </div>

            <div className="border-2 border-border bg-card p-6 relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent/0 via-accent/5 to-accent/0 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Prize Pool</p>
                <p className="font-mono text-2xl font-black text-accent">160€ Total</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Bracket Section */}
      <section className="py-16 border-b-2 border-border bg-background">
        <div className="container mx-auto px-4">
          {!bracketData?.rounds || bracketData.rounds.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="font-mono text-2xl font-black text-foreground mb-2">Bracket Being Prepared</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                The tournament bracket will be generated and displayed here once the registration phase is complete and the teams are finalized.
              </p>
            </div>
          ) : (
            <div>
              <h2 className="font-mono text-2xl font-black uppercase tracking-tight text-primary mb-8">Single Elimination Bracket</h2>
              <BracketVisualizer bracketData={bracketData} />
            </div>
          )}
        </div>
      </section>

      {/* Live Updates Info */}
      <section className="py-12 border-b-2 border-border">
        <div className="container mx-auto px-4">
          <div className="border-2 border-primary/40 bg-primary/5 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-mono text-lg font-black text-primary mb-2">Live Updates</h3>
                <p className="text-sm text-muted-foreground">
                  The bracket is updated in real-time as match results are reported. During the tournament, make sure to follow the live stream on Twitch for commentary and live drawings. This page automatically refreshes every 2 seconds to show the latest results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

interface BracketVisualizerProps {
  bracketData: any;
}

function BracketVisualizer({ bracketData }: BracketVisualizerProps) {
  const rounds = bracketData.rounds || [];

  if (rounds.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No matches available yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="inline-flex gap-12 min-w-full px-4">
        {rounds.map((round: any, roundIndex: number) => (
          <div key={roundIndex} className="flex flex-col gap-4 min-w-max">
            {/* Round Title */}
            <div className="mb-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-bold">
                {round.name}
              </p>
            </div>

            {/* Matches */}
            <div className="flex flex-col gap-8">
              {round.matches?.map((match: any, matchIndex: number) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>

            {/* Connection Lines to Next Round */}
            {roundIndex < rounds.length - 1 && (
              <svg
                className="absolute w-12 h-full pointer-events-none"
                style={{
                  left: "calc(100% + 24px)",
                  top: 0,
                }}
              >
                <defs>
                  <style>{`
                    .bracket-line {
                      stroke: rgb(var(--color-border) / 0.3);
                      stroke-width: 2;
                      fill: none;
                    }
                  `}</style>
                </defs>
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface MatchCardProps {
  match: any;
}

function MatchCard({ match }: MatchCardProps) {
  const hasResult = match.winnerId !== null && match.winnerId !== 0;
  const isComplete = match.team1Score !== null && match.team2Score !== null;

  return (
    <div
      className={`border-2 rounded-lg p-4 w-64 transition-all ${
        hasResult
          ? "border-primary bg-primary/5 shadow-lg shadow-primary/20"
          : isComplete
          ? "border-secondary bg-secondary/5"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      {/* Team 1 */}
      <div className="mb-3 pb-3 border-b border-border/50">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-mono text-sm font-bold truncate ${
            match.winnerId === match.team1Id ? "text-primary" : "text-foreground"
          }`}>
            {match.team1 || "TBD"}
          </span>
          <span className="font-mono text-sm font-black text-primary min-w-fit">
            {match.team1Score ?? "-"}
          </span>
        </div>
      </div>

      {/* Team 2 */}
      <div className="mb-3">
        <div className="flex items-center justify-between gap-2">
          <span className={`font-mono text-sm font-bold truncate ${
            match.winnerId === match.team2Id ? "text-primary" : "text-foreground"
          }`}>
            {match.team2 || "TBD"}
          </span>
          <span className="font-mono text-sm font-black text-primary min-w-fit">
            {match.team2Score ?? "-"}
          </span>
        </div>
      </div>

      {/* Winner Badge */}
      {hasResult && (
        <div className="mt-3 pt-3 border-t border-primary/30">
          <p className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
            ✓ Winner: {match.winnerId === match.team1Id ? match.team1 : match.team2}
          </p>
        </div>
      )}

      {/* Match ID for debugging */}
      <div className="mt-2 text-[10px] text-muted-foreground font-mono">
        Match #{match.id}
      </div>
    </div>
  );
}
