"use client";

import { useEffect, useState, useRef } from "react";
import { nutritionTips, NutritionTipData } from "@/data/nutritionTips";
import { Lightbulb } from "lucide-react";

function getRandomTip(exclude?: NutritionTipData): NutritionTipData {
    if (nutritionTips.length <= 1) return nutritionTips[0];
    let next: NutritionTipData;
    do {
        next = nutritionTips[Math.floor(Math.random() * nutritionTips.length)];
    } while (next.title === exclude?.title);
    return next;
}

export default function NutritionTip() {
    const [tip, setTip] = useState<NutritionTipData>(() => getRandomTip());
    const [visible, setVisible] = useState(true);
    const tipRef = useRef(tip);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        tipRef.current = tip;
    }, [tip]);

    useEffect(() => {
        timerRef.current = setInterval(() => {
            // Fade out
            setVisible(false);

            // After fade out, swap tip and fade in
            setTimeout(() => {
                const next = getRandomTip(tipRef.current);
                setTip(next);
                setVisible(true);
            }, 400);
        }, 5000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <div className="w-full max-w-md mx-auto animate-in fade-in zoom-in duration-500">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 shadow-sm relative overflow-hidden">
                {/* Decorational Icon Background */}
                <div className="absolute -right-4 -top-4 text-amber-100 transform rotate-12">
                    <Lightbulb className="w-24 h-24" />
                </div>

                <div
                    className="relative z-10"
                    style={{
                        opacity: visible ? 1 : 0,
                        transition: "opacity 0.4s ease-in-out",
                    }}
                >
                    <div className="flex items-center gap-2 mb-3 text-amber-700 font-bold">
                        <Lightbulb className="w-5 h-5 animate-pulse" />
                        <span>豆知識</span>
                    </div>

                    <h3 className="text-lg font-bold text-zinc-900 mb-1">
                        {tip.title}
                    </h3>
                    <p className="text-xs text-amber-600 mb-2 font-medium">{tip.category}</p>

                    <p className="text-sm text-zinc-700 leading-relaxed">
                        {tip.content}
                    </p>
                </div>
            </div>
            <p className="text-center text-xs text-zinc-500 mt-2 animate-pulse font-medium">
                AIが最適な献立を考えています...
            </p>
        </div>
    );
}
