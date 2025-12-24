'use client'

import { RotanikaQuestion, Player } from '@/shared/types';

interface QuestionLogProps {
    questions: RotanikaQuestion[];
    players: Player[];
}

export default function QuestionLog({ questions, players }: QuestionLogProps) {
    const getPlayerName = (id: number) => {
        return players.find(p => p.playerID === id)?.playerName ?? 'Unknown';
    };

    const getAnswerStyles = (answer: 'yes' | 'no' | 'unsure' | null) => {
        switch (answer) {
            case 'yes':
                return 'border-l-emerald-500 bg-emerald-900/20';
            case 'no':
                return 'border-l-red-500 bg-red-900/20';
            case 'unsure':
                return 'border-l-amber-500 bg-amber-900/20';
            default:
                return 'border-l-white/30 bg-neutral-800/50';
        }
    };

    const getAnswerText = (answer: 'yes' | 'no' | 'unsure' | null) => {
        switch (answer) {
            case 'yes':
                return <span className="text-emerald-400">YES</span>;
            case 'no':
                return <span className="text-red-400">NO</span>;
            case 'unsure':
                return <span className="text-amber-400">UNSURE</span>;
            default:
                return <span className="text-white/50 animate-pulse">...</span>;
        }
    };

    if (questions.length === 0) {
        return (
            <div className="bg-neutral-900 border-2 border-white/50 p-4">
                <h3 className="text-white/50 text-center font-inter">
                    No questions asked yet
                </h3>
            </div>
        );
    }

    return (
        <div className="bg-neutral-900 border-2 border-white">
            <h3 className="text-white font-inter uppercase text-sm p-3 border-b border-white/30 bg-black/50">
                Question Log
            </h3>
            <div className="max-h-1/4 overflow-y-auto">
                {questions.map((q, index) => (
                    <div 
                        key={index}
                        className={`p-3 border-l-4 transition-all duration-500 ${getAnswerStyles(q.answer)} 
                            ${index !== questions.length - 1 ? 'border-b border-white/10' : ''}`}
                    >
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <span className="text-white/50 text-sm font-inter">
                                    #{q.turnNumber} · {getPlayerName(q.askedBy)}
                                </span>
                                <p className={`text-white font-inter mt-1 ${
                                    q.isDeciding ? 'text-purple-400 font-semibold' : ''
                                }`}>
                                    {q.text}
                                    {q.isDeciding && (
                                        <span className="ml-2 text-xs bg-purple-600/50 px-1.5 py-0.5 rounded">
                                            DECIDING
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="font-inter font-bold text-lg">
                                {getAnswerText(q.answer)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}