import { useEffect, useState } from "react";
import {
    PeopleProperties,
    PeopleBPSettings as PeopleBPSettingsType,
    CONTINENTS,
    GENDERS,
    OCCUPATIONS,
} from "@/shared/types";
import { SettingsChips, SettingsSlider } from "@/components/SettingsControls";

interface PeopleBPSettingsProps {
    host: boolean;
    settings?: PeopleBPSettingsType;
    initialProperties?: string[];
    initialMinDuration?: number;
    initialMaxDuration?: number;
    initialStartingLives?: number;
    initialLowerBound?: number;
    initialUpperBound?: number;
    onSettingsChange: (settings: Partial<PeopleBPSettingsType>) => void;
}

const formatPropertyLabel = (property: string) => {
    return property
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default function PeopleBPSettings({
    host,
    settings,
    initialProperties = Object.values(PeopleProperties),
    initialMinDuration = 8,
    initialMaxDuration = 25,
    initialStartingLives = 5,
    initialLowerBound = 1,
    initialUpperBound = 2,
    onSettingsChange,
}: PeopleBPSettingsProps) {
    const [selectedProperties, setSelectedProperties] = useState<string[]>(settings?.properties ?? initialProperties);
    const [minDuration, setMinDuration] = useState(settings?.minDuration ?? initialMinDuration);
    const [maxDuration, setMaxDuration] = useState(settings?.maxDuration ?? initialMaxDuration);
    const [startingLives, setStartingLives] = useState(settings?.startingLives ?? initialStartingLives);
    const [lowerBound, setLowerBound] = useState(settings?.combinationLowerBound ?? initialLowerBound);
    const [upperBound, setUpperBound] = useState(settings?.combinationUpperBound ?? initialUpperBound);

    useEffect(() => {
        if (settings?.properties) setSelectedProperties(settings.properties);
    }, [settings?.properties]);

    useEffect(() => {
        if (settings?.minDuration !== undefined) setMinDuration(settings.minDuration);
    }, [settings?.minDuration]);

    useEffect(() => {
        if (settings?.maxDuration !== undefined) setMaxDuration(settings.maxDuration);
    }, [settings?.maxDuration]);

    useEffect(() => {
        if (settings?.startingLives !== undefined) setStartingLives(settings.startingLives);
    }, [settings?.startingLives]);

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
                label="Min Timer Duration"
                tooltip="Minimum time given to each player for their turn"
                value={minDuration}
                suffix="seconds"
                min={3}
                max={30}
                host={host}
                onChange={(value) => {
                    setMinDuration(value);
                    if (host) onSettingsChange({ minDuration: value });
                }}
            />

            <SettingsSlider
                label="Max Timer Duration"
                tooltip="Maximum time given to each player for their turn"
                value={maxDuration}
                suffix="seconds"
                min={5}
                max={60}
                host={host}
                onChange={(value) => {
                    setMaxDuration(value);
                    if (host) onSettingsChange({ maxDuration: value });
                }}
            />

            <SettingsSlider
                label="Starting Lives"
                tooltip="Number of lives each player starts with"
                value={startingLives}
                min={1}
                max={10}
                host={host}
                onChange={(value) => {
                    setStartingLives(value);
                    if (host) onSettingsChange({ startingLives: value });
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
