
'use client'

import { useGameContext } from '@/shared/GameContext';
import { Stages } from '@/shared/types';
import { useEffect, useState } from 'react';
import { Question } from '@/shared/types';
import PlayerList from '@/components/PlayerList';

export default function Reveal() {
    const { host, question, players, winningScore, submitUpdateStage, submitUpdateQuestion } = useGameContext();
    const [revealQuestion] = useState<Question | null>(question);
    useEffect(() => {
        if (!host) return;
        
        const timer = setTimeout(() => {
            const winner = players.find(player => player.score >= winningScore);
            
            if (winner) {
                submitUpdateStage(Stages.Results);
            } else {
                submitUpdateQuestion();
                submitUpdateStage(Stages.QuestionDisplay);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, [host, players, winningScore, submitUpdateStage, submitUpdateQuestion]);

    return <div>
        <h1>{revealQuestion?.body}</h1>
        <h2>The answer was: {revealQuestion?.answer}</h2>
        <PlayerList />
    </div>
}
