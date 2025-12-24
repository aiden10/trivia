
import React from 'react';
import { useGameContext } from '@/shared/GameContext';

interface LeaderboardProps {
    showPositions?: boolean;
    maxPlayers?: number;
    compact?: boolean;
}

export default function Leaderboard({ showPositions = true, maxPlayers, compact = false }: LeaderboardProps) {
    const { players, playerID } = useGameContext();
    
    const sortedPlayers = [...players].sort((a, b) => {
        if (a.score !== b.score) {
            return b.score - a.score;
        }
        return a.playerName.localeCompare(b.playerName);
    });

    const displayPlayers = maxPlayers ? sortedPlayers.slice(0, maxPlayers) : sortedPlayers;

    return (
        <div className="overflow-hidden md:w-2/3 w-full font-inter">
            {/* Header */}
            <div className="bg-neutral-900 border-2 border-white text-white p-4">
                <p className="text-center text-white font-bold text-md font-inter">
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
                                flex items-center justify-between p-4 transition-all duration-200 hover:shadow-md bg-stone-800
                                border-2 border-white border-t-0
                                ${compact ? 'p-3' : 'p-4'}
                            `}
                            >
                            {/* Left side - Position and name */}
                            <div className="flex items-center space-x-4">
                                {/* Position */}
                                {showPositions && (
                                <div className="flex items-center justify-center w-8 h-8">
                                    <span className="text-lg font-bold text-white">#{position}</span>
                                </div>
                                )}
                                
                            {/* Player info */}
                            <div>
                                <div className="flex items-center space-x-2">
                                    <h3 className={`font-semibold text-white ${compact ? 'text-base' : 'text-lg'}`}>
                                        {player.playerName}
                                    </h3>
                                    {isCurrentPlayer && (
                                    <span className="bg-white text-xs px-2 py-1 rounded-sm">
                                        You
                                    </span>
                                    )}
                                </div>
                                {!compact && position <= 3 && (
                                    <p className="text-sm text-white">
                                    {position === 1 ? 'Winner!' : 
                                    position === 2 ? 'Second place' : 
                                    'Third place'}
                                    </p>
                                )}
                            </div>
                    </div>

                    {/* Right side - Score */}
                    <div className="text-right">
                            <div className={`font-bold text-white ${compact ? 'text-lg' : 'text-xl'}`}>
                                {player.score}
                            </div>
                            <div className="text-sm text-white">
                                {player.score === 1 ? 'point' : 'points'}
                            </div>
                        </div>
                    </div>
                );
                })}
            </div>

            {maxPlayers && sortedPlayers.length > maxPlayers && (
                <div className="bg-gray-50 p-3 text-center">
                    <p className="text-sm text-white">
                        Showing top {maxPlayers} of {sortedPlayers.length} players
                    </p>
                </div>
            )}
        </div>
    );
}