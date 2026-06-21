import React, { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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

interface AdminBracketViewProps {
  matches: Match[];
  fullSize?: boolean;
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

function roundGap(ri: number): number {
  return ri === 0 ? R1_GAP : 2 * MH + 2 * roundGap(ri - 1) + R1_GAP - MH;
}

function colH(ri: number, n: number): number {
  return n > 0 ? n * MH + (n - 1) * roundGap(ri) : 0;
}

function trunc(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

export function AdminBracketView({ matches, fullSize = false }: AdminBracketViewProps) {
  const utils = trpc.useUtils();
  const submitScoreMutation = trpc.tournament.submitMatchResult.useMutation({
    onSuccess: async () => {
      await utils.tournament.getBracket.invalidate();
      setEditMatch(null);
      toast.success("Match result updated");
    },
    onError: (error) => {
      toast.error(`Failed to save scores: ${error.message}`);
    },
  });

  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [editScore1, setEditScore1] = useState(0);
  const [editScore2, setEditScore2] = useState(0);

  const grouped = useMemo(() => {
    const next: Record<string, Record<number, Match[]>> = {};
    matches.forEach((m) => {
      next[m.bracket] ??= {};
      next[m.bracket][m.round] ??= [];
      next[m.bracket][m.round].push(m);
    });
    return next;
  }, [matches]);

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

  function openScoreEditor(match: Match) {
    setEditMatch(match);
    setEditScore1(match.team1Score ?? 0);
    setEditScore2(match.team2Score ?? 0);
  }

  async function handleSaveScores() {
    if (!editMatch) return;
    const token = localStorage.getItem("adminToken") || "";
    if (!token) {
      toast.error("Admin token not found");
      return;
    }

    const winnerId =
      editScore1 > editScore2
        ? editMatch.team1Id
        : editScore2 > editScore1
          ? editMatch.team2Id
          : null;

    await submitScoreMutation.mutateAsync({
      token,
      matchId: editMatch.id,
      team1Score: editScore1,
      team2Score: editScore2,
      winnerId: winnerId ?? 0,
    });
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
      <g key={`m${m.id}`} onClick={() => openScoreEditor(m)} style={{ cursor: "pointer" }}>
        <rect x={x} y={y} width={MW} height={TEAM_H} rx={3} fill={t1fill} stroke={border} strokeWidth={1} />
        <text x={x + 6} y={y + TEAM_H / 2} fontSize={10} fill={t1color} dominantBaseline="middle" fontFamily="Orbitron,monospace" fontWeight={t1w ? "700" : "400"} style={{ pointerEvents: "none" }}>
          {trunc(m.team1 || "TBD", 15)}
        </text>
        {done && <text x={x + MW - 5} y={y + TEAM_H / 2} fontSize={8} fill={t1w ? "#22c55e" : "#ef4444"} textAnchor="end" dominantBaseline="middle" fontFamily="monospace" fontWeight="bold" style={{ pointerEvents: "none" }}>{t1w ? "WIN" : "OUT"}</text>}

        <rect x={x} y={y + TEAM_H} width={MW} height={VS_H} fill="#0e0619" stroke={border} strokeWidth={1} />
        <text x={x + MW / 2} y={y + TEAM_H + VS_H / 2} fontSize={8} fill="#5030a0" textAnchor="middle" dominantBaseline="middle" fontFamily="Orbitron,monospace" style={{ pointerEvents: "none" }}>VS</text>

        <rect x={x} y={y + TEAM_H + VS_H} width={MW} height={TEAM_H} rx={3} fill={t2fill} stroke={border} strokeWidth={1} />
        <text x={x + 6} y={y + TEAM_H + VS_H + TEAM_H / 2} fontSize={10} fill={t2color} dominantBaseline="middle" fontFamily="Orbitron,monospace" fontWeight={t2w ? "700" : "400"} style={{ pointerEvents: "none" }}>
          {trunc(m.team2 || "TBD", 15)}
        </text>
        {done && <text x={x + MW - 5} y={y + TEAM_H + VS_H + TEAM_H / 2} fontSize={8} fill={t2w ? "#22c55e" : "#ef4444"} textAnchor="end" dominantBaseline="middle" fontFamily="monospace" fontWeight="bold" style={{ pointerEvents: "none" }}>{t2w ? "WIN" : "OUT"}</text>}
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
    ? finalMatch.winnerId === finalMatch.team1Id ? finalMatch.team1 : finalMatch.team2
    : null;

  const RNAMES = ["Round 1", "Round 2", "Round 3", "Round 4", "Round 5"];
  const RCOUNTS = ["32 Matches", "16 Matches", "8 Matches", "4 Matches", "2 Matches"];

  const wbW = FM_W + 44;
  const wbX = CX - wbW / 2;
  const wbR = 8;
  const dS = 7;

  if (!matches.length) {
    return (
      <div className="rounded-xl border border-border/50 bg-[#07050f] p-10 text-center">
        <p className="font-mono text-sm text-muted-foreground">Tournament bracket will appear here</p>
      </div>
    );
  }

  return (
    <>
      {editMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setEditMatch(null)}>
          <div className="w-full max-w-sm rounded-xl border-2 border-primary bg-[#12091f] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <h3 className="mb-4 font-mono text-sm font-black uppercase tracking-[0.2em] text-primary">
              Edit Match #{editMatch.id}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {editMatch.team1 || "TBD"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={editScore1}
                  onChange={(event) => setEditScore1(parseInt(event.target.value, 10) || 0)}
                  className="w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm text-foreground"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                  {editMatch.team2 || "TBD"}
                </label>
                <input
                  type="number"
                  min="0"
                  value={editScore2}
                  onChange={(event) => setEditScore2(parseInt(event.target.value, 10) || 0)}
                  className="w-full rounded border border-border bg-background px-3 py-2 font-mono text-sm text-foreground"
                />
              </div>
              <p className="font-mono text-xs text-primary/90">
                {editScore1 === editScore2
                  ? "Tie score resets the winner."
                  : `Winner: ${editScore1 > editScore2 ? editMatch.team1 : editMatch.team2}`}
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button onClick={handleSaveScores} disabled={submitScoreMutation.isPending} className="flex-1 font-mono text-xs uppercase">
                {submitScoreMutation.isPending ? "Saving..." : "Save"}
              </Button>
              <Button variant="outline" onClick={() => setEditMatch(null)} className="flex-1 font-mono text-xs uppercase">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className={`w-full rounded-xl border border-border/50 ${fullSize ? "overflow-x-auto overflow-y-hidden" : "overflow-hidden"}`} style={{ background: "#07050f" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');`}</style>
        <svg
          viewBox={fullSize ? undefined : `0 0 ${totalW} ${totalH}`}
          width={fullSize ? totalW : "100%"}
          height={fullSize ? totalH : undefined}
          preserveAspectRatio="xMidYMin meet"
          style={{ display: "block", minWidth: fullSize ? `${totalW}px` : undefined }}
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
          <text x={HPAD + sideW / 2} y={TL_Y - 12} fontSize={9} fill="#9060c0" textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="700">GROUP A</text>

          <rect x={totalW - HPAD - sideW} y={TL_Y - 20} width={sideW} height={15} rx={3} fill="#1a0835" opacity={0.9} />
          <text x={totalW - HPAD - sideW / 2} y={TL_Y - 12} fontSize={9} fill="#9060c0" textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="700">GROUP B</text>

          {leftRounds.map((_, ri) => {
            const x = colX(ri, "left") + MW / 2;
            return <g key={`lh${ri}`}>
              <circle cx={x} cy={TL_Y} r={4} fill="#7030d0" />
              <text x={x} y={TL_Y + 13} fontSize={9} fill="#9060d0" textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="700">{RNAMES[ri]}</text>
              <text x={x} y={TL_Y + 24} fontSize={7.5} fill="#5a3a8a" textAnchor="middle" fontFamily="monospace">{RCOUNTS[ri]}</text>
            </g>;
          })}

          {rightRounds.map((_, ri) => {
            const x = colX(ri, "right") + MW / 2;
            return <g key={`rh${ri}`}>
              <circle cx={x} cy={TL_Y} r={4} fill="#7030d0" />
              <text x={x} y={TL_Y + 13} fontSize={9} fill="#9060d0" textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="700">{RNAMES[ri]}</text>
              <text x={x} y={TL_Y + 24} fontSize={7.5} fill="#5a3a8a" textAnchor="middle" fontFamily="monospace">{RCOUNTS[ri]}</text>
            </g>;
          })}

          <text x={CX} y={TL_Y + 13} fontSize={10} fill="#ff60ff" textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="900">Grand Final</text>
          <text x={CX} y={TL_Y + 24} fontSize={7.5} fill="#8030a0" textAnchor="middle" fontFamily="monospace">1 Match</text>

          {drawSide("left", leftRounds)}
          {drawSide("right", rightRounds)}

          {[0, 1].map((i) => {
            const team = i === 0 ? (finalMatch?.team1 || "TBD") : (finalMatch?.team2 || "TBD");
            const isWin = finalMatch?.winnerId && (i === 0 ? finalMatch.winnerId === finalMatch.team1Id : finalMatch.winnerId === finalMatch.team2Id);
            const ty = i === 0 ? fTopY : fTopY + TEAM_H + VS_H;
            const fill = isWin ? "#2a0060" : "#0e0618";
            const color = isWin ? "#dd88ff" : "#c090ff";
            return <g key={`f${i}`} onClick={() => finalMatch && openScoreEditor(finalMatch)} style={{ cursor: finalMatch ? "pointer" : "default" }}>
              <rect x={fmx} y={ty} width={FM_W} height={TEAM_H} rx={3} fill={fill} stroke="#8000ff" strokeWidth={2} />
              {finalMatch
                ? <text x={fmx + 8} y={ty + TEAM_H / 2} fontSize={10} fill={color} dominantBaseline="middle" fontFamily="Orbitron,monospace" style={{ pointerEvents: "none" }}>{trunc(team, 22)}</text>
                : <line x1={fmx + FM_W * 0.15} y1={ty + TEAM_H / 2} x2={fmx + FM_W * 0.85} y2={ty + TEAM_H / 2} stroke="#3a1a6a" strokeWidth={1.5} />
              }
            </g>;
          })}
          <rect x={fmx} y={fTopY + TEAM_H} width={FM_W} height={VS_H} fill="#0b0016" stroke="#8000ff" strokeWidth={2} />
          <text x={CX} y={fTopY + TEAM_H + VS_H / 2} fontSize={8} fill="#7030b0" textAnchor="middle" dominantBaseline="middle" fontFamily="Orbitron,monospace">VS</text>

          <line x1={CX} y1={fTopY + MH} x2={CX} y2={winnerY} stroke="#8800ff" strokeWidth={2} />

          <rect x={wbX - 3} y={winnerY - 3} width={wbW + 6} height={WB_H + 6} rx={wbR + 4} fill="none" stroke="#cc44ff" strokeWidth={1} opacity={0.3} />
          <rect x={wbX} y={winnerY} width={wbW} height={WB_H} rx={wbR} fill="url(#wg)" stroke="url(#wb)" strokeWidth={2} />
          <line x1={wbX + 18} y1={winnerY + 2} x2={wbX + wbW - 18} y2={winnerY + 2} stroke="#cc44ff" strokeWidth={1} opacity={0.4} />
          <line x1={wbX + 18} y1={winnerY + WB_H - 2} x2={wbX + wbW - 18} y2={winnerY + WB_H - 2} stroke="#cc44ff" strokeWidth={1} opacity={0.4} />
          <text x={CX} y={winnerY + WB_H * 0.27} fontSize={26} textAnchor="middle" dominantBaseline="middle">🏆</text>
          <text x={CX} y={winnerY + WB_H * 0.56} fontSize={13} fill="#dd88ff" textAnchor="middle" dominantBaseline="middle" fontFamily="Orbitron,monospace" fontWeight="900">WINNER</text>
          <rect x={wbX + wbW * 0.1} y={winnerY + WB_H * 0.73} width={wbW * 0.8} height={23} rx={3} fill="#0d001f" stroke="#5500bb" strokeWidth={1} />
          {winnerName && <text x={CX} y={winnerY + WB_H * 0.73 + 11} fontSize={10} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontFamily="Orbitron,monospace" fontWeight="700">{trunc(winnerName, 22)}</text>}
          {[[wbX + 14, winnerY + 14], [wbX + wbW - 14, winnerY + 14], [wbX + 14, winnerY + WB_H - 14], [wbX + wbW - 14, winnerY + WB_H - 14]].map(([dx, dy], i) => (
            <polygon key={i} points={`${dx},${dy - dS} ${dx + dS},${dy} ${dx},${dy + dS} ${dx - dS},${dy}`} fill="#9900dd" opacity={0.7} />
          ))}

          <text x={CX} y={winnerY + WB_H + 26} fontSize={15} fill="#fff" textAnchor="middle" fontFamily="Orbitron,monospace" fontWeight="900">AQRIX 2v2 Community Cup</text>
          <text x={CX} y={winnerY + WB_H + 44} fontSize={9} fill="#6030a0" textAnchor="middle" fontFamily="monospace">64 TEAM · SINGLE ELIMINATION</text>
        </svg>
      </div>
    </>
  );
}