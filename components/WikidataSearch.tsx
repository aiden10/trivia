'use client'

import { useState, useEffect, useRef } from 'react';
import { WIKIDATA_SEARCH_URL } from '@/shared/constants';

const WIKIDATA_API_URL = "https://www.wikidata.org/w/api.php";
const SEARCH_LIMIT = 20;

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

interface EntitySearchResponse {
    search?: Array<{ id: string; label: string; description?: string }>;
}

interface FullTextSearchResponse {
    query?: { search?: Array<{ title: string }> };
}

interface EntitiesResponse {
    entities?: Record<string, {
        labels?: Record<string, { value: string }>;
        descriptions?: Record<string, { value: string }>;
    }>;
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Wikidata request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
}

/** Label/alias search (good for exact names). */
async function searchByLabel(query: string): Promise<WikidataResult[]> {
    const data = await fetchJson<EntitySearchResponse>(
        `${WIKIDATA_SEARCH_URL}${encodeURIComponent(query)}&type=item&limit=${SEARCH_LIMIT}&origin=*`
    );

    return (data.search ?? []).map(item => ({
        id: item.id,
        label: item.label,
        description: item.description,
    }));
}

async function fetchEntitiesById(ids: string[]): Promise<WikidataResult[]> {
    if (ids.length === 0) return [];

    const params = new URLSearchParams({
        action: "wbgetentities",
        ids: ids.join("|"),
        props: "labels|descriptions",
        languages: "en",
        format: "json",
        origin: "*",
    });

    const data = await fetchJson<EntitiesResponse>(`${WIKIDATA_API_URL}?${params}`);
    return ids.flatMap(id => {
        const entity = data.entities?.[id];
        const label = entity?.labels?.en?.value;
        if (!label) return [];
        return [{
            id,
            label,
            description: entity?.descriptions?.en?.value,
        }];
    });
}

/** Full-text search (better relevance for ambiguous names like "Batman"). */
async function searchByText(query: string): Promise<WikidataResult[]> {
    const params = new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: query,
        srnamespace: "0",
        srlimit: String(SEARCH_LIMIT),
        format: "json",
        origin: "*",
    });

    const data = await fetchJson<FullTextSearchResponse>(`${WIKIDATA_API_URL}?${params}`);
    const ids = (data.query?.search ?? [])
        .map(item => item.title)
        .filter(title => /^Q\d+$/.test(title));

    return fetchEntitiesById(ids);
}

/**
 * Neither search endpoint is great on its own: label search buries ambiguous
 * names behind unrelated exact matches (e.g. "Batman" returns the Turkish
 * province and several games before the DC character), while full-text search
 * can be noisy for exact names.  Combine both rankings, with a bonus for an
 * exact label match, so the same query gets the best of both.
 */
async function searchWikidata(query: string): Promise<WikidataResult[]> {
    const [labelResults, textResults] = await Promise.all([
        searchByLabel(query).catch(() => [] as WikidataResult[]),
        searchByText(query).catch(() => [] as WikidataResult[]),
    ]);

    const scored = new Map<string, { item: WikidataResult; score: number }>();

    const addScore = (item: WikidataResult, rank: number) => {
        const existing = scored.get(item.id);
        const score = 1 / (rank + 1);
        if (existing) {
            existing.score += score;
        } else {
            scored.set(item.id, { item, score });
        }
    };

    labelResults.forEach((item, rank) => addScore(item, rank));
    textResults.forEach((item, rank) => addScore(item, rank));

    const normalizedQuery = query.trim().toLowerCase();
    for (const entry of scored.values()) {
        if (entry.item.label.trim().toLowerCase() === normalizedQuery) {
            entry.score += 1;
        }
    }

    return Array.from(scored.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, SEARCH_LIMIT)
        .map(entry => entry.item);
}

export default function WikidataSearch({ onSelect, placeholder = "search for a person...", disabled = false }: WikidataSearchProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<WikidataResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const debounceRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    useEffect(() => {
        let cancelled = false;

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (!query.trim()) {
            setResults([]);
            setShowDropdown(false);
            setIsLoading(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setIsLoading(true);

            try {
                const items = await searchWikidata(query);

                // Ignore responses from a query the user has already replaced.
                if (cancelled) return;

                setResults(items);
                setShowDropdown(items.length > 0);
                setSelectedIndex(0);
            } catch (error) {
                if (cancelled) return;
                console.error("Wikidata search error:", error);
                setResults([]);
                setShowDropdown(false);
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                }
            }
        }, 300);

        return () => {
            cancelled = true;
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

    // Keep the highlighted result visible when using the arrow keys.
    useEffect(() => {
        if (!showDropdown) return;
        const item = listRef.current?.children[selectedIndex] as HTMLElement | undefined;
        item?.scrollIntoView({ block: 'nearest' });
    }, [selectedIndex, showDropdown]);

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
                    className="w-full input-primary"
                />
                {isLoading && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-white border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Dropdown Results */}
            {showDropdown && (
                <ul
                    ref={listRef}
                    className="absolute z-50 w-full mt-2 bg-neutral-900 border-4
                border-white shadow-xl max-h-72 overflow-y-auto font-inter"
                >
                    {results.map((result, index) => (
                        <li key={result.id}>
                            <button
                                type="button"
                                onClick={() => handleSelect(result)}
                                onMouseEnter={() => setSelectedIndex(index)}
                                className={`w-full text-left px-4 py-3 transition-colors border-b border-stone-800 last:border-b-0 hover:cursor-pointer ${
                                    selectedIndex === index ? 'bg-stone-600' : 'hover:bg-white/50 hover:bg-dots'
                                }`}
                            >
                                <p className="text-white font-semibold text-lg">{result.label}</p>
                                {result.description && (
                                    <p className="text-white text-sm truncate">{result.description}</p>
                                )}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
