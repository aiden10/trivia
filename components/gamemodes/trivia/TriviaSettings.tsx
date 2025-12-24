import { useState } from "react";
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
    initialCategories = Object.values(TriviaCategories),
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

    const handleDurationChange = (value: number) => {
        setDuration(value);
        if (host) {
            onSettingsChange({ questionDuration: value });
        }
    };

    const handleWinningScoreChange = (value: number) => {
        setWinningScore(value);
        if (host) {
            onSettingsChange({ winningScore: value });
        }
    };

    return (
        <div className="settings-group bg-lines">
            {/* Question Duration */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Question Duration: {duration} seconds
                    <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block 
                        bg-black text-white text-sm p-2 rounded max-w-xs z-10">
                        How long players have to answer each question
                    </span>
                </label>
                {host ? (
                    <input
                        type="range"
                        min={5}
                        max={120}
                        value={duration}
                        onChange={(e) => handleDurationChange(parseInt(e.target.value))}
                        className="w-full accent-white"
                    />
                ) : (
                    <p className="text-white/70 font-inter">{duration} seconds</p>
                )}
            </div>

            {/* Winning Score */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Winning Score: {winningScore}
                    <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block 
                        bg-black text-white text-sm p-2 rounded max-w-xs z-10">
                        Score needed to win the game
                    </span>
                </label>
                {host ? (
                    <input
                        type="range"
                        min={10}
                        max={1000}
                        step={10}
                        value={winningScore}
                        onChange={(e) => handleWinningScoreChange(parseInt(e.target.value))}
                        className="w-full accent-white"
                    />
                ) : (
                    <p className="text-white/70 font-inter">{winningScore}</p>
                )}
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Categories (select at least one)
                    <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block 
                        bg-black text-white text-sm p-2 rounded max-w-xs z-10">
                        Select which question categories to include
                    </span>
                </label>
                
                <div className="grid grid-cols-2 gap-2 bg-neutral-900 bg-dots p-4">
                    {Object.values(TriviaCategories).map((category) => (
                        <label 
                            key={category}
                            className={`flex items-center gap-3 settings-label ${!host && 'opacity-50'}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedCategories.includes(category)}
                                onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                                disabled={!host}
                                className="settings-checkbox"
                            />
                            <span>{formatCategoryLabel(category)}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}