'use client'

import { useState, useEffect, useRef, useMemo } from 'react';
import { useGameContext } from '@/shared/GameContext';
import { capitalizeWords } from '@/shared/utils';
import WikidataSearch from '../../../WikidataSearch';
import Timer from '@/components/Timer';
import { useCountdown } from '@/shared/useCountdown';

export default function Game() {
    const { 
        roomState, 
        playerID,
        players,
        submitPeopleBPGuess,
        submitPeopleBPTimeout,
    } = useGameContext();

    const peopleBPState = roomState?.peopleBPState;
    const currentProperties = useMemo(() => 
        peopleBPState?.currentProperties ?? [], 
        [peopleBPState?.currentProperties]
    );
    const currentGuesser = peopleBPState?.currentGuesser;
    const settings = peopleBPState?.settings;
    const duration = peopleBPState?.turnDuration || 10;
    const remainingTime = useCountdown(
        peopleBPState?.turnEndsAt,
        duration,
        roomState?.serverTime,
    );

    const isMyTurn = playerID === currentGuesser;
    const currentGuesserName = players.find(p => p.playerID === currentGuesser)?.playerName ?? 'Unknown';
    const currentPlayer = players.find(p => p.playerID === playerID);
    const myLives = currentPlayer?.lives ?? 0;

    const [searchKey, setSearchKey] = useState(0);
    const guesserRef = useRef(currentGuesser);
    const propertiesRef = useRef(currentProperties);
    const expiredTurnRef = useRef<string>("");

    // Clear the search bar whenever the turn changes.
    useEffect(() => {
        if (guesserRef.current !== currentGuesser ||
            JSON.stringify(propertiesRef.current) !== JSON.stringify(currentProperties)) {
            guesserRef.current = currentGuesser;
            propertiesRef.current = currentProperties;
            setSearchKey(prev => prev + 1);
        }
    }, [currentGuesser, currentProperties]);

    // The server owns the turn deadline; the guesser reports the timeout.
    useEffect(() => {
        if (!isMyTurn || remainingTime > 0) return;

        const key = `${currentGuesser}-${peopleBPState?.turnEndsAt ?? 'local'}`;
        if (expiredTurnRef.current === key) return;
        expiredTurnRef.current = key;
        submitPeopleBPTimeout();
    }, [isMyTurn, remainingTime, currentGuesser, peopleBPState?.turnEndsAt, submitPeopleBPTimeout]);

    const handleSelect = (id: string) => {
        if (isMyTurn) {
            submitPeopleBPGuess(id);
        }
    };

    // lives display
    const renderLives = (lives: number) => {
        if (lives === 0) return 'DEAD';
        return '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, (settings?.startingLives ?? 3) - lives));
    };

    return (
        <div className='w-full flex flex-col min-h-screen gap-y-5 p-4 bg-lines'>
            <div className='w-full justify-center items-center flex flex-col md:gap-6 gap-8'>
                {/* Properties Display */}
                <h1 className='heading1 bg-dots uppercase text-center'>
                    {currentProperties.map(p => capitalizeWords(p.replace(/_/g, ' '))).join(' + ')}
                </h1>

                {/* Current Turn Indicator */}
                <div className={`w-full max-w-2xl p-4 border-2 text-center ${
                    isMyTurn 
                        ? 'bg-amber-900/50 border-amber-500' 
                        : 'bg-neutral-900 border-white/50'
                }`}>
                    {isMyTurn ? (
                        <p className="text-amber-400 text-xl font-inter font-bold uppercase animate-pulse">
                            Your Turn!
                        </p>
                    ) : (
                        <p className="text-white text-xl font-inter">
                            <span className="text-white/60">Waiting for</span> {currentGuesserName}
                        </p>
                    )}
                </div>

                {/* Searchbar */}
                <div className="w-full max-w-2xl">
                    <WikidataSearch 
                        key={searchKey}
                        onSelect={handleSelect} 
                        placeholder={isMyTurn ? "Search for a person..." : "Wait for your turn..."}
                        disabled={!isMyTurn}
                    />
                </div>

                <Timer remainingTime={remainingTime} duration={duration} />

                {/* My Lives */}
                <div className="bg-neutral-900 border-2 border-white p-4 w-full max-w-2xl">
                    <p className="text-white font-inter text-center text-2xl">
                        {renderLives(myLives)}
                    </p>
                </div>
            </div>

            {/* Player List */}
            <div className='w-full max-w-4xl mx-auto mt-6'>
                <div className="bg-neutral-900 border-2 border-white">
                    <h3 className="text-white font-inter uppercase text-sm p-3 border-b border-white/30 bg-black/50">
                        Players
                    </h3>
                    <div className="divide-y divide-white/10">
                        {players.map((player) => {
                            const isCurrentGuesser = player.playerID === currentGuesser;
                            const isEliminated = player.lives <= 0;
                            
                            return (
                                <div 
                                    key={player.playerID}
                                    className={`p-3 flex justify-between items-center transition-all ${
                                        isCurrentGuesser ? 'bg-amber-900/30' : ''
                                    } ${isEliminated ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        {isCurrentGuesser && (
                                            <span className="text-amber-400">▶</span>
                                        )}
                                        <span className={`text-white font-inter ${
                                            isEliminated ? 'line-through' : ''
                                        }`}>
                                            {player.playerName}
                                            {player.playerID === playerID && (
                                                <span className="ml-2 text-xs bg-white text-black px-1.5 py-0.5">
                                                    YOU
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-white/60 font-inter text-sm w-32 text-right truncate">
                                            {player.guess}
                                        </span>
                                        <span className="text-lg">
                                            {renderLives(player.lives)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}