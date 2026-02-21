"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Calculator } from "lucide-react";
import clsx from "clsx";

interface TdeeModalProps {
    onApply: (data: { calories: number }) => void;
    onClose: () => void;
}

const ACTIVITY_LEVELS = [
    { label: "座り仕事", factor: 1.2, desc: "デスクワーク中心" },
    { label: "軽い運動", factor: 1.375, desc: "週1-3回" },
    { label: "中程度", factor: 1.55, desc: "週3-5回" },
    { label: "激しい", factor: 1.725, desc: "週6-7回" },
    { label: "超激しい", factor: 1.9, desc: "アスリート" },
];

export default function TdeeModal({ onApply, onClose }: TdeeModalProps) {
    const [weight, setWeight] = useState<string>("");
    const [bodyFat, setBodyFat] = useState<string>("");
    const [activityIndex, setActivityIndex] = useState<number>(1); // default: 軽い運動

    // Close on Escape key
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [onClose]);

    const calc = useMemo(() => {
        const w = Number(weight);
        const bf = Number(bodyFat);
        if (!w || w <= 0 || !bf || bf <= 0 || bf >= 100) return null;

        const lbm = w * (1 - bf / 100);
        const bmr = Math.round(370 + 21.6 * lbm);
        const tdee = Math.round(bmr * ACTIVITY_LEVELS[activityIndex].factor);

        return { lbm, bmr, tdee };
    }, [weight, bodyFat, activityIndex]);

    const handleApply = () => {
        if (!calc) return;
        onApply({
            calories: calc.tdee,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
                    <div className="flex items-center gap-2">
                        <Calculator className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h2 className="text-lg font-bold text-zinc-800 dark:text-white">TDEE 自動計算</h2>
                    </div>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-4">
                    <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        🔒 体重・体脂肪率はこの画面のみで使用し、保存されません。
                    </p>

                    {/* Inputs */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">体重 (kg)</label>
                            <input
                                type="number"
                                value={weight}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => setWeight(e.target.value)}
                                placeholder="65"
                                className="w-full p-2.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">体脂肪率 (%)</label>
                            <input
                                type="number"
                                value={bodyFat}
                                onKeyDown={handleKeyDown}
                                onChange={(e) => setBodyFat(e.target.value)}
                                placeholder="20"
                                className="w-full p-2.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
                            />
                        </div>
                    </div>

                    {/* Activity Level */}
                    <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-2">活動レベル</label>
                        <div className="grid grid-cols-5 gap-1">
                            {ACTIVITY_LEVELS.map((level, i) => (
                                <button
                                    key={level.label}
                                    type="button"
                                    onClick={() => setActivityIndex(i)}
                                    className={clsx(
                                        "py-2 px-1 rounded-lg text-center transition-all border",
                                        activityIndex === i
                                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                                            : "bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                                    )}
                                >
                                    <div className="text-[11px] font-bold leading-tight">{level.label}</div>
                                    <div className="text-[9px] opacity-70 mt-0.5">{level.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Results */}
                    {calc && (
                        <div className="p-4 rounded-lg border space-y-2 bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800">
                            <div className="grid grid-cols-3 gap-2 text-center">
                                <div>
                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">LBM</div>
                                    <div className="text-sm font-bold text-zinc-800 dark:text-white">{calc.lbm.toFixed(1)}kg</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">BMR</div>
                                    <div className="text-sm font-bold text-zinc-800 dark:text-white">{calc.bmr.toLocaleString()} kcal</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">TDEE</div>
                                    <div className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300">{calc.tdee.toLocaleString()}</div>
                                    <div className="text-[10px] text-indigo-500">kcal</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex gap-3 px-5 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-lg font-bold text-sm text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                    >
                        キャンセル
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        disabled={!calc}
                        className={clsx(
                            "flex-1 py-2.5 rounded-lg font-bold text-sm text-white transition-all",
                            (!calc)
                                ? "bg-zinc-400 cursor-not-allowed"
                                : "bg-indigo-600 hover:bg-indigo-700 active:scale-95 shadow-md"
                        )}
                    >
                        ✓ 適用して閉じる
                    </button>
                </div>
            </div>
        </div>
    );
}
