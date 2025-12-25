import { useGameContext } from "@/shared/GameContext";
import { RotanikaSettings as RotanikaSettingsType } from "@/shared/types";
import RotanikaSettings from "../RotanikaSettings";
import Back from "@/components/Back";

export default function Results() {
    const { 
        host, 
        roomState,
        players,
        submitRotanikaRestart,
        submitRotanikaUpdateSettings,
    } = useGameContext();

    const rotanikaState = roomState?.rotanikaState;
    const winner = rotanikaState?.winner;
    const winReason = rotanikaState?.winReason;
    const pickerId = rotanikaState?.pickerId;
    const questions = rotanikaState?.questions ?? [];

    const winnerName = players.find(p => p.playerID === winner)?.playerName;
    const pickerName = players.find(p => p.playerID === pickerId)?.playerName;

    const handleSettingsChange = (settings: RotanikaSettingsType) => {
        submitRotanikaUpdateSettings(settings);
    };

    const getResultMessage = () => {
        switch (winReason) {
            case 'guessed':
                return {
                    title: `${winnerName} guessed it!`,
                    subtitle: `The secret was: ${rotanikaState?.secretThing}`,
                    description: questions.length < (rotanikaState?.settings.minQuestions ?? 5)
                        ? `Guessed in only ${questions.length} questions! Only the guesser wins.`
                        : `Guessed in ${questions.length} questions. Both ${winnerName} and ${pickerName} win!`
                };
            case 'maxReached':
                return {
                    title: 'Nobody guessed it!',
                    subtitle: `The secret was: ${rotanikaState?.secretThing}`,
                    description: `${pickerName} (the picker) loses. Everyone else wins!`
                };
            case 'minNotReached':
                return {
                    title: 'Too easy...',
                    subtitle: `The secret was: ${rotanikaState?.secretThing}`,
                    description: `Guessed before the minimum questions. ${winnerName} wins!`
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

    return (
        <div className="game-screen bg-lines">
            <Back inRoom={true}/>
            <h1 className="title font-bartle bg-dots">Results</h1>

            <div className="w-full max-w-2xl flex flex-col items-center gap-6">
                {/* Result Display */}
                <div className="bg-neutral-900 border-2 border-white p-8 w-full text-center">
                    <h2 className="md:text-[32px] text-[18px] text-white font-bartle mb-4">
                        {result.title}
                    </h2>
                    <p className="text-white bg-emerald-900/50 md:text-[32px] text-[18px] font-inter font-thin mb-4
                    border-2 border-emerald-800 lowercase">
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
            
            {host ? (
                <div className="flex flex-col gap-4 md:w-2/3 w-full">
                    <RotanikaSettings
                        host={host}
                        onSettingsChange={handleSettingsChange}
                    />

                    <button 
                        className="btn-primary w-full text-2xl py-4 uppercase"
                        onClick={() => submitRotanikaRestart()}
                    >
                        New Game
                    </button>
                </div>
            ) : (
                <h2 className="text-2xl font-bold text-white/50 mb-3 animate-pulse">
                    Waiting for host...
                </h2>
            )}
        </div>
    );
}