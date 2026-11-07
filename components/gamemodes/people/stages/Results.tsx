
import { PeopleSettings as PeopleSettingsType } from "@/shared/types";
import { useGameContext } from "@/shared/GameContext";
import Leaderboard from "../../../Leaderboard";
import PeopleSettings from "../PeopleSettings";
import Back from "@/components/Back";

export default function Results() {
    const { 
        host, 
        roomState,
        submitPGRestart,
        submitPGUpdateSettings,
    } = useGameContext();

    const peopleState = roomState?.peopleState;

    const handleSettingsChange = (settings: PeopleSettingsType) => {
        submitPGUpdateSettings(settings);
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
                        settings={peopleState?.settings}
                        onSettingsChange={handleSettingsChange}
                    />

                    <button 
                        className="btn-primary w-full text-2xl py-4 uppercase"
                        onClick={() => submitPGRestart()}
                    >
                        New Game
                    </button>
                </div>
            ) : (
                <div className="flex flex-col gap-4 md:w-2/3 w-full">
                    <PeopleSettings
                        host={false}
                        settings={peopleState?.settings}
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
