import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { Copy, CheckCircle2, Clock, XCircle, Twitch, Youtube, Instagram, Link, Trophy, Brackets, Check, ZoomIn, ZoomOut, ShieldCheck, Sparkles, Settings2, CircleDashed } from "lucide-react";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-4 w-4"}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className || "h-4 w-4"}>
    <path d="M20.317 4.367C18.7975 3.637 17.147 3.12 15.3917 2.886C15.1597 3.296 14.8789 3.867 14.6725 4.287C12.8156 3.965 11.0812 3.965 9.36469 4.287C9.15823 3.867 8.8732 3.296 8.64077 2.886C6.88231 3.12 5.23274 3.637 3.71325 4.367C0.533471 8.948-0.31895 13.352 0.0991801 17.699C2.18421 19.341 4.17871 20.329 6.12328 20.931C6.62077 20.203 7.04892 19.434 7.3931 18.616C6.52975 18.352 5.71422 18.023 4.96578 17.634C5.13087 17.519 5.29356 17.401 5.45272 17.286C9.59662 19.633 14.6997 19.633 18.7231 17.286C18.8823 17.401 19.045 17.519 19.2101 17.634C18.4616 18.023 17.6461 18.352 16.7827 18.616C17.1269 19.434 17.5551 20.203 18.0526 20.931C19.9973 20.329 21.9918 19.341 24.0771 17.699C24.5588 12.738 23.1957 8.387 20.317 4.367ZM8.02109 14.768C6.8789 14.768 5.98635 13.78 5.98635 12.572C5.98635 11.364 6.855 10.375 8.02109 10.375C9.18719 10.375 10.0881 11.364 10.0881 12.572C10.0881 13.78 9.18719 14.768 8.02109 14.768ZM15.6559 14.768C14.5138 14.768 13.6212 13.78 13.6212 12.572C13.6212 11.364 14.4873 10.375 15.6559 10.375C16.822 10.375 17.7286 11.364 17.7286 12.572C17.7286 13.78 16.822 14.768 15.6559 14.768Z"/>
  </svg>
);
import { AdminBracketView } from "@/components/AdminBracketView";
import { AdminFortuneWheel } from "@/components/AdminFortuneWheel";
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
import type { AppRouter } from "../../../server/routers";
import type { inferRouterOutputs } from "@trpc/server";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type AdminTeam = RouterOutputs["teams"]["admin"]["listAll"][number];

export default function Admin() {
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminToken, setAdminToken] = useState<string>(() => localStorage.getItem("adminToken") ?? "");
  const [tempToken, setTempToken] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified" | "rejected" | "wheel_selected">("all");
  const [activeTab, setActiveTab] = useState("tournament");
  const [bracketFullSize, setBracketFullSize] = useState(false);
  const [tournamentDate, setTournamentDate] = useState("");
  const [tournamentTime, setTournamentTime] = useState("");

  const isLoggedIn = !!adminToken;
  const isAwaitingVerification = !!tempToken && !isLoggedIn;

  const { data: allTeams = [], refetch: refetchTeams, error: teamsError } = trpc.teams.admin.listAll.useQuery(
    { token: adminToken, search: searchQuery, status: filterStatus === "all" ? undefined : filterStatus },
    { enabled: isLoggedIn }
  );
  const filteredTeams = allTeams.filter((team: AdminTeam) => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return true;
    }

    return [
      team.teamName,
      team.player1Name,
      team.player2Name,
      team.email,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedQuery));
  });

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

  const adminLoginMutation = trpc.admin.login.useMutation({
    onSuccess: (data) => {
      setTempToken(data.tempToken);
      setPendingEmail(data.email);
      setVerificationCode("");
      setAdminPassword("");
      toast.success("Verification code sent to your email.");
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const verifyCodeMutation = trpc.admin.verify2FACode.useMutation({
    onSuccess: (data) => {
      localStorage.setItem("adminToken", data.token);
      setAdminToken(data.token);
      setTempToken("");
      setPendingEmail("");
      setVerificationCode("");
      setAdminEmail("");
      setAdminPassword("");
      toast.success("Logged in successfully!");
    },
    onError: (error) => {
      toast.error(error.message || "Verification failed");
    },
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    adminLoginMutation.mutate({
      email: adminEmail.trim(),
      password: adminPassword,
    });
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempToken) {
      toast.error("Verification session expired. Please log in again.");
      return;
    }

    verifyCodeMutation.mutate({
      tempToken,
      code: verificationCode.trim(),
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setAdminToken("");
    setTempToken("");
    setPendingEmail("");
    setVerificationCode("");
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
              {!isAwaitingVerification ? (
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
                  <Button
                    type="submit"
                    disabled={adminLoginMutation.isPending}
                    className="w-full font-mono text-xs uppercase"
                  >
                    {adminLoginMutation.isPending ? "Sending Code..." : "Login"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
                    <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">Verification Required</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Enter the 6-digit code sent to {pendingEmail || adminEmail}.
                    </p>
                  </div>
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
                      Verification Code
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="123456"
                      className="font-mono text-sm border-2 border-border bg-card text-foreground"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={verifyCodeMutation.isPending || verificationCode.trim().length !== 6}
                      className="flex-1 font-mono text-xs uppercase"
                    >
                      {verifyCodeMutation.isPending ? "Verifying..." : "Verify Code"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="font-mono text-xs uppercase"
                      onClick={() => {
                        setTempToken("");
                        setPendingEmail("");
                        setVerificationCode("");
                      }}
                    >
                      Back
                    </Button>
                  </div>
                </form>
              )}
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
            <TabsList className="mb-8 grid w-full grid-cols-4 gap-0 rounded-full border border-primary/30 bg-primary/20 p-3">
              <TabsTrigger value="tournament" className="flex items-center justify-center gap-2 rounded-full border border-primary/20 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-all hover:border-primary/40 data-[state=active]:border-primary/50 data-[state=active]:bg-background/80 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                <Trophy className="h-4 w-4" />
                Tournament Settings
              </TabsTrigger>
              <TabsTrigger value="verification" className="flex items-center justify-center gap-2 rounded-full border border-primary/20 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-all hover:border-primary/40 data-[state=active]:border-primary/50 data-[state=active]:bg-background/80 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                <CheckCircle2 className="h-4 w-4" />
                Verification
              </TabsTrigger>
              <TabsTrigger value="bracket" className="flex items-center justify-center gap-2 rounded-full border border-primary/20 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-all hover:border-primary/40 data-[state=active]:border-primary/50 data-[state=active]:bg-background/80 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                <Brackets className="h-4 w-4" />
                Bracket Results
              </TabsTrigger>
              <TabsTrigger value="wheel" className="flex items-center justify-center gap-2 rounded-full border border-primary/20 px-4 py-3 font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground transition-all hover:border-primary/40 data-[state=active]:border-primary/50 data-[state=active]:bg-background/80 data-[state=active]:text-primary data-[state=active]:shadow-[0_0_20px_rgba(168,85,247,0.35)]">
                <CircleDashed className="h-4 w-4" />
                Fortune Wheel
              </TabsTrigger>
            </TabsList>

            {/* Tournament Settings Tab */}
            <TabsContent value="tournament" className="space-y-6">
              {/* Status Overview Card */}
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-mono text-lg font-black uppercase tracking-tight text-primary">
                    Tournament Status
                  </h2>
                  <span className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-[0.15em] ${
                    tournamentStatus?.status === "live" 
                      ? "bg-red-500/20 border border-red-500/40 text-red-400" 
                      : "bg-green-500/20 border border-green-500/40 text-green-400"
                  }`}>
                    <span className={`h-2 w-2 rounded-full ${tournamentStatus?.status === "live" ? "bg-red-500 animate-pulse" : "bg-green-500"}`} />
                    {tournamentStatus?.status === "live" ? "LIVE" : "Registration Open"}
                  </span>
                </div>
                <p className="font-mono text-3xl font-black text-foreground">
                  {allTeams.filter((t: any) => t.status !== "rejected").length}<span className="text-muted-foreground text-lg">/64</span> <span className="text-sm font-normal text-muted-foreground">Teams Registered</span>
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: "Total Teams", value: allTeams.length, color: "text-primary" },
                  { label: "Pending", value: allTeams.filter((t: any) => t.status === "pending").length, color: "text-yellow-400" },
                  { label: "Verified", value: allTeams.filter((t: any) => t.status === "verified").length, color: "text-green-400" },
                  { label: "Wheel Selected", value: allTeams.filter((t: any) => t.status === "wheel_selected").length, color: "text-primary" },
                  { label: "Rejected", value: allTeams.filter((t: any) => t.status === "rejected").length, color: "text-red-400" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl border border-border/60 bg-background/60 p-4 text-center">
                    <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{stat.label}</p>
                    <p className={`font-mono text-3xl font-black mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Schedule Settings */}
              <div className="rounded-2xl border border-border/60 bg-background/40 p-6">
                <h3 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">Schedule</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                      Start Date
                    </label>
                    <Input
                      type="date"
                      value={tournamentDate}
                      onChange={(e) => setTournamentDate(e.target.value)}
                      className="font-mono text-sm border border-border/60 bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2">
                      Start Time
                    </label>
                    <Input
                      type="time"
                      value={tournamentTime}
                      onChange={(e) => setTournamentTime(e.target.value)}
                      className="font-mono text-sm border border-border/60 bg-background text-foreground"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="rounded-2xl border border-border/60 bg-background/40 p-6">
                <h3 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-primary mb-4">Actions</h3>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => {
                      if (!adminToken) { toast.error("Admin token not found"); return; }
                      startTournamentMutation.mutate({ token: adminToken });
                    }}
                    disabled={startTournamentMutation.isPending}
                    className="font-mono text-xs uppercase px-6"
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
                    className="font-mono text-xs uppercase px-6"
                  >
                    {resetTimerMutation.isPending ? "Resetting..." : "Reset Timer"}
                  </Button>
                </div>
              </div>

              {/* Test Data Section */}
              <div className="rounded-2xl border border-dashed border-yellow-500/30 bg-yellow-500/5 p-6">
                <h3 className="font-mono text-sm font-bold uppercase tracking-[0.2em] text-yellow-400 mb-3">Testing</h3>
                <p className="font-mono text-xs text-yellow-400/60 mb-4">
                  Seed 64 verified test teams, then hit "Start Tournament" to generate the bracket.
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Button
                    onClick={() => {
                      if (!adminToken) { toast.error("Admin token not found"); return; }
                      seedTestTeamsMutation.mutate({ token: adminToken });
                    }}
                    disabled={seedTestTeamsMutation.isPending}
                    className="font-mono text-xs uppercase bg-yellow-600 hover:bg-yellow-500 text-black"
                  >
                    {seedTestTeamsMutation.isPending ? "Seeding..." : "Seed 64 Test Teams"}
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
                    {clearTestTeamsMutation.isPending ? "Clearing..." : "Clear Test Teams"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="wheel" className="space-y-6">
              <AdminFortuneWheel adminToken={adminToken} />
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
                  {(["all", "pending", "verified", "wheel_selected", "rejected"] as const).map((status) => (
                    <Button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      variant={filterStatus === status ? "default" : "outline"}
                      className="font-mono text-xs uppercase"
                    >
                      {status === "all"
                        ? "All Teams"
                        : status === "pending"
                          ? "Pending"
                          : status === "verified"
                            ? "Verified"
                            : status === "wheel_selected"
                              ? "Wheel Selected"
                              : "Rejected"} ({status === "all" ? allTeams.length : allTeams.filter((t: any) => t.status === status).length})
                    </Button>
                  ))}
                </div>

                <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Showing {filteredTeams.length} team{filteredTeams.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="space-y-6">
                {filteredTeams.map((team) => (
                  <TeamCard key={team.id} team={team} onSuccess={() => refetchTeams()} adminToken={adminToken || ""} />
                ))}
                {filteredTeams.length === 0 && (
                  <div className="rounded-xl border border-dashed border-border bg-card/60 px-6 py-10 text-center">
                    <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">No teams found</p>
                    <p className="mt-2 text-sm text-muted-foreground">Try a different search term or status filter.</p>
                  </div>
                )}
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
                <div className="rounded-2xl border border-primary/15 bg-card/70 p-4 shadow-[0_0_24px_rgba(168,85,247,0.08)]">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.25em] text-primary/80">Bracket View</p>
                      <p className="text-sm text-muted-foreground">Switch between responsive zoomed mode and full-size horizontal scroll.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setBracketFullSize((current) => !current)}
                      className="border-primary/35 bg-background/70 font-mono text-xs uppercase tracking-[0.2em] text-primary hover:border-primary hover:bg-primary/10"
                    >
                      {bracketFullSize ? <ZoomOut className="mr-2 h-4 w-4" /> : <ZoomIn className="mr-2 h-4 w-4" />}
                      {bracketFullSize ? "Zoomed" : "Full Size"}
                    </Button>
                  </div>
                  <AdminBracketView matches={bracketData.matches || []} fullSize={bracketFullSize} />
                </div>
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

type VerifiedFieldKey =
  | "player1TrackerLink"
  | "player1Tracker"
  | "player1Twitch"
  | "player1YouTube"
  | "player1Instagram"
  | "player1TikTok"
  | "player1Discord"
  | "player2TrackerLink"
  | "player2Tracker"
  | "player2Twitch"
  | "player2YouTube"
  | "player2Instagram"
  | "player2TikTok"
  | "player2Discord";

const verificationSections: Array<{
  title: string;
  playerNameKey: "player1Name" | "player2Name";
  fields: Array<{ key: VerifiedFieldKey; label: string; icon?: any; valueKey: string }>;
}> = [
  {
    title: "Player 1",
    playerNameKey: "player1Name",
    fields: [
      { key: "player1TrackerLink", label: "Tracker", icon: Link, valueKey: "player1TrackerLink" },
      { key: "player1Twitch", label: "Twitch", icon: Twitch, valueKey: "player1TwitchName" },
      { key: "player1YouTube", label: "YouTube", icon: Youtube, valueKey: "player1YouTubeName" },
      { key: "player1Instagram", label: "Instagram", icon: Instagram, valueKey: "player1InstagramName" },
      { key: "player1TikTok", label: "TikTok", icon: TikTokIcon, valueKey: "player1TikTokName" },
      { key: "player1Discord", label: "Discord", icon: DiscordIcon, valueKey: "player1DiscordName" },
    ],
  },
  {
    title: "Player 2",
    playerNameKey: "player2Name",
    fields: [
      { key: "player2TrackerLink", label: "Tracker", icon: Link, valueKey: "player2TrackerLink" },
      { key: "player2Twitch", label: "Twitch", icon: Twitch, valueKey: "player2TwitchName" },
      { key: "player2YouTube", label: "YouTube", icon: Youtube, valueKey: "player2YouTubeName" },
      { key: "player2Instagram", label: "Instagram", icon: Instagram, valueKey: "player2InstagramName" },
      { key: "player2TikTok", label: "TikTok", icon: TikTokIcon, valueKey: "player2TikTokName" },
      { key: "player2Discord", label: "Discord", icon: DiscordIcon, valueKey: "player2DiscordName" },
    ],
  },
];

function TeamCard({ team, onSuccess, adminToken }: TeamCardProps) {
  const [showUnverifyConfirm, setShowUnverifyConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [pendingUncheckField, setPendingUncheckField] = useState<VerifiedFieldKey | null>(null);
  const [verifiedFields, setVerifiedFields] = useState({
    player1TrackerLink: false,
    player1Tracker: false,
    player1Twitch: false,
    player1YouTube: false,
    player1Instagram: false,
    player1TikTok: false,
    player1Discord: false,
    player2TrackerLink: false,
    player2Tracker: false,
    player2Twitch: false,
    player2YouTube: false,
    player2Instagram: false,
    player2TikTok: false,
    player2Discord: false,
  });

  const isVerified = team.status === "verified";
  const isRejected = team.status === "rejected";
  const isWheelSelected = team.status === "wheel_selected";
  const rejectionReason = team.rejectionReason?.trim() || "No reason provided";
  const totalChecks = Object.keys(verifiedFields).length;
  const completedChecks = Object.values(verifiedFields).filter(Boolean).length;
  const completionPercent = Math.round((completedChecks / totalChecks) * 100);
  const missingFields = verificationSections.flatMap((section) =>
    section.fields
      .filter((field) => !team[field.valueKey])
      .map((field) => `${team[section.playerNameKey]} · ${field.label}`)
  );
  const canVerify = completedChecks > 0;

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
    // Reset all checkboxes
    setVerifiedFields(current => {
      const reset: any = {};
      Object.keys(current).forEach(key => { reset[key] = false; });
      return reset;
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

  const toggleVerifiedField = (field: VerifiedFieldKey) => {
    // If team is verified and user is trying to UNCHECK, show warning
    if (isVerified && verifiedFields[field]) {
      setPendingUncheckField(field);
      return;
    }
    setVerifiedFields((current) => ({
      ...current,
      [field]: !current[field],
    }));
  };

  const confirmUncheckField = () => {
    if (pendingUncheckField) {
      setVerifiedFields((current) => ({
        ...current,
        [pendingUncheckField]: false,
      }));
      // Unverify the team since a platform was unchecked
      confirmUnverify();
      setPendingUncheckField(null);
    }
  };

  return (
    <>
      <div className={`rounded-2xl border bg-card/95 p-6 shadow-[0_0_24px_rgba(168,85,247,0.08)] transition-all hover:shadow-[0_0_32px_rgba(168,85,247,0.14)] ${
        isWheelSelected
          ? "border-primary/40 shadow-[0_0_28px_rgba(168,85,247,0.18)] hover:border-primary/60"
          : "border-primary/15 hover:border-primary/40"
      }`}>
        <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="font-mono text-xl font-black uppercase tracking-tight text-foreground">{team.teamName}</h3>
                <span className={`px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] border rounded-full ${
                  isWheelSelected ? "border-primary/60 bg-primary/20 text-primary shadow-[0_0_18px_rgba(168,85,247,0.22)]" :
                  isVerified ? "border-green-500/50 bg-green-500/10 text-green-400" :
                  isRejected ? "border-destructive bg-destructive/10 text-destructive" :
                  "border-secondary bg-secondary/10 text-secondary"
                }`}>
                  {isWheelSelected ? "Wheel Selected" : isVerified ? "Verified" : isRejected ? "Rejected" : "Pending"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{team.region || "Region not provided"}</p>
            </div>

            {isRejected && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 shadow-[0_0_18px_rgba(239,68,68,0.12)]">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-red-300">Rejection Reason</p>
                <p className="mt-2 font-mono text-sm text-red-100">{rejectionReason}</p>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-background/60 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Player 1</p>
                <p className="mt-2 font-mono text-sm font-bold text-foreground">{team.player1Name}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/60 px-4 py-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Player 2</p>
                <p className="mt-2 font-mono text-sm font-bold text-foreground">{team.player2Name}</p>
              </div>

            </div>
          </div>

        </div>

        <div className="mb-5 grid gap-4 xl:grid-cols-2">
          {verificationSections.map((section) => (
            <div key={section.title} className="rounded-2xl border border-primary/15 bg-background/50 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary/80">{section.title}</p>
                  <p className="mt-1 font-mono text-base font-bold text-foreground">{team[section.playerNameKey]}</p>
                </div>
                <span className="rounded-full border border-border/70 bg-card px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {section.fields.filter((field) => verifiedFields[field.key]).length}/{section.fields.length} checked
                </span>
              </div>
              <div className="space-y-2.5">
                {section.fields.map((field) => {
                  const Icon = field.icon ?? CheckCircle2;
                  const checked = verifiedFields[field.key];
                  const rawValue = team[field.valueKey];
                  const hasValue = Boolean(rawValue);
                  const displayValue = rawValue ? String(rawValue) : "Not provided";
                  return (
                    <button
                      key={field.key}
                      type="button"
                      onClick={() => toggleVerifiedField(field.key)}
                      className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-all ${
                        checked
                          ? "border-primary/60 bg-primary/10 shadow-[0_0_16px_rgba(168,85,247,0.18)]"
                          : hasValue
                            ? "border-border/70 bg-card hover:border-primary/35 hover:bg-primary/5"
                            : "border-dashed border-border/70 bg-background/70 hover:border-primary/25"
                      }`}
                    >
                      <span className="flex min-w-0 items-start gap-3">
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
                          checked ? "border-primary/50 bg-primary/15" : "border-border/70 bg-background"
                        }`}>
                          <Icon className={`h-4 w-4 ${checked ? "text-primary" : hasValue ? "text-muted-foreground" : "text-muted-foreground/60"}`} />
                        </span>
                        <span className="min-w-0">
                          <span className="block font-mono text-[11px] uppercase tracking-[0.18em] text-foreground">{field.label}</span>
                          <span className={`mt-1 block break-all text-xs ${hasValue ? "text-muted-foreground" : "text-muted-foreground/70 italic"}`}>
                            {displayValue}
                          </span>
                        </span>
                      </span>
                      <span className="ml-3 flex shrink-0 items-center gap-2">
                        {!hasValue && (
                          <span className="rounded-full border border-border/70 bg-background px-2 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
                            Missing
                          </span>
                        )}
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-md border ${
                            checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                          }`}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {/* Verify Player Button */}
              {(() => {
                const allChecked = section.fields.every(f => verifiedFields[f.key]);
                const toggleAll = () => {
                  // If team is verified and trying to uncheck all, show warning
                  if (isVerified && allChecked) {
                    setPendingUncheckField(section.fields[0].key);
                    return;
                  }
                  const newValue = !allChecked;
                  const updates: any = {};
                  section.fields.forEach(f => { updates[f.key] = newValue; });
                  setVerifiedFields(current => ({ ...current, ...updates }));
                };
                return (
                  <button
                    type="button"
                    onClick={toggleAll}
                    className={`mt-4 w-full rounded-xl border px-4 py-3 font-mono text-xs uppercase tracking-[0.18em] transition-all ${
                      allChecked
                        ? "border-green-500 bg-green-600 text-white shadow-[0_0_16px_rgba(34,197,94,0.3)]"
                        : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                    }`}
                  >
                    {allChecked ? `${section.title} Verified` : `Verify ${section.title}`}
                  </button>
                );
              })()}
            </div>
          ))}
        </div>

        {/* Verify Team Button */}
        <div className="flex gap-3">
          {(() => {
            const bothPlayersVerified = verificationSections.every(section => section.fields.every(f => verifiedFields[f.key]));
            return (
              <button
                type="button"
                onClick={() => {
                  if (isVerified) {
                    confirmUnverify();
                  } else {
                    // Set all checkboxes to true when verifying team
                    const allTrue: any = {};
                    verificationSections.forEach(s => s.fields.forEach(f => { allTrue[f.key] = true; }));
                    setVerifiedFields(current => ({ ...current, ...allTrue }));
                    handleVerify();
                  }
                }}
                disabled={updateStatusMutation.isPending}
                className={`flex-1 rounded-xl border px-4 py-4 font-mono text-sm uppercase tracking-[0.18em] transition-all ${
                  isVerified || bothPlayersVerified
                    ? "border-green-500 bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                    : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                }`}
              >
                {updateStatusMutation.isPending ? "..." : isVerified ? "Verified (Click to Undo)" : "Verify Team"}
              </button>
            );
          })()}
          {!isVerified && (
            <Button
              onClick={handleReject}
              disabled={updateStatusMutation.isPending}
              className="font-mono text-xs uppercase"
              variant="outline"
            >
              Reject
            </Button>
          )}
        </div>
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

      {/* Uncheck Platform Warning Dialog */}
      <AlertDialog open={pendingUncheckField !== null} onOpenChange={(open) => { if (!open) setPendingUncheckField(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unverify Platform?</AlertDialogTitle>
            <AlertDialogDescription>
              Unchecking this platform will unverify the entire team <strong>{team.teamName}</strong>. Are you sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUncheckField} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Unverify
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

