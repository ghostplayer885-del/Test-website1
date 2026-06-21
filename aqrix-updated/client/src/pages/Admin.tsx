import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { Copy, CheckCircle2, Clock, XCircle, Zap, Twitch, Youtube, Instagram, Link, Trophy } from "lucide-react";
import { BracketVisualizer } from "@/components/BracketVisualizer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Admin() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState<string>(() => localStorage.getItem("adminToken") ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified" | "rejected">("all");
  const [activeTab, setActiveTab] = useState("tournament");

  const isLoggedIn = !!adminToken;

  const { data: allTeams = [], refetch: refetchTeams, error: teamsError } = trpc.teams.admin.listAll.useQuery(
    { token: adminToken, search: searchQuery, status: filterStatus === "all" ? undefined : filterStatus },
    { enabled: isLoggedIn }
  );

  // Show error if teams query fails
  useEffect(() => {
    if (teamsError) {
      console.error("Teams query error:", teamsError);
      toast.error("Failed to load teams");
    }
  }, [teamsError]);

  const { data: tournamentStatus } = trpc.tournament.getStatus.useQuery();
  const { data: bracketData, refetch: refetchBracket } = trpc.tournament.getBracket.useQuery(undefined, {
    refetchInterval: 2000,
  });

  const startTournamentMutation = trpc.tournament.startTournament.useMutation({
    onSuccess: () => {
      toast.success("Tournament started!");
      refetchBracket();
    },
    onError: (error) => {
      toast.error("Failed to start tournament: " + (error.message || "Unknown error"));
    },
  });
  const resetTimerMutation = trpc.tournament.resetTimer.useMutation({
    onSuccess: () => {
      toast.success("Timer reset!");
    },
    onError: (error) => {
      toast.error("Failed to reset timer: " + (error.message || "Unknown error"));
    },
  });
  const updateMatchMutation = trpc.tournament.submitMatchResult.useMutation();

  const seedTestTeamsMutation = trpc.tournament.seedTestTeams.useMutation({
    onSuccess: (data) => {
      toast.success(`Seeded ${data.count} test teams (all verified)!`);
      refetchTeams();
    },
    onError: (error) => {
      toast.error("Failed to seed teams: " + error.message);
    },
  });

  const clearTestTeamsMutation = trpc.tournament.clearTestTeams.useMutation({
    onSuccess: () => {
      toast.success("Test teams cleared!");
      refetchTeams();
    },
    onError: (error) => {
      toast.error("Failed to clear test teams: " + error.message);
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: adminPassword }),
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("adminToken", data.token);
        setAdminToken(data.token);
        setAdminEmail("");
        setAdminPassword("");
        toast.success("Logged in successfully!");
      } else {
        toast.error("Invalid credentials");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken("");
    toast.success("Logged out successfully!");
  };

  if (!isLoggedIn) {
    return (
      <Layout>
        <section className="min-h-screen flex items-center justify-center py-20 border-b-2 border-border">
          <div className="w-full max-w-md px-4">
            <div className="border-2 border-primary bg-card p-8">
              <h1 className="font-mono text-2xl font-black uppercase tracking-tight text-primary mb-6">
                Admin Panel
              </h1>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@aqrix.local"
                    className="font-mono text-sm border-2 border-border bg-card text-foreground"
                  />
                </div>
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                    Password
                  </label>
                  <Input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter password"
                    className="font-mono text-sm border-2 border-border bg-card text-foreground"
                  />
                </div>
                <Button type="submit" className="w-full font-mono text-xs uppercase">
                  Login
                </Button>
              </form>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-12 px-4 min-h-screen bg-background">
        <div className="container mx-auto">
          {/* Header */}
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="font-mono text-3xl font-black uppercase tracking-tight text-primary">
                Admin Dashboard
              </h1>
              <p className="text-sm text-muted-foreground mt-2">Manage tournament teams, verifications, and tournament settings</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="font-mono text-xs uppercase"
            >
              Logout
            </Button>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="tournament" className="font-mono text-xs uppercase">
                Tournament Settings
              </TabsTrigger>
              <TabsTrigger value="verification" className="font-mono text-xs uppercase">
                Verification
              </TabsTrigger>
              <TabsTrigger value="bracket" className="font-mono text-xs uppercase">
                Bracket Results
              </TabsTrigger>
            </TabsList>

            {/* Tournament Settings Tab */}
            <TabsContent value="tournament" className="space-y-6">
              <div className="border-2 border-border bg-card p-8">
                <h2 className="font-mono text-xl font-black uppercase tracking-tight text-primary mb-6">
                  Tournament Settings
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Tournament Start Date
                    </label>
                    <Input
                      type="date"
                      defaultValue="2026-06-06"
                      className="font-mono text-sm border-2 border-border bg-card text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Tournament Start Time
                    </label>
                    <Input
                      type="time"
                      defaultValue="15:00"
                      className="font-mono text-sm border-2 border-border bg-card text-foreground"
                    />
                  </div>
                </div>

                <div className="mb-8 p-4 border-2 border-border bg-background">
                  <p className="font-mono text-sm text-muted-foreground mb-2">Current Status</p>
                  <p className="font-mono text-lg font-black text-primary">
                    {tournamentStatus?.status === "live" ? "🔴 LIVE" : "⏳ Registration Open"} - {allTeams.length}/64 Teams Registered
                  </p>
                </div>

                <div className="flex gap-4 flex-wrap">
                  <Button
                    onClick={() => {
                      if (!adminToken) { toast.error("Admin token not found"); return; }
                      startTournamentMutation.mutate({ token: adminToken });
                    }}
                    disabled={startTournamentMutation.isPending}
                    className="font-mono text-xs uppercase"
                  >
                    {startTournamentMutation.isPending ? "Starting..." : "Start Tournament"}
                  </Button>
                  <Button
                    onClick={() => {
                      if (!adminToken) { toast.error("Admin token not found"); return; }
                      resetTimerMutation.mutate({ token: adminToken });
                    }}
                    disabled={resetTimerMutation.isPending}
                    variant="outline"
                    className="font-mono text-xs uppercase"
                  >
                    {resetTimerMutation.isPending ? "Resetting..." : "Reset Timer"}
                  </Button>
                </div>

                {/* Test Data Section */}
                <div className="mt-6 p-4 border-2 border-dashed border-yellow-500/40 bg-yellow-500/5 rounded-lg">
                  <p className="font-mono text-xs uppercase tracking-widest text-yellow-400 mb-3">🧪 Testing — Fill with fake teams</p>
                  <div className="flex gap-3 flex-wrap">
                    <Button
                      onClick={() => {
                        if (!adminToken) { toast.error("Admin token not found"); return; }
                        seedTestTeamsMutation.mutate({ token: adminToken });
                      }}
                      disabled={seedTestTeamsMutation.isPending}
                      className="font-mono text-xs uppercase bg-yellow-600 hover:bg-yellow-500 text-black"
                    >
                      {seedTestTeamsMutation.isPending ? "Seeding..." : "⚡ Seed 64 Test Teams"}
                    </Button>
                    <Button
                      onClick={() => {
                        if (!adminToken) { toast.error("Admin token not found"); return; }
                        clearTestTeamsMutation.mutate({ token: adminToken });
                      }}
                      disabled={clearTestTeamsMutation.isPending}
                      variant="outline"
                      className="font-mono text-xs uppercase border-yellow-500/50 text-yellow-400 hover:border-yellow-400"
                    >
                      {clearTestTeamsMutation.isPending ? "Clearing..." : "🗑 Clear Test Teams"}
                    </Button>
                  </div>
                  <p className="font-mono text-[10px] text-yellow-400/60 mt-2">
                    Seeds 64 verified TEST_ teams → then hit "Start Tournament" to generate the bracket.
                  </p>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-4 gap-4 mt-8">
                  <div className="border-2 border-border bg-background p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Total Teams</p>
                    <p className="font-mono text-2xl font-black text-primary mt-2">{allTeams.length}</p>
                  </div>
                  <div className="border-2 border-border bg-background p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Pending</p>
                    <p className="font-mono text-2xl font-black text-secondary mt-2">{allTeams.filter(t => t.status === "pending").length}</p>
                  </div>
                  <div className="border-2 border-border bg-background p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Verified</p>
                    <p className="font-mono text-2xl font-black text-accent mt-2">{allTeams.filter(t => t.status === "verified").length}</p>
                  </div>
                  <div className="border-2 border-border bg-background p-4">
                    <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Rejected</p>
                    <p className="font-mono text-2xl font-black text-destructive mt-2">{allTeams.filter(t => t.status === "rejected").length}</p>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Verification Tab */}
            <TabsContent value="verification" className="space-y-6">
              <div className="mb-6 space-y-4">
                <div>
                  <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Search Teams</label>
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by team name or player name..."
                    className="font-mono text-sm border-2 border-border bg-card text-foreground"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  {(["all", "pending", "verified", "rejected"] as const).map((status) => (
                    <Button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      variant={filterStatus === status ? "default" : "outline"}
                      className="font-mono text-xs uppercase"
                    >
                      {status === "all" ? "All Teams" : status === "pending" ? "Pending" : status === "verified" ? "Verified" : "Rejected"} ({allTeams.filter(t => status === "all" || t.status === status).length})
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {allTeams.filter(t => filterStatus === "all" || t.status === filterStatus).map((team) => (
                  <TeamCard key={team.id} team={team} onSuccess={() => refetchTeams()} adminToken={adminToken || ""} />
                ))}
              </div>
            </TabsContent>

            {/* Bracket Results Tab */}
            <TabsContent value="bracket" className="space-y-6">
              {!bracketData?.rounds || bracketData.rounds.length === 0 ? (
                <div className="text-center py-20 border-2 border-border bg-card p-8">
                  <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="font-mono text-xl font-black text-foreground mb-2">Bracket Not Generated</h3>
                  <p className="text-muted-foreground">Start the tournament to generate the bracket</p>
                </div>
              ) : (
                <BracketVisualizer matches={bracketData.matches || []} />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </Layout>
  );
}

interface BracketVisualizationProps {
  rounds: any[];
  onMatchUpdate: () => void;
}

function BracketVisualization({ rounds, onMatchUpdate }: BracketVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [matchPositions, setMatchPositions] = useState<Record<number, { x: number; y: number }>>({});

  useEffect(() => {
    // Calculate positions of all matches for drawing lines
    const calculatePositions = () => {
      const positions: Record<number, { x: number; y: number }> = {};
      const elements = containerRef.current?.querySelectorAll("[data-match-id]");
      
      elements?.forEach((el) => {
        const matchId = el.getAttribute("data-match-id");
        if (matchId) {
          const rect = el.getBoundingClientRect();
          const containerRect = containerRef.current?.getBoundingClientRect();
          if (containerRect) {
            positions[parseInt(matchId)] = {
              x: rect.left - containerRect.left + rect.width / 2,
              y: rect.top - containerRect.top + rect.height / 2,
            };
          }
        }
      });
      
      setMatchPositions(positions);
    };
    
    // Calculate immediately and after a short delay to ensure DOM is ready
    calculatePositions();
    const timer = setTimeout(calculatePositions, 50);
    
    // Also recalculate on window resize
    window.addEventListener('resize', calculatePositions);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculatePositions);
    };
  }, [rounds]);

  return (
    <div ref={containerRef} className="relative w-full overflow-x-auto bg-card border-2 border-border p-8 rounded-lg">
      <svg
        ref={svgRef}
        className="absolute top-0 left-0 pointer-events-none"
        style={{ zIndex: 0, width: '100%', height: '100%', minHeight: '600px' }}
        preserveAspectRatio="none"
      >
        {/* Draw connection lines between matches */}
        {Object.keys(matchPositions).length > 0 && rounds.map((round, roundIndex) => {
          if (roundIndex === rounds.length - 1) return null; // No lines from last round
          
          return round.matches?.map((match: any) => {
            if (!match.winnerId) return null;
            
            const nextRound = rounds[roundIndex + 1];
            if (!nextRound) return null;

            // Find the next match this winner goes to
            const matchIndex = round.matches.indexOf(match);
            const nextMatchIndex = Math.floor(matchIndex / 2);
            const nextMatch = nextRound.matches?.[nextMatchIndex];

            if (!nextMatch || !matchPositions[match.id] || !matchPositions[nextMatch.id]) {
              return null;
            }

            const fromPos = matchPositions[match.id];
            const toPos = matchPositions[nextMatch.id];

            // Create smooth bezier curve
            const controlX = (fromPos.x + toPos.x) / 2;
            const controlY = (fromPos.y + toPos.y) / 2;

            return (
              <g key={`line-${match.id}`}>
                {/* Curved line with glow effect */}
                <path
                  d={`M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}`}
                  stroke="rgba(168, 85, 247, 0.8)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray="5,5"
                  opacity="0.6"
                />
                {/* Main line */}
                <path
                  d={`M ${fromPos.x} ${fromPos.y} Q ${controlX} ${controlY} ${toPos.x} ${toPos.y}`}
                  stroke="url(#gradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="5,5"
                  opacity="0.8"
                />
                {/* Animated dots */}
                <circle cx={fromPos.x} cy={fromPos.y} r="3" fill="hsl(var(--primary))" opacity="0.6" />
                <circle cx={toPos.x} cy={toPos.y} r="3" fill="hsl(var(--accent))" opacity="0.6" />
              </g>
            );
          });
        })}
        
        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
          </linearGradient>
        </defs>
      </svg>

      <div className="inline-flex gap-16 relative z-10">
        {rounds.map((round, roundIndex) => (
          <div key={roundIndex} className="flex flex-col gap-8 min-w-max">
            <div className="mb-4">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-bold">
                {round.name}
              </p>
            </div>

            <div className="flex flex-col gap-12">
              {round.matches?.map((match: any) => (
                <MatchResultEditor
                  key={match.id}
                  match={match}
                  onSuccess={onMatchUpdate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TeamCardProps {
  team: any;
  onSuccess: () => void;
  adminToken: string;
}

function TeamCard({ team, onSuccess, adminToken }: TeamCardProps) {
  const [showUnverifyConfirm, setShowUnverifyConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [verifiedFields, setVerifiedFields] = useState({
    player1Tracker: false,
    player1Twitch: false,
    player1YouTube: false,
    player1Instagram: false,
    player1TikTok: false,
    player1Discord: false,
    player2Tracker: false,
    player2Twitch: false,
    player2YouTube: false,
    player2Instagram: false,
    player2TikTok: false,
    player2Discord: false,
  });

  const isVerified = team.status === "verified";
  const isRejected = team.status === "rejected";

  const updateStatusMutation = trpc.teams.admin.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Team status updated!");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleVerify = () => {
    const token = adminToken || localStorage.getItem("adminToken") || "";
    if (!token) {
      toast.error("Admin token not found");
      return;
    }
    updateStatusMutation.mutate({
      teamId: team.id,
      status: "verified",
      token,
    });
  };

  const handleUnverify = () => {
    setShowUnverifyConfirm(true);
  };

  const confirmUnverify = () => {
    const token = adminToken || localStorage.getItem("adminToken") || "";
    if (!token) {
      toast.error("Admin token not found");
      return;
    }
    updateStatusMutation.mutate({
      teamId: team.id,
      status: "pending",
      token,
    });
    setShowUnverifyConfirm(false);
  };

  const handleReject = () => {
    setShowRejectConfirm(true);
  };

  const confirmReject = () => {
    const token = adminToken || localStorage.getItem("adminToken") || "";
    if (!token) {
      toast.error("Admin token not found");
      return;
    }
    updateStatusMutation.mutate({
      teamId: team.id,
      status: "rejected",
      token,
    });
    setShowRejectConfirm(false);
  };

  return (
    <>
      <div className="border-2 border-border bg-card p-6 rounded-lg hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-mono text-lg font-black text-foreground">{team.teamName}</h3>
            <p className="text-sm text-muted-foreground mt-1">{team.region}</p>
          </div>
          <span className={`px-3 py-1 font-mono text-xs uppercase tracking-wider border rounded ${
            isVerified ? "border-primary bg-primary/10 text-primary" :
            isRejected ? "border-destructive bg-destructive/10 text-destructive" :
            "border-secondary bg-secondary/10 text-secondary"
          }`}>
            {isVerified ? "Verified" : isRejected ? "Rejected" : "Pending"}
          </span>
        </div>

        <div className="space-y-2 mb-4 text-sm">
          <p><span className="text-muted-foreground">Player 1:</span> {team.player1Name}</p>
          <p><span className="text-muted-foreground">Player 2:</span> {team.player2Name}</p>
          <p><span className="text-muted-foreground">Email:</span> {team.email}</p>
        </div>

      {!isVerified && !isRejected && (
        <div className="flex gap-2">
          <Button
            onClick={handleVerify}
            disabled={updateStatusMutation.isPending}
            className="flex-1 font-mono text-xs uppercase"
            variant="default"
          >
            {updateStatusMutation.isPending ? "..." : "Verify"}
          </Button>
          <Button
            onClick={handleReject}
            disabled={updateStatusMutation.isPending}
            className="flex-1 font-mono text-xs uppercase"
            variant="outline"
          >
            {updateStatusMutation.isPending ? "..." : "Reject"}
          </Button>
        </div>
      )}
      {isVerified && (
        <div className="flex gap-2">
          <Button
            onClick={handleUnverify}
            disabled={updateStatusMutation.isPending}
            className="flex-1 font-mono text-xs uppercase"
            variant="outline"
          >
            {updateStatusMutation.isPending ? "..." : "Unverify"}
          </Button>
          <Button
            onClick={handleReject}
            disabled={updateStatusMutation.isPending}
            className="flex-1 font-mono text-xs uppercase"
            variant="outline"
          >
            {updateStatusMutation.isPending ? "..." : "Reject"}
          </Button>
        </div>
      )}
      {isRejected && (
        <div className="flex gap-2">
          <Button
            onClick={handleVerify}
            disabled={updateStatusMutation.isPending}
            className="flex-1 font-mono text-xs uppercase"
            variant="default"
          >
            {updateStatusMutation.isPending ? "..." : "Verify"}
          </Button>
          <Button
            onClick={handleUnverify}
            disabled={updateStatusMutation.isPending}
            className="flex-1 font-mono text-xs uppercase"
            variant="outline"
          >
            {updateStatusMutation.isPending ? "..." : "Return to Pending"}
          </Button>
        </div>
      )}
      </div>

      {/* Unverify Confirmation Dialog */}
      <AlertDialog open={showUnverifyConfirm} onOpenChange={setShowUnverifyConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unverify Team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unverify <strong>{team.teamName}</strong>? This will move them back to pending status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnverify} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Unverify
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation Dialog */}
      <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Team?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject <strong>{team.teamName}</strong>? This will prevent them from participating in the tournament.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface MatchResultEditorProps {
  match: any;
  onSuccess: () => void;
}

function MatchResultEditor({ match, onSuccess }: MatchResultEditorProps) {
  const [team1Score, setTeam1Score] = useState(match.team1Score || 0);
  const [team2Score, setTeam2Score] = useState(match.team2Score || 0);
  const [winnerId, setWinnerId] = useState(match.winnerId || 0);
  const [isEditing, setIsEditing] = useState(false);

  const updateMatchMutation = trpc.tournament.submitMatchResult.useMutation({
    onSuccess: () => {
      toast.success("Match result updated!");
      setIsEditing(false);
      onSuccess();
    },
    onError: (error) => {
      console.error("Match update error:", error);
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (winnerId === 0) {
      toast.error("Please select a winner");
      return;
    }
    const adminToken = localStorage.getItem("adminToken") || "";
    if (!adminToken) {
      toast.error("Admin token not found");
      return;
    }
    updateMatchMutation.mutate({
      token: adminToken,
      matchId: match.id,
      team1Score,
      team2Score,
      winnerId,
    });
  };

  const hasResult = match.winnerId !== null && match.winnerId !== 0;

  return (
    <div
      data-match-id={match.id}
      className={`border-2 rounded-lg p-4 w-80 transition-all cursor-pointer group ${
        hasResult
          ? "border-border bg-card shadow-lg"
          : "border-border bg-card hover:border-primary/50 hover:shadow-md"
      }`}
    >
      {!isEditing ? (
        <div onClick={() => setIsEditing(true)} className="space-y-2">
          {/* Team 1 */}
          <div className="flex items-center justify-between gap-3 p-3 rounded border border-border/50 bg-background/50">
            <div className="flex-1 min-w-0">
              <span className="font-mono text-sm font-bold truncate block text-foreground">
                {match.team1 || "TBD"}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Score: {match.team1Score ?? "-"}
              </span>
            </div>
            {hasResult && (
              <span className={`px-2 py-1 rounded font-mono text-xs font-bold uppercase whitespace-nowrap ${
                match.winnerId === match.team1Id
                  ? "bg-green-500/20 text-green-400 border border-green-500/50"
                  : "bg-red-500/20 text-red-400 border border-red-500/50"
              }`}>
                {match.winnerId === match.team1Id ? "WON" : "LOST"}
              </span>
            )}
          </div>

          {/* Team 2 */}
          <div className="flex items-center justify-between gap-3 p-3 rounded border border-border/50 bg-background/50">
            <div className="flex-1 min-w-0">
              <span className="font-mono text-sm font-bold truncate block text-foreground">
                {match.team2 || "TBD"}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                Score: {match.team2Score ?? "-"}
              </span>
            </div>
            {hasResult && (
              <span className={`px-2 py-1 rounded font-mono text-xs font-bold uppercase whitespace-nowrap ${
                match.winnerId === match.team2Id
                  ? "bg-green-500/20 text-green-400 border border-green-500/50"
                  : "bg-red-500/20 text-red-400 border border-red-500/50"
              }`}>
                {match.winnerId === match.team2Id ? "WON" : "LOST"}
              </span>
            )}
          </div>

          {!hasResult && (
            <div className="mt-2 text-[10px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity text-center">
              Click to edit
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Team 1 Winner Button */}
          <button
            onClick={() => setWinnerId(match.team1Id)}
            className={`w-full p-3 border-2 rounded transition-all text-left ${
              winnerId === match.team1Id
                ? "border-primary bg-primary/15"
                : "border-border hover:border-primary/50"
            }`}
          >
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1">Team 1</p>
            <p className="font-mono text-sm font-bold text-foreground mb-2">{match.team1 || "TBD"}</p>
            <input
              type="number"
              value={team1Score}
              onChange={(e) => setTeam1Score(parseInt(e.target.value) || 0)}
              placeholder="Score"
              className="w-full px-2 py-1 border border-border bg-background text-foreground font-mono text-sm rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </button>

          {/* Team 2 Winner Button */}
          <button
            onClick={() => setWinnerId(match.team2Id)}
            className={`w-full p-3 border-2 rounded transition-all text-left ${
              winnerId === match.team2Id
                ? "border-primary bg-primary/15"
                : "border-border hover:border-primary/50"
            }`}
          >
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1">Team 2</p>
            <p className="font-mono text-sm font-bold text-foreground mb-2">{match.team2 || "TBD"}</p>
            <input
              type="number"
              value={team2Score}
              onChange={(e) => setTeam2Score(parseInt(e.target.value) || 0)}
              placeholder="Score"
              className="w-full px-2 py-1 border border-border bg-background text-foreground font-mono text-sm rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </button>

          {/* Save/Cancel Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={updateMatchMutation.isPending}
              className="flex-1 font-mono text-xs uppercase"
              size="sm"
            >
              {updateMatchMutation.isPending ? "..." : "Save"}
            </Button>
            <Button
              onClick={() => {
                setIsEditing(false);
                setTeam1Score(match.team1Score || 0);
                setTeam2Score(match.team2Score || 0);
                setWinnerId(match.winnerId || 0);
              }}
              variant="outline"
              className="flex-1 font-mono text-xs uppercase"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
