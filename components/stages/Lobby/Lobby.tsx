import { useGameContext } from "@/shared/GameContext"
import { Stages } from "@/shared/types";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PlayerList from "@/components/PlayerList";

export default function Lobby() {
    const { 
        host, 
        setQuestionDuration, 
        setWinningScore, 
        submitUpdateDifficulties, 
        submitUpdateStage, 
        submitUpdateQuestionDuration 
    } = useGameContext();

    const [easy, setEasy] = useState(true);
    const [medium, setMedium] = useState(true);
    const [hard, setHard] = useState(true);
    const router = useRouter();

    const handleWinningScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value)) {
            setWinningScore(value);
        }
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value)) {
            setQuestionDuration(value);
            submitUpdateQuestionDuration(value);
        }
    };

    return <div className="flex flex-col items-center gap-6 p-4 min-h-screen">
        <svg 
            className="w-4 h-4 md:w-8 md:h-8 absolute left-0 top-0 m-2 md:m-4 hover:cursor-pointer hover:opacity-50"
            onClick={() => router.push('/')}
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 108.06"><path d="M63.94,24.28a14.28,14.28,0,0,0-20.36-20L4.1,44.42a14.27,14.27,0,0,0,0,20l38.69,39.35a14.27,14.27,0,0,0,20.35-20L48.06,68.41l60.66-.29a14.27,14.27,0,1,0-.23-28.54l-59.85.28,15.3-15.58Z"/></svg>
        <div className="w-full max-w-4xl gap-6">
            <PlayerList />

            <div className="order-2 flex flex-col gap-4 mt-10">
                <h2 className="text-2xl font-bold text-white mb-3">
                    {host ? "settings" : "waiting for host..."}
                </h2>
                
                <div className="bg-indigo-800 border-black border-4 rounded-lg p-4 md:p-6 space-y-4">
                    <div className="flex flex-col gap-2">
                        <label className={`text-white text-lg font-semibold ${!host && 'opacity-50'}`}>
                            winning score
                        </label>
                        <input
                            type="number"
                            min="5"
                            max="9999"
                            placeholder="150"
                            step={5}
                            onChange={handleWinningScoreChange}
                            disabled={!host}
                            className={`bg-indigo-700 text-white rounded px-3 py-2 w-full ${!host && 'opacity-50 cursor-not-allowed'}`}
                        />
                    </div>

                    {/* Question Duration */}
                    <div className="flex flex-col gap-2">
                        <label className={`text-white text-lg font-semibold ${!host && 'opacity-50'}`}>
                            question duration (seconds)
                        </label>
                        <input
                            type="number"
                            min="3"
                            max="120"
                            placeholder="15"
                            step={5}
                            onChange={handleDurationChange}
                            disabled={!host}
                            className={`bg-indigo-700 text-white rounded px-3 py-2 w-full ${!host && 'opacity-50 cursor-not-allowed'}`}
                        />
                    </div>

                    {/* Difficulty Checkboxes */}
                    <div className="flex flex-col gap-2">
                        <label className="text-white text-lg font-semibold mb-1">
                            difficulty levels
                        </label>
                        
                        <div className="space-y-2">
                            <label className={`flex items-center gap-3 text-white ${!host && 'opacity-50'}`}>
                                <input
                                    type="checkbox"
                                    checked={easy}
                                    onChange={(e) => {
                                        setEasy(e.target.checked);
                                        submitUpdateDifficulties(e.target.checked, medium, hard);
                                    }}
                                    disabled={!host}
                                    className="w-5 h-5"
                                />
                                <span>easy (5 points)</span>
                            </label>

                            <label className={`flex items-center gap-3 text-white ${!host && 'opacity-50'}`}>
                                <input
                                    type="checkbox"
                                    checked={medium}
                                    onChange={(e) => {
                                        setMedium(e.target.checked);
                                        submitUpdateDifficulties(easy, e.target.checked, hard);
                                    }}
                                    disabled={!host}
                                    className="w-5 h-5"
                                />
                                <span>medium (10 points)</span>
                            </label>

                            <label className={`flex items-center gap-3 text-white ${!host && 'opacity-50'}`}>
                                <input
                                    type="checkbox"
                                    checked={hard}
                                    onChange={(e) => {
                                        setHard(e.target.checked);
                                        submitUpdateDifficulties(easy, medium, e.target.checked);
                                    }}
                                    disabled={!host}
                                    className="w-5 h-5"
                                />
                                <span>hard (15 points)</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
            {host && (
                <button
                    onClick={() => submitUpdateStage(Stages.QuestionDisplay)}    
                    className="btn-primary w-full text-2xl py-4 mt-4"
                >
                    start game
                </button>
            )}
        </div>
    </div>
}