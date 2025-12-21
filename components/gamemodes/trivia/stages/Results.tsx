'use client'

import { useGameContext } from "@/shared/GameContext";
import Leaderboard from "../../../Leaderboard";
import TriviaSettings from "../TriviaSettings";

export default function Results() {
    const { 
        host, 
        roomState,
        submitRestart,
        submitUpdateCategories,
        submitUpdateQuestionDuration,
    } = useGameContext();

    const triviaState = roomState?.gamemodeState;

    const handleCategoriesChange = (categories: string[]) => {
        submitUpdateCategories(categories);
    };

    const handleDurationChange = (duration: number) => {
        submitUpdateQuestionDuration(duration);
    };

    return (
        <div className="flex flex-col gap-y-10 p-4 items-center">
            <Leaderboard />
            
            {host ? (
                <div className="flex flex-col gap-4 w-full max-w-md">
                    <TriviaSettings
                        host={host}
                        initialCategories={triviaState?.categories ?? []}
                        initialDuration={triviaState?.questionDuration ?? 15}
                        onCategoriesChange={handleCategoriesChange}
                        onDurationChange={handleDurationChange}
                    />

                    <button 
                        className="btn-primary w-full text-2xl py-4"
                        onClick={() => submitRestart()}
                    >
                        New Game
                    </button>
                </div>
            ) : (
                <h2 className="text-2xl font-bold text-white mb-3">
                    Waiting for host...
                </h2>
            )}
        </div>
    );
}