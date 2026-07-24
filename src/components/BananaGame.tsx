import kaplay from "kaplay";
import { useEffect, useRef } from "react";

export type GamePhase = "playing" | "won" | "lost";
export type GameState = {
	phase: GamePhase;
	bananas: number;
	total: number;
	lives: number;
	time: number;
	world: string;
};

type BananaGameProps = {
	onState?: (state: GameState) => void;
	lives?: number;
};

type RGB = [number, number, number];
type Theme = {
	sky: RGB;
	ground: RGB;
	cap: RGB;
	platform: RGB;
	platformOutline: RGB;
	enemy: RGB;
	enemyOutline: RGB;
	cloud: RGB;
	cloudOpacity: number;
	icicle?: RGB;
	icicleOutline?: RGB;
	frost?: RGB;
};
type Level = {
	world: string;
	name: string;
	theme: Theme;
	slippery: boolean;
	enemySpeed: number;
	icicles?: boolean;
	hazards?: number[];
	coins: Array<{ x: number; y: number }>;
	enemies: Array<{ x: number; min: number; max: number }>;
};

/**
 * Super Banana Bros - a Mario-style platformer starring a banana, across
 * three themed worlds (Grass, Ice, Fire). Kaplay is browser-only, so the
 * engine only boots inside useEffect. HUD state (bananas / lives / time /
 * world) is reported up to React via onState.
 */
export default function BananaGame({ onState, lives = 3 }: BananaGameProps) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const kRef = useRef<ReturnType<typeof kaplay> | null>(null);
	const teardownRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onStateRef = useRef(onState);
	onStateRef.current = onState;
	const initialLivesRef = useRef(lives);
	initialLivesRef.current = lives;

	useEffect(() => {
		const root = containerRef.current;
		if (!root) return;

		// React StrictMode double-invokes effects in dev, and kaplay cannot be
		// initialized twice on one page (it warns and the second instance renders
		// broken). So boot exactly once: a pending teardown from a StrictMode/HMR
		// unmount is cancelled by the immediate remount instead of thrashing.
		if (teardownRef.current) {
			clearTimeout(teardownRef.current);
			teardownRef.current = null;
		}

		if (!kRef.current) {
			while (root.firstChild) root.removeChild(root.firstChild);

			const k = kaplay({
				root,
				width: 960,
				height: 540,
				letterbox: true,
				global: false,
				background: [142, 212, 238],
				crisp: true,
			});
			kRef.current = k;

			// ---- tuning -----------------------------------------------------------
			const SPEED = 320;
			const JUMP = 820;
			const LEVEL_W = 3600;
			const GROUND_TOP = 500;
			const GOAL_X = 3480;

			k.setGravity(1800);

			// ---- shared geometry (proven reachable across all worlds) -------------
			const groundSegments = [
				{ x: 0, w: 900 },
				{ x: 1080, w: 1200 },
				{ x: 2460, w: LEVEL_W - 2460 },
			];
			const platforms = [
				{ x: 520, y: 360, w: 150 },
				{ x: 950, y: 400, w: 170 },
				{ x: 1500, y: 350, w: 160 },
				{ x: 1820, y: 250, w: 150 },
				{ x: 2320, y: 380, w: 170 },
				{ x: 2760, y: 350, w: 170 },
			];

			// ---- worlds -----------------------------------------------------------
			const LEVELS: Level[] = [
				{
					world: "1-1",
					name: "GRASS",
					slippery: false,
					enemySpeed: 95,
					theme: {
						sky: [142, 212, 238],
						ground: [122, 82, 48],
						cap: [86, 168, 46],
						platform: [150, 100, 55],
						platformOutline: [90, 60, 30],
						enemy: [155, 78, 151],
						enemyOutline: [110, 49, 105],
						cloud: [255, 255, 255],
						cloudOpacity: 0.9,
					},
					coins: [
						{ x: 300, y: 440 },
						{ x: 560, y: 300 },
						{ x: 600, y: 300 },
						{ x: 985, y: 340 },
						{ x: 1340, y: 440 },
						{ x: 1560, y: 290 },
						{ x: 1870, y: 190 },
						{ x: 2360, y: 320 },
						{ x: 2800, y: 290 },
						{ x: 2850, y: 290 },
						{ x: 3200, y: 440 },
						{ x: 3380, y: 440 },
					],
					enemies: [
						{ x: 650, min: 520, max: 800 },
						{ x: 1600, min: 1300, max: 1950 },
						{ x: 2950, min: 2700, max: 3150 },
					],
				},
				{
					world: "2-1",
					name: "ICE",
					slippery: true,
					enemySpeed: 95,
					icicles: true,
					theme: {
						sky: [205, 235, 245],
						ground: [150, 200, 220],
						cap: [240, 250, 255],
						platform: [180, 220, 235],
						platformOutline: [120, 160, 180],
						enemy: [90, 150, 210],
						enemyOutline: [45, 90, 150],
						cloud: [255, 255, 255],
						cloudOpacity: 0.85,
						icicle: [206, 236, 249],
						icicleOutline: [150, 200, 225],
						frost: [190, 225, 245],
					},
					coins: [
						{ x: 300, y: 440 },
						{ x: 540, y: 300 },
						{ x: 640, y: 300 },
						{ x: 985, y: 350 },
						{ x: 1300, y: 440 },
						{ x: 1540, y: 290 },
						{ x: 1870, y: 190 },
						{ x: 2340, y: 320 },
						{ x: 2760, y: 300 },
						{ x: 2860, y: 300 },
						{ x: 3150, y: 440 },
						{ x: 3380, y: 440 },
					],
					enemies: [
						{ x: 500, min: 200, max: 820 },
						{ x: 1400, min: 1150, max: 1950 },
						{ x: 3000, min: 2650, max: 3300 },
					],
				},
				{
					world: "3-1",
					name: "FIRE",
					slippery: false,
					enemySpeed: 150,
					hazards: [480, 1300, 1720, 2150, 2650, 3120],
					theme: {
						sky: [45, 15, 20],
						ground: [70, 40, 38],
						cap: [240, 100, 35],
						platform: [95, 45, 40],
						platformOutline: [45, 18, 12],
						enemy: [225, 75, 40],
						enemyOutline: [140, 30, 20],
						cloud: [70, 55, 60],
						cloudOpacity: 0.45,
					},
					coins: [
						{ x: 260, y: 440 },
						{ x: 560, y: 300 },
						{ x: 600, y: 300 },
						{ x: 985, y: 350 },
						{ x: 1360, y: 440 },
						{ x: 1560, y: 290 },
						{ x: 1880, y: 190 },
						{ x: 2340, y: 320 },
						{ x: 2790, y: 300 },
						{ x: 2860, y: 300 },
						{ x: 3200, y: 440 },
						{ x: 3400, y: 440 },
					],
					enemies: [
						{ x: 650, min: 520, max: 800 },
						{ x: 1400, min: 1150, max: 1950 },
						{ x: 1750, min: 1150, max: 1950 },
						{ x: 2900, min: 2650, max: 3150 },
						{ x: 3250, min: 2650, max: 3400 },
					],
				},
			];

			// ---- run state (persists across worlds within a run) ------------------
			let currentLevel = 0;
			let livesLeft = initialLivesRef.current;

			// ---- per-scene state --------------------------------------------------
			let bananas = 0;
			let phase: GamePhase = "playing";
			let clock = 0;
			let invulnUntil = 0;
			let vx = 0;

			const rgb = (c: RGB) => k.rgb(c[0], c[1], c[2]);
			const fill = (c: RGB) => k.color(c[0], c[1], c[2]);

			const snap = () => {
				const level = LEVELS[currentLevel];
				onStateRef.current?.({
					phase,
					bananas,
					total: level.coins.length,
					lives: livesLeft,
					time: clock,
					world: level.world,
				});
			};

			// ---- scene ------------------------------------------------------------
			k.scene("game", () => {
				const level = LEVELS[currentLevel];
				const theme = level.theme;
				const SPAWN = k.vec2(120, 300);
				let sceneEnded = false;

				// reset per-scene state
				bananas = 0;
				phase = "playing";
				clock = 0;
				invulnUntil = 0;
				vx = 0;

				// per-world sky colour (fills the canvas behind everything)
				k.setBackground(theme.sky[0], theme.sky[1], theme.sky[2]);

				const addCloud = (x: number, y: number) => {
					const mk = (dx: number, dy: number, r: number) =>
						k.add([
							k.circle(r),
							k.pos(x + dx, y + dy),
							fill(theme.cloud),
							k.opacity(theme.cloudOpacity),
							k.z(-5),
						]);
					mk(0, 0, 28);
					mk(34, 6, 34);
					mk(66, 10, 24);
				};
				addCloud(200, 90);
				addCloud(760, 140);
				addCloud(1500, 80);
				addCloud(2300, 120);
				addCloud(3100, 90);

				groundSegments.forEach((g) => {
					k.add([
						k.rect(g.w, 120),
						k.pos(g.x, GROUND_TOP),
						fill(theme.ground),
						k.area(),
						k.body({ isStatic: true }),
						"solid",
					]);
					k.add([
						k.rect(g.w, 14),
						k.pos(g.x, GROUND_TOP),
						fill(theme.cap),
						k.z(1),
					]);
				});

				platforms.forEach((p) => {
					k.add([
						k.rect(p.w, 22, { radius: 6 }),
						k.pos(p.x, p.y),
						fill(theme.platform),
						k.outline(3, rgb(theme.platformOutline)),
						k.area(),
						k.body({ isStatic: true }),
						"solid",
					]);
					k.add([k.rect(p.w, 6), k.pos(p.x, p.y), fill(theme.cap), k.z(1)]);

					// icicles growing under the platform (ice world)
					if (level.icicles && theme.icicle) {
						const bottom = p.y + 22;
						let idx = 0;
						for (let ix = 8; ix < p.w - 8; ix += 20) {
							const cw = 11;
							const ch = 12 + (idx % 3) * 8;
							k.add([
								k.polygon([k.vec2(0, 0), k.vec2(cw, 0), k.vec2(cw / 2, ch)]),
								k.pos(p.x + ix, bottom),
								fill(theme.icicle),
								k.outline(
									2,
									rgb(theme.icicleOutline ?? ([150, 200, 225] as RGB)),
								),
								k.opacity(0.95),
								k.z(3),
							]);
							idx += 1;
						}
					}
				});

				const player = k.add([
					k.rect(42, 58, { radius: 18 }),
					k.color(255, 206, 59),
					k.outline(4, k.rgb(201, 143, 27)),
					k.opacity(1),
					k.pos(SPAWN.x, SPAWN.y),
					k.area(),
					k.body(),
					k.anchor("center"),
					k.z(10),
					"player",
				]);
				player.add([
					k.circle(4),
					k.color(30, 30, 30),
					k.pos(-9, -10),
					k.anchor("center"),
				]);
				player.add([
					k.circle(4),
					k.color(30, 30, 30),
					k.pos(9, -10),
					k.anchor("center"),
				]);
				player.add([
					k.rect(16, 3, { radius: 2 }),
					k.color(30, 30, 30),
					k.pos(0, 6),
					k.anchor("center"),
				]);

				level.coins.forEach((c) => {
					k.add([
						k.circle(11),
						k.color(255, 205, 0),
						k.outline(3, k.rgb(180, 130, 0)),
						k.pos(c.x, c.y),
						k.area(),
						k.anchor("center"),
						k.z(5),
						"coin",
					]);
				});

				level.enemies.forEach((e) => {
					k.add([
						k.rect(46, 42, { radius: 8 }),
						fill(theme.enemy),
						k.outline(4, rgb(theme.enemyOutline)),
						k.pos(e.x, GROUND_TOP),
						k.area(),
						k.anchor("bot"),
						k.z(6),
						"enemy",
						{ dir: 1, min: e.min, max: e.max, speed: level.enemySpeed },
					]);
				});

				// fire hazards to jump over (fire world)
				if (level.hazards) {
					level.hazards.forEach((hx, i) => {
						const flame = k.add([
							k.polygon([k.vec2(-16, 0), k.vec2(16, 0), k.vec2(0, -46)]),
							k.pos(hx, GROUND_TOP),
							k.color(240, 90, 30),
							k.outline(3, k.rgb(150, 40, 15)),
							k.anchor("bot"),
							k.area(),
							k.scale(1),
							k.z(7),
							"hazard",
							{ seed: i * 1.7 },
						]);
						flame.add([
							k.polygon([k.vec2(-9, 0), k.vec2(9, 0), k.vec2(0, -30)]),
							k.color(255, 205, 60),
							k.anchor("bot"),
						]);
					});
				}

				k.add([
					k.rect(10, 170),
					k.pos(GOAL_X, GROUND_TOP),
					k.color(220, 220, 220),
					k.anchor("bot"),
					k.area(),
					k.z(4),
					"goal",
				]);
				k.add([
					k.rect(70, 44),
					k.pos(GOAL_X + 5, GROUND_TOP - 170),
					k.color(0, 175, 80),
					k.z(4),
				]);

				// world intro banner
				const banner = k.add([
					k.rect(k.width(), k.height()),
					k.pos(0, 0),
					k.color(0, 0, 0),
					k.opacity(0.5),
					k.fixed(),
					k.z(50),
				]);
				const bannerText = k.add([
					k.text(`WORLD ${level.world}\n${level.name}`, {
						size: 34,
						align: "center",
					}),
					k.pos(k.width() / 2, k.height() / 2),
					k.anchor("center"),
					k.color(255, 255, 255),
					k.fixed(),
					k.z(51),
				]);
				k.wait(1.2, () => {
					k.destroy(banner);
					k.destroy(bannerText);
				});

				const endGame = (p: GamePhase) => {
					if (phase !== "playing") return;
					phase = p;
					snap();
				};

				const advance = () => {
					if (phase !== "playing" || sceneEnded) return;
					sceneEnded = true;
					if (currentLevel < LEVELS.length - 1) {
						currentLevel += 1;
						k.go("game");
					} else {
						endGame("won");
					}
				};

				const respawn = () => {
					player.pos = SPAWN.clone();
					vx = 0;
					if (player.vel) {
						player.vel.x = 0;
						player.vel.y = 0;
					}
					invulnUntil = clock + 1.5;
				};

				const hitPlayer = () => {
					if (phase !== "playing" || clock < invulnUntil) return;
					livesLeft -= 1;
					if (livesLeft <= 0) {
						livesLeft = 0;
						snap();
						endGame("lost");
					} else {
						respawn();
						snap();
					}
				};

				const jump = () => {
					if (phase === "playing" && player.isGrounded()) player.jump(JUMP);
				};
				k.onKeyPress("space", jump);
				k.onKeyPress("up", jump);
				k.onKeyPress("w", jump);

				k.onUpdate("enemy", (e: any) => {
					if (phase !== "playing") return;
					e.move(e.dir * e.speed, 0);
					if (e.pos.x > e.max) e.dir = -1;
					if (e.pos.x < e.min) e.dir = 1;
				});

				k.onUpdate("hazard", (f: any) => {
					f.scale = k.vec2(1, 1 + Math.sin(k.time() * 9 + f.seed) * 0.14);
				});

				player.onCollide("coin", (c: any) => {
					if (phase !== "playing") return;
					k.destroy(c);
					bananas += 1;
					snap();
				});

				player.onCollide("enemy", (e: any) => {
					if (phase !== "playing") return;
					const goingDown = player.vel ? player.vel.y > 0 : true;
					const onTop = player.pos.y < e.pos.y - 34;
					if (goingDown && onTop) {
						k.destroy(e);
						player.jump(JUMP * 0.55);
					} else {
						hitPlayer();
					}
				});

				player.onCollide("goal", advance);
				player.onCollide("hazard", () => hitPlayer());

				let lastTick = -1;
				k.onUpdate(() => {
					const half = k.width() / 2;
					const camX = Math.max(half, Math.min(player.pos.x, LEVEL_W - half));
					k.setCamPos(k.vec2(camX, 300));

					if (phase !== "playing") return;

					// horizontal movement: snappy on solid ground, slidey on ice
					const left = k.isKeyDown("left") || k.isKeyDown("a");
					const right = k.isKeyDown("right") || k.isKeyDown("d");
					const target = (right ? SPEED : 0) - (left ? SPEED : 0);
					const rate = level.slippery ? 700 : 6000;
					const step = rate * k.dt();
					vx += Math.max(-step, Math.min(step, target - vx));
					player.move(vx, 0);

					clock += k.dt();
					const secs = Math.floor(clock);
					if (secs !== lastTick) {
						lastTick = secs;
						snap();
					}
					if (player.pos.y > 900) hitPlayer();

					player.opacity =
						clock < invulnUntil && Math.floor(clock * 10) % 2 === 0 ? 0.4 : 1;
				});

				snap();
			});

			k.go("game");
		}

		return () => {
			// defer disposal; a StrictMode/HMR remount cancels it (see above)
			if (teardownRef.current) clearTimeout(teardownRef.current);
			teardownRef.current = setTimeout(() => {
				const inst = kRef.current;
				if (inst) {
					try {
						inst.quit();
					} catch {}
				}
				kRef.current = null;
				while (root.firstChild) root.removeChild(root.firstChild);
				teardownRef.current = null;
			}, 150);
		};
	}, []);

	return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
