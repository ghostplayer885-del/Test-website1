import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle2, AlertCircle, Twitch, ShieldCheck, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";
import { Link } from "wouter";
import Loader from "@/components/Loader";



export default function Register() {
  const [teamName, setTeamName] = useState("");
  const { data: registeredTeamsCount } = trpc.teams.count.useQuery(undefined, {
    refetchInterval: 10000,
  });
  const registeredTeamsTotal =
    typeof registeredTeamsCount === "number"
      ? registeredTeamsCount
      : registeredTeamsCount?.count ?? 0;
  
  // Player 1 State
  const [p1, setP1] = useState({
    name: "",
    tracker: "",
    twitch: "",
    youtube: "",
    instagram: "",
    discord: "",
    tiktok: ""
  });

  // Player 2 State
  const [p2, setP2] = useState({
    name: "",
    tracker: "",
    twitch: "",
    youtube: "",
    instagram: "",
    discord: "",
    tiktok: ""
  });

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Team registered successfully!");
    },
    onError: (error) => {
      setIsSubmitting(false);
      toast.error(error.message || "Registration failed");
    },
  });

  const validateFields = () => {
    const newErrors: string[] = [];
    if (!teamName) newErrors.push("teamName");
    if (!p1.name) newErrors.push("p1.name");
    if (!p1.tracker || !p1.tracker.startsWith("https://")) newErrors.push("p1.tracker");
    if (!p1.twitch) newErrors.push("p1.twitch");
    if (!p1.youtube) newErrors.push("p1.youtube");
    if (!p1.instagram) newErrors.push("p1.instagram");
    if (!p1.discord) newErrors.push("p1.discord");
    if (!p1.tiktok) newErrors.push("p1.tiktok");
    if (!p2.name) newErrors.push("p2.name");
    if (!p2.tracker || !p2.tracker.startsWith("https://")) newErrors.push("p2.tracker");
    if (!p2.twitch) newErrors.push("p2.twitch");
    if (!p2.youtube) newErrors.push("p2.youtube");
    if (!p2.instagram) newErrors.push("p2.instagram");
    if (!p2.discord) newErrors.push("p2.discord");
    if (!p2.tiktok) newErrors.push("p2.tiktok");
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isValid = validateFields();
    if (!isValid) {
      toast.error("Please fill out all fields correctly.");
      return;
    }
    setIsSubmitting(true);

    createTeamMutation.mutate({
      teamName,
      player1Name: p1.name,
      player1TrackerLink: p1.tracker,
      player1TwitchName: p1.twitch,
      player1YouTubeName: p1.youtube,
      player1InstagramName: p1.instagram,
      player1DiscordName: p1.discord,
      player1TikTokName: p1.tiktok,
      player2Name: p2.name,
      player2TrackerLink: p2.tracker,
      player2TwitchName: p2.twitch,
      player2YouTubeName: p2.youtube,
      player2InstagramName: p2.instagram,
      player2DiscordName: p2.discord,
      player2TikTokName: p2.tiktok,
    });
  };

  if (submitted) {
    return (
      <Layout>
        <section className="flex min-h-[80vh] items-center justify-center py-28 md:py-32">
          <div className="w-full max-w-md text-center">
            <div className="rounded-[32px] bg-white/[0.04] p-12 shadow-[0_0_30px_rgba(168,85,247,0.08)]">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <CheckCircle2 className="h-12 w-12 text-primary" />
                </div>
              </div>

              <h1 className="font-heading text-3xl font-black uppercase tracking-tight text-foreground mb-2">
                Registration <span className="text-primary">Complete</span>
              </h1>
              <p className="text-muted-foreground mb-6">
                Thank you! Your team has been registered. We are now manually verifying your details and tracker profiles.
              </p>

              <Link href="/">
                <Button className="w-full rounded-full bg-primary py-6 font-mono uppercase tracking-[0.18em] text-primary-foreground hover:bg-primary/85">
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const getErrorClass = (field: string) => errors.includes(field) ? "bg-destructive/10 ring-1 ring-destructive" : "bg-black/20";

  return (
    <Layout>
      <section className="relative overflow-hidden py-28 md:py-32">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(168,85,247,0.08),transparent_26%)]" />
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <div className="mb-14 relative z-10">
            <Link href="/">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-6 font-mono text-sm">
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
            </Link>

            <h1 className="mb-2 font-heading text-4xl font-black uppercase tracking-[0.2em] text-foreground md:text-5xl">
              Team <span className="text-primary">Registration</span>
            </h1>
            <p className="text-muted-foreground">
              Fill out all fields to participate in the Aqrix Community Cup.
            </p>
            <div className="mt-6 rounded-[24px] border border-primary/20 bg-white/[0.04] p-5">
              <p className="font-heading text-2xl font-black uppercase tracking-[0.18em] text-primary">
                Registered Teams: {registeredTeamsTotal}
              </p>
              <p className="mt-2 font-mono text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Registration closes Friday at 15:00
              </p>
            </div>
          </div>

          {/* Warning Box */}
          <div className="relative mb-12 overflow-hidden rounded-[28px] bg-black/20 p-7 md:p-8">
            <div className="flex gap-4 relative z-10">
              <AlertCircle className="h-8 w-8 text-destructive flex-shrink-0" />
              <div>
                <h3 className="font-heading text-lg font-bold uppercase text-destructive mb-1">Important Participation Rule!</h3>
                <p className="text-sm text-foreground leading-relaxed">
                  Every participant must follow Aqrix on **Twitch, TikTok, and YouTube** and be on the **Discord server**. 
                  We verify this manually. Those who do not meet the conditions will be **disqualified** without warning.
                </p>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-destructive/5 -mr-16 -mt-16 rounded-full" />
          </div>

          {/* Registration Form */}
          <div className="relative rounded-[32px] bg-white/[0.04] p-8 shadow-[0_0_30px_rgba(168,85,247,0.06)] md:p-10">
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Team Name */}
              <div>
                <label className="mb-2 block font-mono text-sm font-bold uppercase tracking-[0.18em] text-primary">
                  Team Name *
                </label>
                <Input
                  type="text"
                  value={teamName}
                  onChange={(e) => {
                    setTeamName(e.target.value);
                  }}
                  placeholder="e.g. Purple Legends"
                  className={`border-0 font-mono text-sm text-foreground py-6 ${getErrorClass("teamName")}`}
                  required
                />
              </div>

              {/* Player 1 Section */}
              <div className="relative space-y-6 rounded-[28px] bg-black/20 p-6 md:p-8">
                <div className="absolute -top-3 left-4 bg-black/20 px-2 font-heading text-sm font-bold uppercase tracking-[0.18em] text-primary">
                  Player 1 (Leader)
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Display Name (Public) *</label>
                    <Input required value={p1.name} onChange={e => {setP1({...p1, name: e.target.value}); }} placeholder="Name" className={`border-0 ${getErrorClass("p1.name")}`} />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Tracker Link *</label>
                    <Input required type="url" value={p1.tracker} onChange={e => {setP1({...p1, tracker: e.target.value}); }} placeholder="https://tracker.gg/..." className={`border-0 ${getErrorClass("p1.tracker")}`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2"><Twitch className="h-4 w-4 text-muted-foreground" /></div>
                    <Input required value={p1.twitch} onChange={e => {setP1({...p1, twitch: e.target.value}); }} placeholder="Twitch Name" className={`pl-10 border-0 ${getErrorClass("p1.twitch")}`} />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-muted-foreground"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></div>
                    <Input required value={p1.youtube} onChange={e => {setP1({...p1, youtube: e.target.value}); }} placeholder="YouTube Channel" className={`pl-10 border-0 ${getErrorClass("p1.youtube")}`} />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-muted-foreground"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" /></svg></div>
                    <Input required value={p1.instagram} onChange={e => {setP1({...p1, instagram: e.target.value}); }} placeholder="Instagram Name" className={`pl-10 border-0 ${getErrorClass("p1.instagram")}`} />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-muted-foreground"><path d="M20.317 4.3671C18.7975 3.6368 17.147 3.1205 15.3917 2.8859C15.1597 3.2957 14.8789 3.8674 14.6725 4.2868C12.8156 3.9645 11.0812 3.9645 9.36469 4.2868C9.15823 3.8674 8.8732 3.2957 8.64077 2.8859C6.88231 3.1205 5.23274 3.6368 3.71325 4.3671C0.533471 8.9476 -0.31895 13.3519 0.0991801 17.699C2.18421 19.3410 4.17871 20.3292 6.12328 20.9306C6.62077 20.2026 7.04892 19.4335 7.3931 18.6155C6.52975 18.3519 5.71422 18.0226 4.96578 17.6335C5.13087 17.5193 5.29356 17.4012 5.45272 17.2864C9.59662 19.6328 14.6997 19.6328 18.7231 17.2864C18.8823 17.4012 19.045 17.5193 19.2101 17.6335C18.4616 18.0226 17.6461 18.3519 16.7827 18.6155C17.1269 19.4335 17.5551 20.2026 18.0526 20.9306C19.9973 20.3292 21.9918 19.3410 24.0771 17.699C24.5588 12.7383 23.1957 8.3866 20.317 4.3671ZM8.02109 14.7684C6.8789 14.7684 5.98635 13.7795 5.98635 12.5718C5.98635 11.3641 6.8550 10.3752 8.02109 10.3752C9.18719 10.3752 10.0881 11.3641 10.0881 12.5718C10.0881 13.7795 9.18719 14.7684 8.02109 14.7684ZM15.6559 14.7684C14.5138 14.7684 13.6212 13.7795 13.6212 12.5718C13.6212 11.3641 14.4873 10.3752 15.6559 10.3752C16.822 10.3752 17.7286 11.3641 17.7286 12.5718C17.7286 13.7795 16.822 14.7684 15.6559 14.7684Z" /></svg></div>
                    <Input required value={p1.discord} onChange={e => {setP1({...p1, discord: e.target.value}); }} placeholder="Discord Name" className={`pl-10 border-0 ${getErrorClass("p1.discord")}`} />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg></div>
                    <Input required value={p1.tiktok} onChange={e => {setP1({...p1, tiktok: e.target.value}); }} placeholder="TikTok Name" className={`pl-10 border-0 ${getErrorClass("p1.tiktok")}`} />
                  </div>
                </div>
              </div>

              {/* Player 2 Section */}
              <div className="relative space-y-6 rounded-[28px] bg-black/20 p-6 md:p-8">
                <div className="absolute -top-3 left-4 bg-black/20 px-2 font-heading text-sm font-bold uppercase tracking-[0.18em] text-primary">
                  Player 2
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Display Name (Public) *</label>
                    <Input required value={p2.name} onChange={e => {setP2({...p2, name: e.target.value}); }} placeholder="Name" className={`border-0 ${getErrorClass("p2.name")}`} />
                  </div>
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Tracker Link *</label>
                    <Input required type="url" value={p2.tracker} onChange={e => {setP2({...p2, tracker: e.target.value}); }} placeholder="https://tracker.gg/..." className={`border-0 ${getErrorClass("p2.tracker")}`} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2"><Twitch className="h-4 w-4 text-muted-foreground" /></div>
                    <Input required value={p2.twitch} onChange={e => {setP2({...p2, twitch: e.target.value}); }} placeholder="Twitch Name" className={`pl-10 border-0 ${getErrorClass("p2.twitch")}`} />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-muted-foreground"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg></div>
                    <Input required value={p2.youtube} onChange={e => {setP2({...p2, youtube: e.target.value}); }} placeholder="YouTube Channel" className={`pl-10 border-0 ${getErrorClass("p2.youtube")}`} />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-muted-foreground"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" /></svg></div>
                    <Input required value={p2.instagram} onChange={e => {setP2({...p2, instagram: e.target.value}); }} placeholder="Instagram Name" className={`pl-10 border-0 ${getErrorClass("p2.instagram")}`} />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2"><svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-muted-foreground"><path d="M20.317 4.3671C18.7975 3.6368 17.147 3.1205 15.3917 2.8859C15.1597 3.2957 14.8789 3.8674 14.6725 4.2868C12.8156 3.9645 11.0812 3.9645 9.36469 4.2868C9.15823 3.8674 8.8732 3.2957 8.64077 2.8859C6.88231 3.1205 5.23274 3.6368 3.71325 4.3671C0.533471 8.9476 -0.31895 13.3519 0.0991801 17.699C2.18421 19.3410 4.17871 20.3292 6.12328 20.9306C6.62077 20.2026 7.04892 19.4335 7.3931 18.6155C6.52975 18.3519 5.71422 18.0226 4.96578 17.6335C5.13087 17.5193 5.29356 17.4012 5.45272 17.2864C9.59662 19.6328 14.6997 19.6328 18.7231 17.2864C18.8823 17.4012 19.045 17.5193 19.2101 17.6335C18.4616 18.0226 17.6461 18.3519 16.7827 18.6155C17.1269 19.4335 17.5551 20.2026 18.0526 20.9306C19.9973 20.3292 21.9918 19.3410 24.0771 17.699C24.5588 12.7383 23.1957 8.3866 20.317 4.3671ZM8.02109 14.7684C6.8789 14.7684 5.98635 13.7795 5.98635 12.5718C5.98635 11.3641 6.8550 10.3752 8.02109 10.3752C9.18719 10.3752 10.0881 11.3641 10.0881 12.5718C10.0881 13.7795 9.18719 14.7684 8.02109 14.7684ZM15.6559 14.7684C14.5138 14.7684 13.6212 13.7795 13.6212 12.5718C13.6212 11.3641 14.4873 10.3752 15.6559 10.3752C16.822 10.3752 17.7286 11.3641 17.7286 12.5718C17.7286 13.7795 16.822 14.7684 15.6559 14.7684Z" /></svg></div>
                    <Input required value={p2.discord} onChange={e => {setP2({...p2, discord: e.target.value}); }} placeholder="Discord Name" className={`pl-10 border-0 ${getErrorClass("p2.discord")}`} />
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 text-muted-foreground"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" /></svg></div>
                    <Input required value={p2.tiktok} onChange={e => {setP2({...p2, tiktok: e.target.value}); }} placeholder="TikTok Name" className={`pl-10 border-0 ${getErrorClass("p2.tiktok")}`} />
                  </div>
                </div>
              </div>

              {/* Verify Button */}
              <div className="space-y-4">
                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-primary py-8 font-heading text-lg uppercase tracking-[0.18em] text-primary-foreground transition-all duration-200 hover:bg-primary/85 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader className="py-0 [&_.loader]:scale-[0.32] [&_.loader]:origin-center [&_.loader]:[--main-size:3.2em]" />
                  ) : (
                    "Register Team & Accept Rules"
                  )}
                </Button>
                
                <p className="text-center text-[10px] text-muted-foreground mt-4 font-mono uppercase tracking-tighter">
                  By clicking register, you accept manual verification of your tracker links and social media profiles.
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </Layout>
  );
}
