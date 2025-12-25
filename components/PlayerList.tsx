import { useGameContext } from "@/shared/GameContext";

export default function PlayerList() {
    const { players } = useGameContext();
    
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.score < b.score) return 1;
        if (a.score > b.score) return -1;
        return 0;
    });

    return (
        <div className="flex-col bg-neutral-900 border-white border-2 bg-dots font-inter font-light">
            {sortedPlayers.map((player, index) => (
                <div key={index} className={`flex flex-row justify-between items-center py-2 px-4 transition-colors ${
                    player.guessedCorrectly ? 'bg-emerald-900/75' : ''
                }`}>
                    <div className="flex flex-col flex-1">
                        <div className="flex items-center gap-2">
                            <span className="text-[24px] font-bold text-white">#{index + 1}</span>
                            <h2 className="text-[24px] text-white ml-2">{player.playerName}</h2>
                        </div>
                        {!player.guessedCorrectly && player.guess && (
                            <p className="text-md text-white/80 italic ml-12 font-inter font-thin">
                                {player.guess}
                            </p>
                        )}
                        {player.correctGuesses && player.correctGuesses.length > 0 && (
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

                    <h1 className="text-[24px] text-white/80 md:ml-5">{player.score}</h1>
                </div>
            ))}
        </div>
    );
}