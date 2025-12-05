
import React from 'react';
import { useGameContext } from '@/shared/GameContext';

interface LeaderboardProps {
    title?: string;
    showPositions?: boolean;
    maxPlayers?: number;
    compact?: boolean;
}

export default function Leaderboard({ title = "Leaderboard", showPositions = true, maxPlayers, compact = false }: LeaderboardProps) {
    const { players, playerID } = useGameContext();
    
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.score !== b.score) {
            return b.score - a.score;
        }
        return a.playerName.localeCompare(b.playerName);
    });

    // Limit players if maxPlayers is specified
    const displayPlayers = maxPlayers ? sortedPlayers.slice(0, maxPlayers) : sortedPlayers;

    return (
        <div className="bg-white rounded-md overflow-hidden w-full">
            {/* Header */}
            <div className="bg-blue-600 border-4 border-black text-white p-4">
                <h2 className="text-2xl font-bold text-center">{title}</h2>
                <p className="text-center text-white font-bold text-sm">
                {players.length} {players.length === 1 ? 'player' : 'players'}
                </p>
            </div>

            {/* Player list */}
            <div className="divide-y divide-gray-200">
                {displayPlayers.map((player, index) => {
                    const position = index + 1;
                    const isCurrentPlayer = player.playerID === playerID;
                
                    return (
                        <div
                            key={player.playerID}
                            className={`
                                flex items-center justify-between p-4 transition-all duration-200 hover:shadow-md bg-amber-50
                                border-4 border-black border-t-0
                                ${compact ? 'p-3' : 'p-4'}
                            `}
                            >
                            {/* Left side - Position and name */}
                            <div className="flex items-center space-x-4">
                                {/* Position */}
                                {showPositions && (
                                <div className="flex items-center justify-center w-8 h-8">
                                    <span className="text-lg font-bold text-gray-500">#{position}</span>
                                </div>
                                )}
                                
                                {/* Player info */}
                            <div>
                            <div className="flex items-center space-x-2">
                                <h3 className={`font-semibold ${compact ? 'text-base' : 'text-lg'}`}>
                                    {player.playerName}
                                </h3>
                                {isCurrentPlayer && (
                                <span className="bg-indigo-300 text-white text-xs px-2 py-1 rounded-full">
                                    You
                                </span>
                                )}
                            </div>
                            {!compact && position <= 3 && (
                                <p className="text-sm text-gray-600">
                                {position === 1 ? 'Winner' : 
                                position === 2 ? 'Runner-up' : 
                                'Third place'}
                                </p>
                            )}
                            </div>
                    </div>

                    {/* Right side - Score */}
                    <div className="text-right">
                            <div className={`font-bold ${compact ? 'text-lg' : 'text-xl'} ${
                                position === 1 ? 'text-yellow-600' :
                                position === 2 ? 'text-gray-600' :
                                position === 3 ? 'text-orange-600' :
                                'text-gray-800'
                            }`}>
                                {player.score}
                            </div>
                            <div className="text-sm text-gray-500">
                                {player.score === 1 ? 'point' : 'points'}
                            </div>
                        </div>
                    </div>
                );
                })}
            </div>

            {/* Footer with additional info */}
            {maxPlayers && sortedPlayers.length > maxPlayers && (
                <div className="bg-gray-50 p-3 text-center">
                    <p className="text-sm text-gray-600">
                        Showing top {maxPlayers} of {sortedPlayers.length} players
                    </p>
                </div>
            )}

            {/* Current player's position if not in top results */}
            {maxPlayers && 
            sortedPlayers.length > maxPlayers && 
            !displayPlayers.some(p => p.playerID === playerID) && (
                <div className="bg-blue-50 border-t-2 border-blue-200 p-3">
                {(() => {
                    const currentPlayerIndex = sortedPlayers.findIndex(p => p.playerID === playerID);
                    const currentPlayer = sortedPlayers[currentPlayerIndex];
                    return currentPlayer ? (
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-blue-800">
                            Your position: #{currentPlayerIndex + 1}
                        </span>
                        <span className="font-bold text-blue-800">
                            {currentPlayer.score} points
                        </span>
                    </div>
                    ) : null;
                })()}
                </div>
            )}
        </div>
    );
}