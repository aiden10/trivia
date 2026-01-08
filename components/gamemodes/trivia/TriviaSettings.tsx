import { useState } from "react";
import { TriviaCategories, ImageCategories, SongCategories, TriviaSettings as TriviaSettingsType } from "@/shared/types";

interface TriviaSettingsProps {
    host: boolean;
    initialCategories?: string[];
    initialImageCategories?: string[];
    initialSongCategories?: string[];
    initialDuration?: number;
    initialWinningScore?: number;
    onSettingsChange: (settings: TriviaSettingsType) => void;
}

interface CategorySection {
    title: string;
    tooltip: string;
    values: string[];
    settingsKey: keyof TriviaSettingsType;
}

export default function TriviaSettings({
    host,
    initialCategories = Object.values(TriviaCategories),
    initialImageCategories = Object.values(ImageCategories),
    initialSongCategories = Object.values(SongCategories),
    initialDuration = 15,
    initialWinningScore = 100,
    onSettingsChange,
}: TriviaSettingsProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
    const [selectedImageCategories, setSelectedImageCategories] = useState<string[]>(initialImageCategories);
    const [selectedSongCategories, setSelectedSongCategories] = useState<string[]>(initialSongCategories);
    const [duration, setDuration] = useState(initialDuration);
    const [winningScore, setWinningScore] = useState(initialWinningScore);

    const categorySections: CategorySection[] = [
        {
            title: "Text Questions",
            tooltip: "Standard trivia questions",
            values: Object.values(TriviaCategories),
            settingsKey: "categories"
        },
        {
            title: "Image Questions",
            tooltip: "Identify people or things from images",
            values: Object.values(ImageCategories),
            settingsKey: "imageCategories"
        },
        {
            title: "Song Categories",
            tooltip: "Guess the song and artists",
            values: Object.values(SongCategories),
            settingsKey: "songCategories"
        }
    ];

    const formatCategoryLabel = (category: string) => {
        const shortNames: Record<string, string> = {
            'art_and_architecture': 'Art & Arch.',
            'miscellaneous': 'Misc.',
            'science_and_nature': 'Science',
            'food_and_drink': 'Food & Drink',
        };
        
        return shortNames[category] || category
            .split('_')
            .map(word => word === 'and' ? '&' : word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const getSelectedState = (settingsKey: keyof TriviaSettingsType) => {
        switch (settingsKey) {
            case "categories": return selectedCategories;
            case "imageCategories": return selectedImageCategories;
            case "songCategories": return selectedSongCategories;
            default: return [];
        }
    };

    const setSelectedState = (settingsKey: keyof TriviaSettingsType, value: string[]) => {
        switch (settingsKey) {
            case "categories":
                setSelectedCategories(value);
                break;
            case "imageCategories":
                setSelectedImageCategories(value);
                break;
            case "songCategories":
                setSelectedSongCategories(value);
                break;
        }
        onSettingsChange({ [settingsKey]: value });
    };

    const handleCategoryToggle = (settingsKey: keyof TriviaSettingsType, category: string, checked: boolean) => {
        const selected = getSelectedState(settingsKey);
        const totalSelected = selectedCategories.length + selectedImageCategories.length + selectedSongCategories.length;
        
        if (!checked && totalSelected === 1) return;

        const newCategories = checked
            ? [...selected, category]
            : selected.filter(c => c !== category);
        
        setSelectedState(settingsKey, newCategories);
    };

    const handleToggleAll = (section: CategorySection) => {
        const selected = getSelectedState(section.settingsKey);
        const totalSelected = selectedCategories.length + selectedImageCategories.length + selectedSongCategories.length;
        
        // If all are selected in this section, unselect all
        if (selected.length === section.values.length) {
            if (totalSelected === selected.length) return; // Can't unselect if it's the last category
            setSelectedState(section.settingsKey, []);
        } else {
            // Otherwise, select all in this section
            setSelectedState(section.settingsKey, section.values);
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
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setDuration(val);
                            onSettingsChange({ questionDuration: val });
                        }}
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
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setWinningScore(val);
                            onSettingsChange({ winningScore: val });
                        }}
                        className="w-full accent-white"
                    />
                ) : (
                    <p className="text-white/70 font-inter">{winningScore}</p>
                )}
            </div>

            {/* Category Sections */}
            {categorySections.map((section) => {
                const selected = getSelectedState(section.settingsKey);
                const allSelected = selected.length === section.values.length;
                const totalSelected = selectedCategories.length + selectedImageCategories.length + selectedSongCategories.length;
                
                return (
                    <div key={section.settingsKey} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <label className="settings-label group relative cursor-help">
                                {section.title}
                                <span className="tooltip">
                                    {section.tooltip}
                                </span>
                            </label>
                            {host && (
                                <button
                                    onClick={() => handleToggleAll(section)}
                                    disabled={allSelected && totalSelected === 1}
                                    className="btn-primary text-sm px-3 py-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {allSelected ? 'Unselect All' : 'Select All'}
                                </button>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 bg-neutral-900 bg-dots p-4">
                            {section.values.map((category) => (
                                <label 
                                    key={category}
                                    className={`flex items-center gap-3 settings-label ${!host && 'opacity-50'}`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selected.includes(category)}
                                        onChange={(e) => handleCategoryToggle(section.settingsKey, category, e.target.checked)}
                                        disabled={!host}
                                        className="settings-checkbox"
                                    />
                                    <span>{formatCategoryLabel(category)}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}