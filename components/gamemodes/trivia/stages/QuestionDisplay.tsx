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
    const hasImage = !!question?.image;

    const [remainingTime, setRemainingTime] = useState(questionDuration);
    const [guess, setGuess] = useState("");
    const [imageLoaded, setImageLoaded] = useState(false);
    
    const endTimeRef = useRef<number>(Date.now() + (questionDuration * 1000));
    const questionIdRef = useRef(question?.body);
    const inputRef = useRef<HTMLInputElement>(null);

    // Check if current player guessed correctly
    const currentPlayer = players.find(p => p.playerID === playerID);
    const guessedCorrectly = currentPlayer?.guessedCorrectly ?? false;

    // Reset state when question changes
    useEffect(() => {
        if (questionIdRef.current !== question?.body || (hasImage && question?.image)) {
            questionIdRef.current = question?.body;
            endTimeRef.current = Date.now() + (questionDuration * 1000);
            setRemainingTime(questionDuration);
            setGuess("");
            setImageLoaded(false);
            inputRef.current?.focus();
        }
    }, [question?.body, question?.image, questionDuration, hasImage]);

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
            <div className={`w-full max-w-8xl mx-auto ${hasImage ? 'md:flex md:flex-row md:gap-8 md:items-start' : 'flex flex-col'}`}>
                <div className='w-full md:flex-1 flex flex-col gap-4 mt-4'>
                    {/* Question */}
                    <h1 className='heading1 bg-dots text-center'>
                        {question?.body}
                    </h1>

                    {/* Timer */}
                    <Timer remainingTime={remainingTime} duration={questionDuration}/>

                    {/* Image */}
                    {hasImage && question?.image && (
                        <div className="relative w-full max-h-[300px] aspect-square bg-neutral-800 border-2 border-white overflow-hidden">
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-pulse text-white/50 font-inter">Loading...</div>
                                </div>
                            )}
                            <img
                                src={question.image}
                                alt="Question image"
                                className={`w-full h-full object-contain transition-opacity duration-300 ${
                                    imageLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                                onLoad={() => setImageLoaded(true)}
                            />
                        </div>
                    )}

                    {/* Correct feedback */}
                    {guessedCorrectly && (
                        <h2 className="main-text-color text-2xl bg-emerald-700 border-4 border-emerald-400 
                            text-center p-2 text-emerald-400">
                            You guessed it!
                        </h2>
                    )}

                    {/* Answer Input */}
                    {!guessedCorrectly && (
                        <form onSubmit={handleSubmitGuess} className="w-full">
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
                </div>

                {/* PlayerList - positioned on right when image shown */}
                {hasImage && (
                    <div className='w-full md:w-96 md:flex-shrink-0 mt-6 md:mt-4 md:min-h-screen bg-neutral-900 border-white border-2 bg-dots'>
                        <PlayerList />
                    </div>
                )}
            </div>

            {/* PlayerList */}
            {!hasImage && (
                <div className='w-full max-w-6xl mx-auto mt-4'>
                    <PlayerList />
                </div>
            )}
        </div>
    );
}