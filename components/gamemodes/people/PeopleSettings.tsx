import { useState } from "react";
import { PeopleProperties, PeopleSettings as PeopleSettingsType, CONTINENTS, GENDERS, OCCUPATIONS } from "@/shared/types";

interface PeopleSettingsProps {
    host: boolean;
    initialProperties?: string[];
    initialDuration?: number;
    initialWinningScore?: number;
    initialLowerBound?: number;
    initialUpperBound?: number;
    onSettingsChange: (settings: PeopleSettingsType) => void;
}

export default function PeopleSettings({
    host,
    initialProperties = Object.values(PeopleProperties),
    initialDuration = 15,
    initialWinningScore = 150,
    initialLowerBound = 1,
    initialUpperBound = 2,
    onSettingsChange,
}: PeopleSettingsProps) {
    const [selectedProperties, setSelectedProperties] = useState<string[]>(initialProperties);
    const [duration, setDuration] = useState(initialDuration);
    const [winningScore, setWinningScore] = useState(initialWinningScore);
    const [lowerBound, setLowerBound] = useState(initialLowerBound);
    const [upperBound, setUpperBound] = useState(initialUpperBound);

    const formatPropertyLabel = (property: string) => {
        return property
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handlePropertyToggle = (property: string, checked: boolean) => {
        // Prevent deselecting if it's the last one
        if (!checked && selectedProperties.length === 1) {
            return;
        }

        const newProperties = checked
            ? [...selectedProperties, property]
            : selectedProperties.filter(c => c !== property);
        
        setSelectedProperties(newProperties);
        onSettingsChange({ properties: newProperties });
    };

    const handleDurationChange = (value: number) => {
        setDuration(value);
        if (host) {
            onSettingsChange({ duration: value });
        }
    };

    const handleWinningScoreChange = (value: number) => {
        setWinningScore(value);
        if (host) {
            onSettingsChange({ winningScore: value });
        }
    };

    const handleLowerBoundChange = (value: number) => {
        setLowerBound(value);
        if (host) {
            onSettingsChange({ combinationLowerBound: value });
        }
    };

    const handleUpperBoundChange = (value: number) => {
        setUpperBound(value);
        if (host) {
            onSettingsChange({ combinationUpperBound: value });
        }
    };

    return (
        <div className="settings-group bg-lines">
            {/* Question Duration */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Question Duration: {duration} seconds
                    <span className="tooltip">
                        How long players have to guess people
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

            {/* Combinations Lower Bound */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Combinations Lower Bound: {lowerBound}
                    <span className="tooltip">
                        Minimum number of properties that will be combined
                    </span>
                </label>
                {host ? (
                    <input
                        type="range"
                        min={1}
                        max={Object.keys(PeopleProperties).length}
                        value={lowerBound}
                        onChange={(e) => handleLowerBoundChange(parseInt(e.target.value))}
                        className="w-full accent-white"
                    />
                ) : (
                    <p className="text-white/70 font-inter">{lowerBound}</p>
                )}
            </div>

            {/* Combinations Upper Bound */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Combinations Upper Bound: {upperBound}
                    <span className="tooltip">
                        Maximum number of properties that will be combined
                    </span>
                </label>
                {host ? (
                    <input
                        type="range"
                        min={lowerBound}
                        max={Object.keys(PeopleProperties).length}
                        value={upperBound}
                        onChange={(e) => handleUpperBoundChange(parseInt(e.target.value))}
                        className="w-full accent-white"
                    />
                ) : (
                    <p className="text-white/70 font-inter">{upperBound}</p>
                )}
            </div>

            {/* Genders */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Genders
                    <span className="tooltip">
                        Must be of this gender
                    </span>
                </label>
                
                <div className="grid grid-cols-2 gap-2 bg-neutral-900 bg-dots p-4">
                    {GENDERS.map((property) => (
                        <label 
                            key={property}
                            className={`flex items-center gap-3 settings-label ${!host && 'opacity-50'}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedProperties.includes(property)}
                                onChange={(e) => handlePropertyToggle(property, e.target.checked)}
                                disabled={!host}
                                className="settings-checkbox"
                            />
                            <span>{formatPropertyLabel(property)}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Continents */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Continents
                    <span className="tooltip">
                        Must have been a citizen in a country in the continent at some point during their life 
                    </span>
                </label>
                
                <div className="grid grid-cols-2 gap-2 bg-neutral-900 bg-dots p-4">
                    {CONTINENTS.map((property) => (
                        <label 
                            key={property}
                            className={`flex items-center gap-3 settings-label ${!host && 'opacity-50'}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedProperties.includes(property)}
                                onChange={(e) => handlePropertyToggle(property, e.target.checked)}
                                disabled={!host}
                                className="settings-checkbox"
                            />
                            <span>{formatPropertyLabel(property)}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Occupations */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Occupations
                    <span className="tooltip">
                        Must have had this occupation at some point during their life
                    </span>
                </label>
                
                <div className="grid grid-cols-2 gap-2 bg-neutral-900 bg-dots p-4">
                    {OCCUPATIONS.map((property) => (
                        <label 
                            key={property}
                            className={`flex items-center gap-3 settings-label ${!host && 'opacity-50'}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedProperties.includes(property)}
                                onChange={(e) => handlePropertyToggle(property, e.target.checked)}
                                disabled={!host}
                                className="settings-checkbox"
                            />
                            <span>{formatPropertyLabel(property)}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}