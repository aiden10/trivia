import { useState, useEffect } from "react";
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
    initialWinningScore = 100,
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

    const handleLowerBoundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setLowerBound(value);
            onSettingsChange({ combinationLowerBound: value });
        }
    };

    const handleUpperBoundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value);
        if (!isNaN(value) && value > 0) {
            setUpperBound(value);
            onSettingsChange({ combinationUpperBound: value });
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
                    step={1}
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

            <div className="flex flex-col gap-2">
                <label className={`text-white text-lg font-semibold ${!host && 'opacity-50'}`}>
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
                    className={`bg-indigo-700 text-white rounded px-3 py-2 w-full
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                        [&::-webkit-inner-spin-button]:appearance-none
                        ${!host && 'opacity-50 cursor-not-allowed'}`}
                />
            </div>

            <div className="flex flex-col gap-2">
                <label className={`text-white text-lg font-semibold ${!host && 'opacity-50'}`}>
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
                    className={`bg-indigo-700 text-white rounded px-3 py-2 w-full
                        [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none 
                        [&::-webkit-inner-spin-button]:appearance-none
                        ${!host && 'opacity-50 cursor-not-allowed'}`}
                />
            </div>

            {/* Properties */}
            <div className="flex flex-col gap-2">
                <label className={`text-white text-lg font-semibold mb-1 ${!host && 'opacity-50'}`}>
                    Properties (select at least one)
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                    {Object.values(PeopleProperties).map((property) => (
                        <label 
                            key={property}
                            className={`flex items-center gap-3 text-white ${!host && 'opacity-50'}`}
                        >
                            <input
                                type="checkbox"
                                checked={selectedProperties.includes(property)}
                                onChange={(e) => handlePropertyToggle(property, e.target.checked)}
                                disabled={!host}
                                className="w-5 h-5"
                            />
                            <span>{property}</span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
    );
}