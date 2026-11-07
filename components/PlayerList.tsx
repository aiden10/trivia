import { useGameContext } from "@/shared/GameContext";
import { GameModes, TriviaStages } from "@/shared/types";

export default function PlayerList() {
    const { players, roomState, host, playerID, submitTransferHost } = useGameContext();
    
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.score < b.score) return 1;
        if (a.score > b.score) return -1;
        return 0;
    });

    return (
        <div className="flex flex-col bg-neutral-900 border-white border-2 bg-dots font-inter 
         font-light max-h-[60vh] md:max-h-[50vh] overflow-y-auto">
            {sortedPlayers.map((player, index) => (
                <div key={player.playerID} className={`flex flex-row justify-between items-center py-2 px-4 transition-colors ${
                    player.guessedCorrectly ? 'bg-emerald-900/75' : ''
                } ${player.connected === false ? 'opacity-50' : ''}`}>
                    <div className="flex flex-col flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[24px] font-bold text-white">#{index + 1}</span>
                            <h2 className="text-[24px] text-white ml-2 truncate">{player.playerName}</h2>
                            {player.playerID === playerID && (
                                <span className="text-xs bg-white text-black px-1.5 py-0.5 font-inter">YOU</span>
                            )}
                            {player.host && (
                                <span className="text-[20px]" title="Host">👑</span>
                            )}
                            {player.connected === false && (
                                <span className="text-[11px] text-amber-400/80 font-inter uppercase animate-pulse">
                                    {player.leaving ? 'leaving' : 'reconnecting'}
                                </span>
                            )}
                        </div>
                        {!player.guessedCorrectly && player.guess && (
                            <p className="text-md text-white/80 italic ml-12 font-inter font-thin">
                                {player.guess}
                            </p>
                        )}
                        {/* Only show the correct guesses in Trivia if it's the reveal stage */}
                        {player.correctGuesses && player.correctGuesses.length > 0 && (
                            roomState?.gamemode !== GameModes.Trivia || 
                            (roomState?.gamemode === GameModes.Trivia && roomState.triviaState?.currentStage === TriviaStages.Reveal)
                        ) && (
                            <div className="ml-6 mt-1 flex flex-wrap gap-1">
                                {player.correctGuesses.map((correctGuess, i) => (
                                    <span 
                                        key={i}
                                        className="px-2 py-0.5 bg-emerald-900 text-white
                                            text-xs font-medium border border-emerald-500"
                                    >
                                        ✓ {correctGuess}
                                    </span>
                                ))}
                            </div>
                        )}                    
                    </div>

                    <div className="flex items-center gap-3 md:ml-5">
                        {host && !player.host && player.connected !== false && (
                            <button
                                onClick={() => submitTransferHost(player.playerID)}
                                className="text-[11px] uppercase font-inter border border-white/40 px-2 py-1
                                    text-white/70 hover:text-white hover:border-white transition-colors whitespace-nowrap"
                                title={`Make ${player.playerName} the host`}
                            >
                                Make host
                            </button>
                        )}
                        <h1 className="text-[24px] text-white/80">{player.score}</h1>
                    </div>
                </div>
            ))}
        </div>
    );
}