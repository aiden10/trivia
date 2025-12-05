import { useState } from "react";

interface GameSettingsProps {
    host: boolean;
    showWinningScore?: boolean;
    showQuestionDuration?: boolean;
    onWinningScoreChange?: (value: number) => void;
    onQuestionDurationChange?: (value: number) => void;
    onDifficultyChange: (easy: boolean, medium: boolean, hard: boolean) => void;
}

export default function GameSettings({ 
    host, 
    showWinningScore = false,
    showQuestionDuration = false,
    onWinningScoreChange,
    onQuestionDurationChange,
    onDifficultyChange
}: GameSettingsProps) {
    const [easy, setEasy] = useState(true);
    const [medium, setMedium] = useState(true);
    const [hard, setHard] = useState(true);

    const handleWinningScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && onWinningScoreChange) {
            onWinningScoreChange(value);
        }
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && onQuestionDurationChange) {
            onQuestionDurationChange(value);
        }
    };

    const handleDifficultyChange = (difficulty: 'easy' | 'medium' | 'hard', checked: boolean) => {
        const currentlySelected = [easy, medium, hard].filter(Boolean).length;
        if (currentlySelected === 1 && !checked) {
            return;
        }

        let newEasy = easy;
        let newMedium = medium;
        let newHard = hard;

        if (difficulty === 'easy') {
            setEasy(checked);
            newEasy = checked;
        } else if (difficulty === 'medium') {
            setMedium(checked);
            newMedium = checked;
        } else if (difficulty === 'hard') {
            setHard(checked);
            newHard = checked;
        }

        onDifficultyChange(newEasy, newMedium, newHard);
    };

    return (
        <div className="bg-indigo-800 border-black border-4 rounded-lg p-4 md:p-6 space-y-4">
            {showWinningScore && (
                <div className="flex flex-col gap-2">
                    <label className={`text-white text-lg font-semibold ${!host && 'opacity-50'}`}>
                        winning score
                    </label>
                    <input
                        type="number"
                        max="9999"
                        defaultValue={100}
                        step={5}
                        onChange={handleWinningScoreChange}
                        disabled={!host}
                        className={`bg-indigo-700 text-white rounded px-3 py-2 w-full 
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                            [&::-webkit-inner-spin-button]:appearance-none
                            ${!host && 'opacity-50 cursor-not-allowed'}`}
                    />
                </div>
            )}

            {showQuestionDuration && (
                <div className="flex flex-col gap-2">
                    <label className={`text-white text-lg font-semibold ${!host && 'opacity-50'}`}>
                        question duration (seconds)
                    </label>
                    <input
                        type="number"
                        max="120"
                        defaultValue={15}
                        step={1}
                        onChange={handleDurationChange}
                        disabled={!host}
                        className={`bg-indigo-700 text-white rounded px-3 py-2 w-full
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                            [&::-webkit-inner-spin-button]:appearance-none
                            ${!host && 'opacity-50 cursor-not-allowed'}`}
                    />
                </div>
            )}

            <div className="flex flex-col gap-2">
                <label className={`text-white text-lg font-semibold mb-1 ${!host && 'opacity-50'}`}>
                    difficulty levels (select at least one)
                </label>
                
                <div className="space-y-2">
                    <label className={`flex items-center gap-3 text-white ${!host && 'opacity-50'}`}>
                        <input
                            type="checkbox"
                            checked={easy}
                            onChange={(e) => handleDifficultyChange('easy', e.target.checked)}
                            disabled={!host}
                            className="w-5 h-5"
                        />
                        <span>easy (5 points)</span>
                    </label>

                    <label className={`flex items-center gap-3 text-white ${!host && 'opacity-50'}`}>
                        <input
                            type="checkbox"
                            checked={medium}
                            onChange={(e) => handleDifficultyChange('medium', e.target.checked)}
                            disabled={!host}
                            className="w-5 h-5"
                        />
                        <span>medium (10 points)</span>
                    </label>

                    <label className={`flex items-center gap-3 text-white ${!host && 'opacity-50'}`}>
                        <input
                            type="checkbox"
                            checked={hard}
                            onChange={(e) => handleDifficultyChange('hard', e.target.checked)}
                            disabled={!host}
                            className="w-5 h-5"
                        />
                        <span>hard (15 points)</span>
                    </label>
                </div>
            </div>
        </div>
    );
}