CREATE TABLE `admin_access_tokens` (
	`id` int AUTO_INCREMENT NOT NULL,
	`token` varchar(255) NOT NULL,
	`createdBy` varchar(320) NOT NULL,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`usedBy` varchar(320),
	`usedAt` timestamp,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `admin_access_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `admin_access_tokens_token_unique` UNIQUE(`token`)
);
