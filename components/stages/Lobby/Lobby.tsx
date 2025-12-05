import { useGameContext } from "@/shared/GameContext"
import { Stages } from "@/shared/types";
import { useRouter } from "next/navigation";
import PlayerList from "@/components/PlayerList";
import GameSettings from "@/components/GameSettings";

export default function Lobby() {
    const { 
        host, 
        setQuestionDuration, 
        setWinningScore, 
        submitUpdateDifficulties, 
        submitUpdateStage, 
        submitUpdateQuestionDuration 
    } = useGameContext();

    const router = useRouter();

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
                
                <GameSettings
                    host={host}
                    showWinningScore={true}
                    showQuestionDuration={true}
                    onWinningScoreChange={handleWinningScoreChange}
                    onQuestionDurationChange={handleDurationChange}
                    onDifficultyChange={handleDifficultyChange}
                />
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