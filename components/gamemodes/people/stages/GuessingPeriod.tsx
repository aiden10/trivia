'use client'

import { useState, useEffect, useRef } from 'react';
import { useGameContext } from '@/shared/GameContext';
import { PeopleStages } from '@/shared/types';
import { capitalizeWords } from '@/shared/utils';
import PlayerList from '@/components/PlayerList';
import WikidataSearch from '../WikidataSearch';

export default function GuessingPeriod() {
    const { 
        host, 
        roomState, 
        playerID,
        players,
        submitPGUpdateStage, 
        submitPGGuess,
        submitPGUpdateProperties
    } = useGameContext();

    const peopleState = roomState?.peopleState;
    const currentProperties = peopleState?.currentProperties;
    const duration = peopleState?.settings.duration ?? 15;

    const [remainingTime, setRemainingTime] = useState(duration);

    const endTimeRef = useRef<number>(Date.now() + (duration * 1000));
    const propertiesRef = useRef(currentProperties);

    const currentPlayer = players.find(p => p.playerID === playerID);

    // Reset state when properties change
    useEffect(() => {
        if (propertiesRef.current !== currentProperties) {
            propertiesRef.current = currentProperties;
            endTimeRef.current = Date.now() + (duration * 1000);
            setRemainingTime(duration);
        }
    }, [currentProperties, duration]);

    // Timer countdown
    useEffect(() => {
        const interval = setInterval(() => {
            const timeLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
            setRemainingTime(timeLeft);
            
            if (timeLeft === 0) {
                clearInterval(interval);
                if (host) {
                    submitPGUpdateProperties();
                    submitPGUpdateStage(PeopleStages.PropertiesDisplay);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [currentProperties, host, submitPGUpdateStage, submitPGUpdateProperties]);

    const handleSelect = (id: string) => {
        submitPGGuess(id);
    };

    const progressPercentage = (remainingTime / duration) * 100;

    return (
        <div className='w-full flex flex-col min-h-screen gap-y-5 p-4'>
            <div className='w-full justify-center items-center flex flex-col md:gap-8 gap-12'>
                {/* Properties Display */}
                <h1 className='main-text-color text-2xl md:text-4xl w-full p-4 text-center 
                    drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.3)] font-semibold
                    bg-indigo-500 border-4 border-black rounded-sm'>
                    {currentProperties?.map(p => capitalizeWords(p.replace(/_/g, ' '))).join(', ')}
                </h1>

                {/* Correct Guesses */}
                {currentPlayer?.correctGuesses && currentPlayer.correctGuesses.length > 0 && (
                    <div className="w-full max-w-2xl">
                        <p className="text-indigo-200 text-sm mb-2 text-center">Your correct guesses:</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {currentPlayer.correctGuesses.map((correctGuess, i) => (
                                <span 
                                    key={i}
                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-full 
                                        text-sm font-medium border-2 border-emerald-400
                                        shadow-md"
                                >
                                    ✓ {correctGuess}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Search */}
                <WikidataSearch 
                    onSelect={handleSelect} 
                    placeholder="Search for a person..."
                />

                {/* Timer */}
                <div className='flex flex-col items-center w-full max-w-4xl gap-2'>
                    <p className='main-text-color text-2xl'>{remainingTime}s</p>
                    <div className='w-full h-1 bg-gray-700 rounded-full overflow-hidden'>
                        <div 
                            className='h-full bg-white transition-all duration-100 ease-linear'
                            style={{ width: `${progressPercentage}%` }}
                        />
                    </div>
                </div>
            </div>

            <div className='w-full max-w-4xl mx-auto mt-10'>
                <PlayerList />
            </div>
        </div>
    );
}