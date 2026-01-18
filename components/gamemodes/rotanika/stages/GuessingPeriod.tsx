'use client'

import { useState } from 'react';
import { useGameContext } from '@/shared/GameContext';
import QuestionLog from '../QuestionLog';

export default function GuessingPeriod() {
    const { 
        roomState, 
        playerID, 
        players,
        submitRotanikaAskQuestion,
        submitRotanikaAnswerQuestion
    } = useGameContext();

    const rotanikaState = roomState?.rotanikaState;
    const pickerId = rotanikaState?.pickerId;
    const isPicker = playerID === pickerId;
    const currentAsker = rotanikaState?.currentAsker;
    const isMyTurn = playerID === currentAsker;
    const waitingForAnswer = rotanikaState?.waitingForAnswer ?? false;
    const currentQuestion = rotanikaState?.currentQuestion;
    const questions = rotanikaState?.questions ?? [];
    const settings = rotanikaState?.settings;

    const currentAskerName = players.find(p => p.playerID === currentAsker)?.playerName ?? 'Unknown';
    
    const [questionText, setQuestionText] = useState('');
    const [isDeciding, setIsDeciding] = useState(false);

    const handleSubmitQuestion = (e: React.FormEvent) => {
        e.preventDefault();
        if (!questionText.trim()) return;
        submitRotanikaAskQuestion(questionText.trim(), isDeciding);
        setQuestionText('');
        setIsDeciding(false);
    };

    const handleAnswer = (answer: 'yes' | 'no' | 'unsure') => {
        submitRotanikaAnswerQuestion(answer);
    };

    return (
        <div className="game-screen bg-lines pt-8">
            <div className="w-full max-w-4xl flex flex-col gap-6">
                {/* Header */}
                <div className="flex justify-between items-center bg-neutral-900 p-4 border-2 border-white">
                    <span className="text-white font-inter">
                        Questions: {questions.length} / {settings?.maxQuestions ?? 20}
                    </span>
                </div>

                {/* Current Question Display */}
                {waitingForAnswer && currentQuestion && (
                    <div className="bg-neutral-900 border-2 border-amber-500 p-6">
                        <p className="text-amber-400 text-sm uppercase mb-2 font-inter">
                            {currentAskerName} asks:
                        </p>
                        <h2 className={`text-white text-2xl font-inter ${
                            questions[questions.length - 1]?.isDeciding 
                                ? 'text-purple-400' 
                                : ''
                        }`}>
                            {currentQuestion}
                            {questions[questions.length - 1]?.isDeciding && (
                                <span className="ml-2 text-sm bg-purple-600 px-2 py-1 rounded">
                                    DECIDING
                                </span>
                            )}
                        </h2>

                        {/* Answer Buttons for Picker */}
                        {isPicker && (
                            <div className="flex gap-4 mt-6">
                                <button
                                    onClick={() => handleAnswer('yes')}
                                    className="btn-primary flex-1 text-center bg-emerald-900 
                                        border-emerald-500 hover:bg-emerald-800"
                                >
                                    Yes
                                </button>
                                <button
                                    onClick={() => handleAnswer('no')}
                                    className="btn-primary flex-1 text-center bg-red-900 
                                        border-red-500 hover:bg-red-800"
                                >
                                    No
                                </button>
                                {!questions[questions.length - 1]?.isDeciding && (
                                    <button
                                        onClick={() => handleAnswer('unsure')}
                                        className="btn-primary flex-1 text-center bg-neutral-700 
                                            border-neutral-500 hover:bg-neutral-600"
                                    >
                                        Unsure
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Waiting message for non-pickers */}
                        {!isPicker && (
                            <p className="text-white/60 mt-4 font-inter animate-pulse">
                                Waiting for picker to answer...
                            </p>
                        )}
                    </div>
                )}

                {/* Question Input for Current Asker */}
                {!waitingForAnswer && isMyTurn && !isPicker && (
                    <div className="bg-neutral-900 border-2 border-white p-6 bg-dots">
                        <p className="text-white text-lg mb-4 font-inter">
                            It is your turn to ask a question
                        </p>
                        
                        <form onSubmit={handleSubmitQuestion} className="flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="deciding"
                                    checked={isDeciding}
                                    onChange={(e) => setIsDeciding(e.target.checked)}
                                    className="settings-checkbox"
                                />
                                <label 
                                    htmlFor="deciding" 
                                    className="text-purple-400 font-inter cursor-pointer"
                                >
                                    I know what/who it is (Deciding Question)
                                </label>
                            </div>

                            <input
                                type="text"
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                placeholder={isDeciding ? "Is it...?" : "Ask a yes/no question..."}
                                autoFocus
                                className={`input-primary ${isDeciding ? 'border-purple-500' : ''}`}
                            />
                            
                            <button
                                type="submit"
                                disabled={!questionText.trim()}
                                className={`btn-primary w-full text-xl py-3 disabled:opacity-50 uppercase ${
                                    isDeciding ? 'bg-purple-900 border-purple-500' : ''
                                }`}
                            >
                                {isDeciding ? 'Make Guess' : 'Ask Question'}
                            </button>
                        </form>
                    </div>
                )}

                {/* Waiting for other player's turn */}
                {!waitingForAnswer && !isMyTurn && !isPicker && (
                    <div className="bg-neutral-900 border-2 border-white p-6 text-center">
                        <p className="text-white/60 font-inter animate-pulse">
                            Waiting for {currentAskerName} to ask a question...
                        </p>
                    </div>
                )}

                {/* Picker view when waiting for question */}
                {!waitingForAnswer && isPicker && (
                    <div className="bg-neutral-900 border-2 border-white p-6 text-center">
                        <p className="text-white font-inter mb-2">
                            Your secret: <span className="text-emerald-400 font-bold">{rotanikaState?.secretThing}</span>
                        </p>
                        <p className="text-white/60 font-inter animate-pulse">
                            Waiting for {currentAskerName} to ask a question...
                        </p>
                    </div>
                )}

                <QuestionLog questions={questions} players={players} />
            </div>
        </div>
    );
}