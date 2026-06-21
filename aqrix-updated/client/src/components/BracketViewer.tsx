import React, { useState } from "react";
import { X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BracketViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BracketViewer({ isOpen, onClose }: BracketViewerProps) {
  if (!isOpen) return null;

  // Sample bracket data - replace with real data from your API
  const bracketData = {
    tournament: "Aqrix 2v2 Community Cup",
    status: "Registration Phase",
    registeredTeams: 12,
    maxTeams: 32,
    rounds: [
      {
        name: "Round 1 - Qualifiers",
        matches: [
          { team1: "Team Alpha", team2: "Team Beta", score1: null, score2: null },
          { team1: "Team Gamma", team2: "Team Delta", score1: null, score2: null },
          { team1: "Team Epsilon", team2: "Team Zeta", score1: null, score2: null },
          { team1: "Team Eta", team2: "Team Theta", score1: null, score2: null },
        ]
      },
      {
        name: "Round 2 - Semifinals",
        matches: [
          { team1: "TBD", team2: "TBD", score1: null, score2: null },
          { team1: "TBD", team2: "TBD", score1: null, score2: null },
        ]
      },
      {
        name: "Grand Finals",
        matches: [
          { team1: "TBD", team2: "TBD", score1: null, score2: null },
        ]
      }
    ]
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      {/* Modal Container */}
      <div className="bg-card border-2 border-primary w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b-2 border-border p-6 flex items-center justify-between">
          <div>
            <h2 className="font-mono text-2xl font-black uppercase tracking-tight text-foreground">
              {bracketData.tournament}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Status: <span className="text-secondary font-mono">{bracketData.status}</span> • 
              Teams: <span className="text-primary font-mono ml-1">{bracketData.registeredTeams}/{bracketData.maxTeams}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 border-2 border-border text-foreground hover:text-primary hover:border-primary transition-colors duration-150"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Bracket Content */}
        <div className="p-6">
          {bracketData.status === "Registration Phase" ? (
            <div className="text-center py-12">
              <div className="inline-block border-2 border-dashed border-primary/50 p-8 bg-primary/5">
                <p className="font-mono text-lg text-foreground mb-2">
                  🎮 Bracket will be displayed after registration phase
                </p>
                <p className="text-sm text-muted-foreground">
                  Once enough teams are registered, the tournament bracket will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {bracketData.rounds.map((round, roundIndex) => (
                <div key={roundIndex}>
                  <h3 className="font-mono text-lg font-bold uppercase tracking-wide text-primary mb-4 border-b-2 border-border pb-3">
                    {round.name}
                  </h3>
                  <div className="space-y-3">
                    {round.matches.map((match, matchIndex) => (
                      <div key={matchIndex} className="border-2 border-border p-4 bg-muted/30 hover:border-primary transition-colors duration-150">
                        <div className="flex items-center justify-between gap-4">
                          {/* Team 1 */}
                          <div className="flex-1">
                            <p className="font-mono text-sm font-bold text-foreground">
                              {match.team1}
                            </p>
                          </div>

                          {/* Score */}
                          <div className="flex items-center gap-2">
                            {match.score1 !== null ? (
                              <>
                                <span className="font-mono text-lg font-bold text-primary">
                                  {match.score1}
                                </span>
                                <span className="text-muted-foreground">-</span>
                                <span className="font-mono text-lg font-bold text-secondary">
                                  {match.score2}
                                </span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                TBD
                              </span>
                            )}
                          </div>

                          {/* Team 2 */}
                          <div className="flex-1 text-right">
                            <p className="font-mono text-sm font-bold text-foreground">
                              {match.team2}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-border bg-muted/20 p-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Bracket will be updated live during the tournament
          </p>
          <Button
            onClick={onClose}
            variant="outline"
            className="font-mono uppercase tracking-wider text-xs border-2 border-border hover:border-primary"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
