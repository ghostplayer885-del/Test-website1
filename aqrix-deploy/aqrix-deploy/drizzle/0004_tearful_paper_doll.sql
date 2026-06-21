CREATE TABLE `bracket_matches` (
	`id` int AUTO_INCREMENT NOT NULL,
	`round` int NOT NULL,
	`matchNumber` int NOT NULL,
	`team1Id` int,
	`team2Id` int,
	`team1Score` int,
	`team2Score` int,
	`winnerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bracket_matches_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `tournament_status` (
	`id` int AUTO_INCREMENT NOT NULL,
	`status` enum('registration','live','completed') NOT NULL DEFAULT 'registration',
	`startTime` timestamp,
	`endTime` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tournament_status_id` PRIMARY KEY(`id`)
);
