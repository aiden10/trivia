'use client'

import { useState, useEffect, useRef } from 'react';
import { useGameContext } from '@/shared/GameContext';
import Option from './Option';
import { Stages } from '@/shared/types';
import PlayerList from '@/components/PlayerList';

export default function QuestionDisplay() {
    const { question, host, questionDuration, submitUpdateStage } = useGameContext();
    const [ remainingTime, setRemainingTime ] = useState(questionDuration);
    const [ canGuess, setCanGuess ] = useState(true);
    const [ feedback, setFeedback ] = useState<'correct' | 'incorrect' | null>(null);
    const [ ptsPrefix, setPtsPrefix ] = useState("");
    const endTimeRef = useRef<number>(Date.now() + (questionDuration * 1000));
    const questionIdRef = useRef(question?.body);

    useEffect(() => {
        if (questionIdRef.current !== question?.body) {
            questionIdRef.current = question?.body;
            endTimeRef.current = Date.now() + (questionDuration * 1000);
            setRemainingTime(questionDuration);
            setCanGuess(true);
            setFeedback(null);
            setPtsPrefix("");
        }
        
        const interval = setInterval(() => {
            const timeLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
            setRemainingTime(timeLeft);
            
            if (timeLeft === 0) {
                clearInterval(interval);
                if (host) {
                    submitUpdateStage(Stages.Reveal);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [question?.body, questionDuration, host, submitUpdateStage]);
    
    useEffect(() => {
        if (feedback === 'correct') setPtsPrefix("+");
        if (feedback === 'incorrect') setPtsPrefix("✗ ");
    }, [feedback]);

    const progressPercentage = (remainingTime / questionDuration) * 100;

    return <div className='w-full flex flex-col min-h-screen gap-y-5 p-4'>
        <div className='w-full justify-center items-center flex flex-col md:gap-8 gap-12'>

            <h1 className='main-text-color text-2xl md:text-4xl w-full p-4 text-center drop-shadow-[0_1.5px_1.5px_rgba(0,0,0,0.3)] font-semibold
            bg-indigo-500 border-4 border-black rounded-sm'>{question?.body}</h1>

            <h2 className={`main-text-color ${ptsPrefix === '+' && "text-emerald-600"} ${ptsPrefix === '✗ ' && "text-rose-700"} 
            text-2xl bg-indigo-800 border-4 border-cyan-50 min-w-[200px] text-center p-2 transition-colors`}>
            {ptsPrefix}{question?.value} pts
            </h2>
            
            <div className='grid grid-cols-2 md:grid-cols-2 gap-4 w-full max-w-4xl'>
                {question?.options.map((option, index) => {
                    return <Option 
                        key={index}
                        option={option} 
                        canGuess={canGuess}
                        setCanGuess={setCanGuess}
                        setFeedback={setFeedback}
                    />
                })}
            </div>
            
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
}