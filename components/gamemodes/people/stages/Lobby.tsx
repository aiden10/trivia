import { useGameContext } from "@/shared/GameContext";
import { PeopleStages, PeopleSettings as PeopleSettingsType } from "@/shared/types";
import PlayerList from "@/components/PlayerList";
import PeopleSettings from "../PeopleSettings";
import Back from "@/components/Back";

export default function Lobby() {
    const { 
        host, 
        submitPGUpdateStage, 
        submitPGUpdateSettings,
    } = useGameContext();

    const handleSettingsChange = (settings: PeopleSettingsType) => {
        submitPGUpdateSettings(settings);
    };
    
    return (
        <div className="game-screen bg-dots">
            <Back inRoom={true}/>
            <h1 className="title font-bartle bg-dots">People</h1>
            
            <div className="w-full max-w-4xl gap-6">
                <PlayerList />

                <div className="flex flex-col gap-4 mt-10">
                    <h2 className="heading2">
                        {host ? "Settings" : "Waiting for host..."}
                    </h2>
                    
                    <PeopleSettings
                        host={host}
                        onSettingsChange={handleSettingsChange}
                    />
                </div>
                
                {host && (
                    <button
                        onClick={() => submitPGUpdateStage(PeopleStages.PropertiesDisplay)}    
                        className="btn-primary w-full text-2xl py-4 mt-4 uppercase"
                    >
                        Start Game
                    </button>
                )}
            </div>
        </div>
    );
}