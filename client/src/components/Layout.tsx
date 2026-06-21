import React from "react";
import { Link, useLocation } from "wouter";
import { 
  Twitch, 
  Instagram, 
  Youtube, 
  Menu, 
  X, 
  ExternalLink,
  Shield,
  Trophy,
  Users,
  Brackets,
  HelpCircle,
  LogIn
} from "lucide-react";
import { Button } from "@/components/ui/button";
import BracketViewer from "@/components/BracketViewer";
import PlasmaBackground from "@/components/PlasmaBackground";

// Custom Discord icon with official branding
const DiscordIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className="h-4 w-4"
  >
    <path d="M20.317 4.3671C18.7975 3.6368 17.147 3.1205 15.3917 2.8859C15.1597 3.2957 14.8789 3.8674 14.6725 4.2868C12.8156 3.9645 11.0812 3.9645 9.36469 4.2868C9.15823 3.8674 8.8732 3.2957 8.64077 2.8859C6.88231 3.1205 5.23274 3.6368 3.71325 4.3671C0.533471 8.9476 -0.31895 13.3519 0.0991801 17.699C2.18421 19.3410 4.17871 20.3292 6.12328 20.9306C6.62077 20.2026 7.04892 19.4335 7.3931 18.6155C6.52975 18.3519 5.71422 18.0226 4.96578 17.6335C5.13087 17.5193 5.29356 17.4012 5.45272 17.2864C9.59662 19.6328 14.6997 19.6328 18.7231 17.2864C18.8823 17.4012 19.045 17.5193 19.2101 17.6335C18.4616 18.0226 17.6461 18.3519 16.7827 18.6155C17.1269 19.4335 17.5551 20.2026 18.0526 20.9306C19.9973 20.3292 21.9918 19.3410 24.0771 17.699C24.5588 12.7383 23.1957 8.3866 20.317 4.3671ZM8.02109 14.7684C6.8789 14.7684 5.98635 13.7795 5.98635 12.5718C5.98635 11.3641 6.8550 10.3752 8.02109 10.3752C9.18719 10.3752 10.0881 11.3641 10.0881 12.5718C10.0881 13.7795 9.18719 14.7684 8.02109 14.7684ZM15.6559 14.7684C14.5138 14.7684 13.6212 13.7795 13.6212 12.5718C13.6212 11.3641 14.4873 10.3752 15.6559 10.3752C16.822 10.3752 17.7286 11.3641 17.7286 12.5718C17.7286 13.7795 16.822 14.7684 15.6559 14.7684Z" />
  </svg>
);

// Custom TikTok icon since Lucide doesn't have a direct one
const TikTokIcon = () => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className="h-4 w-4"
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const logoClassName = "w-auto cursor-pointer transition-transform duration-150 interactive-surface";

  const socials = [
    { name: "Twitch", icon: <Twitch className="h-4 w-4" />, url: "https://www.twitch.tv/aqrix78" },
    { name: "Discord", icon: <DiscordIcon />, url: "https://discord.gg/jTrdKhb469" },
    { name: "Instagram", icon: <Instagram className="h-4 w-4" />, url: "https://www.instagram.com/aqrix78" },
    { name: "YouTube", icon: <Youtube className="h-4 w-4" />, url: "https://www.youtube.com/@aqrix78" },
    { name: "TikTok", icon: <TikTokIcon />, url: "https://www.tiktok.com/@aqrix78" }
  ];

  return (
    <div className="min-h-screen text-foreground flex flex-col font-sans selection:bg-primary selection:text-primary-foreground">
      <PlasmaBackground />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-black/40 backdrop-blur-2xl">
        <div className="container mx-auto flex items-center justify-between px-4 py-5">
          
          {/* Brand Logo & Socials Box (Left Side) */}
          <div className="flex items-center gap-4">
            <Link href="/">
              <img 
                src="/aqrix-logo-transparent.png" 
                alt="Aqrix Logo" 
                className={`h-14 ${logoClassName} hover:scale-110 drop-shadow-lg`}
              />
            </Link>

            {/* Social Links - Minimal and clean */}
            <div className="flex items-center gap-2 pl-3">
              {socials.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.name}
                  className="interactive-surface rounded-full bg-white/[0.03] p-2 text-muted-foreground transition-colors duration-200 hover:bg-white/[0.08] hover:text-primary"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Navigation Links (Right Side) */}
          <nav className="hidden md:flex items-center gap-3 rounded-full bg-white/[0.03] px-4 py-2">
            <Link href="/">
              <span className={`interactive-surface inline-flex items-center rounded-full px-3 py-2 font-mono text-sm uppercase tracking-[0.18em] cursor-pointer transition-colors duration-200 ${
                location === "/" 
                  ? "bg-white/[0.08] text-white font-bold" 
                  : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              }`}>
                Home
              </span>
            </Link>
            <Link href="/rules">
              <span className={`interactive-surface inline-flex items-center rounded-full px-3 py-2 font-mono text-sm uppercase tracking-[0.18em] cursor-pointer transition-colors duration-200 ${
                location === "/rules" 
                  ? "bg-white/[0.08] text-white font-bold" 
                  : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              }`}>
                Rules
              </span>
            </Link>



            {/* Bracket Link */}
            <Link href="/bracket">
              <span className={`interactive-surface inline-flex items-center gap-1 rounded-full px-3 py-2 font-mono text-sm uppercase tracking-[0.18em] cursor-pointer transition-colors duration-200 ${
                location === "/bracket" 
                  ? "bg-white/[0.08] text-white font-bold" 
                  : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
              }`} title="Tournament Bracket">
                <Brackets className="h-4 w-4" />
                Bracket
              </span>
            </Link>

            {/* Support Button */}
            <a 
              href="https://discord.gg/2mj9xgWzFg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="interactive-surface inline-flex items-center gap-1 rounded-full px-3 py-2 font-mono text-sm uppercase tracking-[0.18em] text-secondary transition-colors duration-200 hover:bg-white/[0.05] hover:text-white"
              title="Support Channel"
            >
              <HelpCircle className="h-4 w-4" />
              Support
            </a>
            
            {/* Call to action button */}
            <Link href="/register">
              <Button 
                variant="default" 
                className="interactive-surface rounded-full bg-primary px-6 py-2.5 font-mono text-xs uppercase tracking-[0.18em] text-primary-foreground transition-colors duration-200 hover:bg-primary/85"
              >
                <span className="flex items-center gap-2">
                  Join Tournament <ExternalLink className="h-3 w-3" />
                </span>
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="interactive-surface md:hidden rounded-full bg-white/[0.04] p-2 text-foreground transition-colors duration-200 hover:bg-white/[0.08] hover:text-primary"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="animate-in fade-in slide-in-from-top-5 duration-150 md:hidden bg-card/90 backdrop-blur-2xl">
            <div className="container mx-auto flex flex-col gap-3 px-4 py-4">
              <Link href="/">
                <div 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-2xl px-4 py-3 font-mono text-base uppercase tracking-[0.18em] cursor-pointer ${
                    location === "/" 
                      ? "bg-white/[0.08] text-white font-bold" 
                      : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                  }`}
                >
                  Home
                </div>
              </Link>
              <Link href="/rules">
                <div 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-2xl px-4 py-3 font-mono text-base uppercase tracking-[0.18em] cursor-pointer ${
                    location === "/rules" 
                      ? "bg-white/[0.08] text-white font-bold" 
                      : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                  }`}
                >
                  Rules
                </div>
              </Link>
              <Link href="/bracket">
                <div 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-2xl px-4 py-3 font-mono text-base uppercase tracking-[0.18em] cursor-pointer ${
                    location === "/bracket" 
                      ? "bg-white/[0.08] text-white font-bold" 
                      : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground"
                  }`}
                >
                  Bracket
                </div>
              </Link>
              
              <div className="pt-2">
                <Link href="/register" className="w-full block" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="interactive-surface w-full rounded-full bg-primary py-3 font-mono text-sm uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/85">
                    Join Tournament <ExternalLink className="h-4 w-4 ml-2 inline" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>



      {/* Main Content Area */}
      <main className="flex-1 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-card/30 py-14 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            
            {/* Column 1: Branding */}
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-2">
                <img 
                  src="/aqrix-logo-transparent.png" 
                  alt="Aqrix Logo" 
                  className={`h-8 ${logoClassName}`}
                />
                <span className="font-mono text-lg font-black tracking-[0.2em] text-primary">
                  TOURNAMENT
                </span>
              </div>
              <p className="text-xs text-muted-foreground text-center md:text-left">
                The ultimate Valorant competitive experience. Form your duo and claim the throne.
              </p>
            </div>

            {/* Column 2: Social Links */}
            <div className="flex flex-col items-center">
              <span className="font-mono text-xs text-muted-foreground uppercase tracking-widest mb-3">
                Follow Aqrix
              </span>
              <div className="flex gap-4">
                {socials.map((social) => (
                  <a
                    key={social.name + "-footer"}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="interactive-surface rounded-full bg-white/[0.04] p-2 text-muted-foreground transition-colors duration-200 hover:bg-white/[0.08] hover:text-primary"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Column 3: Legal/Copyright */}
            <div className="flex flex-col items-center md:items-end text-center md:text-right">
              <span className="text-xs text-muted-foreground">
                © {new Date().getFullYear()} Aqrix. All rights reserved.
              </span>
              <span className="text-[10px] text-muted-foreground/60 mt-1 max-w-xs">
                This tournament is not affiliated with or sponsored by Riot Games, Inc. or Valorant Esports.
              </span>
              
              {/* Admin Login - Bottom Right */}
              <Link href="/admin" title="Admin Panel" className="mt-3">
                <span className="interactive-surface cursor-pointer py-1 px-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors duration-150 opacity-50 hover:opacity-100 flex items-center">
                  <LogIn className="h-3 w-3" />
                </span>
              </Link>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}
