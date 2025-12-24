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

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        
        if (rawValue === "") {
            setDuration(0);
            return;
        }
        
        const value = parseInt(rawValue);
        if (!isNaN(value) && value >= 0) {
            setDuration(value);
            if (value > 0) {
                onSettingsChange({ questionDuration: value });
            }
        }
    };

    const handleWinningScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        
        if (rawValue === "") {
            setWinningScore(0);
            return;
        }
        
        const value = parseInt(rawValue);
        if (!isNaN(value) && value >= 0) {
            setWinningScore(value);
            if (value > 0) {
                onSettingsChange({ winningScore: value });
            }
        }
    };

    return (
        <div className="settings-group bg-lines">
            {/* Question Duration */}
            <div className="flex flex-col gap-2">
                <label className={`settings-label ${!host && 'opacity-50'}`}>
                    question duration (seconds)
                </label>
                <input
                    type="number"
                    min="5"
                    max="120"
                    value={duration}
                    step={1}
                    onChange={handleDurationChange}
                    disabled={!host}
                    className={`settings-input ${!host && 'opacity-50 cursor-not-allowed'}`}
                />
            </div>

            {/* Winning Score */}
            <div className="flex flex-col gap-2">
                <label className={`settings-label ${!host && 'opacity-50'}`}>
                    winning score
                </label>
                <input
                    type="number"
                    min="1"
                    max="1000"
                    value={winningScore}
                    step={10}
                    onChange={handleWinningScoreChange}
                    disabled={!host}
                    className={`settings-input ${!host && 'opacity-50 cursor-not-allowed'}`}
                />
            </div>

            {/* Categories */}
            <div className="flex flex-col gap-2">
                <label className={`settings-label ${!host && 'opacity-50'}`}>
                    categories (select at least one)
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