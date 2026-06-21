import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Maximize, Minimize, Sparkles, Trophy } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminFortuneWheelProps {
  adminToken: string;
}

type WheelTeam = {
  id: number;
  teamName: string;
  player1Name: string;
  player2Name: string;
};

const WHEEL_COLORS = [
  "#7c3aed",
  "#9333ea",
  "#a855f7",
  "#c084fc",
  "#6d28d9",
  "#8b5cf6",
  "#7e22ce",
  "#581c87",
];

const BASE_ROTATIONS = 10;
const BASE_SPIN_MS = 8000;
const MAX_SELECTED_TEAMS = 64;

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

function normalizeRotation(rotation: number) {
  const fullCircle = Math.PI * 2;
  return ((rotation % fullCircle) + fullCircle) % fullCircle;
}

function truncateLabel(label: string, maxLength: number) {
  return label.length > maxLength ? `${label.slice(0, maxLength - 1)}…` : label;
}

export function AdminFortuneWheel({ adminToken }: AdminFortuneWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fullscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<WheelTeam | null>(null);
  const [pendingBanTeam, setPendingBanTeam] = useState<WheelTeam | null>(null);
  const [eligibleSearch, setEligibleSearch] = useState("");
  const [fullscreen, setFullscreen] = useState(false);

  const poolQuery = trpc.teams.admin.getWheelPool.useQuery(
    { token: adminToken },
    { enabled: Boolean(adminToken) }
  );
  const statsQuery = trpc.teams.admin.getWheelStats.useQuery(
    { token: adminToken },
    { enabled: Boolean(adminToken) }
  );

  const acceptMutation = trpc.teams.admin.acceptWheelTeam.useMutation({
    onSuccess: async () => {
      toast.success("Team accepted from the wheel.");
      setSelectedTeam(null);
      await Promise.all([poolQuery.refetch(), statsQuery.refetch()]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to accept team.");
    },
  });

  const banMutation = trpc.teams.admin.banWheelTeam.useMutation({
    onSuccess: async () => {
      toast.success("Team banned from the wheel.");
      setSelectedTeam(null);
      setPendingBanTeam(null);
      await Promise.all([poolQuery.refetch(), statsQuery.refetch()]);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to ban team.");
    },
  });

  const teams = poolQuery.data ?? [];
  const stats = statsQuery.data;
  const selectedCount = stats?.selectedCount ?? 0;
  const eligibleCount = stats?.eligibleCount ?? teams.length;
  const hasReachedLimit = selectedCount >= MAX_SELECTED_TEAMS;
  const canSpin = !isSpinning && teams.length > 0 && !hasReachedLimit;

  const wheelTeams = useMemo(() => teams, [teams]);
  const filteredEligibleTeams = useMemo(() => {
    const query = eligibleSearch.trim().toLowerCase();
    if (!query) {
      return teams;
    }

    return teams.filter((team) => team.teamName.toLowerCase().includes(query));
  }, [eligibleSearch, teams]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const drawWheel = (canvas: HTMLCanvasElement | null, size: number) => {
      if (!canvas) {
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        return;
      }

      const radius = size / 2 - 24;
      const center = size / 2;
      const devicePixelRatio = window.devicePixelRatio || 1;

      canvas.width = size * devicePixelRatio;
      canvas.height = size * devicePixelRatio;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      context.clearRect(0, 0, size, size);

      context.save();
      context.translate(center, center);
      context.rotate(rotation - Math.PI / 2);

      if (wheelTeams.length === 0) {
        context.beginPath();
        context.arc(0, 0, radius, 0, Math.PI * 2);
        context.fillStyle = "rgba(88, 28, 135, 0.35)";
        context.fill();
        context.lineWidth = 3;
        context.strokeStyle = "rgba(192, 132, 252, 0.35)";
        context.stroke();
        context.restore();

        context.fillStyle = "#f5f3ff";
        context.font = "700 24px Outfit, ui-sans-serif, system-ui, sans-serif";
        context.textAlign = "center";
        context.fillText("No eligible teams", center, center + 8);
        return;
      }

      const segmentAngle = (Math.PI * 2) / wheelTeams.length;

      for (let index = 0; index < wheelTeams.length; index += 1) {
        const team = wheelTeams[index];
        const startAngle = index * segmentAngle;
        const endAngle = startAngle + segmentAngle;
        const color = WHEEL_COLORS[index % WHEEL_COLORS.length];

        context.beginPath();
        context.moveTo(0, 0);
        context.arc(0, 0, radius, startAngle, endAngle);
        context.closePath();
        context.fillStyle = color;
        context.fill();
        context.lineWidth = 2;
        context.strokeStyle = "rgba(10, 6, 20, 0.55)";
        context.stroke();

        // Draw label along the segment radius
        const midAngle = startAngle + segmentAngle / 2;
        context.save();
        context.rotate(midAngle);
        // Text reads outward along the radius
        context.textAlign = "right";
        context.textBaseline = "middle";
        context.fillStyle = "white";
        const fontSize = Math.max(9, Math.min(size * 0.028, Math.floor(size * 0.8 / wheelTeams.length)));
        context.font = `bold ${fontSize}px Outfit`;
        context.shadowColor = "rgba(0,0,0,0.8)";
        context.shadowBlur = 4;
        const rawName = team.teamName || `Team ${index + 1}`;
        const label = rawName.length > 14 ? rawName.slice(0, 13) + "..." : rawName;
        // Draw near outer edge where the segment is widest
        context.fillText(label, radius * 0.92, 0);
        context.shadowBlur = 0;
        context.restore();
      }

      context.beginPath();
      context.arc(0, 0, radius * 0.18, 0, Math.PI * 2);
      context.fillStyle = "#12071f";
      context.fill();
      context.lineWidth = 4;
      context.strokeStyle = "rgba(216, 180, 254, 0.85)";
      context.stroke();
      context.restore();
    };

    drawWheel(canvasRef.current, 520);
    drawWheel(fullscreenCanvasRef.current, Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9));
  }, [fullscreen, rotation, wheelTeams]);

  const handleSpin = () => {
    if (!canSpin) {
      return;
    }

    const winningIndex = Math.floor(Math.random() * wheelTeams.length);
    const segmentAngle = (Math.PI * 2) / wheelTeams.length;
    const targetCenterAngle = winningIndex * segmentAngle + segmentAngle / 2;
    // Randomize spin speed each time
    const spinRotations = BASE_ROTATIONS + Math.floor(Math.random() * 8);
    const spinDuration = BASE_SPIN_MS + Math.floor(Math.random() * 5000);
    const normalizedCurrent = normalizeRotation(rotation);
    const targetRotation =
      rotation +
      spinRotations * Math.PI * 2 +
      ((Math.PI * 2 - targetCenterAngle) - normalizedCurrent + Math.PI * 2) % (Math.PI * 2);

    setIsSpinning(true);
    setSelectedTeam(null);

    const startRotation = rotation;
    const startTime = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const easedProgress = easeOutCubic(progress);
      const nextRotation = startRotation + (targetRotation - startRotation) * easedProgress;

      setRotation(nextRotation);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      animationFrameRef.current = null;
      setRotation(targetRotation);
      setIsSpinning(false);
      setSelectedTeam(wheelTeams[winningIndex] ?? null);
    };

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleAccept = () => {
    if (!selectedTeam) {
      return;
    }

    acceptMutation.mutate({
      teamId: selectedTeam.id,
      token: adminToken,
    });
  };

  const handleBan = () => {
    if (!pendingBanTeam) {
      return;
    }

    banMutation.mutate({
      teamId: pendingBanTeam.id,
      token: adminToken,
    });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setFullscreen(true);
        document.body.style.overflow = "hidden";
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setFullscreen(false);
        document.body.style.overflow = "";
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement) {
        setFullscreen(false);
        document.body.style.overflow = "";
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
        <div className="card-glow relative rounded-[32px] border border-primary/25 bg-[radial-gradient(circle_at_top,rgba(168,85,247,0.22),rgba(10,6,20,0.92)_58%)] p-6 shadow-[0_0_40px_rgba(88,28,135,0.28)]">
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute right-5 top-5 z-20 rounded-lg bg-white/10 p-2 text-white/70 transition hover:bg-white/20 hover:text-white"
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-primary/80">Admin Fortune Wheel</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-white">Spin for the next team</h2>
              <p className="mt-2 max-w-2xl text-sm text-purple-100/70">
                Randomly draw from all currently eligible teams, then accept, reroll, or ban the result.
              </p>
            </div>
          </div>

          <div className="relative mx-auto flex w-full max-w-[560px] items-center justify-center">
            <div className="pointer-events-none absolute top-2 z-10 flex h-0 w-0 -translate-y-1 border-l-[18px] border-r-[18px] border-t-[34px] border-l-transparent border-r-transparent border-t-primary drop-shadow-[0_0_18px_rgba(168,85,247,0.8)]" />
            <div className="rounded-full border border-primary/25 bg-black/30 p-4 shadow-[0_0_30px_rgba(168,85,247,0.18)]">
              <canvas ref={canvasRef} className="max-w-full rounded-full" aria-label="Fortune wheel" />
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button
                onClick={handleSpin}
                disabled={!canSpin}
                className="min-w-[220px] rounded-full bg-primary px-8 py-6 font-mono text-sm uppercase tracking-[0.24em] text-primary-foreground shadow-[0_0_24px_rgba(168,85,247,0.45)] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSpinning ? "Spinning..." : "Spin Wheel"}
              </Button>
            </div>
            <p className="text-center text-sm text-purple-100/65">
              {hasReachedLimit
                ? "All 64 teams have already been selected."
                : teams.length === 0
                  ? "There are no eligible teams left in the wheel pool."
                  : "The wheel will stop on a random eligible team."}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-glow rounded-[28px] border border-primary/25 bg-black/35 p-6">
            <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary/80">Selection Progress</p>
            <div className="mt-4 grid gap-4">
              <div className="rounded-2xl border border-primary/20 bg-primary/10 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-purple-100/70">Verified:</p>
                <p className="mt-2 text-4xl font-black text-white">{stats?.verifiedCount ?? 0} / {MAX_SELECTED_TEAMS}</p>
              </div>
              <div className="rounded-2xl border border-primary/20 bg-black/25 p-5">
                <p className="font-mono text-xs uppercase tracking-[0.18em] text-purple-100/70">Selected:</p>
                <p className="mt-2 text-4xl font-black text-white">{selectedCount}</p>
              </div>
            </div>
          </div>

          <div className="card-glow rounded-[28px] border border-primary/25 bg-black/35 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-primary/80">Wheel Pool</p>
                <h3 className="mt-2 text-xl font-bold text-white">Eligible teams ({eligibleCount})</h3>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  void poolQuery.refetch();
                  void statsQuery.refetch();
                }}
                className="font-mono text-xs uppercase"
              >
                Refresh
              </Button>
            </div>

            <input
              type="text"
              value={eligibleSearch}
              onChange={(event) => setEligibleSearch(event.target.value)}
              placeholder="Search teams..."
              className="mt-4 w-full rounded-2xl border border-primary/25 bg-[#140a24] px-4 py-3 font-['Outfit'] text-sm text-white outline-none transition placeholder:text-purple-100/45 focus:border-primary focus:ring-2 focus:ring-primary/30"
            />

            <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {poolQuery.isLoading || statsQuery.isLoading ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-purple-100/70">
                  Loading wheel data...
                </div>
              ) : filteredEligibleTeams.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 p-4 text-sm text-purple-100/70">
                  {eligibleSearch.trim() ? "No teams match that search." : "No teams are currently eligible for the wheel."}
                </div>
              ) : (
                filteredEligibleTeams.map((team: WheelTeam, index: number) => (
                  <div
                    key={team.id}
                    className="rounded-2xl border border-primary/15 bg-background/60 px-4 py-3"
                  >
                    <p className="truncate text-sm font-semibold text-white">{index + 1}. {team.teamName}</p>
                    <p className="mt-1 text-xs text-purple-100/60">
                      {team.player1Name} & {team.player2Name}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen overlay — rendered via portal to cover everything */}
      {fullscreen ? createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="absolute right-6 top-6 z-20 rounded-lg bg-white/10 p-2.5 text-white/70 transition hover:bg-white/20 hover:text-white"
          >
            <Minimize className="h-6 w-6" />
          </button>

          {/* Wheel centered */}
          <div className="relative flex flex-col items-center">
            <div className="pointer-events-none z-20 mb-[-12px] h-0 w-0 border-l-[28px] border-r-[28px] border-t-[50px] border-l-transparent border-r-transparent border-t-primary drop-shadow-[0_0_24px_rgba(168,85,247,0.95)]" />
            <div className="rounded-full border-2 border-primary/30 p-4 shadow-[0_0_60px_rgba(168,85,247,0.25)]">
              <canvas ref={fullscreenCanvasRef} className="rounded-full" aria-label="Fortune wheel fullscreen" />
            </div>
          </div>

          {/* Controls on the right */}
          <div className="absolute right-10 top-1/2 flex -translate-y-1/2 flex-col items-center gap-6">
            <Button
              onClick={handleSpin}
              disabled={!canSpin}
              className="min-w-[200px] rounded-full bg-primary px-12 py-8 font-mono text-lg uppercase tracking-[0.24em] text-primary-foreground shadow-[0_0_40px_rgba(168,85,247,0.6)] hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSpinning ? "Spinning..." : "Spin"}
            </Button>
            <p className="font-mono text-sm uppercase tracking-widest text-purple-300/50">
              {selectedCount} / {MAX_SELECTED_TEAMS}
            </p>
          </div>

          {/* Result popup inside fullscreen portal */}
          {selectedTeam && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70">
              <div className="w-full max-w-md rounded-3xl border border-primary/30 bg-[#0d0718] p-8 text-white shadow-[0_0_60px_rgba(168,85,247,0.3)]">
                <h3 className="text-center text-2xl font-black tracking-tight text-white">Wheel Result</h3>
                <p className="mt-1 text-center text-sm text-purple-100/70">The wheel landed on this team.</p>
                <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-6 text-center">
                  <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary/80">Selected Team</p>
                  <h4 className="mt-3 text-3xl font-black text-white">{selectedTeam.teamName}</h4>
                  <p className="mt-2 text-sm text-purple-100/70">{selectedTeam.player1Name} & {selectedTeam.player2Name}</p>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <Button
                    onClick={handleAccept}
                    disabled={acceptMutation.isPending || banMutation.isPending}
                    className="bg-emerald-600 py-5 font-mono text-xs uppercase tracking-[0.18em] text-white hover:bg-emerald-500"
                  >
                    {acceptMutation.isPending ? "..." : "Accept"}
                  </Button>
                  <Button
                    onClick={() => setSelectedTeam(null)}
                    disabled={acceptMutation.isPending || banMutation.isPending}
                    className="bg-amber-500 py-5 font-mono text-xs uppercase tracking-[0.18em] text-black hover:bg-amber-400"
                  >
                    Reroll
                  </Button>
                  <Button
                    onClick={() => setPendingBanTeam(selectedTeam)}
                    disabled={acceptMutation.isPending || banMutation.isPending}
                    className="bg-red-600 py-5 font-mono text-xs uppercase tracking-[0.18em] text-white hover:bg-red-500"
                  >
                    Ban
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Ban confirmation inside fullscreen portal */}
          {pendingBanTeam && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70">
              <div className="w-full max-w-sm rounded-3xl border border-primary/30 bg-[#0d0718] p-8 text-white shadow-[0_0_60px_rgba(168,85,247,0.3)]">
                <h3 className="text-xl font-bold text-white">Ban this team from the wheel?</h3>
                <p className="mt-2 text-sm text-purple-100/70">This will remove <strong>{pendingBanTeam.teamName}</strong> from the eligible wheel pool.</p>
                <div className="mt-6 flex gap-3">
                  <Button onClick={() => setPendingBanTeam(null)} disabled={banMutation.isPending} variant="outline" className="flex-1 text-white">Cancel</Button>
                  <Button onClick={handleBan} disabled={banMutation.isPending} className="flex-1 bg-red-600 text-white hover:bg-red-500">
                    {banMutation.isPending ? "Banning..." : "Ban Team"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>, document.body
      ) : null}

      {!fullscreen && (
      <>
      <Dialog open={Boolean(selectedTeam)} onOpenChange={(open) => { if (!open && !acceptMutation.isPending && !banMutation.isPending) setSelectedTeam(null); }}>
        <DialogContent className="border border-primary/30 bg-[#0d0718] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight text-white">Wheel Result</DialogTitle>
            <DialogDescription className="text-purple-100/70">
              The wheel landed on this team. Choose what happens next.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-3xl border border-primary/20 bg-primary/10 p-6 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.24em] text-primary/80">Selected Team</p>
            <h3 className="mt-3 text-3xl font-black text-white">{selectedTeam?.teamName}</h3>
            <p className="mt-2 text-sm text-purple-100/70">
              {selectedTeam?.player1Name} & {selectedTeam?.player2Name}
            </p>
          </div>

          <DialogFooter className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button
              onClick={handleAccept}
              disabled={acceptMutation.isPending || banMutation.isPending}
              className="bg-emerald-600 font-mono text-xs uppercase tracking-[0.18em] text-white hover:bg-emerald-500"
            >
              {acceptMutation.isPending ? "Accepting..." : "Accept"}
            </Button>
            <Button
              onClick={() => setSelectedTeam(null)}
              disabled={acceptMutation.isPending || banMutation.isPending}
              className="bg-amber-500 font-mono text-xs uppercase tracking-[0.18em] text-black hover:bg-amber-400"
            >
              Reroll
            </Button>
            <Button
              onClick={() => setPendingBanTeam(selectedTeam)}
              disabled={acceptMutation.isPending || banMutation.isPending}
              className="bg-red-600 font-mono text-xs uppercase tracking-[0.18em] text-white hover:bg-red-500"
            >
              Ban
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(pendingBanTeam)} onOpenChange={(open) => { if (!open && !banMutation.isPending) setPendingBanTeam(null); }}>
        <AlertDialogContent className="border border-primary/30 bg-[#0d0718] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Ban this team from the wheel?</AlertDialogTitle>
            <AlertDialogDescription className="text-purple-100/70">
              This will remove <strong>{pendingBanTeam?.teamName}</strong> from the eligible wheel pool.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={banMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              disabled={banMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-500"
            >
              {banMutation.isPending ? "Banning..." : "Ban Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </>
      )}
    </>
  );
}