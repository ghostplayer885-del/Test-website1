import React from "react";
import {
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Twitch,
  Youtube,
  Instagram,
  AlertTriangle,
  Music2
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
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-primary">
          <path d="M20.317 4.3671C18.7975 3.6368 17.147 3.1205 15.3917 2.8859C15.1597 3.2957 14.8789 3.8674 14.6725 4.2868C12.8156 3.9645 11.0812 3.9645 9.36469 4.2868C9.15823 3.8674 8.8732 3.2957 8.64077 2.8859C6.88231 3.1205 5.23274 3.6368 3.71325 4.3671C0.533471 8.9476 -0.31895 13.3519 0.0991801 17.699C2.18421 19.3410 4.17871 20.3292 6.12328 20.9306C6.62077 20.2026 7.04892 19.4335 7.3931 18.6155C6.52975 18.3519 5.71422 18.0226 4.96578 17.6335C5.13087 17.5193 5.29356 17.4012 5.45272 17.2864C9.59662 19.6328 14.6997 19.6328 18.7231 17.2864C18.8823 17.4012 19.045 17.5193 19.2101 17.6335C18.4616 18.0226 17.6461 18.3519 16.7827 18.6155C17.1269 19.4335 17.5551 20.2026 18.0526 20.9306C19.9973 20.3292 21.9918 19.3410 24.0771 17.699C24.5588 12.7383 23.1957 8.3866 20.317 4.3671ZM8.02109 14.7684C6.8789 14.7684 5.98635 13.7795 5.98635 12.5718C5.98635 11.3641 6.8550 10.3752 8.02109 10.3752C9.18719 10.3752 10.0881 11.3641 10.0881 12.5718C10.0881 13.7795 9.18719 14.7684 8.02109 14.7684ZM15.6559 14.7684C14.5138 14.7684 13.6212 13.7795 13.6212 12.5718C13.6212 11.3641 14.4873 10.3752 15.6559 10.3752C16.822 10.3752 17.7286 11.3641 17.7286 12.5718C17.7286 13.7795 16.822 14.7684 15.6559 14.7684Z" />
        </svg>
      ),
      title: "Discord Join",
      desc: "You must be on the official Aqrix Discord server to coordinate matches.",
      actionText: "Join Aqrix Discord",
      actionUrl: "https://discord.gg/jTrdKhb469"
    },
    {
      icon: <Music2 className="h-6 w-6 text-primary" />,
      title: "TikTok Follow",
      desc: "You must follow Aqrix on TikTok to stay updated with tournament clips and announcements.",
      actionText: "Follow Aqrix on TikTok",
      actionUrl: "https://www.tiktok.com/@aqrix78"
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
      <section className="relative overflow-hidden bg-transparent py-28 md:py-32">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/[0.02] rounded-full blur-3xl -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl -ml-48 -mb-48 pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/[0.05] px-4 py-2 font-mono text-xs uppercase tracking-[0.22em] text-primary">
              <ShieldAlert className="h-4 w-4" />
              Tournament Rules & Requirements
            </div>

            <h1 className="mb-4 font-mono text-5xl font-black uppercase tracking-[0.2em] text-foreground md:text-6xl">
              Tournament <span className="text-primary">Rules</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Read the complete rules and requirements for the Tournament. Make sure you understand all regulations before registering your team.
            </p>
          </div>
        </div>
      </section>

      <section className="py-28 md:py-32">
        <div className="container mx-auto px-4">
          <h2 className="mb-14 font-mono text-3xl font-black uppercase tracking-[0.2em] text-foreground md:text-4xl">
            Participation <span className="text-primary">Requirements</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {requirements.map((req, index) => (
              <div
                key={index}
                className="group relative bg-white/[0.04] p-7 transition-all duration-200 hover:bg-white/[0.06] md:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="mt-1">{req.icon}</div>
                  <div className="flex-1">
                    <h3 className="mb-2 font-mono text-lg font-bold uppercase tracking-[0.18em] text-foreground">
                      {req.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">{req.desc}</p>
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

      <section className="bg-transparent py-28 md:py-32">
        <div className="container mx-auto px-4">
          <h2 className="mb-14 font-mono text-3xl font-black uppercase tracking-[0.2em] text-foreground md:text-4xl">
            Tournament <span className="text-primary">Regulations</span>
          </h2>

          <div className="space-y-8 md:space-y-10">
            {rules.map((ruleGroup, index) => (
              <div key={index} className="relative bg-white/[0.04] p-9 md:p-10">
                <h3 className="mb-6 font-mono text-xl font-black uppercase tracking-[0.18em] text-primary">
                  {ruleGroup.category}
                </h3>

                <ul className="space-y-3">
                  {ruleGroup.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex gap-4 items-start">
                      <CheckCircle2 className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-28 md:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl bg-black/20 p-9 md:p-10">
            <div className="flex gap-4">
              <AlertTriangle className="h-6 w-6 text-secondary flex-shrink-0 mt-1" />
              <div>
                <h3 className="mb-2 font-mono text-lg font-bold uppercase tracking-[0.18em] text-foreground">
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

      <section className="bg-transparent py-28 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 font-mono text-3xl font-black uppercase tracking-[0.2em] text-foreground md:text-4xl">
            Ready to <span className="text-primary">Compete?</span>
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            If you understand all the rules and meet the requirements, head back to the homepage to register your team.
          </p>

          <a href="/" className="inline-block">
            <Button
              size="lg"
              className="rounded-full bg-primary px-8 py-6 font-mono text-sm uppercase tracking-[0.18em] text-primary-foreground transition-all duration-200 hover:bg-primary/85"
            >
              Back to Home
            </Button>
          </a>
        </div>
      </section>
    </Layout>
  );
}