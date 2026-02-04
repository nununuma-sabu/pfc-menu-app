"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import clsx from "clsx";

interface InputFormProps {
    onSubmit: (data: { calories: number; p: number; f: number; c: number; mainIngredient?: string }) => Promise<void>;
    isLoading: boolean;
}

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
    const [calories, setCalories] = useState<string>("2000");
    // Default PFC Ratio: 15:25:60 (Standard Japanese balance)
    const [pRatio, setPRatio] = useState<string>("15");
    const [fRatio, setFRatio] = useState<string>("25");
    const [cRatio, setCRatio] = useState<string>("60");
    const [mainIngredient, setMainIngredient] = useState<string>("");

    // Recomp specific state
    const [weight, setWeight] = useState<string>("");
    const [multiplier, setMultiplier] = useState<string>("25");

    const [error, setError] = useState<string | null>(null);

    // Calculated grams (for display)
    const [grams, setGrams] = useState({ p: 0, f: 0, c: 0 });

    useEffect(() => {
        const cal = Number(calories) || 0;
        const p = Number(pRatio) || 0;
        const f = Number(fRatio) || 0;
        const c = Number(cRatio) || 0;

        // Calculate grams: Calorie ratio -> Grams
        // P: 4kcal/g, F: 9kcal/g, C: 4kcal/g
        setGrams({
            p: Math.round((cal * (p / 100)) / 4),
            f: Math.round((cal * (f / 100)) / 9),
            c: Math.round((cal * (c / 100)) / 4),
        });
    }, [calories, pRatio, fRatio, cRatio]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const calVal = Number(calories);
        const pVal = Number(pRatio);
        const fVal = Number(fRatio);
        const cVal = Number(cRatio);

        // Validation 1: Numeric Check
        if (!calVal || calVal <= 0) {
            setError("目標カロリーには正の数値を入力してください。");
            return;
        }
        if (pVal < 0 || fVal < 0 || cVal < 0) {
            setError("PFCバランスには正の数値を入力してください。");
            return;
        }

        // Validation 2: Sum Check
        // Strict 100 check required as inputs are integers.
        const totalRatio = pVal + fVal + cVal;
        if (totalRatio !== 100) {
            setError(`PFCバランスの合計が表示上 100% になっていません（現在: ${totalRatio}%）。微調整してください。`);
            return;
        }

        onSubmit({
            calories: calVal,
            p: grams.p,
            f: grams.f,
            c: grams.c,
            mainIngredient: mainIngredient.trim()
        });
    };

    const totalRatio = (Number(pRatio) || 0) + (Number(fRatio) || 0) + (Number(cRatio) || 0);
    const isInvalidTotal = totalRatio !== 100;

    const PRESETS = [
        { name: "標準バランス", p: 15, f: 25, c: 60, color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
        { name: "ローファット", p: 30, f: 10, c: 60, color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800" },
        { name: "ケトジェニック", p: 20, f: 75, c: 5, color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
        { name: "筋肥大 (高タンパク)", p: 40, f: 20, c: 40, color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800" },
    ];

    const applyPreset = (preset: { p: number; f: number; c: number }) => {
        setPRatio(preset.p.toString());
        setFRatio(preset.f.toString());
        setCRatio(preset.c.toString());
    };

    const applyRecomp = () => {
        const w = Number(weight);
        if (!w || w <= 0) {
            setError("リコンプ計算をするには、体重(kg)を入力してください。");
            return;
        }

        // 1. Total Calories = Weight * Multiplier
        const totalCal = Math.round(w * (Number(multiplier) || 0));

        // 2. Protein = Weight * 2g
        const pGrams = w * 2;
        const pCals = pGrams * 4;

        // 3. Fat = 25% of Total Calories
        const fCals = totalCal * 0.25;
        // const fGrams = fCals / 9;

        // 4. Carbs = Remainder
        const cCals = totalCal - pCals - fCals;

        // Convert to Percentages
        const pPercent = Math.round((pCals / totalCal) * 100);
        const fPercent = Math.round((fCals / totalCal) * 100); // Should be 25
        // Ensure sum is 100
        const cPercent = 100 - pPercent - fPercent;

        if (cPercent < 0) {
            setError("この設定では炭水化物がマイナスになります。カロリー係数を上げるか、体重設定を見直してください。");
            return;
        }

        setCalories(totalCal.toString());
        setPRatio(pPercent.toString());
        setFRatio(fPercent.toString());
        setCRatio(cPercent.toString());
        setError(null);
    };

    const handleIntegerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Stop e, E, +, -, .
        if (["e", "E", "+", "-", "."].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleFloatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Stop e, E, +, - (allow dot)
        if (["e", "E", "+", "-"].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleSanitizedChange = (
        e: React.ChangeEvent<HTMLInputElement>,
        setter: (value: string) => void
    ) => {
        let val = e.target.value;
        // Strip leading zeros if followed by a digit.
        // "05" -> "5"
        // "00" -> "0"
        // "0.5" -> "0.5" (0 is followed by ., not digit)
        if (val.length > 1) {
            val = val.replace(/^0+(?=\d)/, "");
        }

        // Direct DOM manipulation to ensure leading zero is gone even if state doesn't change enough to trigger re-render
        if (val !== e.target.value) {
            e.target.value = val;
        }

        setter(val);
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 p-6 bg-white dark:bg-zinc-800 rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-700">
            <div>
                <h2 className="text-xl font-bold text-zinc-800 dark:text-white mb-1">PFCバランス設定</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">目標カロリーとPFC比率(%)を入力してください</p>

                {/* Presets */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                    {PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            type="button"
                            onClick={() => applyPreset(preset)}
                            className={`p-2 text-xs font-bold rounded-lg border transition-all hover:scale-105 ${preset.color}`}
                        >
                            {preset.name}
                        </button>
                    ))}
                </div>

                {/* Recomp Calculation */}
                <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <h3 className="text-sm font-bold text-zinc-700 dark:text-zinc-300 mb-2">🔥 リコンプ設定 (自動計算)</h3>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="block text-xs text-zinc-500 mb-1">体重 (kg)</label>
                            <input
                                type="number"
                                value={weight}
                                onKeyDown={handleFloatKeyDown}
                                onChange={(e) => handleSanitizedChange(e, setWeight)}
                                className="w-full p-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md"
                                placeholder="例: 65"
                            />
                        </div>
                        <div className="w-20">
                            <label className="block text-xs text-zinc-500 mb-1">係数</label>
                            <input
                                type="number"
                                value={multiplier}
                                onKeyDown={handleIntegerKeyDown}
                                onChange={(e) => handleSanitizedChange(e, setMultiplier)}
                                className="w-full p-2 text-sm border border-zinc-300 dark:border-zinc-600 rounded-md"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={applyRecomp}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-md font-bold text-sm h-[38px] w-20"
                        >
                            適用
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">
                        ※ P=体重×2g, F=全体25%, C=残り (係数目安: 24~26)
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Calories */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        目標カロリー (kcal)
                    </label>
                    <input
                        type="number"
                        min="0"
                        value={calories}
                        onKeyDown={handleIntegerKeyDown}
                        onChange={(e) => handleSanitizedChange(e, setCalories)}
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                {/* Main Ingredient */}
                <div>
                    <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                        メイン食材 (任意)
                    </label>
                    <input
                        type="text"
                        value={mainIngredient}
                        onChange={(e) => setMainIngredient(e.target.value)}
                        placeholder="例: 鶏胸肉, 鮭"
                        className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                        使いたい食材があれば入力してください。
                    </p>
                </div>

                {/* PFC Ratios */}
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            P (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={pRatio}
                            onKeyDown={handleIntegerKeyDown}
                            onChange={(e) => handleSanitizedChange(e, setPRatio)}
                            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 text-center"
                            required
                        />
                        <div className="text-xs text-center text-zinc-500 mt-1">
                            {grams.p}g
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            F (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={fRatio}
                            onKeyDown={handleIntegerKeyDown}
                            onChange={(e) => handleSanitizedChange(e, setFRatio)}
                            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 text-center"
                            required
                        />
                        <div className="text-xs text-center text-zinc-500 mt-1">
                            {grams.f}g
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                            C (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value={cRatio}
                            onKeyDown={handleIntegerKeyDown}
                            onChange={(e) => handleSanitizedChange(e, setCRatio)}
                            className="w-full p-2 border border-zinc-300 dark:border-zinc-600 rounded-md bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 text-center"
                            required
                        />
                        <div className="text-xs text-center text-zinc-500 mt-1">
                            {grams.c}g
                        </div>
                    </div>
                </div>

                {/* Validation Feedback */}
                <div className={clsx(
                    "text-sm font-medium flex items-center justify-center gap-2 p-2 rounded-md transition-colors",
                    isInvalidTotal ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                )}>
                    {isInvalidTotal ? (
                        <>
                            <AlertCircle className="w-4 h-4" />
                            合計: {totalRatio}% (100%にしてください)
                        </>
                    ) : (
                        "合計: 100% OK"
                    )}
                </div>

                {error && (
                    <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800">
                        {error}
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={isLoading || isInvalidTotal}
                className={clsx(
                    "w-full py-3 px-4 mt-6 rounded-lg font-bold text-white transition-all",
                    (isLoading || isInvalidTotal)
                        ? "bg-zinc-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 active:scale-95 shadow-md hover:shadow-lg"
                )}
            >
                {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin w-5 h-5" />
                        提案を生成中
                    </span>
                ) : (
                    "献立を提案する"
                )}
            </button>
        </form>
    );
}
