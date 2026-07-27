import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import BananaGame, {
	type GameControls,
	type GameState,
} from "../components/BananaGame";
import {
	ScoreList,
	SubmitScore,
	useLeaderboard,
} from "../components/leaderboard-ui";

export const Route = createFileRoute("/")({ component: Home });

const INITIAL: GameState = {
	phase: "playing",
	bananas: 0,
	total: 12,
	lives: 3,
	time: 0,
	world: "1-1",
	score: 0,
};

function Home() {
	const isMobile = useIsMobile();
	if (isMobile === null) {
		return (
			<div
				className="min-h-screen"
				style={{ background: "var(--suga-black)" }}
			/>
		);
	}
	return isMobile ? <MobileGame /> : <DesktopHome />;
}

function useIsMobile() {
	const [isMobile, setIsMobile] = useState<boolean | null>(null);
	useEffect(() => {
		const mq = window.matchMedia("(pointer: coarse)");
		const update = () => setIsMobile(mq.matches);
		update();
		mq.addEventListener("change", update);
		return () => mq.removeEventListener("change", update);
	}, []);
	return isMobile;
}

function DesktopHome() {
	const [started, setStarted] = useState(false);
	const [game, setGame] = useState<GameState>(INITIAL);
	const [you, setYou] = useState<string | null>(null);
	const controlsRef = useRef<GameControls | null>(null);
	const { scores, refresh } = useLeaderboard();

	const start = useCallback(() => setStarted(true), []);
	const restart = useCallback(() => {
		setGame(INITIAL);
		controlsRef.current?.reset();
	}, []);
	const onSubmitted = useCallback(
		(name: string) => {
			setYou(name);
			refresh();
		},
		[refresh],
	);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			// don't hijack typing in the initials field
			if (e.target instanceof HTMLInputElement) return;
			const k = e.code;
			if (!started) {
				if (k === "Space" || k === "Enter") {
					e.preventDefault();
					start();
				}
				return;
			}
			if (game.phase !== "playing") {
				if (k === "KeyR") {
					e.preventDefault();
					restart();
				}
				return;
			}
			if (k === "KeyR") {
				e.preventDefault();
				restart();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [started, game.phase, start, restart]);

	const bananas = String(game.bananas).padStart(2, "0");
	const timeStr = String(Math.min(Math.floor(game.time), 999)).padStart(3, "0");
	const won = started && game.phase === "won";
	const lost = started && game.phase === "lost";

	return (
		<div className="sbb-root dark">
			{/* Top nav */}
			<header className="sbb-header">
				<div className="sbb-brand">
					<span className="sbb-logo-box">
						<BananaMark />
					</span>
					<span className="sbb-pixel sbb-brand-title">SUPER BANANA BROS</span>
					<span className="sbb-chip" translate="no">
						v1.2.0
					</span>
				</div>
				<nav className="sbb-nav">
					<a href="#how">How to play</a>
					<a href="#scores">High scores</a>
				</nav>
			</header>

			{/* Main */}
			<main className="sbb-main">
				{/* HUD */}
				<div className="sbb-hud" translate="no">
					<div className="sbb-hud-left">
						<span className="sbb-hud-bananas">
							🍌 {bananas}/{game.total}
						</span>
						<span className="sbb-hud-lives">♥ ×{game.lives}</span>
					</div>
					<span className="sbb-hud-world">WORLD {game.world}</span>
					<span className="sbb-hud-time">TIME {timeStr}</span>
				</div>

				{/* Game window */}
				<div className="sbb-window">
					{started ? (
						<BananaGame onState={setGame} controlsRef={controlsRef} />
					) : (
						<ReadyScene />
					)}

					<div className="sbb-scanlines" />

					{!started && (
						<button type="button" className="sbb-overlay" onClick={start}>
							<span className="sbb-overlay-title">
								SUPER
								<br />
								BANANA BROS
							</span>
							<span className="sbb-overlay-sub">PRESS START</span>
						</button>
					)}

					{(won || lost) && (
						<div className="sbb-overlay">
							<span className={`sbb-overlay-title${lost ? " is-lost" : ""}`}>
								{won ? "YOU WIN!" : "GAME OVER"}
							</span>
							<SubmitScore score={game.score} onSubmitted={onSubmitted} />
							<button type="button" className="sbb-btn" onClick={restart}>
								{won ? "PLAY AGAIN" : "RETRY"}
							</button>
						</div>
					)}
				</div>

				{/* Controls */}
				<div id="how" className="sbb-controls">
					<div className="sbb-controls-left">
						<div className="sbb-control">
							<kbd className="sbb-kbd">←</kbd>
							<kbd className="sbb-kbd">→</kbd>
							<span>move</span>
						</div>
						<div className="sbb-control">
							<kbd className="sbb-kbd is-wide">space</kbd>
							<span>jump</span>
						</div>
						<div className="sbb-control">
							<kbd className="sbb-kbd">R</kbd>
							<span>restart</span>
						</div>
					</div>
					<p className="sbb-tagline">
						Stomp the plums, grab the bananas, reach the flag.
					</p>
				</div>

				{/* Cards */}
				<div className="sbb-cards">
					<div className="sbb-card">
						<div className="sbb-eyebrow">A potassium-boosting masterpiece</div>
						<div className="sbb-tips">
							<div className="sbb-tip">
								<span className="sbb-tip-num">01</span>
								<span>Every banana counts. All 12 unlock the golden flag.</span>
							</div>
							<div className="sbb-tip">
								<span className="sbb-tip-num">02</span>
								<span>Plums are hostile. Jump on them, not into them.</span>
							</div>
							<div className="sbb-tip">
								<span className="sbb-tip-num">03</span>
								<span>Three lives. The pit does not negotiate.</span>
							</div>
						</div>
					</div>
					<div id="scores" className="sbb-card">
						<div className="sbb-eyebrow">High scores</div>
						<ScoreList scores={scores} highlight={you} />
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="sbb-footer">
				<a
					className="sbb-footer-brand"
					href="https://suga.app"
					target="_blank"
					rel="noopener noreferrer"
				>
					<SugaMark />
					<span>Deployed with Suga</span>
				</a>
			</footer>
		</div>
	);
}

function MobileGame() {
	const [started, setStarted] = useState(false);
	const [game, setGame] = useState<GameState>(INITIAL);
	const [you, setYou] = useState<string | null>(null);
	const controlsRef = useRef<GameControls | null>(null);
	const { scores, refresh } = useLeaderboard();

	const start = useCallback(() => setStarted(true), []);
	const restart = useCallback(() => {
		setGame(INITIAL);
		controlsRef.current?.reset();
	}, []);
	const onSubmitted = useCallback(
		(name: string) => {
			setYou(name);
			refresh();
		},
		[refresh],
	);

	const playing = started && game.phase === "playing";
	const won = started && game.phase === "won";
	const lost = started && game.phase === "lost";
	const bananas = String(game.bananas).padStart(2, "0");

	return (
		<div
			className="sbb-m-root dark"
			onPointerDown={(e) => {
				if (!playing) return;
				e.preventDefault();
				controlsRef.current?.jump();
			}}
			onPointerUp={() => playing && controlsRef.current?.release()}
			onPointerCancel={() => playing && controlsRef.current?.release()}
		>
			<div className="sbb-m-stage">
				{started ? (
					<BananaGame autoRun controlsRef={controlsRef} onState={setGame} />
				) : (
					<ReadyScene />
				)}

				<div className="sbb-scanlines" />

				<div className="sbb-m-hud" translate="no">
					<span className="sbb-m-hud-bananas">
						🍌 {bananas}/{game.total}
					</span>
					<span className="sbb-m-hud-world">{game.world}</span>
					<span className="sbb-m-hud-lives">♥ ×{game.lives}</span>
				</div>
				<span className="sbb-m-badge" translate="no">
					auto-run
				</span>

				{playing && (
					<div className="sbb-m-hint" translate="no">
						tap anywhere · hold to jump higher
					</div>
				)}

				{!started && (
					<div className="sbb-overlay sbb-m-overlay">
						<span className="sbb-overlay-title">
							SUPER
							<br />
							BANANA BROS
						</span>
						<button type="button" className="sbb-btn" onClick={start}>
							PLAY
						</button>
					</div>
				)}

				{(won || lost) && (
					<div className="sbb-overlay sbb-m-overlay">
						<span className={`sbb-overlay-title${lost ? " is-lost" : ""}`}>
							{won ? "YOU WIN!" : "GAME OVER"}
						</span>
						<SubmitScore score={game.score} onSubmitted={onSubmitted} />
						<div className="sbb-m-board">
							<ScoreList scores={scores.slice(0, 5)} highlight={you} />
						</div>
						<button type="button" className="sbb-btn" onClick={restart}>
							{won ? "PLAY AGAIN" : "RETRY"}
						</button>
					</div>
				)}
			</div>

			<footer className="sbb-m-footer">
				<SugaMark />
				<span>Deployed with Suga</span>
			</footer>
		</div>
	);
}

/** Static sky shown in the window before the player presses start. */
function ReadyScene() {
	return (
		<div
			className="absolute inset-0"
			style={{ background: "var(--game-sky)" }}
		/>
	);
}

function BananaMark() {
	return (
		<svg
			width="18"
			height="18"
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden="true"
		>
			<path
				d="M4.5 13.5c1.2 4 5 6.5 9.5 6.5 3.6 0 6.4-1.6 7.5-4-4.5 1.2-9.5.5-12.5-2.5C7 11.5 6 8.5 6.5 5.5 5 7.5 4 10.5 4.5 13.5Z"
				fill="#FFCE3B"
				stroke="#C98F1B"
				strokeWidth="1.4"
				strokeLinejoin="round"
			/>
			<path d="M6.5 5.5 6 3.8h2l-.4 2" fill="#7A5230" />
		</svg>
	);
}

/** Suga logomark (white), inlined from suga.app/assets/suga-icon-white.svg */
function SugaMark() {
	return (
		<svg
			width="20"
			height="20"
			viewBox="0 0 730 728"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
		>
			<path
				d="M315 117.868C345.94 100.004 384.06 100.004 415 117.868L553.157 197.632C584.097 215.496 603.157 248.508 603.157 284.235V443.765C603.157 479.492 584.097 512.504 553.157 530.368L415 610.133C384.06 627.996 345.94 627.996 315 610.133L176.843 530.368C145.903 512.504 126.843 479.492 126.843 443.765V284.235C126.843 248.508 145.903 215.496 176.843 197.632L315 117.868Z"
				fill="white"
			/>
			<path
				d="M369 556V417.524C369 380.432 389.531 346.387 422.337 329.079L540 267"
				stroke="black"
				strokeWidth="25"
				strokeLinecap="round"
			/>
		</svg>
	);
}
