'use client'

import { useGameContext } from "@/shared/GameContext";
import { RotanikaSettings as RotanikaSettingsType } from "@/shared/types";
import { useState, useEffect } from "react";

interface RotanikaSettingsProps {
    host: boolean;
    onSettingsChange: (settings: RotanikaSettingsType) => void;
}

export default function RotanikaSettings({ host, onSettingsChange }: RotanikaSettingsProps) {
    const { roomState, players } = useGameContext();
    
    const rotanikaState = roomState?.rotanikaState;
    const settings = rotanikaState?.settings;
    
    const [minQuestions, setMinQuestions] = useState(settings?.minQuestions ?? 5);
    const [maxQuestions, setMaxQuestions] = useState(settings?.maxQuestions ?? 20);
    const [pickerId, setPickerId] = useState<number | undefined>(settings?.pickerId);

    useEffect(() => {
        if (settings) {
            setMinQuestions(settings.minQuestions ?? 5);
            setMaxQuestions(settings.maxQuestions ?? 20);
            setPickerId(settings.pickerId);
        }
    }, [settings]);

    const handleMaxQuestionsChange = (value: number) => {
        setMaxQuestions(value);
        if (host) {
            onSettingsChange({ minQuestions, maxQuestions: value, pickerId });
        }
    };

    const handlePickerChange = (value: string) => {
        if (value === '') {
            // Random was selected - pick a random player
            if (players.length > 0) {
                const randomPlayer = players[Math.floor(Math.random() * players.length)];
                setPickerId(randomPlayer.playerID);
                if (host) {
                    onSettingsChange({ minQuestions, maxQuestions, pickerId: randomPlayer.playerID });
                }
            }
        } else {
            const playerId = parseInt(value);
            setPickerId(playerId);
            if (host) {
                onSettingsChange({ minQuestions, maxQuestions, pickerId: playerId });
            }
        }
    };

    return (
        <div className="settings-group">
            {/* Max Questions */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Maximum Questions: {maxQuestions}
                    <span className="tooltip">
                        If not guessed by this many questions, the picker wins
                    </span>
                </label>
                {host ? (
                    <input
                        type="range"
                        min={minQuestions + 1}
                        max={30}
                        value={maxQuestions}
                        onChange={(e) => handleMaxQuestionsChange(parseInt(e.target.value))}
                        className="w-full accent-white"
                    />
                ) : (
                    <p className="text-white/70 font-inter">{maxQuestions}</p>
                )}
            </div>

            {/* Picker Selection */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Picker
                    <span className="absolute bottom-full left-0 mb-2 hidden group-hover:block 
                        bg-black text-white text-sm p-2 z-10">
                        The player who will think of something for others to guess
                    </span>
                </label>
                {host ? (
                    <select
                        value={pickerId ?? ''}
                        onChange={(e) => handlePickerChange(e.target.value)}
                        className="settings-input cursor-pointer"
                    >
                        <option value="">Random</option>
                        {players.map(player => (
                            <option key={player.playerID} value={player.playerID}>
                                {player.playerName}
                            </option>
                        ))}
                    </select>
                ) : (
                    <p className="text-white/70 font-inter">
                        {pickerId !== undefined 
                            ? players.find(p => p.playerID === pickerId)?.playerName ?? 'Unknown'
                            : 'None'
                        }
                    </p>
                )}
            </div>
        </div>
    );
}