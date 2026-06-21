import { useState, useEffect, useRef } from "react";
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
import { trpc } from "@/lib/trpc";

// Particle component for interactive background
const ParticleSystem = ({ mouseX, mouseY }: { mouseX: number; mouseY: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<any[]>([]);
  const animationIdRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Initialize particles with orbital behavior - distributed across full screen
    const particleCount = 150;
    if (particlesRef.current.length === 0) {
      particlesRef.current = Array.from({ length: particleCount }, () => {
        // Random position across entire canvas
        const centerX = Math.random() * canvas.width;
        const centerY = Math.random() * canvas.height;
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 200 + 50;
        return {
          x: centerX + Math.cos(angle) * distance,
          y: centerY + Math.sin(angle) * distance,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
          baseVx: (Math.random() - 0.5) * 0.15,
          baseVy: (Math.random() - 0.5) * 0.15,
          radius: Math.random() * 2 + 0.8,
          opacity: Math.random() * 0.4 + 0.15,
          maxOpacity: Math.random() * 0.4 + 0.15,
          centerX: centerX,
          centerY: centerY,
          angle: angle,
          distance: distance,
          orbitSpeed: Math.random() * 0.0008 + 0.0002,
        };
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current.forEach((particle, index) => {
        // Orbital motion - particles have their own life
        particle.angle += particle.orbitSpeed;
        particle.distance += (Math.random() - 0.5) * 0.3;
        particle.distance = Math.max(30, Math.min(250, particle.distance));
        
        // Calculate orbital position around local center
        const orbitX = particle.centerX + Math.cos(particle.angle) * particle.distance;
        const orbitY = particle.centerY + Math.sin(particle.angle) * particle.distance;
        
        // Move particle
        particle.x += particle.vx;
        particle.y += particle.vy;
        
        // Gently pull back to orbit
        const toOrbitX = orbitX - particle.x;
        const toOrbitY = orbitY - particle.y;
        const distToOrbit = Math.sqrt(toOrbitX * toOrbitX + toOrbitY * toOrbitY);
        
        if (distToOrbit > 50) {
          const pullStrength = 0.02;
          particle.vx += (toOrbitX / distToOrbit) * pullStrength;
          particle.vy += (toOrbitY / distToOrbit) * pullStrength;
        }

        // Distance to mouse
        const dx = mouseX - particle.x;
        const dy = mouseY - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Mouse repulsion - disturb from orbit
        const repulsionRadius = 200;
        if (distance < repulsionRadius) {
          const force = (repulsionRadius - distance) / repulsionRadius;
          const angle = Math.atan2(dy, dx);
          
          // Push away from mouse
          particle.vx -= Math.cos(angle) * force * 1.2;
          particle.vy -= Math.sin(angle) * force * 1.2;
        }

        // Speed limit
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        if (speed > 2) {
          particle.vx = (particle.vx / speed) * 2;
          particle.vy = (particle.vy / speed) * 2;
        }

        // Damping - slowly return to orbit
        particle.vx *= 0.96;
        particle.vy *= 0.96;

        // Draw particle
        ctx.fillStyle = `rgba(168, 85, 247, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();



        // Draw connections between nearby particles
        for (let i = index + 1; i < particlesRef.current.length; i++) {
          const other = particlesRef.current[i];
          const cdx = other.x - particle.x;
          const cdy = other.y - particle.y;
          const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

          if (cdist < 100) {
            ctx.strokeStyle = `rgba(168, 85, 247, ${(1 - cdist / 100) * 0.08})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      });

      animationIdRef.current = requestAnimationFrame(animate) as unknown as number;
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Re-initialize particles when canvas resizes to cover full screen
      if (particlesRef.current.length > 0) {
        particlesRef.current.forEach((particle) => {
          particle.centerX = Math.random() * canvas.width;
          particle.centerY = Math.random() * canvas.height;
        });
      }
    };

    // Set initial size
    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationIdRef.current !== undefined) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [mouseX, mouseY]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        opacity: 0.8,
        width: '100%',
        height: '100%',
        display: 'block',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    />
  );
};

export default function Home() {
  const [refreshTeams, setRefreshTeams] = useState(0);
  const { data: allTeams } = trpc.teams.list.useQuery();
  const { data: tournamentStatus } = trpc.tournament.getStatus.useQuery();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isLive, setIsLive] = useState(false);

  // Mouse tracking state
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

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

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Calculate team capacity
  const totalTeams = allTeams?.length || 0;
  const maxTeams = 64;
  const availableSpots = maxTeams - totalTeams;
  const capacityPercentage = (totalTeams / maxTeams) * 100;

  // Stats and highlights data
  const highlights = [
    {
      icon: <Trophy className="h-8 w-8 text-primary" />,
      title: "Prize Pool",
      description: "1st Place: 100€\n2nd Place: 40€\n3rd Place: 20€"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      title: "2v2 Duo Format",
      description: "Team up with your best mate. Double the chemistry, double the tactical depth."
    },
    {
      icon: <Calendar className="h-8 w-8 text-primary" />,
      title: "Upcoming Schedule",
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
      desc: "Fill out the registration form on our website with your duo partner's details and tracker links."
    },
    {
      num: "03",
      title: "Attend Live Stream",
      desc: "Be active in the Twitch chat on tournament day. Matches and brackets will be drawn live on stream."
    }
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section 
        ref={heroRef}
        className="relative min-h-[85vh] flex items-center justify-center overflow-hidden border-b-2 border-border"
      >
        {/* Minimalist gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-background z-0" />
        
        {/* Interactive Particle System - Clipped to Hero Section */}
        <div className="absolute inset-0 overflow-hidden z-0">
          <ParticleSystem mouseX={mousePosition.x} mouseY={mousePosition.y} />
        </div>



        <div className="container mx-auto px-4 relative z-10 text-center py-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary/40 bg-primary/10 text-primary font-mono text-xs uppercase tracking-widest mb-6 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-primary" />
            Valorant 2v2 Tournament
          </div>

          {/* Title with scroll fade */}
          <div 
            style={{
              opacity: Math.max(0, 1 - scrollY / 300),
            }}
          >
            <h1 className="font-heading text-5xl md:text-8xl font-black tracking-tighter uppercase text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">
              AQRIX <span className="text-primary">2V2</span>
            </h1>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight uppercase text-white/90 mt-2">
              COMMUNITY CUP
            </h2>
          </div>
          
          <p className="max-w-2xl mx-auto text-muted-foreground text-sm md:text-lg mt-6 leading-relaxed">
            Ready to dominate the server? Gather your duo partner, perfect your tactical setups, and battle against other duos to claim the ultimate glory in the Aqrix 2v2 Community Cup.
          </p>

          {/* Tournament Status Grid */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Countdown Timer */}
            <div className="border-2 border-primary/40 bg-primary/5 p-6 rounded-lg backdrop-blur-sm transition-all duration-300 hover:border-primary/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <div className="flex items-center justify-center gap-2 mb-4">
                <p className="font-mono text-xs uppercase tracking-widest text-primary text-center">
                  {isLive ? "Tournament" : "Tournament Starts In"}
                </p>
                {isLive && (
                  <span className="inline-block px-2 py-1 bg-green-500 text-white text-[9px] font-bold rounded animate-pulse">LIVE</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                <div className="text-center bg-primary/10 p-3 rounded border border-primary/20 hover:bg-primary/20 transition-colors">
                  <div className="font-mono text-2xl font-black text-primary">{String(timeLeft.days).padStart(2, "0")}</div>
                  <div className="font-mono text-[9px] text-muted-foreground mt-1 uppercase tracking-wider">Days</div>
                </div>
                <div className="text-center bg-primary/10 p-3 rounded border border-primary/20 hover:bg-primary/20 transition-colors">
                  <div className="font-mono text-2xl font-black text-primary">{String(timeLeft.hours).padStart(2, "0")}</div>
                  <div className="font-mono text-[9px] text-muted-foreground mt-1 uppercase tracking-wider">Hrs</div>
                </div>
                <div className="text-center bg-primary/10 p-3 rounded border border-primary/20 hover:bg-primary/20 transition-colors">
                  <div className="font-mono text-2xl font-black text-primary">{String(timeLeft.minutes).padStart(2, "0")}</div>
                  <div className="font-mono text-[9px] text-muted-foreground mt-1 uppercase tracking-wider">Mins</div>
                </div>
                <div className="text-center bg-primary/10 p-3 rounded border border-primary/20 hover:bg-primary/20 transition-colors">
                  <div className="font-mono text-2xl font-black text-primary">{String(timeLeft.seconds).padStart(2, "0")}</div>
                  <div className="font-mono text-[9px] text-muted-foreground mt-1 uppercase tracking-wider">Secs</div>
                </div>
              </div>
            </div>

            {/* Live Team Counter */}
            <div className="border-2 border-primary/20 bg-primary/5 p-6 rounded-lg backdrop-blur-sm transition-all duration-300 hover:border-primary/60 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
              <p className="font-mono text-xs uppercase tracking-widest text-primary mb-4 text-center">Tournament Capacity</p>
              <div className="text-center mb-4">
                <p className="font-mono text-4xl font-black text-primary">{totalTeams}/{maxTeams}</p>
                {totalTeams >= maxTeams ? (
                  <p className="font-mono text-xs text-secondary uppercase tracking-widest mt-2 font-bold">🔴 Tournament Full</p>
                ) : (
                  <p className="font-mono text-xs text-muted-foreground uppercase tracking-widest mt-2">{availableSpots} Spots Left</p>
                )}
              </div>
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500 shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                  style={{ width: `${capacityPercentage}%` }}
                />
              </div>
              <p className="font-mono text-[10px] text-muted-foreground text-center mt-3">{Math.round(capacityPercentage)}% Full</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link href="/register" className="w-full sm:w-auto">
              <Button 
                size="lg"
                className="w-full sm:w-auto font-mono uppercase tracking-wider text-sm border-2 border-primary bg-primary hover:bg-transparent hover:text-primary text-primary-foreground transition-all duration-300 py-6 px-8 relative group hover:scale-110 btn-click-anim btn-glow"
              >
                <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-white" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white" />
                Register Team Now
              </Button>
            </Link>
            
            <Link href="/rules" className="w-full sm:w-auto">
              <Button 
                size="lg"
                variant="outline"
                className="w-full sm:w-auto font-mono uppercase tracking-wider text-sm border-2 text-foreground py-6 px-8 relative btn-outline-hover"
              >
                Read Rules <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-60">
          <span className="font-mono text-[10px] tracking-widest text-muted-foreground uppercase">Scroll</span>
          <ChevronDown className="h-4 w-4 text-primary animate-bounce" />
        </div>
      </section>

      {/* Tournament Stats & Highlights */}
      <section className="py-20 border-b-2 border-border bg-card/20 relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlights.map((item, index) => (
              <div 
                key={index}
                className="border-2 border-border bg-card p-8 relative group hover:border-primary transition-all duration-150 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              >
                {/* Tech corner accents */}
                <div className="absolute top-0 left-0 w-2 h-2 bg-border group-hover:bg-primary transition-colors" />
                <div className="absolute bottom-0 right-0 w-2 h-2 bg-border group-hover:bg-primary transition-colors" />
                
                <div className="mb-4">
                  {item.icon}
                </div>
                <h3 className="font-mono text-xl font-bold uppercase tracking-wide text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Stream Promotion / Stream Info */}
      <section className="py-20 border-b-2 border-border relative overflow-hidden">
        {/* Background gradient block */}
        <div className="absolute right-0 top-0 w-1/3 h-full bg-primary/5 skew-x-12 transform origin-top-right pointer-events-none" />
        
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Column: Info */}
            <div className="flex flex-col items-start">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-secondary/40 bg-secondary/10 text-secondary font-mono text-[10px] uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Live Broadcast
              </div>
              <h2 className="font-mono text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
                WATCH IT LIVE ON <span className="text-primary">TWITCH</span>
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-4 leading-relaxed">
                The entire tournament will be streamed live on Aqrix's official Twitch channel! Don't miss a single highlight, tactical execute, or insane clutch. The <Link href="/bracket" className="text-primary hover:underline">tournament bracket</Link> will be updated live, and the community will be casting the matches.
              </p>
              
              <div className="flex flex-col gap-3 mt-6 w-full">
                <div className="flex items-center gap-3 font-mono text-xs text-foreground/80 bg-muted/30 p-3 border border-border/80 hover:border-primary/50 transition-colors">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>STREAM START: TO BE ANNOUNCED</span>
                </div>
                <div className="flex items-center gap-3 font-mono text-xs text-foreground/80 bg-muted/30 p-3 border border-border/80 hover:border-secondary/50 transition-colors">
                  <Coins className="h-4 w-4 text-secondary" />
                  <span>GIVEAWAYS & DROPS FOR ACTIVE CHATTERS</span>
                </div>
              </div>

              <div className="mt-8 flex gap-4 w-full sm:w-auto">
                <a 
                  href="https://www.twitch.tv/aqrix78" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button className="w-full sm:w-auto font-mono uppercase tracking-wider text-xs border-2 border-primary bg-primary hover:bg-transparent hover:text-primary text-primary-foreground py-5 px-6">
                    Go to Twitch Channel
                  </Button>
                </a>
              </div>
            </div>

            {/* Right Column: Twitch Player Embed */}
            <div className="relative border-2 border-primary p-2 bg-black group shadow-[0_0_20px_rgba(147,51,234,0.2)] hover:shadow-[0_0_30px_rgba(147,51,234,0.4)] transition-all duration-300">
              <div className="absolute top-0 left-0 w-3 h-3 bg-primary z-10" />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary z-10" />
              
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
      <section className="py-20 bg-card/10">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-mono text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
              HOW TO <span className="text-primary">PARTICIPATE</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Follow these simple steps to register your duo and secure your spot in the bracket.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="border-2 border-border/80 bg-card p-8 relative flex flex-col items-start group hover:border-primary transition-all duration-150 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)]"
              >
                <span className="font-mono text-5xl font-black text-primary/10 group-hover:text-primary/20 transition-colors absolute top-4 right-6">
                  {step.num}
                </span>
                
                <h3 className="font-mono text-lg font-bold uppercase tracking-wide text-foreground mt-4 mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border max-w-xl mx-auto bg-card">
              <Info className="h-5 w-5 text-primary flex-shrink-0" />
              <span className="text-xs text-muted-foreground font-mono text-left">
                IMPORTANT: Make sure you meet all the participation requirements listed on our <Link href="/rules" className="text-primary hover:underline font-bold">Rules Page</Link> before registering.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Info Section about External Registration */}
      <section id="register" className="py-20 border-t-2 border-border bg-primary/5 relative overflow-hidden">
        <div className="container mx-auto px-4 text-center max-w-3xl relative z-10">
          <h2 className="font-mono text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground mb-6">
            Ready to <span className="text-primary">Compete</span>?
          </h2>
          <p className="text-sm md:text-base text-muted-foreground mb-10 leading-relaxed">
            Tournament registration is now live on our new platform. 
            Click the button below to sign up your team.
          </p>
          <Link href="/register" className="inline-block">
            <Button 
              size="lg"
              className="font-mono uppercase tracking-wider text-lg border-2 border-primary bg-primary text-primary-foreground py-8 px-12 hover:scale-110 transition-transform duration-300 btn-click-anim btn-glow"
            >
              Register Now
            </Button>
          </Link>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,var(--primary)_0%,transparent_70%)]" />
      </section>

      {/* Registered Teams Section */}
      <section className="py-20 bg-card/20 border-t-2 border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-mono text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
              Registered <span className="text-primary">Teams</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-4">
              Check out the teams that have already registered for the tournament.
            </p>
          </div>
          <TeamList refreshTrigger={refreshTeams} />
        </div>
      </section>
    </Layout>
  );
}
