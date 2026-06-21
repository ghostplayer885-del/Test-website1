import { Trophy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import Loader from "@/components/Loader";
import type { AppRouter } from "../../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type TeamListProps = {
  refreshTrigger?: number;
  searchTerm?: string;
};

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Team = RouterOutputs["teams"]["list"][number];

export default function TeamList({ refreshTrigger = 0, searchTerm = "" }: TeamListProps) {
  const { data: teams, isLoading } = trpc.teams.list.useQuery(undefined, {
    enabled: refreshTrigger >= 0,
  });

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredTeams = teams?.filter((team: Team) => {
    if (!normalizedSearch) {
      return true;
    }

    return [team.teamName, team.player1Name, team.player2Name].some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    );
  });

  if (isLoading) {
    return (
      <Loader className="py-12" />
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="rounded-[28px] bg-card/30 py-12 text-center">
        <p className="font-mono text-muted-foreground">No teams registered yet</p>
      </div>
    );
  }

  if (!filteredTeams || filteredTeams.length === 0) {
    return (
      <div className="rounded-[28px] bg-card/30 py-12 text-center">
        <p className="font-mono text-muted-foreground">No teams match your search</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {filteredTeams.map((team: Team) => (
        <div key={team.id} className="relative bg-white/[0.04] p-7 transition-colors duration-200 hover:bg-white/[0.06]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Info */}
            <div>
              <h3 className="mb-4 font-mono text-lg font-bold uppercase tracking-[0.18em] text-primary">
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
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 font-mono text-xs uppercase tracking-[0.18em] text-primary">
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
