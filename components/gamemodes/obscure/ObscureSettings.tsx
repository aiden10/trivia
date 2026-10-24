'use client'

import { useEffect, useState } from "react";
import { ObscureSettings as ObscureSettingsType, ObscurePromptGroup } from "@/shared/types";

interface ObscureSettingsProps {
    host: boolean;
    settings?: ObscureSettingsType;
    catalog?: ObscurePromptGroup[];
    onSettingsChange: (settings: ObscureSettingsType) => void;
}

export default function ObscureSettings({
    host,
    settings,
    catalog = [],
    onSettingsChange,
}: ObscureSettingsProps) {
    const [duration, setDuration] = useState(settings?.duration ?? 45);
    const [winningScore, setWinningScore] = useState(settings?.winningScore ?? 50);

    // Keep the controls in sync when the server broadcasts another player's
    // changes (and so non-hosts see the host's values).
    useEffect(() => {
        if (settings?.duration !== undefined) setDuration(settings.duration);
    }, [settings?.duration]);

    useEffect(() => {
        if (settings?.winningScore !== undefined) setWinningScore(settings.winningScore);
    }, [settings?.winningScore]);

    const allPromptIds = catalog.flatMap(group => group.prompts.map(prompt => prompt.id));
    const selectedPrompts = settings?.prompts?.length ? settings.prompts : allPromptIds;

    const handleDurationChange = (value: number) => {
        setDuration(value);
        if (host) onSettingsChange({ duration: value });
    };

    const handleWinningScoreChange = (value: number) => {
        setWinningScore(value);
        if (host) onSettingsChange({ winningScore: value });
    };

    const handleGroupToggle = (promptIds: string[], checked: boolean) => {
        if (!host) return;

        const next = new Set(selectedPrompts);
        for (const id of promptIds) {
            if (checked) next.add(id);
            else next.delete(id);
        }

        if (next.size === 0) return;
        onSettingsChange({ prompts: Array.from(next) });
    };

    return (
        <div className="settings-group bg-lines">
            {/* Timer Duration */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Timer Duration: {duration} seconds
                    <span className="tooltip">
                        How long players have to submit an answer each round
                    </span>
                </label>
                {host ? (
                    <input
                        type="range"
                        min={10}
                        max={180}
                        step={5}
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
                        Score needed to win the game.
                    </span>
                </label>
                {host ? (
                    <input
                        type="range"
                        min={10}
                        max={500}
                        step={10}
                        value={winningScore}
                        onChange={(e) => handleWinningScoreChange(parseInt(e.target.value))}
                        className="w-full accent-white"
                    />
                ) : (
                    <p className="text-white/70 font-inter">{winningScore}</p>
                )}
            </div>

            {/* Prompt selection */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Prompts
                    <span className="tooltip">
                        Pick which prompts can appear during the game.
                    </span>
                </label>

                <div className="flex flex-col gap-4 bg-neutral-900 bg-dots p-4">
                    {catalog.map(group => {
                        const groupIds = group.prompts.map(prompt => prompt.id);
                        const allSelected = groupIds.every(id => selectedPrompts.includes(id));
                        const someSelected = groupIds.some(id => selectedPrompts.includes(id));

                        return (
                            <div key={group.id} className="flex flex-col gap-2">
                                <label className={`flex items-center gap-3 settings-label ${!host && 'opacity-50'}`}>
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        ref={(el) => {
                                            if (el) el.indeterminate = someSelected && !allSelected;
                                        }}
                                        onChange={(e) => handleGroupToggle(groupIds, e.target.checked)}
                                        disabled={!host}
                                        className="settings-checkbox"
                                    />
                                    <span>{group.name}</span>
                                </label>

                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
