'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';

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

interface BracketVisualizerProps {
  matches: Match[];
}

const MATCH_WIDTH = 180;
const MATCH_HEIGHT = 80;
const ROUND_SPACING = 260;
const PAIR_HEIGHT = 240;

export function BracketVisualizer({ matches }: BracketVisualizerProps) {
  // Use updateMatchResult (winner-only toggle) for admin quick-clicks
  const updateMatchMutation = trpc.tournament.updateMatchResult.useMutation();
  const utils = trpc.useUtils();
  const [loadingMatchId, setLoadingMatchId] = useState<number | null>(null);

  // For score editing modal
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [editScore1, setEditScore1] = useState(0);
  const [editScore2, setEditScore2] = useState(0);
  const submitScoreMutation = trpc.tournament.submitMatchResult.useMutation();

  const groupedMatches = useMemo(() => {
    const groups: Record<string, Record<number, Match[]>> = {};
    matches.forEach((match) => {
      if (!groups[match.bracket]) groups[match.bracket] = {};
      if (!groups[match.bracket][match.round]) groups[match.bracket][match.round] = [];
      groups[match.bracket][match.round].push(match);
    });
    return groups;
  }, [matches]);

  const handleSetWinner = async (matchId: number, winnerId: number | null) => {
    setLoadingMatchId(matchId);
    try {
      const adminToken = localStorage.getItem('adminToken') || '';
      await updateMatchMutation.mutateAsync({ matchId, winnerId, token: adminToken });
      await utils.tournament.getBracket.invalidate();
    } catch (error) {
      console.error('Failed to update match result:', error);
    } finally {
      setLoadingMatchId(null);
    }
  };

  const openScoreEditor = (match: Match) => {
    setEditMatch(match);
    setEditScore1(match.team1Score ?? 0);
    setEditScore2(match.team2Score ?? 0);
  };

  const handleSaveScores = async () => {
    if (!editMatch) return;
    const adminToken = localStorage.getItem('adminToken') || '';
    const winnerId = editScore1 > editScore2 ? editMatch.team1Id : editScore2 > editScore1 ? editMatch.team2Id : null;
    try {
      await submitScoreMutation.mutateAsync({
        token: adminToken,
        matchId: editMatch.id,
        team1Score: editScore1,
        team2Score: editScore2,
        winnerId: winnerId ?? 0,
      });
      await utils.tournament.getBracket.invalidate();
      setEditMatch(null);
    } catch (error) {
      console.error('Failed to save scores:', error);
    }
  };

  const renderMatch = (match: Match, x: number, y: number) => {
    const isLoading = loadingMatchId === match.id;
    const t1wins = match.winnerId !== null && match.winnerId === match.team1Id;
    const t2wins = match.winnerId !== null && match.winnerId === match.team2Id;
    const done = match.winnerId !== null;

    const ROW_H = MATCH_HEIGHT / 2;

    return (
      <g key={`match-${match.id}`}>
        {/* Card border glow when done */}
        {done && (
          <rect x={x - 1} y={y - 1} width={MATCH_WIDTH + 2} height={MATCH_HEIGHT + 2} fill="none" stroke="#a855f7" strokeWidth="2" rx="5" opacity="0.6" />
        )}

        {/* Card background */}
        <rect x={x} y={y} width={MATCH_WIDTH} height={MATCH_HEIGHT} fill="#1a1a2e" stroke={done ? "#a855f7" : "#3b355a"} strokeWidth="1.5" rx="4" />

        {/* ── Team 1 row ── */}
        <rect
          x={x} y={y} width={MATCH_WIDTH} height={ROW_H}
          fill={t1wins ? "rgba(168,85,247,0.18)" : "transparent"}
          rx="4"
          style={{ cursor: 'pointer' }}
          onClick={() => !isLoading && handleSetWinner(match.id, t1wins ? null : match.team1Id)}
        />
        {/* Team 1 name */}
        <text x={x + 8} y={y + 25} fontSize="11" fill={t1wins ? "#c084fc" : t2wins ? "#55527a" : "#e9d5ff"} fontWeight={t1wins ? "bold" : "normal"} fontFamily="monospace" style={{ pointerEvents: 'none' }}>
          {truncate(match.team1 || 'TBD', 18)}
        </text>
        {/* Team 1 Score */}
        <text x={x + MATCH_WIDTH - 42} y={y + 25} fontSize="11" fill="#a855f7" textAnchor="middle" fontFamily="monospace" style={{ pointerEvents: 'none' }}>
          {match.team1Score > 0 || done ? match.team1Score : ''}
        </text>
        {/* WIN/LOSS badge T1 */}
        <rect
          x={x + MATCH_WIDTH - 36} y={y + 8} width={30} height={18} rx="3"
          fill={t1wins ? "#166534" : t2wins ? "#7f1d1d" : isLoading ? "#374151" : "#374151"}
          stroke={t1wins ? "#22c55e" : t2wins ? "#ef4444" : "#6b7280"}
          strokeWidth="1"
          style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1 }}
          onClick={() => !isLoading && handleSetWinner(match.id, t1wins ? null : match.team1Id)}
        />
        <text x={x + MATCH_WIDTH - 21} y={y + 20} fontSize="8.5" fill={t1wins ? "#22c55e" : t2wins ? "#ef4444" : "#9ca3af"} fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }} fontFamily="monospace">
          {t1wins ? 'WIN' : t2wins ? 'OUT' : 'WIN'}
        </text>

        {/* Divider */}
        <line x1={x + 6} y1={y + ROW_H} x2={x + MATCH_WIDTH - 6} y2={y + ROW_H} stroke="#3b355a" strokeWidth="1" />

        {/* ── Team 2 row ── */}
        <rect
          x={x} y={y + ROW_H} width={MATCH_WIDTH} height={ROW_H}
          fill={t2wins ? "rgba(168,85,247,0.18)" : "transparent"}
          rx="4"
          style={{ cursor: 'pointer' }}
          onClick={() => !isLoading && handleSetWinner(match.id, t2wins ? null : match.team2Id)}
        />
        {/* Team 2 name */}
        <text x={x + 8} y={y + ROW_H + 25} fontSize="11" fill={t2wins ? "#c084fc" : t1wins ? "#55527a" : "#e9d5ff"} fontWeight={t2wins ? "bold" : "normal"} fontFamily="monospace" style={{ pointerEvents: 'none' }}>
          {truncate(match.team2 || 'TBD', 18)}
        </text>
        {/* Team 2 Score */}
        <text x={x + MATCH_WIDTH - 42} y={y + ROW_H + 25} fontSize="11" fill="#a855f7" textAnchor="middle" fontFamily="monospace" style={{ pointerEvents: 'none' }}>
          {match.team2Score > 0 || done ? match.team2Score : ''}
        </text>
        {/* WIN/LOSS badge T2 */}
        <rect
          x={x + MATCH_WIDTH - 36} y={y + ROW_H + 8} width={30} height={18} rx="3"
          fill={t2wins ? "#166534" : t1wins ? "#7f1d1d" : "#374151"}
          stroke={t2wins ? "#22c55e" : t1wins ? "#ef4444" : "#6b7280"}
          strokeWidth="1"
          style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.5 : 1 }}
          onClick={() => !isLoading && handleSetWinner(match.id, t2wins ? null : match.team2Id)}
        />
        <text x={x + MATCH_WIDTH - 21} y={y + ROW_H + 20} fontSize="8.5" fill={t2wins ? "#22c55e" : t1wins ? "#ef4444" : "#9ca3af"} fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }} fontFamily="monospace">
          {t2wins ? 'WIN' : t1wins ? 'OUT' : 'WIN'}
        </text>

        {/* Score edit button */}
        <rect
          x={x} y={y + MATCH_HEIGHT + 2} width={MATCH_WIDTH} height={14} rx="3"
          fill="#2d1b69" stroke="#6d28d9" strokeWidth="1"
          style={{ cursor: 'pointer', opacity: 0.85 }}
          onClick={() => openScoreEditor(match)}
        />
        <text x={x + MATCH_WIDTH / 2} y={y + MATCH_HEIGHT + 10} fontSize="8" fill="#a78bfa" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }} fontFamily="monospace">
          EDIT SCORES
        </text>

        {/* Reset */}
        <rect
          x={x} y={y + MATCH_HEIGHT + 18} width={MATCH_WIDTH} height={13} rx="3"
          fill="#1f1f1f" stroke="#4b5563" strokeWidth="1"
          style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.4 : 0.7 }}
          onClick={() => !isLoading && handleSetWinner(match.id, null)}
        />
        <text x={x + MATCH_WIDTH / 2} y={y + MATCH_HEIGHT + 27} fontSize="7.5" fill="#9ca3af" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }} fontFamily="monospace">
          RESET
        </text>
      </g>
    );
  };

  const renderColumn = (bracket: string, startX: number, reverse = false) => {
    const els: React.ReactNode[] = [];
    const bm = groupedMatches[bracket];
    if (!bm) return els;

    const rounds = Object.keys(bm).map(Number).sort((a, b) => a - b);
    let xOff = startX;

    rounds.forEach((round, ri) => {
      const roundMatches = bm[round].sort((a, b) => a.matchNumber - b.matchNumber);

      // Round label
      const labelX = xOff + MATCH_WIDTH / 2;
      els.push(
        <text key={`lbl-${bracket}-${round}`} x={labelX} y={28} fontSize="10" fill="#6d28d9" textAnchor="middle" fontFamily="monospace" letterSpacing="1">
          R{round}
        </text>
      );

      let pairIdx = 0;
      for (let i = 0; i < roundMatches.length; i += 2) {
        const m1 = roundMatches[i];
        const m2 = roundMatches[i + 1];
        const pairY = 50 + pairIdx * PAIR_HEIGHT;

        if (m1) els.push(renderMatch(m1, xOff, pairY));
        if (m2) els.push(renderMatch(m2, xOff, pairY + MATCH_HEIGHT + 50));

        // Connector lines between rounds
        if (ri < rounds.length - 1 && m1 && m2) {
          const m1CY = pairY + MATCH_HEIGHT / 2;
          const m2CY = pairY + MATCH_HEIGHT + 50 + MATCH_HEIGHT / 2;
          const midY = (m1CY + m2CY) / 2;
          const lineStart = reverse ? xOff : xOff + MATCH_WIDTH;
          const lineEnd = reverse ? xOff - (ROUND_SPACING - MATCH_WIDTH) / 2 : xOff + MATCH_WIDTH + (ROUND_SPACING - MATCH_WIDTH) / 2;

          els.push(
            <g key={`conn-${bracket}-${round}-${pairIdx}`}>
              <line x1={lineStart} y1={m1CY} x2={lineEnd} y2={m1CY} stroke="#3b355a" strokeWidth="1" strokeDasharray="4,3" />
              <line x1={lineStart} y1={m2CY} x2={lineEnd} y2={m2CY} stroke="#3b355a" strokeWidth="1" strokeDasharray="4,3" />
              <line x1={lineEnd} y1={m1CY} x2={lineEnd} y2={m2CY} stroke="#3b355a" strokeWidth="1" strokeDasharray="4,3" />
              <circle cx={lineEnd} cy={midY} r="3" fill="#6d28d9" />
            </g>
          );
        }

        pairIdx++;
      }

      xOff += reverse ? -ROUND_SPACING : ROUND_SPACING;
    });

    return els;
  };

  if (!matches || matches.length === 0) {
    return (
      <div className="w-full bg-[#0d0d1a] rounded-lg p-8 border border-purple-900 text-center py-20">
        <p className="text-muted-foreground font-mono">No bracket data available</p>
      </div>
    );
  }

  const maxLeft = Math.max(...Object.values(groupedMatches['left'] || {}).map((m) => m.length), 1);
  const pairs = Math.ceil(maxLeft / 2);
  const svgHeight = pairs * PAIR_HEIGHT + 160;

  return (
    <>
      {/* Score edit modal */}
      {editMatch && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center" onClick={() => setEditMatch(null)}>
          <div className="bg-[#1a1a2e] border-2 border-primary rounded-xl p-6 w-80 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-mono text-sm uppercase tracking-widest text-primary font-black mb-4">
              Enter Scores — Match #{editMatch.id}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-1">{editMatch.team1 || 'TBD'}</label>
                <input
                  type="number" min="0" value={editScore1}
                  onChange={(e) => setEditScore1(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-background border border-border rounded font-mono text-sm text-foreground"
                />
              </div>
              <div>
                <label className="font-mono text-xs text-muted-foreground uppercase tracking-widest block mb-1">{editMatch.team2 || 'TBD'}</label>
                <input
                  type="number" min="0" value={editScore2}
                  onChange={(e) => setEditScore2(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-background border border-border rounded font-mono text-sm text-foreground"
                />
              </div>
              {editScore1 !== editScore2 && (
                <p className="font-mono text-xs text-primary">
                  Winner: <strong>{editScore1 > editScore2 ? editMatch.team1 : editMatch.team2}</strong>
                </p>
              )}
              {editScore1 === editScore2 && editScore1 > 0 && (
                <p className="font-mono text-xs text-yellow-400">Equal score — no winner will be set</p>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSaveScores}
                disabled={submitScoreMutation.isPending}
                className="flex-1 py-2 bg-primary text-white font-mono text-xs uppercase rounded hover:bg-primary/80 disabled:opacity-50"
              >
                {submitScoreMutation.isPending ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setEditMatch(null)}
                className="flex-1 py-2 border border-border text-muted-foreground font-mono text-xs uppercase rounded hover:border-primary/50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mb-3 flex flex-wrap gap-4 items-center text-xs font-mono text-muted-foreground px-1">
        <span>💡 Click <span className="text-primary">WIN</span> to set winner · <span className="text-purple-400">EDIT SCORES</span> for exact scores · <span className="text-gray-500">RESET</span> to reset</span>
      </div>

      <div className="w-full overflow-auto bg-[#0d0d1a] rounded-xl border border-purple-900/60 p-4">
        <svg width={2900} height={svgHeight} className="min-w-max">
          {/* Left bracket */}
          <text x={40} y={18} fontSize="11" fill="#a78bfa" fontWeight="bold" fontFamily="monospace" letterSpacing="2">◀ LEFT BRACKET (32 Teams)</text>
          {renderColumn('left', 40)}

          {/* Finals */}
          <text x={1175} y={18} fontSize="12" fill="#fbbf24" fontWeight="bold" fontFamily="monospace" letterSpacing="3">⚡ FINALS</text>
          {renderColumn('finals', 1155)}

          {/* Right bracket */}
          <text x={2350} y={18} fontSize="11" fill="#a78bfa" fontWeight="bold" fontFamily="monospace" letterSpacing="2">RIGHT BRACKET (32 Teams) ▶</text>
          {renderColumn('right', 2310, true)}
        </svg>
      </div>
    </>
  );
}

function truncate(str: string, max: number) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}
