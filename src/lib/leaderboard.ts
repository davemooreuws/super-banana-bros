import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import Redis from "ioredis";
import {
	englishDataset,
	englishRecommendedTransformers,
	RegExpMatcher,
} from "obscenity";

export type ScoreEntry = { rank: number; name: string; score: number };
export type SubmitResult =
	| { ok: true; name: string; score: number }
	| { ok: false; reason: "blocked" | "unavailable" };

const KEY = "leaderboard:banana-bros";
const MAX_ENTRIES = 100;

// Profanity/slur filter for the 3-char initials (obfuscation- and leet-aware).
// Enforced server-side because the server fn can be called directly.
const profanity = new RegExpMatcher({
	...englishDataset.build(),
	...englishRecommendedTransformers,
});

let redis: Redis | null = null;
function getRedis(): Redis | null {
	if (redis) return redis;
	const url = process.env.REDIS_URL ?? "redis://localhost:6379";
	// Fail fast (and never queue) so the game stays responsive if Redis is down.
	redis = new Redis(url, {
		maxRetriesPerRequest: 1,
		enableOfflineQueue: false,
	});
	// Swallow connection errors — a Redis outage must not crash the server via
	// an unhandled 'error' event; the leaderboard just degrades to empty.
	redis.on("error", () => {});
	return redis;
}

function cleanName(raw: string): string {
	const s = (raw ?? "")
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, 3);
	return s || "YOU";
}

export const submitScore = createServerFn({ method: "POST" })
	.inputValidator((data: { name: string; score: number }) => data)
	.handler(async ({ data }): Promise<SubmitResult> => {
		const name = cleanName(data.name);
		if (profanity.hasMatch(name)) return { ok: false, reason: "blocked" };
		const client = getRedis();
		if (!client) return { ok: false, reason: "unavailable" };
		const score = Math.max(0, Math.floor(Number(data.score)) || 0);
		try {
			// Each run is its own entry (unique member) so no submission can
			// overwrite another's; keep only the top MAX_ENTRIES highest scores.
			await client.zadd(KEY, score, `${name}#${randomUUID()}`);
			await client.zremrangebyrank(KEY, 0, -(MAX_ENTRIES + 1));
			return { ok: true, name, score };
		} catch {
			return { ok: false, reason: "unavailable" };
		}
	});

export const topScores = createServerFn({ method: "GET" }).handler(
	async (): Promise<ScoreEntry[]> => {
		const client = getRedis();
		if (!client) return [];
		try {
			const flat = await client.zrevrange(KEY, 0, 9, "WITHSCORES");
			const out: ScoreEntry[] = [];
			for (let i = 0; i < flat.length; i += 2) {
				out.push({
					rank: i / 2 + 1,
					name: flat[i].split("#")[0],
					score: Number(flat[i + 1]),
				});
			}
			return out;
		} catch {
			return [];
		}
	},
);
