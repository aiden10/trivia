'use client'

import { useState, useEffect, useRef } from 'react';
import { useGameContext } from '@/shared/GameContext';
import { TriviaStages } from '@/shared/types';
import Timer from '@/components/Timer';
import PlayerList from '@/components/PlayerList';

export default function QuestionDisplay() {
    const { 
        host, 
        roomState, 
        playerID,
        players,
        submitTriviaUpdateStage, 
        submitTriviaGuess,
    } = useGameContext();

    const triviaState = roomState?.triviaState;
    const question = triviaState?.currentQuestion;
    const questionDuration = triviaState?.settings.questionDuration ?? 15;

    const [remainingTime, setRemainingTime] = useState(questionDuration);
    const [guess, setGuess] = useState("");
    
    const endTimeRef = useRef<number>(Date.now() + (questionDuration * 1000));
    const questionIdRef = useRef(question?.body);
    const inputRef = useRef<HTMLInputElement>(null);

    // Check if current player guessed correctly
    const currentPlayer = players.find(p => p.playerID === playerID);
    const guessedCorrectly = currentPlayer?.guessedCorrectly ?? false;

    // Reset state when question changes
    useEffect(() => {
        if (questionIdRef.current !== question?.body) {
            questionIdRef.current = question?.body;
            endTimeRef.current = Date.now() + (questionDuration * 1000);
            setRemainingTime(questionDuration);
            setGuess("");
            inputRef.current?.focus();
        }
    }, [question?.body, questionDuration]);

    // Timer countdown
    useEffect(() => {
        const interval = setInterval(() => {
            const timeLeft = Math.max(0, Math.ceil((endTimeRef.current - Date.now()) / 1000));
            setRemainingTime(timeLeft);
            
            if (timeLeft === 0) {
                clearInterval(interval);
                if (host) {
                    submitTriviaUpdateStage(TriviaStages.Reveal);
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [question?.body, host, submitTriviaUpdateStage]);

    const handleSubmitGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guess.trim() || guessedCorrectly) return;
        
        submitTriviaGuess(guess.trim());
        setGuess("");
    };

    return (
        <div className='w-full flex flex-col min-h-screen gap-y-5 p-4 bg-lines'>
            <div className='w-full justify-center items-center flex flex-col md:gap-8 gap-12 mt-4'>
                {/* Question */}
                <h1 className='heading1 bg-dots'>
                    {question?.body}
                </h1>

                {/* Correct feedback */}
                {guessedCorrectly && (
                    <h2 className="main-text-color text-2xl bg-emerald-700 border-4 border-emerald-400 
                        min-w-[200px] text-center p-2 text-emerald-400">
                        You guessed it!
                    </h2>
                )}

                {/* Answer Input */}
                {!guessedCorrectly && (
                    <form onSubmit={handleSubmitGuess} className="w-full max-w-2xl">
                        <div className="flex flex-col gap-4">
                            <input
                                ref={inputRef}
                                type="text"
                                value={guess}
                                onChange={(e) => setGuess(e.target.value)}
                                placeholder="type your answer..."
                                autoFocus
                                className="input-primary"
                            />
                            
                            <button
                                type="submit"
                                disabled={!guess.trim()}
                                className="btn-primary w-full text-xl py-3 disabled:opacity-50 uppercase"
                            >
                                Submit Guess
                            </button>
                        </div>
                    </form>
                )}

                <Timer remainingTime={remainingTime} duration={questionDuration}/>
            </div>

            <div className='w-full max-w-4xl mx-auto mt-10'>
                <PlayerList />
            </div>
        </div>
    );
}