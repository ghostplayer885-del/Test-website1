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

const MATCH_WIDTH = 140;
const MATCH_HEIGHT = 60;
const ROUND_SPACING = 220;
const PAIR_HEIGHT = 220; // Height for a pair with more spacing

export function BracketVisualizer({ matches }: BracketVisualizerProps) {
  const updateMatchMutation = trpc.tournament.updateMatchResult.useMutation();
  const utils = trpc.useUtils();
  const [loadingMatchId, setLoadingMatchId] = useState<number | null>(null);

  const groupedMatches = useMemo(() => {
    const groups: Record<string, Record<number, Match[]>> = {};
    
    matches.forEach(match => {
      if (!groups[match.bracket]) {
        groups[match.bracket] = {};
      }
      if (!groups[match.bracket][match.round]) {
        groups[match.bracket][match.round] = [];
      }
      groups[match.bracket][match.round].push(match);
    });

    return groups;
  }, [matches]);

  const handleSetWinner = async (matchId: number, winnerId: number | null) => {
    setLoadingMatchId(matchId);
    try {
      await updateMatchMutation.mutateAsync({
        matchId,
        winnerId,
      });
      await utils.tournament.getBracket.invalidate();
    } catch (error) {
      console.error('Failed to update match result:', error);
    } finally {
      setLoadingMatchId(null);
    }
  };

  const renderMatch = (match: Match, x: number, y: number) => {
    const isLoading = loadingMatchId === match.id;
    
    return (
      <g key={`match-${match.id}`}>
        {/* Match box */}
        <rect
          x={x}
          y={y}
          width={MATCH_WIDTH}
          height={MATCH_HEIGHT}
          fill="#1e1b4b"
          stroke="#a855f7"
          strokeWidth="2"
          rx="3"
        />

        {/* Team 1 */}
        <text x={x + 6} y={y + 15} fontSize="11" fill="#e9d5ff" fontWeight="500">
          {match.team1 || 'TBD'}
        </text>
        
        {/* Team 1 WIN button */}
        <rect
          x={x + MATCH_WIDTH - 38}
          y={y + 2}
          width="36"
          height="16"
          fill={match.winnerId === match.team1Id ? '#22c55e' : match.winnerId === match.team2Id ? '#ef4444' : '#4b5563'}
          stroke="#666"
          strokeWidth="1"
          rx="2"
          style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
          onClick={() => {
            if (!isLoading) {
              handleSetWinner(match.id, match.winnerId === match.team1Id ? null : match.team1Id);
            }
          }}
        />
        <text x={x + MATCH_WIDTH - 20} y={y + 11} fontSize="9" fill="#fff" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
          {match.winnerId === match.team1Id ? '✓' : match.winnerId === match.team2Id ? '✗' : 'W'}
        </text>

        {/* Team 2 */}
        <text x={x + 6} y={y + 45} fontSize="11" fill="#e9d5ff" fontWeight="500">
          {match.team2 || 'TBD'}
        </text>
        
        {/* Team 2 WIN button */}
        <rect
          x={x + MATCH_WIDTH - 38}
          y={y + 32}
          width="36"
          height="16"
          fill={match.winnerId === match.team2Id ? '#22c55e' : match.winnerId === match.team1Id ? '#ef4444' : '#4b5563'}
          stroke="#666"
          strokeWidth="1"
          rx="2"
          style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
          onClick={() => {
            if (!isLoading) {
              handleSetWinner(match.id, match.winnerId === match.team2Id ? null : match.team2Id);
            }
          }}
        />
        <text x={x + MATCH_WIDTH - 20} y={y + 41} fontSize="9" fill="#fff" fontWeight="bold" textAnchor="middle" style={{ pointerEvents: 'none' }}>
          {match.winnerId === match.team2Id ? '✓' : match.winnerId === match.team1Id ? '✗' : 'W'}
        </text>

        {/* Reset button below */}
        <rect
          x={x}
          y={y + MATCH_HEIGHT + 2}
          width={MATCH_WIDTH}
          height="14"
          fill="#6b21a8"
          stroke="#a855f7"
          strokeWidth="1"
          rx="2"
          style={{ cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.6 : 1 }}
          onClick={() => {
            if (!isLoading) {
              handleSetWinner(match.id, null);
            }
          }}
        />
        <text
          x={x + MATCH_WIDTH / 2}
          y={y + MATCH_HEIGHT + 10}
          fontSize="8"
          fill="#e9d5ff"
          fontWeight="bold"
          textAnchor="middle"
          style={{ pointerEvents: 'none' }}
        >
          RST
        </text>
      </g>
    );
  };

  const renderWinnerBox = (winnerMatch: Match | undefined, x: number, y: number) => {
    if (!winnerMatch) return null;

    // Winner box is smaller and positioned to the right to avoid overlap
    const winnerBoxWidth = 100;
    const winnerBoxHeight = 50;
    // Center the winner box vertically at the given y position
    const winnerY = y - winnerBoxHeight / 2;

    return (
      <g key={`winner-${winnerMatch.id}`}>
        {/* Winner box - smaller, to the right, perfectly centered */}
        <rect
          x={x + 80}
          y={winnerY}
          width={winnerBoxWidth}
          height={winnerBoxHeight}
          fill="#0f172a"
          stroke="#fbbf24"
          strokeWidth="2"
          rx="3"
          strokeDasharray="5,5"
        />

        {/* Winner text */}
        <text x={x + 90} y={winnerY + 30} fontSize="9" fill="#fbbf24" fontWeight="bold" textAnchor="start">
          {winnerMatch.team1 || 'TBD'}
        </text>
      </g>
    );
  };

  const renderBracketColumn = (bracketType: 'left' | 'right' | 'finals', startX: number, isReverse: boolean = false) => {
    const elements: React.ReactNode[] = [];
    const bracketMatches = groupedMatches[bracketType];

    if (!bracketMatches) return elements;

    const rounds = Object.keys(bracketMatches)
      .map(Number)
      .sort((a, b) => a - b);

    let xOffset = startX;

    rounds.forEach((round, roundIndex) => {
      const roundMatches = bracketMatches[round].sort((a, b) => a.matchNumber - b.matchNumber);
      let pairIndex = 0;

      // Group matches in pairs
      for (let i = 0; i < roundMatches.length; i += 2) {
        const match1 = roundMatches[i];
        const match2 = roundMatches[i + 1];
        
        // Calculate Y position for this pair
        const pairYStart = 40 + pairIndex * PAIR_HEIGHT;
        
        // Match 1 at top of pair
        if (match1) {
          elements.push(renderMatch(match1, xOffset, pairYStart));
        }

        // Match 2 at bottom of pair (with 40px gap between them)
        if (match2) {
          elements.push(renderMatch(match2, xOffset, pairYStart + MATCH_HEIGHT + 40));
        }

        pairIndex++;
      }

      // Render connector lines BETWEEN rounds (no duplicate match boxes)
      if (roundIndex < rounds.length - 1) {
        let pairIdx = 0;
        for (let i = 0; i < roundMatches.length; i += 2) {
          const match1 = roundMatches[i];
          const match2 = roundMatches[i + 1];
          if (match1 && match2) {
            const match1CenterY = 40 + pairIdx * PAIR_HEIGHT + MATCH_HEIGHT / 2;
            const match2CenterY = 40 + pairIdx * PAIR_HEIGHT + MATCH_HEIGHT + 40 + MATCH_HEIGHT / 2;
            const lineEndX = isReverse
              ? xOffset - (ROUND_SPACING - MATCH_WIDTH) / 2
              : xOffset + MATCH_WIDTH + (ROUND_SPACING - MATCH_WIDTH) / 2;
            const lineStartX = isReverse ? xOffset : xOffset + MATCH_WIDTH;
            elements.push(
              <g key={`conn-${bracketType}-${round}-${pairIdx}`}>
                <line x1={lineStartX} y1={match1CenterY} x2={lineEndX} y2={match1CenterY} stroke="#4b5563" strokeWidth="1" />
                <line x1={lineStartX} y1={match2CenterY} x2={lineEndX} y2={match2CenterY} stroke="#4b5563" strokeWidth="1" />
                <line x1={lineEndX} y1={match1CenterY} x2={lineEndX} y2={match2CenterY} stroke="#4b5563" strokeWidth="1" />
              </g>
            );
          }
          pairIdx++;
        }
      }

      // For RIGHT bracket, always move LEFT (negative)
      if (isReverse) {
        xOffset -= ROUND_SPACING;
      } else {
        xOffset += ROUND_SPACING;
      }
    });

    return elements;
  };

  if (!matches || matches.length === 0) {
    return (
      <div className="w-full bg-slate-950 rounded-lg p-4 border border-purple-900 text-center py-20">
        <p className="text-muted-foreground">No bracket data available</p>
      </div>
    );
  }

  const maxMatchesPerRound = Math.max(
    ...Object.values(groupedMatches['left'] || {}).map(m => m.length),
    ...Object.values(groupedMatches['right'] || {}).map(m => m.length),
    1
  );
  const pairsPerRound = Math.ceil(maxMatchesPerRound / 2);
  const svgHeight = pairsPerRound * PAIR_HEIGHT + 100;

  return (
    <div className="w-full overflow-auto bg-slate-950 rounded-lg p-4 border border-purple-900">
      <svg width={2800} height={svgHeight} className="min-w-max">
        {/* Left Bracket - LEFT TO RIGHT */}
        <g>
          <text x={40} y={25} fontSize="13" fill="#a78bfa" fontWeight="bold">
            LEFT (32)
          </text>
          {renderBracketColumn('left', 40, false)}
        </g>

        {/* Finals - MIDDLE */}
        <g>
          <text x={1100} y={25} fontSize="13" fill="#fbbf24" fontWeight="bold">
            FINALS
          </text>
          {renderBracketColumn('finals', 1100, false)}
        </g>

        {/* Right Bracket - RIGHT TO LEFT (MIRRORED) */}
        <g>
          <text x={2350} y={25} fontSize="13" fill="#a78bfa" fontWeight="bold">
            RIGHT (32)
          </text>
          {renderBracketColumn('right', 2200, true)}
        </g>
      </svg>
    </div>
  );
}
