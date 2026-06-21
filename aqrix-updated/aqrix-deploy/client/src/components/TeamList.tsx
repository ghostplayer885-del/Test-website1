import { Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function TeamList({ refreshTrigger = 0 }: { refreshTrigger?: number }) {
  const { data: teams, isLoading } = trpc.teams.list.useQuery();

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="font-mono text-muted-foreground">Loading teams...</p>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-border bg-card/30 rounded">
        <p className="font-mono text-muted-foreground">No teams registered yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teams.map((team) => (
        <div key={team.id} className="border-2 border-border bg-card p-6 relative">
          <div className="absolute top-0 left-0 w-2 h-2 bg-primary" />
          <div className="absolute bottom-0 right-0 w-2 h-2 bg-primary" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Info */}
            <div>
              <h3 className="font-mono text-lg font-bold uppercase tracking-wide text-primary mb-4">
                {team.teamName}
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground font-mono text-xs uppercase">Player 1</p>
                  <p className="text-foreground font-mono font-semibold">{team.player1Name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground font-mono text-xs uppercase">Player 2</p>
                  <p className="text-foreground font-mono font-semibold">{team.player2Name}</p>
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="flex flex-col justify-center items-end">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary/40 bg-primary/10 text-primary font-mono text-xs uppercase tracking-widest rounded">
                <Trophy className="h-4 w-4" />
                {team.status}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
