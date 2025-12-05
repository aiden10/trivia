'use client'

import { useGameContext } from '@/shared/GameContext';
import { Stages } from '@/shared/types';
import { useEffect, useState, useRef } from 'react';
import { Question } from '@/shared/types';
import PlayerList from '@/components/PlayerList';

export default function Reveal() {
    const { host, question, players, winningScore, submitUpdateStage, submitUpdateQuestion } = useGameContext();
    const [revealQuestion] = useState<Question | null>(question);
    const endTimeRef = useRef<number>(Date.now() + 4000);
    
    useEffect(() => {
        if (!host) return;
        
        endTimeRef.current = Date.now() + 4000;
        
        const interval = setInterval(() => {
            const timeLeft = Math.max(0, endTimeRef.current - Date.now());
            
            if (timeLeft === 0) {
                clearInterval(interval);
                const winner = players.find(player => player.score >= winningScore);
                
                if (winner) {
                    submitUpdateStage(Stages.Results);
                } else {
                    submitUpdateQuestion();
                    submitUpdateStage(Stages.QuestionDisplay);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [host, players, winningScore, submitUpdateStage, submitUpdateQuestion]);

    return <div className='w-full flex flex-col min-h-screen gap-y-16 p-4'>
        <div className='w-full justify-center items-center flex flex-col gap-16'>
            <h1 className='main-text-color text-2xl md:text-4xl w-full p-4 text-center drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.3)] font-semibold
            bg-indigo-500 border-4 border-black rounded-sm'>{revealQuestion?.body}</h1>
            <div className='flex flex-col w-full md:w-1/2'>
                <h1 className='bg-indigo-950 p-2 main-text-color w-full text-[14px] font-semibold'>ANSWER</h1>
                <h2 className='main-text-color text-[32px] bg-indigo-400  w-full p-4 text-center drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.3)] font-semibold'>{revealQuestion?.answer}</h2>
            </div>
        </div>
        <div className='w-full max-w-4xl mx-auto mt-10'>
            <PlayerList />
        </div>        
    </div>
}