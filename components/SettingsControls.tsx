interface SettingsSliderProps {
    label: string;
    tooltip: string;
    value: number;
    suffix?: string;
    min: number;
    max: number;
    step?: number;
    host: boolean;
    onChange: (value: number) => void;
}

export function SettingsSlider({
    label,
    tooltip,
    value,
    suffix = '',
    min,
    max,
    step = 1,
    host,
    onChange,
}: SettingsSliderProps) {
    return (
        <div className="flex flex-col gap-2">
            <label className="settings-label group relative cursor-help">
                {label}{host ? `: ${value}${suffix ? ` ${suffix}` : ''}` : ''}
                <span className="tooltip">{tooltip}</span>
            </label>
            {host ? (
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(parseInt(e.target.value))}
                    className="w-full accent-white"
                />
            ) : (
                <div className="settings-readonly">
                    <span className="settings-value">
                        {value}{suffix ? ` ${suffix}` : ''}
                    </span>
                </div>
            )}
        </div>
    );
}

interface SettingsChipsProps {
    values: string[];
    selected: string[];
    labelFor: (value: string) => string;
    counts?: Record<string, number>;
    emptyLabel?: string;
}

export function SettingsChips({
    values,
    selected,
    labelFor,
    counts,
    emptyLabel = 'None selected',
}: SettingsChipsProps) {
    const visible = values.filter(value => selected.includes(value));

    return (
        <div className="settings-readonly flex flex-wrap gap-2">
            {visible.length === 0 && (
                <span className="text-white/40 font-inter text-sm italic">{emptyLabel}</span>
            )}
            {visible.map(value => (
                <span key={value} className="settings-chip">
                    {labelFor(value)}
                    {counts?.[value] !== undefined && (
                        <span className="settings-chip-count">{counts[value].toLocaleString()}</span>
                    )}
                </span>
            ))}
        </div>
    );
}
