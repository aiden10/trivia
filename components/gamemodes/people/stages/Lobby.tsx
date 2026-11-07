import { useGameContext } from "@/shared/GameContext";
import { PeopleStages, PeopleSettings as PeopleSettingsType } from "@/shared/types";
import PlayerList from "@/components/PlayerList";
import PeopleSettings from "../PeopleSettings";
import Back from "@/components/Back";

export default function Lobby() {
    const { 
        host, 
        roomState,
        submitPGUpdateStage, 
        submitPGUpdateSettings,
    } = useGameContext();

    const peopleState = roomState?.peopleState;

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
                        {host ? "Settings" : "Host Settings"}
                    </h2>
                    
                    <PeopleSettings
                        host={host}
                        settings={peopleState?.settings}
                        onSettingsChange={handleSettingsChange}
                    />

                    {!host && (
                        <p className="text-white/50 text-center font-inter text-sm italic">
                            Waiting for the host to start the game...
                        </p>
                    )}
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