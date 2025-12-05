'use client'

import { useGameContext } from "@/shared/GameContext";
import Leaderboard from "./Leaderboard";
import GameSettings from "@/components/GameSettings";

export default function ResultsStage() {
    const { host, submitRestart, submitUpdateDifficulties, setQuestionDuration, setWinningScore, submitUpdateQuestionDuration } = useGameContext();

    const handleWinningScoreChange = (value: number) => {
        setWinningScore(value);
    };

    const handleDurationChange = (value: number) => {
        setQuestionDuration(value);
        submitUpdateQuestionDuration(value);
    };

    const handleDifficultyChange = (easy: boolean, medium: boolean, hard: boolean) => {
        submitUpdateDifficulties(easy, medium, hard);
    };

    return <div className="flex flex-col gap-y-10 p-4 items-center">
        <Leaderboard/>
        {host && (
            <div className="flex flex-col gap-4 w-full max-w-md">
                <GameSettings
                    host={host}
                    showWinningScore={true}
                    showQuestionDuration={true}
                    onWinningScoreChange={handleWinningScoreChange}
                    onQuestionDurationChange={handleDurationChange}
                    onDifficultyChange={handleDifficultyChange}
                />

                <button 
                    className="btn-primary w-full text-2xl py-4"
                    onClick={() => submitRestart(true, true, true)}
                >
                    new game
                </button>
            </div>
        )}
        {
        !host && <h2 className="text-2xl font-bold text-white mb-3">
            waiting for host..
        </h2>
        }
    </div>
}