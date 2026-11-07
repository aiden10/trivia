import { useGameContext } from "@/shared/GameContext";
import QuestionLog from "../QuestionLog";
import Back from "@/components/Back";
import RotanikaSettings from "../RotanikaSettings";
import { RotanikaSettings as RotanikaSettingsType } from "@/shared/types";

export default function Results() {
    const { 
        host, 
        roomState,
        players,
        submitRotanikaRestart,
        submitRotanikaUpdateSettings,
    } = useGameContext();

    const rotanikaState = roomState?.rotanikaState;
    const winReason = rotanikaState?.winReason;
    const pickerId = rotanikaState?.pickerId;
    const questions = rotanikaState?.questions ?? [];

    const pickerName = players.find(p => p.playerID === pickerId)?.playerName;

    const getResultMessage = () => {
        switch (winReason) {
            case 'maxReached':
                return {
                    title: 'Game Over!',
                    subtitle: `The secret was: ${rotanikaState?.secretThing}`,
                    description: `${pickerName} wins! Everyone else loses`
                };
            case 'guessed':
                return {
                    title: 'Game Over!',
                    subtitle: `The secret was: ${rotanikaState?.secretThing}`,
                    description: `The guessers win! ${pickerName} loses`
                };
            default:
                return {
                    title: 'Game Over',
                    subtitle: `The secret was: ${rotanikaState?.secretThing}`,
                    description: ''
                };
        }
    };

    const result = getResultMessage();

    const handleSettingsChange = (settings: RotanikaSettingsType) => {
        submitRotanikaUpdateSettings(settings);
    };

    return (
        <div className="game-screen bg-lines">
            <Back inRoom={true}/>
            <h1 className="title font-bartle bg-dots">Results</h1>

            <div className="w-full flex flex-col items-center gap-6">
                {/* Result Display */}
                <div className="bg-neutral-900 border-2 border-white p-8 w-full text-center">
                    <h2 className="md:text-[32px] text-[18px] text-white font-bartle mb-4">
                        {result.title}
                    </h2>
                    <p className="text-white bg-emerald-900/50 md:text-[32px] text-[18px] font-inter font-semibold mb-4
                    border-2 border-emerald-800">
                        {result.subtitle}
                    </p>
                    <p className="text-white/70 font-inter">
                        {result.description}
                    </p>
                </div>

                {/* Stats */}
                <div className="bg-neutral-900 border-2 border-white/50 p-4 w-full">
                    <p className="text-white font-inter text-center">
                        Total questions asked: <span className="font-bold">{questions.length}</span>
                    </p>
                </div>
            </div>
            <div className="w-full">
                <QuestionLog questions={questions} players={players}/>
            </div>
            <div className="flex flex-col gap-4 md:w-2/3 w-full">
                <RotanikaSettings
                    host={host}
                    onSettingsChange={handleSettingsChange}
                />
                {host ? (
                    <button 
                        className="btn-primary w-full text-2xl py-4 uppercase"
                        onClick={() => submitRotanikaRestart()}
                    >
                        New Game
                    </button>
                ) : (
                    <h2 className="text-2xl font-bold text-white/50 mb-3 animate-pulse text-center">
                        Waiting for host...
                    </h2>
                )}
            </div>
        </div>
    );
}