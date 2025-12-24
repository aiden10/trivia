'use client'

import { useGameContext } from '@/shared/GameContext';
import { TriviaStages } from '@/shared/types';
import { useEffect, useRef } from 'react';
import PlayerList from '@/components/PlayerList';
import { capitalizeWords } from '@/shared/utils';

export default function Reveal() {
    const { 
        host, 
        roomState,
        players, 
        submitTriviaUpdateStage, 
        submitTriviaUpdateQuestion,
    } = useGameContext();

    const triviaState = roomState?.triviaState;
    const question = triviaState?.currentQuestion;
    const winningScore = triviaState?.settings.winningScore ?? 100;
    
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
                    submitTriviaUpdateStage(TriviaStages.Results);
                } else {
                    submitTriviaUpdateQuestion();
                    submitTriviaUpdateStage(TriviaStages.QuestionDisplay);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [host, players, winningScore, submitTriviaUpdateStage, submitTriviaUpdateQuestion]);

    return (
        <div className='w-full flex flex-col min-h-screen gap-y-16 p-4 bg-lines'>
            <div className='w-full justify-center items-center flex flex-col gap-16 mt-4'>
                {/* Question */}
                <h1 className='heading1 bg-dots'>
                    {question?.body}
                </h1>

                {/* Answer Display */}
                <div className='flex flex-col w-full md:w-1/2'>
                    <h1 className='bg-white p-2 text-black w-full text-[14px] font-semibold font-inter'>
                        ANSWER
                    </h1>
                    <h2 className='heading1'>
                        {capitalizeWords(question?.answer || '')}
                    </h2>
                    <p className="text-white/75 text-center mt-2 text-md font-inter font-thin italic">
                        different spellings/variations are accepted
                    </p>
                </div>
            </div>

            <div className='w-full max-w-4xl mx-auto'>
                <PlayerList />
            </div>        
        </div>
    );
}