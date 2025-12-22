'use client'

import { useState, useEffect, useRef } from 'react';
import { WIKIDATA_SEARCH_URL } from '@/shared/constants';

interface WikidataResult {
    id: string;
    label: string;
    description?: string;
}

interface WikidataSearchProps {
    onSelect: (id: string, label: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export default function WikidataSearch({ onSelect, placeholder = "Search for a person...", disabled = false }: WikidataSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<WikidataResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    
    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!query.trim()) {
            setResults([]);
            setShowDropdown(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${WIKIDATA_SEARCH_URL}${encodeURIComponent(query)}&type=item&limit=8&origin=*`);
                const data = await response.json();
                
                const items: WikidataResult[] = (data.search || []).map((item: { id: string; label: string; description?: string }) => ({
                    id: item.id,
                    label: item.label,
                    description: item.description,
                }));
                
                setResults(items);
                setShowDropdown(items.length > 0);
                setSelectedIndex(0);
            } catch (error) {
                console.error("Wikidata search error:", error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        }, 300);

        return () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
            }
        };
    }, [query]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (result: WikidataResult) => {
        onSelect(result.id, result.label);
        setQuery("");
        setResults([]);
        setShowDropdown(false);
        setSelectedIndex(0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showDropdown || results.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => (prev + 1) % results.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
                break;
            case 'Enter':
                e.preventDefault();
                if (results[selectedIndex]) {
                    handleSelect(results[selectedIndex]);
                }
                break;
            case 'Escape':
                setShowDropdown(false);
                break;
        }
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-2xl">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => results.length > 0 && setShowDropdown(true)}
                    placeholder={placeholder}
                    disabled={disabled}
                    autoFocus
                    className="w-full text-center text-2xl p-4 rounded-lg border-4 
                        bg-indigo-600 text-white placeholder-indigo-300
                        focus:outline-none focus:border-white disabled:opacity-50"
                />
                {isLoading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-indigo-300 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
                <ul className="absolute z-50 w-full mt-2 bg-indigo-800 border-4 border-indigo-400 
                    rounded-lg shadow-xl max-h-72 overflow-y-auto">
                    {results.map((result, index) => (
                        <li key={result.id}>
                            <button
                                type="button"
                                onClick={() => handleSelect(result)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`w-full text-left px-4 py-3 transition-colors border-b border-indigo-600 last:border-b-0 ${
                                    selectedIndex === index ? 'bg-indigo-600' : 'hover:bg-indigo-600'
                                }`}
                            >
                                <p className="text-white font-semibold text-lg">{result.label}</p>
                                {result.description && (
                                    <p className="text-indigo-300 text-sm truncate">{result.description}</p>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}