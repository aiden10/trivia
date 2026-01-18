import { useGameContext } from "@/shared/GameContext";
import { TriviaStages, TriviaSettings as TriviaSettingsType } from "@/shared/types";
import PlayerList from "@/components/PlayerList";
import TriviaSettings from "../TriviaSettings";
import Back from "@/components/Back";
export default function Lobby() {
    const { 
        host, 
        submitTriviaUpdateStage, 
        submitTriviaUpdateSettings,
    } = useGameContext();


    const handleSettingsChange = (settings: TriviaSettingsType) => {
        submitTriviaUpdateSettings(settings);
    };

    return (
        <div className="game-screen bg-dots">
            <Back inRoom={true}/>            
            <h1 className="title font-bartle bg-dots">Trivia</h1>
            
            <div className="w-full max-w-4xl gap-6">
                <PlayerList />

                <div className="flex flex-col gap-4 mt-10">
                    <h2 className="heading2">
                        {host ? "Settings" : "Waiting for host..."}
                    </h2>
                    
                    <TriviaSettings
                        host={host}
                        onSettingsChange={handleSettingsChange}
                    />
                </div>
                <p className="text-amber-400/75 mt-4 font-inter text-[12px] md:text-[16px] font-light italic bg-amber-400/30 p-2 ">
                    Note: The text question answers are sometimes flawed
                </p>

                {host && (
                    <button
                        onClick={() => submitTriviaUpdateStage(TriviaStages.QuestionDisplay)}    
                        className="btn-primary w-full text-2xl py-4 mt-4 uppercase"
                    >
                        Start Game
                    </button>
                )}
            </div>
        </div>
    );
}