import { useState } from "react";
import { Brackets, Trophy, Zap, ChevronRight } from "lucide-react";
import Layout from "@/components/Layout";
import { trpc } from "@/lib/trpc";

export default function Bracket() {
  const { data: allTeams } = trpc.teams.list.useQuery();
  const { data: bracketData } = trpc.tournament.getBracket.useQuery(undefined, {
    refetchInterval: 3000,
  });
  const { data: tournamentStatus } = trpc.tournament.getStatus.useQuery();

  const registeredCount = allTeams?.length || 0;
  const maxTeams = 64;
  const matches = bracketData?.matches || [];

  return (
    <Layout>
      {/* Header */}
      <section className="relative py-20 border-b-2 border-border bg-card/10 overflow-hidden">
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
              Track the progress of the Aqrix 2v2 Community Cup. Results refresh every 3 seconds.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b-2 border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              label="Status"
              value={tournamentStatus?.status === "live" ? "🔴 LIVE" : "⏳ Registration"}
              color="primary"
            />
            <StatCard
              label="Teams"
              value={`${registeredCount} / ${maxTeams}`}
              color="secondary"
            />
            <StatCard
              label="Prize Pool"
              value="160€ Total"
              color="accent"
            />
          </div>
        </div>
      </section>

      {/* Bracket */}
      <section className="py-16 border-b-2 border-border bg-background">
        <div className="container mx-auto px-4">
          {matches.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="font-mono text-2xl font-black text-foreground mb-2">Bracket Being Prepared</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                The bracket will appear here once registration is complete.
              </p>
            </div>
          ) : (
            <PublicBracketView matches={matches} />
          )}
        </div>
      </section>

      {/* Live info */}
      <section className="py-12 border-b-2 border-border">
        <div className="container mx-auto px-4">
          <div className="border-2 border-primary/40 bg-primary/5 p-6 rounded-lg">
            <div className="flex items-start gap-3">
              <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-mono text-lg font-black text-primary mb-2">Live Updates</h3>
                <p className="text-sm text-muted-foreground">
                  The bracket refreshes every 3 seconds automatically. Follow the livestream on Twitch for commentary and live draws.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="border-2 border-border bg-card p-6 relative group">
      <div className={`absolute inset-0 bg-gradient-to-r from-${color}/0 via-${color}/5 to-${color}/0 opacity-0 group-hover:opacity-100 transition-opacity`} />
      <div className="relative">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
        <p className={`font-mono text-2xl font-black text-${color}`}>{value}</p>
      </div>
    </div>
  );
}

// ─── Public read-only bracket ────────────────────────────────────────────────

const MATCH_WIDTH = 160;
const MATCH_HEIGHT = 64;
const ROUND_SPACING = 230;
const PAIR_HEIGHT = 220;

interface Match {
  id: number;
  bracket: string;
  round: number;
  matchNumber: number;
  team1: string;
  team2: string;
  team1Id: number | null;
  team2Id: number | null;
  team1Score: number;
  team2Score: number;
  winnerId: number | null;
}

function PublicBracketView({ matches }: { matches: Match[] }) {
  const grouped: Record<string, Record<number, Match[]>> = {};
  matches.forEach((m) => {
    if (!grouped[m.bracket]) grouped[m.bracket] = {};
    if (!grouped[m.bracket][m.round]) grouped[m.bracket][m.round] = [];
    grouped[m.bracket][m.round].push(m);
  });

  const maxLeft = Math.max(...Object.values(grouped["left"] || {}).map((ms) => ms.length), 1);
  const pairs = Math.ceil(maxLeft / 2);
  const svgHeight = pairs * PAIR_HEIGHT + 120;

  const renderMatch = (m: Match, x: number, y: number) => {
    const t1wins = m.winnerId !== null && m.winnerId === m.team1Id;
    const t2wins = m.winnerId !== null && m.winnerId === m.team2Id;
    const done = m.winnerId !== null;

    return (
      <g key={`match-${m.id}`}>
        {/* Card */}
        <rect x={x} y={y} width={MATCH_WIDTH} height={MATCH_HEIGHT} fill="#1a1a2e" stroke={done ? "#a855f7" : "#3b355a"} strokeWidth={done ? 2 : 1} rx="4" />

        {/* Team 1 row */}
        <rect x={x} y={y} width={MATCH_WIDTH} height={MATCH_HEIGHT / 2} fill={t1wins ? "rgba(168,85,247,0.15)" : "transparent"} rx="4" />
        <text x={x + 8} y={y + 21} fontSize="11" fill={t1wins ? "#c084fc" : t2wins ? "#6b7280" : "#e9d5ff"} fontWeight={t1wins ? "bold" : "normal"} fontFamily="monospace">
          {truncate(m.team1 || "TBD", 16)}
        </text>
        {done && (
          <text x={x + MATCH_WIDTH - 8} y={y + 21} fontSize="10" fill={t1wins ? "#22c55e" : "#ef4444"} fontWeight="bold" textAnchor="end" fontFamily="monospace">
            {t1wins ? "WIN" : "LOSS"}
          </text>
        )}
        {!done && m.team1Score > 0 && (
          <text x={x + MATCH_WIDTH - 8} y={y + 21} fontSize="10" fill="#a855f7" textAnchor="end" fontFamily="monospace">{m.team1Score}</text>
        )}

        {/* Divider */}
        <line x1={x + 6} y1={y + MATCH_HEIGHT / 2} x2={x + MATCH_WIDTH - 6} y2={y + MATCH_HEIGHT / 2} stroke="#3b355a" strokeWidth="1" />

        {/* Team 2 row */}
        <rect x={x} y={y + MATCH_HEIGHT / 2} width={MATCH_WIDTH} height={MATCH_HEIGHT / 2} fill={t2wins ? "rgba(168,85,247,0.15)" : "transparent"} rx="4" />
        <text x={x + 8} y={y + 53} fontSize="11" fill={t2wins ? "#c084fc" : t1wins ? "#6b7280" : "#e9d5ff"} fontWeight={t2wins ? "bold" : "normal"} fontFamily="monospace">
          {truncate(m.team2 || "TBD", 16)}
        </text>
        {done && (
          <text x={x + MATCH_WIDTH - 8} y={y + 53} fontSize="10" fill={t2wins ? "#22c55e" : "#ef4444"} fontWeight="bold" textAnchor="end" fontFamily="monospace">
            {t2wins ? "WIN" : "LOSS"}
          </text>
        )}
        {!done && m.team2Score > 0 && (
          <text x={x + MATCH_WIDTH - 8} y={y + 53} fontSize="10" fill="#a855f7" textAnchor="end" fontFamily="monospace">{m.team2Score}</text>
        )}
      </g>
    );
  };

  const renderColumn = (bracket: string, startX: number, reverse = false) => {
    const els: React.ReactNode[] = [];
    const bm = grouped[bracket];
    if (!bm) return els;

    const rounds = Object.keys(bm).map(Number).sort((a, b) => a - b);
    let xOff = startX;

    rounds.forEach((round, ri) => {
      const roundMatches = bm[round].sort((a, b) => a.matchNumber - b.matchNumber);
      let pairIdx = 0;

      for (let i = 0; i < roundMatches.length; i += 2) {
        const m1 = roundMatches[i];
        const m2 = roundMatches[i + 1];
        const pairY = 50 + pairIdx * PAIR_HEIGHT;

        if (m1) els.push(renderMatch(m1, xOff, pairY));
        if (m2) els.push(renderMatch(m2, xOff, pairY + MATCH_HEIGHT + 40));

        // Connector lines
        if (ri < rounds.length - 1 && m1 && m2) {
          const m1CY = pairY + MATCH_HEIGHT / 2;
          const m2CY = pairY + MATCH_HEIGHT + 40 + MATCH_HEIGHT / 2;
          const midX = reverse ? xOff - (ROUND_SPACING - MATCH_WIDTH) / 2 : xOff + MATCH_WIDTH + (ROUND_SPACING - MATCH_WIDTH) / 2;
          const startLineX = reverse ? xOff : xOff + MATCH_WIDTH;
          const midY = (m1CY + m2CY) / 2;
          els.push(
            <g key={`conn-${bracket}-${round}-${pairIdx}`}>
              <line x1={startLineX} y1={m1CY} x2={midX} y2={m1CY} stroke="#3b355a" strokeWidth="1" />
              <line x1={startLineX} y1={m2CY} x2={midX} y2={m2CY} stroke="#3b355a" strokeWidth="1" />
              <line x1={midX} y1={m1CY} x2={midX} y2={m2CY} stroke="#3b355a" strokeWidth="1" />
            </g>
          );
        }

        pairIdx++;
      }

      xOff += reverse ? -ROUND_SPACING : ROUND_SPACING;
    });

    return els;
  };

  return (
    <div className="w-full overflow-auto bg-[#0d0d1a] rounded-xl border-2 border-border p-4">
      <div className="mb-4 flex gap-6 items-center px-2">
        <span className="font-mono text-xs uppercase tracking-widest text-primary flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-primary/30 border border-primary inline-block" /> Aktuell spielend
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-green-400 flex items-center gap-2">
          <span className="font-mono text-xs">WIN</span> Gewonnen
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-red-400 flex items-center gap-2">
          <span className="font-mono text-xs">LOSS</span> Ausgeschieden
        </span>
      </div>
      <svg width={2850} height={svgHeight} className="min-w-max">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Left bracket label */}
        <text x={40} y={30} fontSize="12" fill="#a78bfa" fontWeight="bold" fontFamily="monospace" letterSpacing="2">LEFT BRACKET (32)</text>
        {renderColumn("left", 40)}

        {/* Finals label */}
        <text x={1160} y={30} fontSize="13" fill="#fbbf24" fontWeight="bold" fontFamily="monospace" letterSpacing="2">⚡ FINALS</text>
        {renderColumn("finals", 1140)}

        {/* Right bracket label */}
        <text x={2390} y={30} fontSize="12" fill="#a78bfa" fontWeight="bold" fontFamily="monospace" letterSpacing="2">RIGHT BRACKET (32)</text>
        {renderColumn("right", 2270, true)}
      </svg>
    </div>
  );
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}
