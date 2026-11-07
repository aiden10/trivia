
import { TriviaSettings as TriviaSettingsType } from "@/shared/types";
import { useGameContext } from "@/shared/GameContext";
import Leaderboard from "../../../Leaderboard";
import TriviaSettings from "../TriviaSettings";
import Back from "@/components/Back";

export default function Results() {
    const { 
        host, 
        roomState,
        submitTriviaRestart,
        submitTriviaUpdateSettings,
    } = useGameContext();

    const triviaState = roomState?.triviaState;

    const handleSettingsChange = (settings: TriviaSettingsType) => {
        submitTriviaUpdateSettings(settings);
    };

    return (
        <div className="game-screen bg-lines">
            <Back inRoom={true}/>
            <h1 className="title font-bartle bg-dots">Results</h1>

            <Leaderboard />
            
            {host ? (
                <div className="flex flex-col gap-4 md:w-2/3 w-full">
                    <TriviaSettings
                        host={host}
                        settings={triviaState?.settings}
                        categoryCounts={triviaState?.categoryCounts}
                        onSettingsChange={handleSettingsChange}
                    />

                    <button 
                        className="btn-primary w-full text-2xl py-4 uppercase"
                        onClick={() => submitTriviaRestart()}
                    >
                        New Game
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4 md:w-2/3 w-full">
                    <TriviaSettings
                        host={false}
                        settings={triviaState?.settings}
                        categoryCounts={triviaState?.categoryCounts}
                        onSettingsChange={handleSettingsChange}
                    />
                    <h2 className="text-2xl font-bold text-white/50 mb-3 animate-pulse text-center">
                        Waiting for host...
                    </h2>
                </div>
            )}
        </div>
    );
}