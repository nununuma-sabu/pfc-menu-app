'use client';

import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { searchIngredients, IngredientSearchResult, IngredientSearchParams } from '@/app/actions/ingredients';
import { Search, Loader2 } from 'lucide-react';

export default function IngredientSearch() {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

    const [results, setResults] = useState<IngredientSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const performSearch = async () => {
            // If the search term is empty, clear results and don't search
            if (!debouncedSearchTerm.trim()) {
                setResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            setError(null);

            const res = await searchIngredients({
                query: debouncedSearchTerm,
                limit: 20
            });

            if (res.error) {
                setError(res.error);
                setResults([]);
            } else {
                setResults(res.data || []);
            }

            setIsSearching(false);
        };

        performSearch();
    }, [debouncedSearchTerm]);

    return (
        <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative w-full shadow-sm rounded-xl overflow-hidden bg-white border border-zinc-200 focus-within:ring-2 focus-within:ring-emerald-500/50 focus-within:border-emerald-500 transition-all">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-zinc-400" />
                </div>
                <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-3 border-none bg-transparent text-zinc-900 placeholder-zinc-400 focus:outline-none sm:text-sm"
                    placeholder="食品名で検索（例: 鶏胸肉、卵、白米）..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Results List */}
            {debouncedSearchTerm && !isSearching && results.length === 0 && !error && (
                <div className="text-center py-8 text-zinc-500">
                    「{debouncedSearchTerm}」に一致する食品は見つかりませんでした。
                </div>
            )}

            <div className="flex flex-col gap-3">
                {results.map((item) => (
                    <div
                        key={item.id}
                        className="flex flex-col sm:flex-row justify-between p-4 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 shadow-sm transition-colors duration-200 group"
                    >
                        <div className="flex flex-col">
                            <span className="font-semibold text-zinc-900">{item.name}</span>
                            <span className="text-xs text-zinc-500 mt-1">カテゴリ: {item.category}</span>
                        </div>

                        <div className="flex gap-4 mt-3 sm:mt-0 text-sm">
                            <div className="flex flex-col items-center">
                                <span className="text-zinc-500 text-xs">Kcal</span>
                                <span className="font-medium text-amber-400">{item.calories_per_100g}</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-zinc-500 text-xs">Pro</span>
                                <span className="font-medium text-emerald-400">{item.protein_per_100g}g</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-zinc-500 text-xs">Fat</span>
                                <span className="font-medium text-rose-400">{item.fat_per_100g}g</span>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-zinc-500 text-xs">Carb</span>
                                <span className="font-medium text-sky-400">{item.carbs_per_100g}g</span>
                            </div>
                        </div>

                        {/* Future Add Button Placeholder */}
                        {/* <button className="mt-3 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg p-2 flex items-center justify-center">
               追加
            </button> */}
                    </div>
                ))}
            </div>
        </div>
    );
}
