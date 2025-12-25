
import { TriviaSettings as TriviaSettingsType } from "@/shared/types";
import { useGameContext } from "@/shared/GameContext";
import Leaderboard from "../../../Leaderboard";
import PeopleSettings from "../PeopleSettings";
import Back from "@/components/Back";

export default function Results() {
    const { 
        host, 
        submitTriviaRestart,
        submitTriviaUpdateSettings,
    } = useGameContext();

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
                    <PeopleSettings
                        host={host}
                        onSettingsChange={handleSettingsChange}
                    />

                    <button 
                        className="btn-primary w-full text-2xl py-4"
                        onClick={() => submitTriviaRestart()}
                    >
                        New Game
                    </button>
                </div>
            ) : (
                <h2 className="text-2xl font-bold text-white mb-3 animate-pulse">
                    Waiting for host...
                </h2>
            )}
        </div>
    );
}