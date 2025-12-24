'use client'

import { useState, useEffect, useRef } from 'react';
import { useGameContext } from '@/shared/GameContext';
import { PeopleStages } from '@/shared/types';
import { capitalizeWords } from '@/shared/utils';
import PlayerList from '@/components/PlayerList';
import WikidataSearch from '../WikidataSearch';
import Timer from '@/components/Timer';

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

    return (
        <div className='w-full flex flex-col min-h-screen gap-y-5 p-4 bg-lines'>
            <div className='w-full justify-center items-center flex flex-col md:gap-8 gap-12'>
                {/* Properties Display */}
                <h1 className='heading1 bg-dots uppercase'>
                    {currentProperties?.map(p => capitalizeWords(p.replace(/_/g, ' '))).join(', ')}
                </h1>

                {/* Correct Guesses */}
                {currentPlayer?.correctGuesses && currentPlayer.correctGuesses.length > 0 && (
                    <div className="w-full max-w-2xl">
                        <p className="text-white text-md mb-2 text-center font-inter uppercase bg-black/50 p-2">Your correct guesses</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {currentPlayer.correctGuesses.map((correctGuess, i) => (
                                <span 
                                    key={i}
                                    className="px-3 py-1.5 bg-emerald-900 text-white 
                                        text-sm font-medium border-2 border-emerald-600
                                        shadow-md font-inter"
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
                <Timer remainingTime={remainingTime} duration={duration}/>
            </div>

            <div className='w-full max-w-4xl mx-auto mt-10'>
                <PlayerList />
            </div>
        </div>
    );
}