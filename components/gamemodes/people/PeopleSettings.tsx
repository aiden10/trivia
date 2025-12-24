import { useState } from "react";
import { PeopleProperties, PeopleSettings as PeopleSettingsType } from "@/shared/types";

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
                onSettingsChange({ duration: value });
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

    const handleLowerBoundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        if (rawValue === "") {
            setLowerBound(0);
            return;
        }
        const value = parseInt(rawValue);
        if (!isNaN(value) && value >= 0) {
            setLowerBound(value);
            if (value > 0) {
                onSettingsChange({ combinationLowerBound: value });
            }
        }
    };

    const handleUpperBoundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value;
        if (rawValue === "") {
            setUpperBound(0);
            return;
        }
        const value = parseInt(rawValue);
        if (!isNaN(value) && value >= 0) {
            setUpperBound(value);
            if (value > 0) {
                onSettingsChange({ combinationUpperBound: value });
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

            <div className="flex flex-col gap-2">
                <label className={`settings-label ${!host && 'opacity-50'}`}>
                    combinations lower bound 
                </label>
                <input
                    type="number"
                    min="1"
                    max={Object.keys(PeopleProperties).length}
                    value={lowerBound}
                    step={1}
                    onChange={handleLowerBoundChange}
                    disabled={!host}
                    className={`settings-input ${!host && 'opacity-50 cursor-not-allowed'}`}
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className={`settings-label ${!host && 'opacity-50'}`}>
                    combinations upper bound 
                </label>
                <input
                    type="number"
                    min="1"
                    max={Object.keys(PeopleProperties).length}
                    value={upperBound}
                    step={1}
                    onChange={handleUpperBoundChange}
                    disabled={!host}
                    className={`settings-input ${!host && 'opacity-50 cursor-not-allowed'}`}
                />
            </div>

            {/* Properties */}
            <div className="flex flex-col gap-2">
                <label className={`settings-label ${!host && 'opacity-50'}`}>
                    Properties (select at least one)
                </label>
                
                <div className="grid grid-cols-2 gap-2 bg-neutral-900 bg-dots p-4">
                    {Object.values(PeopleProperties).map((property) => (
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
                            <span>{property}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}