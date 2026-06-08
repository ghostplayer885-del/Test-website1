ALTER TABLE `bracket_matches` MODIFY COLUMN `team1Score` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bracket_matches` MODIFY COLUMN `team2Score` int DEFAULT 0;--> statement-breakpoint
ALTER TABLE `bracket_matches` ADD `nextMatchId` int;--> statement-breakpoint
ALTER TABLE `bracket_matches` ADD `nextMatchPosition` int;--> statement-breakpoint
ALTER TABLE `teams` ADD `player1YouTubeName` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `teams` ADD `player2YouTubeName` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `teams` DROP COLUMN `player1YoutubeName`;--> statement-breakpoint
ALTER TABLE `teams` DROP COLUMN `player2YoutubeName`;