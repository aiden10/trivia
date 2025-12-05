'use client'

import { useGameContext } from "@/shared/GameContext";
import Leaderboard from "./Leaderboard";
import { useState } from "react";

export default function ResultsStage() {
    const { host, submitRestart, submitUpdateDifficulties } = useGameContext();
    const [easy, setEasy] = useState(true);
    const [medium, setMedium] = useState(true);
    const [hard, setHard] = useState(true);

    return <div className="flex flex-col gap-y-10 p-4 items-center">
        <Leaderboard/>
        
        {host && (
            <div className="flex flex-col gap-4 w-full max-w-md">
                <div className="bg-indigo-800 border-black border-4 rounded-lg p-4 space-y-3">
                    <label className="text-white text-lg font-semibold">
                        difficulty levels
                    </label>
                    
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 text-white">
                            <input
                                type="checkbox"
                                checked={easy}
                                onChange={(e) => {
                                    setEasy(e.target.checked);
                                    submitUpdateDifficulties(e.target.checked, medium, hard);
                                }}
                                className="w-5 h-5"
                            />
                            <span>easy (5 points)</span>
                        </label>

                        <label className="flex items-center gap-3 text-white">
                            <input
                                type="checkbox"
                                checked={medium}
                                onChange={(e) => {
                                    setMedium(e.target.checked);
                                    submitUpdateDifficulties(easy, e.target.checked, hard);
                                }}
                                className="w-5 h-5"
                            />
                            <span>medium (10 points)</span>
                        </label>

                        <label className="flex items-center gap-3 text-white">
                            <input
                                type="checkbox"
                                checked={hard}
                                onChange={(e) => {
                                    setHard(e.target.checked);
                                    submitUpdateDifficulties(easy, medium, e.target.checked);
                                }}
                                className="w-5 h-5"
                            />
                            <span>hard (15 points)</span>
                        </label>
                    </div>
                </div>

                <button 
                    className="btn-primary w-full text-2xl py-4"
                    onClick={() => submitRestart(easy, medium, hard)}
                >
                    new game
                </button>
            </div>
        )}
    </div>
}