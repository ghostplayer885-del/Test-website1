import React from "react";
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Twitch, 
  Youtube, 
  Instagram, 
  MessageSquare,
  Clock,
  AlertTriangle,
  Trophy,
  Info,
  ChevronRight,
  Sparkles,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/Layout";

export default function Rules() {
  const requirements = [
    {
      icon: <Twitch className="h-6 w-6 text-primary" />,
      title: "Twitch Follow",
      desc: "You must follow Aqrix on Twitch to participate in the tournament.",
      actionText: "Follow Aqrix on Twitch",
      actionUrl: "https://www.twitch.tv/aqrix78"
    },
    {
      icon: <Youtube className="h-6 w-6 text-primary" />,
      title: "YouTube Subscribe",
      desc: "Subscribe to Aqrix on YouTube to stay updated with tournament news.",
      actionText: "Subscribe on YouTube",
      actionUrl: "https://www.youtube.com/@aqrix78"
    },
    {
      icon: <MessageSquare className="h-6 w-6 text-primary" />,
      title: "Discord Join",
      desc: "You must be on the official Aqrix Discord server to coordinate matches.",
      actionText: "Join Aqrix Discord",
      actionUrl: "https://discord.gg/jTrdKhb469"
    },
    {
      icon: <Instagram className="h-6 w-6 text-primary" />,
      title: "Instagram Follow",
      desc: "Follow Aqrix on Instagram for announcements and tournament highlights.",
      actionText: "Follow on Instagram",
      actionUrl: "https://www.instagram.com/aqrix78"
    }
  ];

  const rules = [
    {
      category: "1. General Rules",
      items: [
        "All participants must follow fair play rules and treat each other with respect.",
        "Insults, toxic behavior, or unsportsmanlike conduct will result in immediate disqualification.",
        "Teams consist of exactly 2 players (Duo Format). Substitute players must be registered in Discord.",
        "Each player can only participate in one team in the tournament.",
        "Your Valorant in-game profile must be set to public during the tournament."
      ]
    },
    {
      category: "2. Tournament Format",
      items: [
        "The tournament will be played in a Single or Double Elimination format (depending on team count).",
        "All matches up to the semi-finals will be played as Best-of-1 (Bo1).",
        "The Grand Finals will be played as Best-of-3 (Bo3).",
        "Matches will be played on special 2v2 Custom Maps or standard maps with restricted sites. Details will be announced in Discord.",
        "Maximum 64 teams can register. Registration closes when the limit is reached."
      ]
    },
    {
      category: "3. Punctuality & Conduct",
      items: [
        "Arriving on time for matches is mandatory. All match times will be announced 24 hours in advance.",
        "The 5-minute rule applies: If a team is not fully ready 5 minutes after the scheduled match time, the match will be counted as a loss (Default Loss). No exceptions.",
        "Technical issues must be reported immediately to the tournament admin in Discord.",
        "The lobby host will be determined by admins or by team agreement.",
        "Screenshots of match results must be uploaded to Discord after each match."
      ]
    },
    {
      category: "4. Verification & Prizes",
      items: [
        "Before the tournament starts, all player accounts (Riot ID, rank, Discord name) will be verified.",
        "False information about rank (smurfing) will result in immediate disqualification of the entire team. All teams must meet minimum rank requirements.",
        "Prize Pool: 1st Place: 100€ Total | 2nd Place: 40€ Total | 3rd Place: 20€ Total. Codes delivered immediately after finals.",
        "All active players must be present in the Twitch stream on tournament day to receive important announcements and prize information."
      ]
    }
  ];

  return (
    <Layout>
      {/* Rules Page Header */}
      <section className="relative py-20 border-b-2 border-border bg-card/10 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-primary/40 bg-primary/10 text-primary font-mono text-xs uppercase tracking-widest mb-6">
              <ShieldAlert className="h-4 w-4" />
              Tournament Rules & Requirements
            </div>

            <h1 className="font-mono text-5xl md:text-6xl font-black uppercase tracking-tight text-foreground mb-4">
              Tournament <span className="text-primary">Rules</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Read the complete rules and requirements for the Tournament. Make sure you understand all regulations before registering your team.
            </p>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 border-b-2 border-border">
        <div className="container mx-auto px-4">
          <h2 className="font-mono text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground mb-12">
            Participation <span className="text-primary">Requirements</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {requirements.map((req, index) => (
              <div 
                key={index}
                className="border-2 border-border bg-card p-6 relative group hover:border-primary transition-all duration-150"
              >
                <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-primary" />
                <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-primary" />

                <div className="flex items-start gap-4">
                  <div className="mt-1">{req.icon}</div>
                  <div className="flex-1">
                    <h3 className="font-mono text-lg font-bold uppercase tracking-wide text-foreground mb-2">
                      {req.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {req.desc}
                    </p>
                    <a 
                      href={req.actionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-xs font-mono text-primary hover:text-secondary transition-colors duration-150"
                    >
                      {req.actionText}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="py-20 bg-card/10">
        <div className="container mx-auto px-4">
          <h2 className="font-mono text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground mb-12">
            Tournament <span className="text-primary">Regulations</span>
          </h2>

          <div className="space-y-8">
            {rules.map((ruleGroup, index) => (
              <div 
                key={index}
                className="border-l-4 border-primary bg-card p-8 relative"
              >
                <h3 className="font-mono text-xl font-black uppercase tracking-wide text-primary mb-6">
                  {ruleGroup.category}
                </h3>
                
                <ul className="space-y-3">
                  {ruleGroup.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex gap-4 items-start">
                      <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-20 border-t-2 border-border">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto border-2 border-dashed border-secondary bg-secondary/5 p-8">
            <div className="flex gap-4">
              <AlertTriangle className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-mono text-lg font-bold uppercase tracking-wide text-foreground mb-2">
                  Important Notice
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  By registering for the Aqrix 2v2 Community Cup, you agree to follow all rules and regulations. Violations may result in immediate disqualification without refund. The tournament admins have the final say on all disputes and rule interpretations.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  If you have any questions about the rules, please contact our support team on Discord.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-card/20 border-t-2 border-border">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-mono text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground mb-6">
            Ready to <span className="text-primary">Compete?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            If you understand all the rules and meet the requirements, head back to the homepage to register your team.
          </p>
          
          <a href="/" className="inline-block">
            <Button 
              size="lg"
              className="font-mono uppercase tracking-wider text-sm border-2 border-primary bg-primary hover:bg-transparent hover:text-primary text-primary-foreground transition-all duration-150 py-6 px-8 relative group"
            >
              <div className="absolute top-0 left-0 w-1.5 h-1.5 bg-white" />
              <div className="absolute bottom-0 right-0 w-1.5 h-1.5 bg-white" />
              Back to Home
            </Button>
          </a>
        </div>
      </section>
    </Layout>
  );
}
