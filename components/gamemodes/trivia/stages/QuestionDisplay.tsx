'use client'

import { useState, useEffect, useRef } from 'react';
import { useGameContext } from '@/shared/GameContext';
import { TriviaStages } from '@/shared/types';
import { GET_SONG_ENDPOINT } from '@/shared/constants';
import Timer from '@/components/Timer';
import { useCountdown } from '@/shared/useCountdown';
import PlayerList from '@/components/PlayerList';
import Image from 'next/image';

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
    const currentStage = triviaState?.currentStage;
    const hasImage = !!question?.image;
    const isSongQuestion = !!question?.songState;
    const songId = question?.songState?.songID;

    const [guess, setGuess] = useState("");
    const [imageLoaded, setImageLoaded] = useState(false);
    const remainingTime = useCountdown(
        roomState?.stageEndsAt,
        questionDuration,
        roomState?.serverTime,
    );
    
    const questionIdRef = useRef(question?.body);
    const expiredStageRef = useRef<string>("");
    const inputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Check if current player guessed correctly
    const currentPlayer = players.find(p => p.playerID === playerID);
    const guessedCorrectly = currentPlayer?.guessedCorrectly ?? false;
    const guessedSong = currentPlayer?.guessedSong ?? false;
    const guessedArtist = currentPlayer?.guessedArtist ?? false;

    const canStillGuess = isSongQuestion 
        ? (!guessedSong || !guessedArtist)
        : !guessedCorrectly;

    useEffect(() => {
        if (songId) {
            const audio = new Audio(`${GET_SONG_ENDPOINT}/${songId}`);
            audioRef.current = audio;
            audio.loop = true;

            const playPromise = audio.play();

            playPromise?.catch(() => {});

            return () => {
                audio.pause();
                audio.removeAttribute('src');
                audio.load();
                audioRef.current = null;
            };
        }
    }, [songId]);

    // Reset state when question changes
    useEffect(() => {
        if (questionIdRef.current !== question?.body || (hasImage && question?.image)) {
            questionIdRef.current = question?.body;
            setGuess("");
            setImageLoaded(false);
            inputRef.current?.focus();
        }
    }, [question?.body, question?.image, hasImage]);

    // The countdown comes from the server; whichever client is host advances
    // the stage once it reaches zero.
    useEffect(() => {
        if (!host || remainingTime > 0 || currentStage !== TriviaStages.QuestionDisplay) return;

        const key = `${currentStage}-${roomState?.stageEndsAt ?? 'local'}`;
        if (expiredStageRef.current === key) return;
        expiredStageRef.current = key;
        submitTriviaUpdateStage(TriviaStages.Reveal);
    }, [remainingTime, host, currentStage, roomState?.stageEndsAt, submitTriviaUpdateStage]);

    const handleSubmitGuess = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guess.trim() || !canStillGuess) return;
        
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
                        <div 
                            onContextMenu={(e) => e.preventDefault()}
                            className="relative w-full max-h-[300px] aspect-square bg-neutral-800 border-2 border-white overflow-hidden">
                            {!imageLoaded && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="animate-pulse text-white/50 font-inter">Loading...</div>
                                </div>
                            )}
                            <Image
                                src={question.image}
                                alt="Question image"
                                fill
                                className={`object-contain transition-opacity duration-300 ${
                                    imageLoaded ? 'opacity-100' : 'opacity-0'
                                }`}
                                onLoad={() => setImageLoaded(true)}
                                draggable={false}
                                unoptimized
                            />
                        </div>
                    )}

                    {isSongQuestion && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-white/60 text-sm font-inter uppercase tracking-wider animate-pulse">
                                    ♪ Now Playing ♪
                                </span>
                            </div>
                            <div className="flex gap-4 justify-center">
                                <div className={`px-4 md:w-1/4 w-full py-2 border-2 font-inter font-bold ${
                                    guessedSong 
                                        ? 'bg-emerald-700 border-emerald-400 text-emerald-200' 
                                        : 'bg-neutral-800 border-white/50 text-white/70'
                                }`}>
                                    Song{guessedSong ? '✓' : '?'}
                                </div>
                                <div className={`px-4 md:w-1/4 w-full py-2 border-2 font-inter font-bold ${
                                    guessedArtist 
                                        ? 'bg-emerald-700 border-emerald-400 text-emerald-200' 
                                        : 'bg-neutral-800 border-white/50 text-white/70'
                                }`}>
                                    Artist{guessedArtist ? '✓' : '?'}
                                </div>
                            </div>
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
                    {canStillGuess && (
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

                {/* PlayerList on right when image shown */}
                {hasImage && (
                    <div className='w-full md:w-96 md:flex-shrink-0 mt-6 md:mt-4 md:min-h-screen bg-neutral-900 border-white border-2 bg-dots'>
                        <PlayerList />
                    </div>
                )}
            </div>

            {/* PlayerList */}
            {!hasImage && (
                <div className='w-full mx-auto mt-4'>
                    <PlayerList />
                </div>
            )}
        </div>
    );
}