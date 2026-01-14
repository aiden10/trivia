import { useGameContext } from "@/shared/GameContext";
import { PeopleBPSettings as PeopleBPSettingsType } from "@/shared/types";
import PeopleBPSettings from "../PeopleBPSettings";
import Back from "@/components/Back";

export default function Results() {
    const { 
        host, 
        players,
        roomState,
        submitPeopleBPUpdateSettings,
        submitPeopleBPRestart
    } = useGameContext();

    const peopleBPState = roomState?.peopleBPState;
    const winnerId = peopleBPState?.winner;
    const winner = players.find(p => p.playerID === winnerId);
    const canStart = players.length >= 2;

    const handleSettingsChange = (settings: Partial<PeopleBPSettingsType>) => {
        submitPeopleBPUpdateSettings(settings as PeopleBPSettingsType);
    };

    return (
        <div className="game-screen bg-lines">
            <Back inRoom={true}/>
            <h1 className="title font-bartle bg-dots">Game Over</h1>

            {/* Winner Display */}
            {winner && (
                <div className="w-full bg-gradient-to-b from-amber-900/50 to-neutral-900 
                    border-2 border-amber-500 p-12 text-center mb-6">
                    <p className="text-amber-400 text-2xl font-inter uppercase mb-4">Winner</p>
                    <h2 className="text-white text-[24px] md:text-[42px] font-bartle mb-4">{winner.playerName}</h2>
                    <p className="text-white/80 font-inter text-xl">
                        {winner.correctGuesses?.length ?? 0} correct {winner.correctGuesses?.length === 1 ? 'guess' : 'guesses'}
                    </p>
                </div>
            )}
            
            {host ? (
                <div className="flex flex-col gap-4 md:w-2/3 w-full mt-6">
                    <PeopleBPSettings
                        host={host}
                        onSettingsChange={handleSettingsChange}
                    />

                    <>
                        {!canStart && (
                            <p className="text-amber-400/75 text-center mt-4 font-inter font-light italic bg-amber-400/30 py-2 ">
                                Need at least 2 players to start
                            </p>
                        )}
                        <button
                            onClick={() => submitPeopleBPRestart()}
                            disabled={!canStart}
                            className="btn-primary w-full text-2xl py-4 mt-4 uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Start Game
                        </button>
                    </>
                </div>
            ) : (
                <h2 className="text-2xl font-bold text-white/50 mb-3 animate-pulse mt-6">
                    Waiting for host...
                </h2>
            )}
        </div>
    );
}