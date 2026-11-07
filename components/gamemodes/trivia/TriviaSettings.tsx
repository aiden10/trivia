import { useEffect, useState } from "react";
import {
    TriviaCategories,
    ImageCategories,
    SongCategories,
    TriviaSettings as TriviaSettingsType,
    CategoryCounts,
} from "@/shared/types";
import { SettingsChips, SettingsSlider } from "@/components/SettingsControls";

interface TriviaSettingsProps {
    host: boolean;
    settings?: TriviaSettingsType;
    categoryCounts?: CategoryCounts;
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
    counts?: Record<string, number>;
}

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

export default function TriviaSettings({
    host,
    settings,
    categoryCounts,
    initialCategories = Object.values(TriviaCategories),
    initialImageCategories = Object.values(ImageCategories),
    initialSongCategories = Object.values(SongCategories),
    initialDuration = 15,
    initialWinningScore = 100,
    onSettingsChange,
}: TriviaSettingsProps) {
    const [selectedCategories, setSelectedCategories] = useState<string[]>(settings?.categories ?? initialCategories);
    const [selectedImageCategories, setSelectedImageCategories] = useState<string[]>(settings?.imageCategories ?? initialImageCategories);
    const [selectedSongCategories, setSelectedSongCategories] = useState<string[]>(settings?.songCategories ?? initialSongCategories);
    const [duration, setDuration] = useState(settings?.questionDuration ?? initialDuration);
    const [winningScore, setWinningScore] = useState(settings?.winningScore ?? initialWinningScore);

    useEffect(() => {
        if (settings?.categories) setSelectedCategories(settings.categories);
    }, [settings?.categories]);

    useEffect(() => {
        if (settings?.imageCategories) setSelectedImageCategories(settings.imageCategories);
    }, [settings?.imageCategories]);

    useEffect(() => {
        if (settings?.songCategories) setSelectedSongCategories(settings.songCategories);
    }, [settings?.songCategories]);

    useEffect(() => {
        if (settings?.questionDuration !== undefined) setDuration(settings.questionDuration);
    }, [settings?.questionDuration]);

    useEffect(() => {
        if (settings?.winningScore !== undefined) setWinningScore(settings.winningScore);
    }, [settings?.winningScore]);

    const categorySections: CategorySection[] = [
        {
            title: "Text Questions",
            tooltip: "Standard trivia questions",
            values: Object.values(TriviaCategories),
            settingsKey: "categories",
            counts: categoryCounts?.text,
        },
        {
            title: "Image Questions",
            tooltip: "Identify people or things from images",
            values: Object.values(ImageCategories),
            settingsKey: "imageCategories",
            counts: categoryCounts?.image,
        },
        {
            title: "Song Categories",
            tooltip: "Guess the song and artists",
            values: Object.values(SongCategories),
            settingsKey: "songCategories",
            counts: categoryCounts?.songs,
        }
    ];

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

        if (selected.length === section.values.length) {
            if (totalSelected === selected.length) return;
            setSelectedState(section.settingsKey, []);
        } else {
            setSelectedState(section.settingsKey, section.values);
        }
    };

    return (
        <div className="settings-group bg-lines">
            <SettingsSlider
                label="Question Duration"
                tooltip="How long players have to answer each question"
                value={duration}
                suffix="seconds"
                min={5}
                max={120}
                host={host}
                onChange={(value) => {
                    setDuration(value);
                    onSettingsChange({ questionDuration: value });
                }}
            />

            <SettingsSlider
                label="Winning Score"
                tooltip="Score needed to win the game"
                value={winningScore}
                min={10}
                max={1000}
                step={10}
                host={host}
                onChange={(value) => {
                    setWinningScore(value);
                    onSettingsChange({ winningScore: value });
                }}
            />

            {categorySections.map((section) => {
                const selected = getSelectedState(section.settingsKey);
                const allSelected = selected.length === section.values.length;
                const totalSelected = selectedCategories.length + selectedImageCategories.length + selectedSongCategories.length;

                return (
                    <div key={section.settingsKey} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                            <label className="settings-label group relative cursor-help">
                                {section.title}
                                <span className="tooltip">{section.tooltip}</span>
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

                        {host ? (
                            <div className="grid grid-cols-2 gap-2 bg-neutral-900 bg-dots p-4">
                                {section.values.map((category) => (
                                    <label
                                        key={category}
                                        className="flex items-center gap-3 settings-label cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selected.includes(category)}
                                            onChange={(e) => handleCategoryToggle(section.settingsKey, category, e.target.checked)}
                                            className="settings-checkbox"
                                        />
                                        <span className="flex-1">{formatCategoryLabel(category)}</span>
                                        <span className="text-white/40 text-xs">
                                            {(section.counts?.[category] ?? 0).toLocaleString()}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <SettingsChips
                                values={section.values}
                                selected={selected}
                                labelFor={formatCategoryLabel}
                                counts={section.counts}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}
