CREATE TABLE `users` (
`id` int AUTO_INCREMENT NOT NULL,
`openId` varchar(64) NOT NULL,
`name` text,
`email` varchar(320),
`loginMethod` varchar(64),
`role` enum('user','admin') NOT NULL DEFAULT 'user',
`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
`lastSignedIn` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT `users_id` PRIMARY KEY (`id`),
CONSTRAINT `users_openId_unique` UNIQUE(`openId`)
);
--> statement-breakpoint
CREATE TABLE `admins` (
`id` int AUTO_INCREMENT NOT NULL,
`email` varchar(320) NOT NULL,
`name` varchar(255) NOT NULL,
`passwordHash` varchar(255) NOT NULL,
`isActive` tinyint NOT NULL DEFAULT 1,
`createdBy` int,
`lastLoginAt` timestamp,
`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `admins_id` PRIMARY KEY (`id`),
CONSTRAINT `admins_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `teams` (
`id` int AUTO_INCREMENT NOT NULL,
`teamName` varchar(255) NOT NULL,
`player1Name` varchar(255) NOT NULL,
`player1TrackerLink` varchar(500) NOT NULL,
`player1TwitchName` varchar(255) NOT NULL,
`player1DiscordName` varchar(255) NOT NULL,
`player1TikTokName` varchar(255) NOT NULL,
`player2Name` varchar(255) NOT NULL,
`player2TrackerLink` varchar(500) NOT NULL,
`player2TwitchName` varchar(255) NOT NULL,
`player2DiscordName` varchar(255) NOT NULL,
`player2TikTokName` varchar(255) NOT NULL,
`status` enum('pending','verified','rejected') NOT NULL DEFAULT 'pending',
`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `teams_id` PRIMARY KEY (`id`)
);
--> statement-breakpoint
CREATE TABLE `admin_2fa_secrets` (
`id` int AUTO_INCREMENT NOT NULL,
`email` varchar(320) NOT NULL,
`totpSecret` varchar(255) NOT NULL,
`backupCodes` json NOT NULL,
`enabled` tinyint NOT NULL DEFAULT 0,
`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
`updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
CONSTRAINT `admin_2fa_secrets_id` PRIMARY KEY (`id`),
CONSTRAINT `admin_2fa_secrets_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `email_verification_codes` (
`id` int AUTO_INCREMENT NOT NULL,
`email` varchar(255) NOT NULL,
`code` varchar(6) NOT NULL,
`expiresAt` timestamp NOT NULL,
`createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
CONSTRAINT `email_verification_codes_id` PRIMARY KEY (`id`)
);
