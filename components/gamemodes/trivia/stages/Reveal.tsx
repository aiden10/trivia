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
    const isSongQuestion = !!question?.songState;
    
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
                    submitTriviaUpdateStage(TriviaStages.QuestionDisplay);
                    submitTriviaUpdateQuestion();
                }
            }
        }, 100);

        return () => clearInterval(interval);
    }, [host, players, winningScore, submitTriviaUpdateStage, submitTriviaUpdateQuestion]);

    return (
        <div className='w-full flex flex-col min-h-screen gap-y-16 p-4 bg-lines'>
            <div className='w-full justify-center items-center flex flex-col gap-8 mt-4'>
                {/* Question */}
                <h1 className='heading1 bg-dots'>
                    {question?.body}
                </h1>

                {/* Song Answer Display */}
                {isSongQuestion && question?.songState && (
                    <div className='flex flex-col md:flex-row items-center gap-8 w-full max-w-2xl bg-neutral-900 p-6 bg-dots border-2 border-white'>
                        {/* Album Art */}
                        <img 
                            src={`https://cdn-images.dzcdn.net/images/cover/${question.songState.imageID}/250x250-000000-80-0-0.jpg`}
                            alt="Album cover"
                            className="w-64 h-64 shadow-lg"
                        />
                        
                        {/* Song & Artist */}
                        <div className='flex flex-col gap-4 flex-1 w-full'>
                            <div className='w-full'>
                                <h2 className='bg-white p-2 text-black text-[14px] font-semibold font-inter'>
                                    SONG
                                </h2>
                                <h3 className='heading1 text-2xl break-words'>
                                    {question.songState.songName}
                                </h3>
                            </div>
                            <div className='w-full'>
                                <h2 className='bg-white p-2 text-black text-[14px] font-semibold font-inter'>
                                    ARTIST
                                </h2>
                                <h3 className='heading1 text-2xl break-words'>
                                    {question.songState.artist}
                                </h3>
                            </div>
                        </div>
                    </div>
                )}

                {/* Regular Answer Display */}
                {!isSongQuestion && (
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
                )}
            </div>

            <div className='w-full max-w-4xl mx-auto'>
                <PlayerList />
            </div>        
        </div>
    );
}