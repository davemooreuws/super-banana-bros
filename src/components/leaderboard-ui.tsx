import { useCallback, useEffect, useState } from "react";
import { type ScoreEntry, submitScore, topScores } from "../lib/leaderboard";

export function useLeaderboard() {
	const [scores, setScores] = useState<ScoreEntry[]>([]);
	const refresh = useCallback(() => {
		topScores()
			.then(setScores)
			.catch(() => {});
	}, []);
	useEffect(() => {
		refresh();
	}, [refresh]);
	return { scores, refresh };
}

export function ScoreList({
	scores,
	highlight,
}: {
	scores: ScoreEntry[];
	highlight?: string | null;
}) {
	if (scores.length === 0) {
		return (
			<div className="sbb-scores-empty">No scores yet — be the first.</div>
		);
	}
	return (
		<div className="sbb-scores" translate="no">
			{scores.map((s) => (
				<div
					key={s.rank}
					className={`sbb-score-row${s.name === highlight ? " is-you" : ""}`}
				>
					<span>
						<span className="sbb-score-rank">{s.rank}.</span>
						{s.name}
					</span>
					<span className="sbb-score-pts">{s.score.toLocaleString()}</span>
				</div>
			))}
		</div>
	);
}

type SubmitStatus = "idle" | "saving" | "done" | "blocked" | "error";

export function SubmitScore({
	score,
	onSubmitted,
}: {
	score: number;
	onSubmitted?: (name: string) => void;
}) {
	const [name, setName] = useState("YOU");
	const [status, setStatus] = useState<SubmitStatus>("idle");

	const submit = async () => {
		setStatus("saving");
		try {
			const r = await submitScore({ data: { name, score } });
			if (r.ok) {
				setStatus("done");
				onSubmitted?.(r.name);
			} else {
				setStatus(r.reason === "blocked" ? "blocked" : "error");
			}
		} catch {
			setStatus("error");
		}
	};

	return (
		<div className="sbb-submit" translate="no">
			<span className="sbb-submit-score">SCORE {score.toLocaleString()}</span>
			{status === "done" ? (
				<span className="sbb-submit-done">Saved as {name}</span>
			) : (
				<div className="sbb-submit-row">
					<input
						className="sbb-submit-input"
						value={name}
						maxLength={3}
						aria-label="Your initials"
						onChange={(e) =>
							setName(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
						}
					/>
					<button
						type="button"
						className="sbb-submit-btn"
						onClick={submit}
						disabled={status === "saving" || score <= 0 || name.length === 0}
					>
						{status === "saving" ? "…" : "Submit"}
					</button>
				</div>
			)}
			{status === "blocked" && (
				<span className="sbb-submit-msg">Pick different initials.</span>
			)}
			{status === "error" && (
				<span className="sbb-submit-msg">Couldn't save score.</span>
			)}
		</div>
	);
}
