import { useState } from "react";
import { PeopleProperties, PeopleBPSettings as PeopleBPSettingsType, CONTINENTS, GENDERS, OCCUPATIONS } from "@/shared/types";

interface PeopleBPSettingsProps {
    host: boolean;
    initialProperties?: string[];
    initialMinDuration?: number;
    initialMaxDuration?: number;
    initialStartingLives?: number;
    initialLowerBound?: number;
    initialUpperBound?: number;
    onSettingsChange: (settings: Partial<PeopleBPSettingsType>) => void;
}

export default function PeopleBPSettings({
    host,
    initialProperties = Object.values(PeopleProperties),
    initialMinDuration = 8,
    initialMaxDuration = 25,
    initialStartingLives = 5,
    initialLowerBound = 1,
    initialUpperBound = 2,
    onSettingsChange,
}: PeopleBPSettingsProps) {
    const [selectedProperties, setSelectedProperties] = useState<string[]>(initialProperties);
    const [minDuration, setMinDuration] = useState(initialMinDuration);
    const [maxDuration, setMaxDuration] = useState(initialMaxDuration);
    const [startingLives, setStartingLives] = useState(initialStartingLives);
    const [lowerBound, setLowerBound] = useState(initialLowerBound);
    const [upperBound, setUpperBound] = useState(initialUpperBound);

    const formatPropertyLabel = (property: string) => {
        return property
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handlePropertyToggle = (property: string, checked: boolean) => {
        if (!checked && selectedProperties.length === 1) {
            return;
        }

        const newProperties = checked
            ? [...selectedProperties, property]
            : selectedProperties.filter(c => c !== property);
        
        setSelectedProperties(newProperties);
        onSettingsChange({ properties: newProperties });
    };

    const handleMinDurationChange = (value: number) => {
        setMinDuration(value);
        if (host) {
            onSettingsChange({ minDuration: value });
        }
    };

    const handleMaxDurationChange = (value: number) => {
        setMaxDuration(value);
        if (host) {
            onSettingsChange({ maxDuration: value });
        }
    };

    const handleStartingLivesChange = (value: number) => {
        setStartingLives(value);
        if (host) {
            onSettingsChange({ startingLives: value });
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
            {/* Min Duration */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Min Timer Duration: {minDuration} seconds
                    <span className="tooltip">
                        Minimum time given to each player for their turn
                    </span>
                </label>
                {host ? (
                    <input
                        type="range"
                        min={3}
                        max={30}
                        value={minDuration}
                        onChange={(e) => handleMinDurationChange(parseInt(e.target.value))}
                        className="w-full accent-white"
                    />
                ) : (
                    <p className="text-white/70 font-inter">{minDuration} seconds</p>
                )}
            </div>

            {/* Max Duration */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Max Timer Duration: {maxDuration} seconds
                    <span className="tooltip">
                        Maximum time given to each player for their turn
                    </span>
                </label>
                {host ? (
                    <input
                        type="range"
                        min={5}
                        max={60}
                        value={maxDuration}
                        onChange={(e) => handleMaxDurationChange(parseInt(e.target.value))}
                        className="w-full accent-white"
                    />
                ) : (
                    <p className="text-white/70 font-inter">{maxDuration} seconds</p>
                )}
            </div>

            {/* Starting Lives */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Starting Lives: {startingLives}
                    <span className="tooltip">
                        Number of lives each player starts with
                    </span>
                </label>
                {host ? (
                    <input
                        type="range"
                        min={1}
                        max={10}
                        value={startingLives}
                        onChange={(e) => handleStartingLivesChange(parseInt(e.target.value))}
                        className="w-full accent-white"
                    />
                ) : (
                    <p className="text-white/70 font-inter">{startingLives} lives</p>
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