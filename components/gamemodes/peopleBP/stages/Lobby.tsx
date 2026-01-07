import { useGameContext } from "@/shared/GameContext";
import { PeopleBPSettings as PeopleBPSettingsType, PeopleBPStages } from "@/shared/types";
import PlayerList from "@/components/PlayerList";
import PeopleBPSettings from "../PeopleBPSettings";
import Back from "@/components/Back";

export default function Lobby() {
    const { 
        host, 
        players,
        submitPeopleBPUpdateStage,
        submitPeopleBPUpdateSettings,
    } = useGameContext();

    const handleSettingsChange = (settings: Partial<PeopleBPSettingsType>) => {
        submitPeopleBPUpdateSettings(settings as PeopleBPSettingsType);
    };
    const canStart = players.length >= 2;
    return (
        <div className="game-screen bg-dots">
            <Back inRoom={true}/>
            <h1 className="title font-bartle bg-dots">People BP</h1>
            
            <div className="w-full max-w-4xl gap-6">
                <PlayerList />

                <div className="flex flex-col gap-4 mt-10">
                    <h2 className="heading2">
                        {host ? "Settings" : "Waiting for host..."}
                    </h2>
                    
                    <PeopleBPSettings
                        host={host}
                        onSettingsChange={handleSettingsChange}
                    />
                </div>
                
                {host && (
                    <>
                        {!canStart && (
                            <p className="text-amber-400/75 text-center mt-4 font-inter font-light italic bg-amber-400/30 py-2 ">
                                Need at least 2 players to start
                            </p>
                        )}
                        <button
                            onClick={() => submitPeopleBPUpdateStage(PeopleBPStages.Game)}
                            disabled={!canStart}
                            className="btn-primary w-full text-2xl py-4 mt-4 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Game
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}