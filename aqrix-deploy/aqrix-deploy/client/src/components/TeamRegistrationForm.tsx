import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface TeamRegistrationFormProps {
  onSuccess?: () => void;
}

export default function TeamRegistrationForm({ onSuccess }: TeamRegistrationFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    teamName: "",
    player1Name: "",
    player1TrackerLink: "",
    player1TwitchName: "",
    player1YouTubeName: "",
    player1InstagramName: "",
    player1DiscordName: "",
    player1TikTokName: "",
    player2Name: "",
    player2TrackerLink: "",
    player2TwitchName: "",
    player2YouTubeName: "",
    player2InstagramName: "",
    player2DiscordName: "",
    player2TikTokName: "",
  });

  const createTeamMutation = trpc.teams.create.useMutation({
    onSuccess: () => {
      toast.success("Team registered successfully! Awaiting verification.");
      setFormData({
        teamName: "",
        player1Name: "",
        player1TrackerLink: "",
        player1TwitchName: "",
        player1YouTubeName: "",
        player1InstagramName: "",
        player1DiscordName: "",
        player1TikTokName: "",
        player2Name: "",
        player2TrackerLink: "",
        player2TwitchName: "",
        player2YouTubeName: "",
        player2InstagramName: "",
        player2DiscordName: "",
        player2TikTokName: "",
      });
      onSuccess?.();
      setIsLoading(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to register team");
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    createTeamMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Team Info */}
      <div className="border-2 border-border bg-card p-6">
        <h3 className="font-mono text-lg font-bold uppercase tracking-wide text-primary mb-4">
          Team Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              Team Name
            </label>
            <Input
              type="text"
              name="teamName"
              value={formData.teamName}
              onChange={handleChange}
              placeholder="Enter team name"
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
        </div>
      </div>

      {/* Player 1 */}
      <div className="border-2 border-border bg-card p-6">
        <h3 className="font-mono text-lg font-bold uppercase tracking-wide text-primary mb-4">
          Player 1
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              Player Name
            </label>
            <Input
              type="text"
              name="player1Name"
              value={formData.player1Name}
              onChange={handleChange}
              placeholder="Enter player name"
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              Tracker.gg Link
            </label>
            <Input
              type="url"
              name="player1TrackerLink"
              value={formData.player1TrackerLink}
              onChange={handleChange}
              placeholder="https://tracker.gg/..."
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              Twitch Username
            </label>
            <Input
              type="text"
              name="player1TwitchName"
              value={formData.player1TwitchName}
              onChange={handleChange}
              placeholder="twitch_username"
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              YouTube Channel
            </label>
            <Input
              type="text"
              name="player1YouTubeName"
              value={formData.player1YouTubeName}
              onChange={handleChange}
              placeholder="youtube_channel"
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              Instagram Username
            </label>
            <Input
              type="text"
              name="player1InstagramName"
              value={formData.player1InstagramName}
              onChange={handleChange}
              placeholder="instagram_username"
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              Discord Username
            </label>
            <Input
              type="text"
              name="player1DiscordName"
              value={formData.player1DiscordName}
              onChange={handleChange}
              placeholder="DiscordUser#1234"
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
        </div>
      </div>

      {/* Player 2 */}
      <div className="border-2 border-border bg-card p-6">
        <h3 className="font-mono text-lg font-bold uppercase tracking-wide text-primary mb-4">
          Player 2
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              Player Name
            </label>
            <Input
              type="text"
              name="player2Name"
              value={formData.player2Name}
              onChange={handleChange}
              placeholder="Enter player name"
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              Tracker.gg Link
            </label>
            <Input
              type="url"
              name="player2TrackerLink"
              value={formData.player2TrackerLink}
              onChange={handleChange}
              placeholder="https://tracker.gg/..."
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              Twitch Username
            </label>
            <Input
              type="text"
              name="player2TwitchName"
              value={formData.player2TwitchName}
              onChange={handleChange}
              placeholder="twitch_username"
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              YouTube Channel
            </label>
            <Input
              type="text"
              name="player2YouTubeName"
              value={formData.player2YouTubeName}
              onChange={handleChange}
              placeholder="youtube_channel"
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              Instagram Username
            </label>
            <Input
              type="text"
              name="player2InstagramName"
              value={formData.player2InstagramName}
              onChange={handleChange}
              placeholder="instagram_username"
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
          <div>
            <label className="block font-mono text-sm uppercase tracking-widest text-foreground mb-2">
              Discord Username
            </label>
            <Input
              type="text"
              name="player2DiscordName"
              value={formData.player2DiscordName}
              onChange={handleChange}
              placeholder="DiscordUser#5678"
              className="font-mono text-sm border-2 border-border bg-card text-foreground"
              required
            />
          </div>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full font-mono uppercase tracking-wider text-sm border-2 border-primary bg-primary hover:bg-transparent hover:text-primary text-primary-foreground transition-all duration-150 py-6"
      >
        {isLoading ? "Registering..." : "Register Team"}
      </Button>
    </form>
  );
}
