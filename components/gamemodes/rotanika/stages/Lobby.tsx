import { useGameContext } from "@/shared/GameContext";
import { RotanikaStages, RotanikaSettings as RotanikaSettingsType } from "@/shared/types";
import PlayerList from "@/components/PlayerList";
import RotanikaSettings from "../RotanikaSettings";
import Back from "@/components/Back";

export default function Lobby() {
    const { 
        host, 
        submitRotanikaUpdateStage, 
        submitRotanikaUpdateSettings,
        players
    } = useGameContext();

    const handleSettingsChange = (settings: RotanikaSettingsType) => {
        submitRotanikaUpdateSettings(settings);
    };

    const canStart = players.length >= 2;

    return (
        <div className="game-screen bg-dots">
            <Back inRoom={true}/>
            <h1 className="title font-bartle bg-dots">Rotanika</h1>
            
            <div className="w-full max-w-4xl gap-6">
                <PlayerList />

                <div className="flex flex-col gap-4 mt-10">
                    <h2 className="heading2">
                        {host ? "Settings" : "Waiting for host..."}
                    </h2>
                    
                    <RotanikaSettings
                        host={host}
                        onSettingsChange={handleSettingsChange}
                    />
                </div>
                
                {host && (
                    <>
                        {!canStart && (
                            <p className="text-amber-400/75 text-center mt-4 font-inter font-light italic">
                                Need at least 2 players to start
                            </p>
                        )}
                        <button
                            onClick={() => submitRotanikaUpdateStage(RotanikaStages.Picking)}
                            disabled={!canStart}
                            className="btn-primary w-full text-2xl py-4 mt-4 uppercase disabled:opacity-50"
                        >
                            Start Game
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}