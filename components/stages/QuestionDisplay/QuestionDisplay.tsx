
'use client'

import { useState, useEffect } from 'react';
import { useGameContext } from '@/shared/GameContext';
import Option from './Option';
import { Stages } from '@/shared/types';
import PlayerList from '@/components/PlayerList';

export default function QuestionDisplay() {
    const { question, host, questionDuration, submitUpdateStage } = useGameContext();
    const [ remainingTime, setRemainingTime ] = useState(questionDuration);
    const [ canGuess, setCanGuess ] = useState(true);

    useEffect(() => {
        if (!host) return;
        
        const timer = setTimeout(() => {
            submitUpdateStage(Stages.Reveal);
        }, questionDuration * 1000);

        return () => clearTimeout(timer);
    }, [host, questionDuration, submitUpdateStage]);

    useEffect(() => {
        setRemainingTime(questionDuration);
        
        const interval = setInterval(() => {
            setRemainingTime(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [questionDuration]);

    return <div>
        <h1>{question?.body}</h1>
        <h2>{question?.value}</h2>
        <div className='grid-cols-2 grid-rows-2 gap-5'>
            {question?.options.map((option, index) => {
                return <Option 
                    key={index}
                    option={option} 
                    canGuess={canGuess}
                    setCanGuess={setCanGuess}
                />
            })}
        </div>
        <p>{remainingTime}s</p>
        <PlayerList />
    </div>
}
