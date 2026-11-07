'use client'

import { useEffect, useState } from "react";
import { ObscureSettings as ObscureSettingsType, ObscurePromptGroup } from "@/shared/types";
import { SettingsSlider } from "@/components/SettingsControls";

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
            <SettingsSlider
                label="Timer Duration"
                tooltip="How long players have to submit an answer each round"
                value={duration}
                suffix="seconds"
                min={10}
                max={180}
                step={5}
                host={host}
                onChange={handleDurationChange}
            />

            <SettingsSlider
                label="Winning Score"
                tooltip="Score needed to win the game."
                value={winningScore}
                min={10}
                max={500}
                step={10}
                host={host}
                onChange={handleWinningScoreChange}
            />

            {/* Prompt selection */}
            <div className="flex flex-col gap-2">
                <label className="settings-label group relative cursor-help">
                    Prompts
                    <span className="tooltip">
                        Pick which prompts can appear during the game.
                    </span>
                </label>

                {host ? (
                    <div className="flex flex-col gap-4 bg-neutral-900 bg-dots p-4">
                        {catalog.map(group => {
                            const groupIds = group.prompts.map(prompt => prompt.id);
                            const selectedCount = groupIds.filter(id => selectedPrompts.includes(id)).length;
                            const allSelected = selectedCount === groupIds.length;
                            const someSelected = selectedCount > 0;

                            return (
                                <div key={group.id} className="flex flex-col gap-2">
                                    <label className="flex items-center gap-3 settings-label cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={allSelected}
                                            ref={(el) => {
                                                if (el) el.indeterminate = someSelected && !allSelected;
                                            }}
                                            onChange={(e) => handleGroupToggle(groupIds, e.target.checked)}
                                            className="settings-checkbox"
                                        />
                                        <span className="flex-1">{group.name}</span>
                                        <span className="text-white/40 text-xs">
                                            {selectedCount}/{groupIds.length}
                                        </span>
                                    </label>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="settings-readonly flex flex-wrap gap-2">
                        {catalog.filter(group =>
                            group.prompts.some(prompt => selectedPrompts.includes(prompt.id))
                        ).map(group => (
                            <span key={group.id} className="settings-chip">
                                {group.name}
                                <span className="settings-chip-count">
                                    {group.prompts.filter(prompt => selectedPrompts.includes(prompt.id)).length}
                                </span>
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
