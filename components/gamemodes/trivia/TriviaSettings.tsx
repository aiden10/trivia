import { useState } from "react";
import { TriviaCategories, IMAGE_CATEGORIES, TriviaSettings as TriviaSettingsType } from "@/shared/types";

interface TriviaSettingsProps {
    host: boolean;
    initialCategories?: string[];
    initialImageCategories?: string[];
    initialDuration?: number;
    initialWinningScore?: number;
    onSettingsChange: (settings: TriviaSettingsType) => void;
}

export default function TriviaSettings({
    host,
    initialCategories = Object.values(TriviaCategories),
    initialImageCategories = [],
    initialDuration = 15,
    initialWinningScore = 100,
    onSettingsChange,
}: TriviaSettingsProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
    const [selectedImageCategories, setSelectedImageCategories] = useState<string[]>(initialImageCategories);
    const [duration, setDuration] = useState(initialDuration);
    const [winningScore, setWinningScore] = useState(initialWinningScore);

    const formatCategoryLabel = (category: string) => {
        const shortNames: Record<string, string> = {
            'art_and_architecture': 'Art & Arch.',
            'miscellaneous': 'Misc.',
            'science_and_nature': 'Science',
            'food_and_drink': 'Food & Drink',
        };
        
        if (shortNames[category]) {
            return shortNames[category];
        }

        return category
            .split('_')
            .map(word => {
                if (word === 'and') return '&';
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    };

    const handleCategoryToggle = (category: string, checked: boolean) => {
        // Prevent deselecting if it's the last one (across both categories)
        const totalSelected = selectedCategories.length + selectedImageCategories.length;
        if (!checked && totalSelected === 1) {
            return;
        }

        const newCategories = checked
            ? [...selectedCategories, category]
            : selectedCategories.filter(c => c !== category);
        
        setSelectedCategories(newCategories);
        onSettingsChange({ categories: newCategories });
    };

    const handleImageCategoryToggle = (category: string, checked: boolean) => {
        const totalSelected = selectedCategories.length + selectedImageCategories.length;
        if (!checked && totalSelected === 1) {
            return;
        }

        const newCategories = checked
            ? [...selectedImageCategories, category]
            : selectedImageCategories.filter(c => c !== category);
        
        setSelectedImageCategories(newCategories);
        onSettingsChange({ imageCategories: newCategories });
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
                    <span className="tooltip">
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
                    <span className="tooltip">
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

            {/* Text Categories */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Text Questions
                    <span className="tooltip">
                        Standard trivia questions
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

            {/* Image Categories */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Image Questions
                    <span className="tooltip">
                        Identify people or things from images
                    </span>
                </label>
                
                <div className="grid grid-cols-2 gap-2 bg-neutral-900 bg-dots p-4">
                    {IMAGE_CATEGORIES.map((category) => (
                        <label 
                            key={category}
                            className={`flex items-center gap-3 settings-label ${!host && 'opacity-50'}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedImageCategories.includes(category)}
                                onChange={(e) => handleImageCategoryToggle(category, e.target.checked)}
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