import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import Loader from "@/components/Loader";
import { Trophy, Zap, Brackets, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import type { AppRouter } from "../../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type BracketResponse = RouterOutputs["bracket"]["get"];
type BracketDataMatch = NonNullable<BracketResponse["matches"]>[number];

export default function Bracket() {
  const { data: allTeams, isLoading: isTeamsLoading } = trpc.teams.list.useQuery();
  const { data: bracketData, isLoading: isBracketLoading } = trpc.bracket.get.useQuery(undefined, { refetchInterval: 3000 });
  const { data: tournamentStatus, isLoading: isTournamentStatusLoading } = trpc.tournament.getStatus.useQuery();
  const [bracketFullSize, setBracketFullSize] = useState(false);
  const isPageLoading = isTeamsLoading || isBracketLoading || isTournamentStatusLoading;

  const registeredCount = allTeams?.length || 0;
  const matches: Match[] = (bracketData?.matches || []).map((match: BracketDataMatch) => ({
    id: match.id,
    bracket: match.bracket,
    round: match.round,
    matchNumber: match.matchNumber,
    team1: match.team1 || "TBD",
    team2: match.team2 || "TBD",
    team1Id: match.team1Id,
    team2Id: match.team2Id,
    team1Score: match.team1Score,
    team2Score: match.team2Score,
    winnerId: match.winnerId,
  }));
  const capacityPercentage = Math.min((registeredCount / 64) * 100, 100);

  if (isPageLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader fullScreen />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative overflow-hidden bg-transparent py-28 md:py-32">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_26%)]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-4 py-2 text-xs uppercase tracking-[0.22em] text-primary">
            <Brackets className="h-4 w-4" /> Live Tournament Bracket
          </div>
          <h1 className="mb-3 font-heading text-4xl font-black uppercase tracking-[0.2em] text-foreground md:text-5xl">
            Tournament <span className="text-primary">Bracket</span>
          </h1>
          <p className="text-muted-foreground">Track the Aqrix 2v2 Community Cup · Auto-refreshes every 3s</p>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            <div className="interactive-surface rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 p-6 card-glow">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary">Status</p>
                  <div className="mt-3 flex items-center gap-3">
                    <span
                      className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background: tournamentStatus?.status === "live" ? "#ff3366" : "#8800ff",
                        boxShadow: tournamentStatus?.status === "live" ? "0 0 8px #ff3366" : "0 0 8px #8800ff",
                      }}
                    />
                    <p className="text-2xl font-black uppercase text-white md:text-3xl">
                      {tournamentStatus?.status === "live" ? "Live" : "Registration"}
                    </p>
                  </div>
                </div>
                <span className="inline-flex rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">
                  {tournamentStatus?.status === "live" ? "LIVE" : "OPEN"}
                </span>
              </div>
              <p className="text-sm uppercase tracking-[0.18em] text-white/55">
                {tournamentStatus?.status === "live" ? "Bracket is active now" : "Open for signups"}
              </p>
            </div>

            <div className="interactive-surface rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 p-6 card-glow">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary">Teams</p>
                  <p className="mt-3 text-2xl font-black uppercase text-white md:text-3xl">{registeredCount}/64</p>
                </div>
                <span className="inline-flex rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">
                  {Math.max(64 - registeredCount, 0)} LEFT
                </span>
              </div>
              <p className="text-sm uppercase tracking-[0.18em] text-white/55">{Math.round(capacityPercentage)}% full</p>
              <div className="mt-4 h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${capacityPercentage}%`, backgroundColor: "#a855f7" }}
                />
              </div>
            </div>

            <div className="interactive-surface rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 p-6 card-glow">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-primary">Prize Pool</p>
                  <p className="mt-3 text-2xl font-black uppercase text-white md:text-3xl">160 euro</p>
                </div>
                <span className="inline-flex rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">TOTAL</span>
              </div>
              <p className="text-sm uppercase tracking-[0.18em] text-white/55">Cash prizes for top 3</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-transparent py-16 md:py-20">
        <div className="container mx-auto px-4">
          {matches.length === 0 ? (
            <div className="text-center py-20">
              <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h2 className="font-heading text-2xl font-black text-foreground mb-2">Bracket Being Prepared</h2>
              <p className="text-muted-foreground">The bracket will appear here once registration is complete.</p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="interactive-surface card-glow flex flex-col gap-3 rounded-[28px] border border-primary/25 bg-gradient-to-r from-primary/12 via-black/20 to-primary/8 p-5 md:flex-row md:items-center md:justify-between md:p-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-primary">Bracket Display</p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Toggle bracket display mode to switch between full-size and fitted bracket views.
                  </p>
                </div>
                <button
                  onClick={() => setBracketFullSize(!bracketFullSize)}
                  className="interactive-surface inline-flex items-center justify-center gap-2 self-start rounded-full border border-primary/40 bg-primary/15 px-5 py-3 text-xs uppercase tracking-[0.18em] text-primary shadow-[0_0_20px_rgba(168,85,247,0.18)] transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground md:self-center"
                >
                  {bracketFullSize ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
                  {bracketFullSize ? "Fit to Page" : "View Full Size"}
                </button>
              </div>
              <PublicBracketView matches={matches} fullSize={bracketFullSize} />
            </div>
          )}
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="card-glow flex items-start gap-3 rounded-[28px] bg-black/20 p-6 shadow-[0_0_24px_rgba(168,85,247,0.08)] md:p-7">
            <Zap className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              <span className="text-primary font-bold">Live Updates —</span> The bracket refreshes every 3 seconds. Follow the Twitch livestream for commentary.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}

interface Match {
  id: number; bracket: string; round: number; matchNumber: number;
  team1: string; team2: string;
  team1Id: number | null; team2Id: number | null;
  team1Score: number; team2Score: number; winnerId: number | null;
}

const MW = 148;
const TEAM_H = 24;
const VS_H = 14;
const MH = TEAM_H * 2 + VS_H;
const R1_GAP = 12;
const COL_GAP = 52;
const FM_W = 178;
const SIDE_GAP = 80;
const WB_H = 118;
const FINALS_V = 36;
const HPAD = 20;
const TL_Y = 36;
const PAD_TOP = 80;
const SVG_FONT = "Outfit, ui-sans-serif, system-ui, sans-serif";

function roundGap(ri: number): number {
  return ri === 0 ? R1_GAP : 2 * MH + 2 * roundGap(ri - 1) + R1_GAP - MH;
}

function colH(ri: number, n: number): number {
  return n > 0 ? n * MH + (n - 1) * roundGap(ri) : 0;
}

function PublicBracketView({ matches, fullSize = false }: { matches: Match[]; fullSize?: boolean }) {
  const grouped: Record<string, Record<number, Match[]>> = {};
  matches.forEach((m) => {
    grouped[m.bracket] ??= {};
    grouped[m.bracket][m.round] ??= [];
    grouped[m.bracket][m.round].push(m);
  });

  const leftRounds = Object.keys(grouped["left"] || {}).map(Number).sort((a, b) => a - b);
  const rightRounds = Object.keys(grouped["right"] || {}).map(Number).sort((a, b) => a - b);
  const finalsRounds = Object.keys(grouped["finals"] || {}).map(Number).sort((a, b) => a - b);

  const r1LeftCount = grouped["left"]?.[leftRounds[0]]?.length ?? 0;
  const r1RightCount = grouped["right"]?.[rightRounds[0]]?.length ?? 0;
  const r1Count = Math.max(r1LeftCount, r1RightCount, 1);
  const maxH = colH(0, r1Count);

  const numRounds = Math.max(leftRounds.length, rightRounds.length);
  const sideW = numRounds * MW + (numRounds - 1) * COL_GAP;
  const totalW = HPAD + sideW + SIDE_GAP + FM_W + SIDE_GAP + sideW + HPAD;

  const finalsTotalH = MH + FINALS_V + WB_H;
  const fTopY = PAD_TOP + Math.max(0, (maxH - finalsTotalH) / 2);
  const winnerY = fTopY + MH + FINALS_V;
  const totalH = Math.max(PAD_TOP + maxH, fTopY + finalsTotalH) + 80;

  const CX = totalW / 2;
  const fmx = CX - FM_W / 2;

  function colX(ri: number, side: "left" | "right"): number {
    if (side === "left") return HPAD + ri * (MW + COL_GAP);
    return totalW - HPAD - MW - ri * (MW + COL_GAP);
  }

  function drawMatch(m: Match, x: number, y: number) {
    const t1w = m.winnerId !== null && m.winnerId !== 0 && m.winnerId === m.team1Id;
    const t2w = m.winnerId !== null && m.winnerId !== 0 && m.winnerId === m.team2Id;
    const done = m.winnerId !== null && m.winnerId !== 0;
    const border = done ? "#8800ff" : "#3a1a6a";

    const t1fill = t1w ? "#2a0060" : "#110820";
    const t2fill = t2w ? "#2a0060" : "#110820";
    const t1color = t1w ? "#dd88ff" : t2w ? "#2a1050" : "#c090ff";
    const t2color = t2w ? "#dd88ff" : t1w ? "#2a1050" : "#c090ff";

    return (
      <g key={`m${m.id}`}>
        <rect x={x} y={y} width={MW} height={TEAM_H} rx={3} fill={t1fill} stroke={border} strokeWidth={1} />
        <text x={x + 6} y={y + TEAM_H / 2} fontSize={10} fill={t1color} dominantBaseline="middle" fontFamily={SVG_FONT} fontWeight={t1w ? "700" : "400"}>
          {trunc(m.team1 || "TBD", 15)}
        </text>
        {done && <text x={x + MW - 5} y={y + TEAM_H / 2} fontSize={8} fill={t1w ? "#22c55e" : "#ef4444"} textAnchor="end" dominantBaseline="middle" fontFamily={SVG_FONT} fontWeight="700">{t1w ? "WIN" : "OUT"}</text>}

        <rect x={x} y={y + TEAM_H} width={MW} height={VS_H} fill="#0e0619" stroke={border} strokeWidth={1} />
        <text x={x + MW / 2} y={y + TEAM_H + VS_H / 2} fontSize={8} fill="#5030a0" textAnchor="middle" dominantBaseline="middle" fontFamily={SVG_FONT} fontWeight="600">VS</text>

        <rect x={x} y={y + TEAM_H + VS_H} width={MW} height={TEAM_H} rx={3} fill={t2fill} stroke={border} strokeWidth={1} />
        <text x={x + 6} y={y + TEAM_H + VS_H + TEAM_H / 2} fontSize={10} fill={t2color} dominantBaseline="middle" fontFamily={SVG_FONT} fontWeight={t2w ? "700" : "400"}>
          {trunc(m.team2 || "TBD", 15)}
        </text>
        {done && <text x={x + MW - 5} y={y + TEAM_H + VS_H + TEAM_H / 2} fontSize={8} fill={t2w ? "#22c55e" : "#ef4444"} textAnchor="end" dominantBaseline="middle" fontFamily={SVG_FONT} fontWeight="700">{t2w ? "WIN" : "OUT"}</text>}
      </g>
    );
  }

  function drawSide(side: "left" | "right", rounds: number[]) {
    const out: React.ReactNode[] = [];
    rounds.forEach((round, ri) => {
      const ms = [...(grouped[side]?.[round] || [])].sort((a, b) => a.matchNumber - b.matchNumber);
      const x0 = colX(ri, side);
      const sp = roundGap(ri);
      const ch = colH(ri, ms.length);
      const offY = PAD_TOP + (maxH - ch) / 2;

      ms.forEach((m, mi) => out.push(drawMatch(m, x0, offY + mi * (MH + sp))));

      if (ri < rounds.length - 1) {
        const nri = ri + 1;
        const nms = grouped[side]?.[rounds[nri]] || [];
        const nsp = roundGap(nri);
        const nch = colH(nri, nms.length);
        const nOffY = PAD_TOP + (maxH - nch) / 2;
        const nx0 = colX(nri, side);
        const ex = side === "left" ? x0 + MW : x0;
        const en = side === "left" ? nx0 : nx0 + MW;
        const midX = (ex + en) / 2;
        ms.forEach((_, mi) => {
          const y0 = offY + mi * (MH + sp) + MH / 2;
          const y1 = nOffY + Math.floor(mi / 2) * (MH + nsp) + MH / 2;
          out.push(<path key={`c${side}${round}${mi}`} d={`M${ex},${y0} H${midX} V${y1} H${en}`} stroke="#3a1a6a" strokeWidth={1} fill="none" />);
        });
      }

      if (ri === rounds.length - 1 && ms.length > 0) {
        const ch2 = colH(ri, ms.length);
        const offY2 = PAD_TOP + (maxH - ch2) / 2;
        const lastCY = offY2 + MH / 2;
        const fCY = fTopY + MH / 2;
        const ex = side === "left" ? x0 + MW : x0;
        const en = side === "left" ? fmx : fmx + FM_W;
        const midX = (ex + en) / 2;
        out.push(<path key={`cf${side}`} d={`M${ex},${lastCY} H${midX} V${fCY} H${en}`} stroke="#6020b0" strokeWidth={1.5} fill="none" />);
      }
    });
    return out;
  }

  const finalMatch = finalsRounds.length > 0 ? (grouped["finals"]?.[finalsRounds[0]] || [])[0] : null;
  const winnerName = finalMatch?.winnerId
    ? (finalMatch.winnerId === finalMatch.team1Id ? finalMatch.team1 : finalMatch.team2)
    : null;

  const RNAMES = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"];
  const RCOUNTS = ["32 Matches", "16 Matches", "8 Matches", "4 Matches", "2 Matches"];

  const wbW = FM_W + 44;
  const wbX = CX - wbW / 2;
  const wbR = 8;
  const dS = 7;

  return (
    <div className="card-glow w-full overflow-auto rounded-[32px] bg-black/35 backdrop-blur-sm" style={{ background: "rgba(7,5,15,0.72)" }}>
      <svg
        viewBox={fullSize ? undefined : `0 0 ${totalW} ${totalH}`}
        width={fullSize ? totalW : "100%"}
        height={fullSize ? totalH : undefined}
        preserveAspectRatio={fullSize ? undefined : "xMidYMin meet"}
        style={{ display: "block", minWidth: fullSize ? totalW : undefined }}
      >
        <defs>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e0050" />
            <stop offset="100%" stopColor="#07000f" />
          </linearGradient>
          <linearGradient id="wb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dd55ff" />
            <stop offset="50%" stopColor="#8800ff" />
            <stop offset="100%" stopColor="#dd55ff" />
          </linearGradient>
        </defs>

        <line x1={0} y1={TL_Y} x2={totalW} y2={TL_Y} stroke="#2a1050" strokeWidth={1.5} />
        <circle cx={CX} cy={TL_Y} r={7} fill="#9900ff" />

        <rect x={HPAD} y={TL_Y - 20} width={sideW} height={15} rx={3} fill="#1a0835" opacity={0.9} />
        <text x={HPAD + sideW / 2} y={TL_Y - 12} fontSize={9} fill="#9060c0" textAnchor="middle" fontFamily={SVG_FONT} fontWeight="700">GROUP A</text>

        <rect x={totalW - HPAD - sideW} y={TL_Y - 20} width={sideW} height={15} rx={3} fill="#1a0835" opacity={0.9} />
        <text x={totalW - HPAD - sideW / 2} y={TL_Y - 12} fontSize={9} fill="#9060c0" textAnchor="middle" fontFamily={SVG_FONT} fontWeight="700">GROUP B</text>

        {leftRounds.map((_, ri) => {
          const x = colX(ri, "left") + MW / 2;
          return <g key={`lh${ri}`}>
            <circle cx={x} cy={TL_Y} r={4} fill="#7030d0" />
            <text x={x} y={TL_Y + 13} fontSize={9} fill="#9060d0" textAnchor="middle" fontFamily={SVG_FONT} fontWeight="700">{RNAMES[ri]}</text>
            <text x={x} y={TL_Y + 24} fontSize={7.5} fill="#5a3a8a" textAnchor="middle" fontFamily={SVG_FONT} fontWeight="600">{RCOUNTS[ri]}</text>
          </g>;
        })}

        {rightRounds.map((_, ri) => {
          const x = colX(ri, "right") + MW / 2;
          return <g key={`rh${ri}`}>
            <circle cx={x} cy={TL_Y} r={4} fill="#7030d0" />
            <text x={x} y={TL_Y + 13} fontSize={9} fill="#9060d0" textAnchor="middle" fontFamily={SVG_FONT} fontWeight="700">{RNAMES[ri]}</text>
            <text x={x} y={TL_Y + 24} fontSize={7.5} fill="#5a3a8a" textAnchor="middle" fontFamily={SVG_FONT} fontWeight="600">{RCOUNTS[ri]}</text>
          </g>;
        })}

        <text x={CX} y={TL_Y + 13} fontSize={10} fill="#ff60ff" textAnchor="middle" fontFamily={SVG_FONT} fontWeight="900">Grand Final</text>
        <text x={CX} y={TL_Y + 24} fontSize={7.5} fill="#8030a0" textAnchor="middle" fontFamily={SVG_FONT} fontWeight="600">1 Match</text>

        {drawSide("left", leftRounds)}
        {drawSide("right", rightRounds)}

        {[0, 1].map((i) => {
          const team = i === 0 ? (finalMatch?.team1 || "TBD") : (finalMatch?.team2 || "TBD");
          const isWin = finalMatch?.winnerId && (i === 0 ? finalMatch.winnerId === finalMatch.team1Id : finalMatch.winnerId === finalMatch.team2Id);
          const ty = i === 0 ? fTopY : fTopY + TEAM_H + VS_H;
          const fill = isWin ? "#2a0060" : "#0e0618";
          const color = isWin ? "#dd88ff" : "#c090ff";
          return <g key={`f${i}`}>
            <rect x={fmx} y={ty} width={FM_W} height={TEAM_H} rx={3} fill={fill} stroke="#8000ff" strokeWidth={2} />
            {finalMatch
              ? <text x={fmx + 8} y={ty + TEAM_H / 2} fontSize={10} fill={color} dominantBaseline="middle" fontFamily={SVG_FONT} fontWeight="700">{trunc(team, 22)}</text>
              : <line x1={fmx + FM_W * 0.15} y1={ty + TEAM_H / 2} x2={fmx + FM_W * 0.85} y2={ty + TEAM_H / 2} stroke="#3a1a6a" strokeWidth={1.5} />
            }
          </g>;
        })}
        <rect x={fmx} y={fTopY + TEAM_H} width={FM_W} height={VS_H} fill="#0b0016" stroke="#8000ff" strokeWidth={2} />
        <text x={CX} y={fTopY + TEAM_H + VS_H / 2} fontSize={8} fill="#7030b0" textAnchor="middle" dominantBaseline="middle" fontFamily={SVG_FONT} fontWeight="600">VS</text>

        <line x1={CX} y1={fTopY + MH} x2={CX} y2={winnerY} stroke="#8800ff" strokeWidth={2} />

        <rect x={wbX - 3} y={winnerY - 3} width={wbW + 6} height={WB_H + 6} rx={wbR + 4} fill="none" stroke="#cc44ff" strokeWidth={1} opacity={0.3} />
        <rect x={wbX} y={winnerY} width={wbW} height={WB_H} rx={wbR} fill="url(#wg)" stroke="url(#wb)" strokeWidth={2} />
        <line x1={wbX + 18} y1={winnerY + 2} x2={wbX + wbW - 18} y2={winnerY + 2} stroke="#cc44ff" strokeWidth={1} opacity={0.4} />
        <line x1={wbX + 18} y1={winnerY + WB_H - 2} x2={wbX + wbW - 18} y2={winnerY + WB_H - 2} stroke="#cc44ff" strokeWidth={1} opacity={0.4} />
        <text x={CX} y={winnerY + WB_H * 0.27} fontSize={26} textAnchor="middle" dominantBaseline="middle">🏆</text>
        <text x={CX} y={winnerY + WB_H * 0.56} fontSize={13} fill="#dd88ff" textAnchor="middle" dominantBaseline="middle" fontFamily={SVG_FONT} fontWeight="900">WINNER</text>
        <rect x={wbX + wbW * 0.1} y={winnerY + WB_H * 0.73} width={wbW * 0.8} height={23} rx={3} fill="#0d001f" stroke="#5500bb" strokeWidth={1} />
        {winnerName && <text x={CX} y={winnerY + WB_H * 0.73 + 11} fontSize={10} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontFamily={SVG_FONT} fontWeight="700">{trunc(winnerName, 22)}</text>}
        {[[wbX + 14, winnerY + 14], [wbX + wbW - 14, winnerY + 14], [wbX + 14, winnerY + WB_H - 14], [wbX + wbW - 14, winnerY + WB_H - 14]].map(([dx, dy], i) => (
          <polygon key={i} points={`${dx},${dy - dS} ${dx + dS},${dy} ${dx},${dy + dS} ${dx - dS},${dy}`} fill="#9900dd" opacity={0.7} />
        ))}

        <text x={CX} y={winnerY + WB_H + 26} fontSize={15} fill="#fff" textAnchor="middle" fontFamily={SVG_FONT} fontWeight="900">AQRIX 2v2 Community Cup</text>
        <text x={CX} y={winnerY + WB_H + 44} fontSize={9} fill="#6030a0" textAnchor="middle" fontFamily={SVG_FONT} fontWeight="600">64 TEAM · SINGLE ELIMINATION</text>
      </svg>
    </div>
  );
}

function trunc(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}