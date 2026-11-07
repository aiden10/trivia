import { useEffect, useState } from "react";
import {
    PeopleProperties,
    PeopleSettings as PeopleSettingsType,
    CONTINENTS,
    GENDERS,
    OCCUPATIONS,
} from "@/shared/types";
import { SettingsChips, SettingsSlider } from "@/components/SettingsControls";

interface PeopleSettingsProps {
    host: boolean;
    settings?: PeopleSettingsType;
    initialProperties?: string[];
    initialDuration?: number;
    initialWinningScore?: number;
    initialLowerBound?: number;
    initialUpperBound?: number;
    onSettingsChange: (settings: PeopleSettingsType) => void;
}

const formatPropertyLabel = (property: string) => {
    return property
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default function PeopleSettings({
    host,
    settings,
    initialProperties = Object.values(PeopleProperties),
    initialDuration = 15,
    initialWinningScore = 150,
    initialLowerBound = 2,
    initialUpperBound = 2,
    onSettingsChange,
}: PeopleSettingsProps) {
    const [selectedProperties, setSelectedProperties] = useState<string[]>(settings?.properties ?? initialProperties);
    const [duration, setDuration] = useState(settings?.questionDuration ?? initialDuration);
    const [winningScore, setWinningScore] = useState(settings?.winningScore ?? initialWinningScore);
    const [lowerBound, setLowerBound] = useState(settings?.combinationLowerBound ?? initialLowerBound);
    const [upperBound, setUpperBound] = useState(settings?.combinationUpperBound ?? initialUpperBound);

    useEffect(() => {
        if (settings?.properties) setSelectedProperties(settings.properties);
    }, [settings?.properties]);

    useEffect(() => {
        if (settings?.questionDuration !== undefined) setDuration(settings.questionDuration);
    }, [settings?.questionDuration]);

    useEffect(() => {
        if (settings?.winningScore !== undefined) setWinningScore(settings.winningScore);
    }, [settings?.winningScore]);

    useEffect(() => {
        if (settings?.combinationLowerBound !== undefined) setLowerBound(settings.combinationLowerBound);
    }, [settings?.combinationLowerBound]);

    useEffect(() => {
        if (settings?.combinationUpperBound !== undefined) setUpperBound(settings.combinationUpperBound);
    }, [settings?.combinationUpperBound]);

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

    const groups = [
        { title: "Genders", tooltip: "Must be of this gender", values: GENDERS },
        {
            title: "Continents",
            tooltip: "Must have been a citizen in a country in the continent at some point during their life",
            values: CONTINENTS,
        },
        {
            title: "Occupations",
            tooltip: "Must have had this occupation at some point during their life",
            values: OCCUPATIONS,
        },
    ];

    return (
        <div className="settings-group bg-lines">
            <SettingsSlider
                label="Question Duration"
                tooltip="How long players have to guess people"
                value={duration}
                suffix="seconds"
                min={5}
                max={120}
                host={host}
                onChange={(value) => {
                    setDuration(value);
                    if (host) onSettingsChange({ questionDuration: value });
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
                    if (host) onSettingsChange({ winningScore: value });
                }}
            />

            <SettingsSlider
                label="Combinations Lower Bound"
                tooltip="Minimum number of properties that will be combined"
                value={lowerBound}
                min={1}
                max={Object.keys(PeopleProperties).length}
                host={host}
                onChange={(value) => {
                    setLowerBound(value);
                    if (host) onSettingsChange({ combinationLowerBound: value });
                }}
            />

            <SettingsSlider
                label="Combinations Upper Bound"
                tooltip="Maximum number of properties that will be combined"
                value={upperBound}
                min={lowerBound}
                max={Object.keys(PeopleProperties).length}
                host={host}
                onChange={(value) => {
                    setUpperBound(value);
                    if (host) onSettingsChange({ combinationUpperBound: value });
                }}
            />

            {groups.map((group) => (
                <div key={group.title} className="flex flex-col gap-2">
                    <label className="settings-label group relative cursor-help">
                        {group.title}
                        <span className="tooltip">{group.tooltip}</span>
                    </label>

                    {host ? (
                        <div className="grid grid-cols-2 gap-2 bg-neutral-900 bg-dots p-4">
                            {group.values.map((property) => (
                                <label
                                    key={property}
                                    className="flex items-center gap-3 settings-label cursor-pointer"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedProperties.includes(property)}
                                        onChange={(e) => handlePropertyToggle(property, e.target.checked)}
                                        className="settings-checkbox"
                                    />
                                    <span>{formatPropertyLabel(property)}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <SettingsChips
                            values={group.values}
                            selected={selectedProperties}
                            labelFor={formatPropertyLabel}
                        />
                    )}
                </div>
            ))}
        </div>
    );
}
