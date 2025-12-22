'use client'

import { useGameContext } from '@/shared/GameContext';
import { PeopleStages } from '@/shared/types';
import { useEffect, useRef } from 'react';
import PlayerList from '@/components/PlayerList';
import { capitalizeWords } from '@/shared/utils';

export default function PropertiesDisplay() {
    const { 
        host, 
        roomState,
        players, 
        submitPGUpdateStage, 
    } = useGameContext();

    const peopleState = roomState?.peopleState;
    const winningScore = peopleState?.settings.winningScore ?? 100;
    const properties = peopleState?.currentProperties ?? [];
    
    const endTimeRef = useRef<number>(Date.now() + 2500);

    useEffect(() => {
        if (!host) return;
        
        const winner = players.find(player => player.score >= winningScore);
        if (winner) submitPGUpdateStage(PeopleStages.Results);

        endTimeRef.current = Date.now() + 2500;
        
        const interval = setInterval(() => {
            const timeLeft = Math.max(0, endTimeRef.current - Date.now());
            if (timeLeft === 0) {
                clearInterval(interval);
                submitPGUpdateStage(PeopleStages.GuessingPeriod);
            }
        }, 100);

        return () => clearInterval(interval);
    }, [host, players, winningScore, submitPGUpdateStage]);

    return (
        <div className='w-full flex flex-col min-h-screen gap-y-16 p-4'>
            <div className='w-full justify-center items-center flex flex-col gap-16'>
                {/* Properties */}
                <h1 className='main-text-color text-2xl md:text-4xl w-full p-4 text-center 
                    drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.3)] font-semibold
                    bg-indigo-500 border-4 border-black rounded-sm'>
                    {properties.map(p => capitalizeWords(p.replace(/_/g, ' '))).join(', ')}
                </h1>
            </div>

            <div className='w-full max-w-4xl mx-auto mt-10'>
                <PlayerList />
            </div>        
        </div>
    );
}