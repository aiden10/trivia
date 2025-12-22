
import { TriviaSettings as TriviaSettingsType } from "@/shared/types";
import { useGameContext } from "@/shared/GameContext";
import Leaderboard from "../../../Leaderboard";
import PeopleSettings from "../PeopleSettings";

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
        <div className="flex flex-col gap-y-10 p-4 items-center">
            <Leaderboard />
            
            {host ? (
                <div className="flex flex-col gap-4 w-full max-w-md">
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
                <h2 className="text-2xl font-bold text-white mb-3">
                    Waiting for host...
                </h2>
            )}
        </div>
    );
}