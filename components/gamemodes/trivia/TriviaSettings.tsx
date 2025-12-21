import { useState, useEffect } from "react";
import { TriviaCategories, TriviaSettings as TriviaSettingsType } from "@/shared/types";

interface TriviaSettingsProps {
    host: boolean;
    initialCategories?: string[];
    initialDuration?: number;
    initialWinningScore?: number;
    onSettingsChange: (settings: TriviaSettingsType) => void;
}

export default function TriviaSettings({
    host,
    initialCategories = [],
    initialDuration = 15,
    initialWinningScore = 100,
    onSettingsChange,
}: TriviaSettingsProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
    const [duration, setDuration] = useState(initialDuration);
    const [winningScore, setWinningScore] = useState(initialWinningScore);

    const formatCategoryLabel = (category: string) => {
        return category
            .split('_')
            .map(word => {
                if (word === 'and') return '&';
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    };

    useEffect(() => {
        if (initialCategories.length > 0) {
            setSelectedCategories(initialCategories);
        }
    }, [initialCategories]);

    const handleCategoryToggle = (category: string, checked: boolean) => {
        // Prevent deselecting if it's the last one
        if (!checked && selectedCategories.length === 1) {
            return;
        }

        const newCategories = checked
            ? [...selectedCategories, category]
            : selectedCategories.filter(c => c !== category);
        
        setSelectedCategories(newCategories);
        onSettingsChange({ categories: newCategories });
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setDuration(value);
            onSettingsChange({ duration: value });
        }
    };

    const handleWinningScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setWinningScore(value);
            onSettingsChange({ winningScore: value });
        }
    };

    return (
        <div className="bg-indigo-800 border-black border-4 rounded-lg p-4 md:p-6 space-y-4">
            {/* Question Duration */}
            <div className="flex flex-col gap-2">
                <label className={`text-white text-lg font-semibold ${!host && 'opacity-50'}`}>
                    question duration (seconds)
                </label>
                <input
                    type="number"
                    min="5"
                    max="120"
                    value={duration}
                    step={5}
                    onChange={handleDurationChange}
                    disabled={!host}
                    className={`bg-indigo-700 text-white rounded px-3 py-2 w-full
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                        [&::-webkit-inner-spin-button]:appearance-none
                        ${!host && 'opacity-50 cursor-not-allowed'}`}
                />
            </div>

            {/* Winning Score */}
            <div className="flex flex-col gap-2">
                <label className={`text-white text-lg font-semibold ${!host && 'opacity-50'}`}>
                    winning score
                </label>
                <input
                    type="number"
                    min="10"
                    max="1000"
                    value={winningScore}
                    step={10}
                    onChange={handleWinningScoreChange}
                    disabled={!host}
                    className={`bg-indigo-700 text-white rounded px-3 py-2 w-full
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                        [&::-webkit-inner-spin-button]:appearance-none
                        ${!host && 'opacity-50 cursor-not-allowed'}`}
                />
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-2">
                <label className={`text-white text-lg font-semibold mb-1 ${!host && 'opacity-50'}`}>
                    categories (select at least one)
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                    {Object.values(TriviaCategories).map((category) => (
                        <label 
                            key={category}
                            className={`flex items-center gap-3 text-white ${!host && 'opacity-50'}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(category)}
                                onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                                disabled={!host}
                                className="w-5 h-5"
                            />
                            <span>{formatCategoryLabel(category)}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}