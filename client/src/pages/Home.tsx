import { useState, useEffect } from "react";
import { Link } from "wouter";
import { 
  Trophy, 
  Calendar, 
  Users, 
  ChevronRight, 
  Play, 
  Info,
  Clock,
  Coins,
  CheckCircle2,
  ChevronDown,
  LogIn,
  Users2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";
import TeamList from "@/components/TeamList";
import Loader from "@/components/Loader";
import { trpc } from "@/lib/trpc";

export default function Home() {
  const [refreshTeams, setRefreshTeams] = useState(0);
  const [teamsExpanded, setTeamsExpanded] = useState(false);
  const [teamSearch, setTeamSearch] = useState("");
  const { data: allTeams, isLoading: isTeamsLoading } = trpc.teams.list.useQuery();
  const { data: teamsCount } = trpc.teams.count.useQuery();
  const { data: tournamentStatus, isLoading: isTournamentStatusLoading } = trpc.tournament.getStatus.useQuery();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLive, setIsLive] = useState(false);
  const [showLivePulse, setShowLivePulse] = useState(false);
  const isPageLoading = isTeamsLoading || isTournamentStatusLoading;
  const verifiedTeamsCount = allTeams?.filter((team) => team.status === "verified").length ?? 0;

  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!tournamentStatus) return;

      // If tournament is live, use endTime
      if (tournamentStatus.status === "live" && tournamentStatus.endTime) {
        const endDate = new Date(tournamentStatus.endTime).getTime();
        const now = new Date().getTime();
        const difference = endDate - now;

        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          });
          setIsLive(true);
        } else {
          // Tournament ended
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          setIsLive(false);
        }
      } else {
        // Registration phase - use fixed target date
        const targetDate = new Date("2026-06-06T15:00:00+02:00").getTime();
        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference > 0) {
          setTimeLeft({
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          });
          setIsLive(false);
        } else {
          setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
          setIsLive(false);
        }
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [tournamentStatus]);

  useEffect(() => {
    if (!isLive) {
      setShowLivePulse(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setShowLivePulse(true);
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isLive]);

  const totalTeams = teamsCount?.count ?? 0;

  // Stats and highlights data
  const highlights = [
    {
      icon: Trophy,
      title: "PRIZE POOL",
      rows: [
        { label: "1st Place", value: "100 €" },
        { label: "2nd Place", value: "40 €" },
        { label: "3rd Place", value: "20 €" }
      ]
    },
    {
      icon: Users,
      title: "2V2 DUO FORMAT",
      description: "Team up with your best mate. Double the chemistry, double the tactical depth."
    },
    {
      icon: Calendar,
      title: "UPCOMING SCHEDULE",
      description: "Saturday, June 6th 2026 at 15:00 CET\nStream starts at 14:00 CET"
    }
  ];

  // Steps to join
  const steps = [
    {
      num: "01",
      title: "Check Requirements",
      desc: "Ensure you follow Aqrix on Twitch, YouTube, Instagram and join the Discord server. Verification is required."
    },
    {
      num: "02",
      title: "Register Your Team",
      desc: "Fill out the registration form on our website with your duo partner's details and tracker links. You can check if your team is registered in the Registered Teams section below."
    },
    {
      num: "03",
      title: "Attend Live Stream",
      desc: "Be active in the Twitch chat on tournament day. Matches and brackets will be drawn live on stream."
    }
  ];

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
      {/* Hero Section */}
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden bg-transparent">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(88,28,135,0.16),transparent_30%)]" />

        <div className="container relative z-10 mx-auto px-4 py-32 text-center md:py-40">
          {/* Title with scroll fade */}
          <div className="hero-animate hero-animate-title">
            <h1 className="font-heading text-6xl font-black uppercase tracking-[0.24em] text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)] md:text-[8.5rem]">
              AQRIX{" "}
              <span
                className="text-primary"
                style={{ textShadow: "0 0 40px rgba(147,51,234,0.5), 0 0 80px rgba(147,51,234,0.3)" }}
              >
                2V2
              </span>
            </h1>
            <h2 className="mt-5 font-heading text-3xl font-black uppercase tracking-widest text-white/80 md:text-5xl">
              TOURNAMENT
            </h2>
          </div>
          
          <p
            className="hero-animate hero-animate-subtitle mx-auto mt-10 max-w-3xl text-sm leading-relaxed text-white/60 md:text-lg"
          >
            Ready to dominate the server? Gather your duo partner, perfect your tactical setups, and battle against other duos to claim the ultimate glory in the Aqrix 2v2 Community Cup.
          </p>

          {/* Tournament Status Grid */}
          <div
            className="hero-animate hero-animate-cards mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-3 md:gap-8"
          >
            <div className="interactive-surface rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 p-6 card-glow">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-primary">Status</p>
                  <p className="mt-3 text-2xl font-black uppercase text-white md:text-3xl">Registration</p>
                </div>
                <span className="inline-flex rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">OPEN</span>
              </div>
              <p className="text-sm uppercase tracking-[0.18em] text-white/55">Open for signups</p>
            </div>

            <div className="interactive-surface rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 p-6 card-glow">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-primary">Teams</p>
                  <p className="mt-3 text-2xl font-black uppercase text-white md:text-3xl">{totalTeams}</p>
                </div>
                <span className="inline-flex rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">REGISTERED</span>
              </div>
              <p className="text-sm uppercase tracking-[0.18em] text-white/55">Total registered teams</p>
            </div>

            <div className="interactive-surface rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 p-6 card-glow">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest text-primary">Prize Pool</p>
                  <p className="mt-3 text-2xl font-black uppercase text-white md:text-3xl">160 euro</p>
                </div>
                <span className="inline-flex rounded-full bg-primary/20 px-3 py-1 text-xs text-primary">TOTAL</span>
              </div>
              <p className="text-sm uppercase tracking-[0.18em] text-white/55">Cash prizes for top 3</p>
            </div>
          </div>

          <div
            className="hero-animate hero-animate-cards mx-auto mt-8 max-w-6xl"
          >
            <div className="interactive-surface rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 p-6 card-glow md:p-8">
              <div className="mb-5 flex items-center justify-center gap-2">
                <p className="font-mono text-xs uppercase tracking-widest text-primary text-center">
                  {isLive ? "Tournament" : "Tournament Starts In"}
                </p>
                {isLive && (
                  <span className={`inline-block rounded-full bg-green-500 px-3 py-1 text-[9px] font-bold text-white ${showLivePulse ? "animate-pulse" : ""}`}>LIVE</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-primary/30 bg-primary/15 p-4">
                  <div className="font-mono text-2xl font-black text-primary">{String(timeLeft.days).padStart(2, "0")}</div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white/60">Days</div>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/15 p-4">
                  <div className="font-mono text-2xl font-black text-primary">{String(timeLeft.hours).padStart(2, "0")}</div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white/60">Hrs</div>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/15 p-4">
                  <div className="font-mono text-2xl font-black text-primary">{String(timeLeft.minutes).padStart(2, "0")}</div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white/60">Mins</div>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/15 p-4">
                  <div className="font-mono text-2xl font-black text-primary">{String(timeLeft.seconds).padStart(2, "0")}</div>
                  <div className="mt-1 font-mono text-[9px] uppercase tracking-wider text-white/60">Secs</div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="hero-animate hero-animate-cards mt-16 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <Link href="/register" className="w-full sm:w-auto">
              <Button 
                size="lg"
                className="interactive-surface w-full rounded-full bg-primary px-8 py-6 font-mono text-sm uppercase tracking-[0.18em] text-primary-foreground transition-colors duration-200 hover:bg-primary/85 sm:w-auto"
              >
                Register Team Now
              </Button>
            </Link>
            
            <Link href="/rules" className="w-full sm:w-auto">
              <Button 
                size="lg"
                variant="outline"
                className="interactive-surface w-full rounded-full bg-white/[0.04] px-8 py-6 font-mono text-sm uppercase tracking-[0.18em] text-foreground transition-colors duration-200 hover:bg-white/[0.08] sm:w-auto"
              >
                Read Rules <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div
          className="hero-animate hero-animate-cards absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 transform flex-col items-center gap-1 opacity-60"
        >
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Scroll</span>
          <ChevronDown className="h-4 w-4 text-primary" />
        </div>
      </section>

      {/* Tournament Stats & Highlights */}
      <section className="relative bg-transparent py-28 md:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlights.map((item, index) => (
              <div 
                key={index}
                className="interactive-surface group relative rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 p-9 transition-colors duration-200 hover:bg-white/[0.05] card-glow md:p-10"
              >
                <div className="mb-5 inline-block rounded-lg border border-primary/40 bg-primary/10 p-3">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-4 font-mono text-xl font-bold uppercase tracking-[0.18em] text-foreground">
                  {item.title}
                </h3>
                {"rows" in item ? (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    {item.rows?.map((row, rowIndex) => (
                      <div
                        key={row.label}
                        className={`flex items-center justify-between gap-4 pb-3 ${
                          rowIndex !== (item.rows?.length ?? 0) - 1 ? "border-b border-white/10" : ""
                        }`}
                      >
                        <span>{row.label}</span>
                        <span>{row.value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Stream Promotion / Stream Info */}
      <section className="relative overflow-hidden py-28 md:py-32">
        {/* Background gradient block */}
        <div className="absolute right-0 top-0 w-1/3 h-full bg-white/[0.02] skew-x-12 transform origin-top-right pointer-events-none" />
        
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 md:gap-16 items-center">
            
            {/* Left Column: Info */}
            <div className="flex flex-col items-start">
              <h2 className="font-mono text-3xl font-black uppercase tracking-[0.2em] text-foreground md:text-5xl">
                WATCH IT LIVE ON <span className="text-primary">TWITCH</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-5 leading-relaxed">
                The entire tournament will be streamed live on Aqrix's official Twitch channel! Don't miss a single highlight, tactical execute, or insane clutch. The <Link href="/bracket" className="text-primary hover:underline">tournament bracket</Link> will be updated live, and the community will be casting the matches.
              </p>
              
              <div className="flex flex-col gap-3 mt-8 w-full">
                <div className="interactive-surface flex items-center gap-3 bg-white/[0.04] p-4 font-mono text-xs text-foreground/80 transition-colors hover:bg-white/[0.06]">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>STREAM START: TO BE ANNOUNCED</span>
                </div>
                <div className="interactive-surface flex items-center gap-3 bg-white/[0.04] p-4 font-mono text-xs text-foreground/80 transition-colors hover:bg-white/[0.06]">
                  <Coins className="h-4 w-4 text-secondary" />
                  <span>GIVEAWAYS & DROPS FOR ACTIVE CHATTERS</span>
                </div>
              </div>

              <div className="mt-10 flex gap-4 w-full sm:w-auto">
                <a 
                  href="https://www.twitch.tv/aqrix78" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button className="interactive-surface w-full rounded-full bg-primary px-6 py-5 font-mono text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors duration-200 hover:bg-primary/85 sm:w-auto">
                    Go to Twitch Channel
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: Twitch Player Embed */}
            <div className="interactive-surface relative rounded-[32px] bg-black/60 p-3 shadow-[0_0_30px_rgba(147,51,234,0.12)] transition-colors duration-300 hover:bg-black/70">
              <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://player.twitch.tv/?channel=aqrix78&parent=${window.location.hostname}&autoplay=false&muted=true`}
                  title="Aqrix Twitch Stream"
                  height="100%"
                  width="100%"
                  allowFullScreen
                  className="absolute inset-0 border-0 w-full h-full"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How to Participate Section */}
      <section className="bg-transparent py-28 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-18">
            <h2 className="font-mono text-3xl font-black uppercase tracking-[0.2em] text-foreground md:text-5xl">
              HOW TO <span className="text-primary">PARTICIPATE</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Follow these simple steps to register your duo and secure your spot in the bracket.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-10">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="interactive-surface relative flex flex-col items-start bg-white/[0.04] p-9 transition-colors duration-200 hover:bg-white/[0.06] md:p-10"
              >
                <span className="font-mono text-5xl font-black text-primary/10 group-hover:text-primary/20 transition-colors absolute top-4 right-6">
                  {step.num}
                </span>
                
                <h3 className="mb-3 mt-4 font-mono text-lg font-bold uppercase tracking-[0.18em] text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Info Section about External Registration */}
      <section id="register" className="relative overflow-hidden bg-transparent py-28 md:py-32">
        <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
          <h2 className="mb-6 font-mono text-3xl font-black uppercase tracking-[0.2em] text-foreground md:text-5xl">
            Ready to <span className="text-primary">Compete</span>?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-10 leading-relaxed">
            Tournament registration is now live on our new platform. 
            Click the button below to sign up your team.
          </p>
          <Link href="/register" className="inline-block">
            <Button 
              size="lg"
            className="interactive-surface rounded-full bg-primary px-12 py-8 font-mono text-lg uppercase tracking-[0.18em] text-primary-foreground transition-colors duration-200 hover:bg-primary/85"
            >
              Register Now
            </Button>
          </Link>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)]" />
      </section>

      {/* Registered Teams Section */}
      <section className="bg-transparent py-28 md:py-32">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="font-mono text-3xl font-black uppercase tracking-[0.2em] text-foreground md:text-5xl">
              Registered <span className="text-primary">Teams</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-4">
              Check out the teams that have already registered for the tournament.
            </p>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-primary/80">
              {totalTeams} Registered · {verifiedTeamsCount} Verified
            </p>
            <div className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setTeamsExpanded((current) => !current)}
                className="interactive-surface rounded-full bg-white/[0.04] px-6 py-5 font-mono text-xs uppercase tracking-[0.18em] text-primary transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
              >
                {teamsExpanded ? "Hide Teams" : "Show Teams"}
              </Button>
            </div>
          </div>
          {teamsExpanded && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="rounded-[28px] bg-white/[0.04] p-5 md:p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="text-left">
                    <p className="font-mono text-xs uppercase tracking-widest text-primary">
                      TOURNAMENT
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Find a team by team name or either player name.
                    </p>
                  </div>
                  <div className="w-full md:max-w-md">
                    <input
                      type="text"
                      value={teamSearch}
                      onChange={(event) => setTeamSearch(event.target.value)}
                      placeholder="Search by team or player name..."
                      className="h-11 w-full rounded-full bg-black/20 px-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/70 transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 md:max-w-md"
                    />
                  </div>
                </div>
              </div>
              <TeamList refreshTrigger={refreshTeams} searchTerm={teamSearch} />
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
