"use client";

import { useEffect, useState } from "react";
import { nutritionTips, NutritionTipData } from "@/data/nutritionTips";
import { Lightbulb } from "lucide-react";

export default function NutritionTip() {
    const [tip, setTip] = useState<NutritionTipData | null>(null);

    useEffect(() => {
        // Randomly select a tip on mount
        const randomIndex = Math.floor(Math.random() * nutritionTips.length);
        setTip(nutritionTips[randomIndex]);
    }, []);

    if (!tip) return null;

    return (
        <div className="w-full max-w-md mx-auto mt-8 animate-in fade-in zoom-in duration-500">
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
                {/* Decorational Icon Background */}
                <div className="absolute -right-4 -top-4 text-amber-100 dark:text-amber-900/40 transform rotate-12">
                    <Lightbulb className="w-24 h-24" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3 text-amber-600 dark:text-amber-400 font-bold">
                        <Lightbulb className="w-5 h-5 animate-pulse" />
                        <span>豆知識</span>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-800 dark:text-zinc-100 mb-2">
                        {tip.title}
                    </h3>

                    <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                        {tip.content}
                    </p>
                </div>
            </div>
            <p className="text-center text-xs text-zinc-400 mt-2 animate-pulse">
                AIが最適な献立を考えています...
            </p>
        </div>
    );
}
