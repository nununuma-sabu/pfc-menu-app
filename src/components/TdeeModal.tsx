"use client";

import { useState, useMemo, useEffect } from "react";
import { X, Calculator } from "lucide-react";
import clsx from "clsx";

interface TdeeModalProps {
    onApply: (data: { calories: number; pRatio?: number; fRatio?: number; cRatio?: number }) => void;
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
    const [applyRecomp, setApplyRecomp] = useState<boolean>(true);
    const [adjustment, setAdjustment] = useState<string>("0");

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

        const adjVal = Number(adjustment) || 0;
        const targetCalories = Math.max(0, tdee + adjVal);

        // Recomp PFC: P=全体重×2g, F=25%, C=残り (targetCaloriesベース)
        const pGrams = w * 2;
        const pCals = pGrams * 4;
        const fCals = targetCalories * 0.25;
        const cCals = targetCalories - pCals - fCals;

        const pRatio = targetCalories > 0 ? Math.round((pCals / targetCalories) * 100) : 0;
        const fRatio = targetCalories > 0 ? Math.round((fCals / targetCalories) * 100) : 0;
        const cRatio = 100 - pRatio - fRatio;

        return { lbm, bmr, tdee, targetCalories, pGrams, pRatio, fRatio, cRatio, cCalsNegative: cCals < 0 };
    }, [weight, bodyFat, activityIndex, adjustment]);

    const handleApply = () => {
        if (!calc) return;

        if (applyRecomp) {
            if (calc.cCalsNegative) return;
            onApply({
                calories: calc.targetCalories,
                pRatio: calc.pRatio,
                fRatio: calc.fRatio,
                cRatio: calc.cRatio,
            });
        } else {
            onApply({
                calories: calc.targetCalories,
            });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (["e", "E", "+"].includes(e.key) && e.currentTarget.type === "number" && !e.currentTarget.name.includes("adjustment")) {
            // Let adjustment allow +/-
        } else if (["e", "E"].includes(e.key)) {
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
                <div className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
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
                                className="w-full p-2.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500"
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
                                className="w-full p-2.5 text-sm border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500"
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

                    {/* Calorie Adjustment */}
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl border border-zinc-200 dark:border-zinc-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                目標設定（調整幅 kcal）
                            </label>
                            <span className="text-[10px] text-zinc-400">
                                維持カロリー ± 調整幅
                            </span>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <input
                                type="text"
                                value={adjustment}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || /^[+-]?\d*$/.test(val)) {
                                        setAdjustment(val);
                                    }
                                }}
                                placeholder="0"
                                className="w-24 p-2 text-sm font-bold border border-zinc-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500"
                            />
                            <div className="flex-1 grid grid-cols-5 gap-1">
                                {[-500, -300, 0, 300, 500].map((val) => (
                                    <button
                                        key={val}
                                        type="button"
                                        onClick={() => setAdjustment(val > 0 ? `+${val}` : val.toString())}
                                        className={clsx(
                                            "text-[10px] font-bold py-1 rounded border transition-colors",
                                            adjustment === (val > 0 ? `+${val}` : val.toString())
                                                ? "bg-indigo-600 text-white border-indigo-600"
                                                : "bg-white dark:bg-zinc-800 text-zinc-600 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100"
                                        )}
                                    >
                                        {val > 0 ? `+${val}` : val}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <p className="text-[9px] text-zinc-500 leading-relaxed italic">
                            💡 減量は **TDEEの10〜20%減 (約300〜500kcal減)** が無理のない目安です。
                        </p>
                    </div>

                    {/* Results */}
                    {calc && (
                        <div className={clsx(
                            "p-4 rounded-lg border space-y-3",
                            applyRecomp && calc.cCalsNegative
                                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                                : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800"
                        )}>
                            <div className="grid grid-cols-2 gap-4 text-center">
                                <div className="border-r border-indigo-100 dark:border-indigo-900/30 pr-2">
                                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400">維持カロリー (TDEE)</div>
                                    <div className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{calc.tdee.toLocaleString()} <span className="text-[10px]">kcal</span></div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium">目標カロリー</div>
                                    <div className="text-lg font-extrabold text-indigo-700 dark:text-indigo-300">{calc.targetCalories.toLocaleString()}</div>
                                    <div className="text-[10px] text-indigo-500">kcal</div>
                                </div>
                            </div>

                            {/* Recomp Settings Toggle */}
                            <div className="border-t border-zinc-200 dark:border-zinc-700/50 pt-3">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                                        リコンプPFCを適用
                                        <div className="group relative">
                                            <span className="text-[10px] bg-zinc-200 dark:bg-zinc-700 px-1 rounded cursor-help">?</span>
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-zinc-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                P=体重x2g, F=目標×25%, C=残りでPFC比率を自動設定します。
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setApplyRecomp(!applyRecomp)}
                                        className={clsx(
                                            "relative w-9 h-5 rounded-full transition-colors",
                                            applyRecomp ? "bg-indigo-600" : "bg-zinc-300 dark:bg-zinc-600"
                                        )}
                                    >
                                        <span className={clsx(
                                            "absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                            applyRecomp && "translate-x-4"
                                        )} />
                                    </button>
                                </div>

                                {applyRecomp && (
                                    <div className="mt-3 bg-white/50 dark:bg-zinc-800/50 p-2 rounded-md border border-indigo-100 dark:border-indigo-900/30">
                                        <div className="flex justify-center gap-4 text-xs font-bold">
                                            <span className="text-blue-600 dark:text-blue-400">P:{calc.pRatio}%</span>
                                            <span className="text-amber-600 dark:text-amber-400">F:{calc.fRatio}%</span>
                                            <span className={clsx(calc.cCalsNegative ? "text-red-600" : "text-green-600 dark:text-green-400")}>
                                                C:{calc.cRatio}%
                                            </span>
                                        </div>
                                        {calc.cCalsNegative && (
                                            <p className="text-[10px] text-red-600 dark:text-red-400 font-medium text-center mt-1">
                                                ⚠️ 炭水化物がマイナスです。活動レベルか摂取カロリーを上げてください。
                                            </p>
                                        )}
                                    </div>
                                )}
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
                        disabled={!calc || (applyRecomp && calc.cCalsNegative)}
                        className={clsx(
                            "flex-1 py-2.5 rounded-lg font-bold text-sm text-white transition-all",
                            (!calc || (applyRecomp && calc.cCalsNegative))
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
