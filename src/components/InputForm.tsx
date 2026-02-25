"use client";

import { useState, useMemo } from "react";
import { Loader2, AlertCircle, Lock, ShieldAlert, Calculator } from "lucide-react";
import clsx from "clsx";
import TdeeModal from "./TdeeModal";

import { GenerateMenuRequest, FixedMeal } from "../types/menu";

const FAVORITE_RECIPES = [
    {
        id: "protein-smoothie",
        name: "プロテインスムージー",
        calories: 270,
        p: 26,
        f: 2,
        c: 46,
        description: "ホエイプロテイン+冷凍バナナ+ベリー+イヌリンのスムージー",
    }
];

interface InputFormProps {
    onSubmit: (data: GenerateMenuRequest) => Promise<void>;
    isLoading: boolean;
}

export default function InputForm({ onSubmit, isLoading }: InputFormProps) {
    const [calories, setCalories] = useState<string>("2000");
    // Default PFC Ratio: 15:25:60 (Standard Japanese balance)
    const [pRatio, setPRatio] = useState<string>("15");
    const [fRatio, setFRatio] = useState<string>("25");
    const [cRatio, setCRatio] = useState<string>("60");
    const [mainIngredient, setMainIngredient] = useState<string>("");
    const [allergies, setAllergies] = useState<string>("");
    const [dislikedFoods, setDislikedFoods] = useState<string>("");
    const [avoidFoods, setAvoidFoods] = useState<string>("");
    const [mealCount, setMealCount] = useState<number>(3);
    const [days, setDays] = useState<number>(3);
    const [fixedMeals, setFixedMeals] = useState<FixedMeal[]>([]);

    // TDEE Modal
    const [showTdeeModal, setShowTdeeModal] = useState<boolean>(false);

    const [error, setError] = useState<string | null>(null);

    // Calculated grams (derived from state via useMemo)
    const grams = useMemo(() => {
        const cal = Number(calories) || 0;
        const p = Number(pRatio) || 0;
        const f = Number(fRatio) || 0;
        const c = Number(cRatio) || 0;

        return {
            p: Math.round((cal * (p / 100)) / 4),
            f: Math.round((cal * (f / 100)) / 9),
            c: Math.round((cal * (c / 100)) / 4),
        };
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
            mainIngredient: mainIngredient.trim(),
            allergies: allergies.trim(),
            dislikedFoods: dislikedFoods.trim(),
            avoidFoods: avoidFoods.trim(),
            mealCount,
            days,
            fixedMeals
        });
    };

    const totalRatio = (Number(pRatio) || 0) + (Number(fRatio) || 0) + (Number(cRatio) || 0);
    const isInvalidTotal = totalRatio !== 100;

    const PRESETS = [
        { name: "標準バランス", p: 15, f: 25, c: 60, color: "bg-blue-100 text-blue-700   border-blue-200 " },
        { name: "ローファット", p: 30, f: 10, c: 60, color: "bg-green-100 text-green-700   border-green-200 " },
        { name: "ケトジェニック", p: 20, f: 75, c: 5, color: "bg-purple-100 text-purple-700   border-purple-200 " },
        { name: "筋肥大 (高タンパク)", p: 40, f: 20, c: 40, color: "bg-orange-100 text-orange-700   border-orange-200 " },
    ];

    const applyPreset = (preset: { p: number; f: number; c: number }) => {
        setPRatio(preset.p.toString());
        setFRatio(preset.f.toString());
        setCRatio(preset.c.toString());
    };

    const handleTdeeApply = (data: { calories: number; pRatio?: number; fRatio?: number; cRatio?: number }) => {
        setCalories(data.calories.toString());
        if (data.pRatio !== undefined) setPRatio(data.pRatio.toString());
        if (data.fRatio !== undefined) setFRatio(data.fRatio.toString());
        if (data.cRatio !== undefined) setCRatio(data.cRatio.toString());
        setShowTdeeModal(false);
        setError(null);
    };

    const handleIntegerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Stop e, E, +, -, .
        if (["e", "E", "+", "-", "."].includes(e.key)) {
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
        <>
            <form onSubmit={handleSubmit} className="w-full max-w-md space-y-6 p-6 bg-white  rounded-xl shadow-lg border border-zinc-100 ">
                <div>
                    <h2 className="text-xl font-bold text-zinc-800  mb-1">PFCバランス設定</h2>
                    <p className="text-sm text-zinc-500 ">目標カロリーとPFC比率(%)を入力してください</p>

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

                    {/* TDEE Calculation Button */}
                    <div className="mt-4">
                        <button
                            type="button"
                            onClick={() => setShowTdeeModal(true)}
                            className="w-full p-3 bg-indigo-50  hover:bg-indigo-100  rounded-lg border border-indigo-200  transition-all flex items-center justify-center gap-2 group"
                        >
                            <Calculator className="w-4 h-4 text-indigo-600  group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-bold text-indigo-700 ">TDEE自動計算 (体重 &amp; 体脂肪率から)</span>
                        </button>
                    </div>
                </div>

                {/* Fixed Meals Section */}
                <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200 space-y-3">
                    <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-indigo-600" />
                        <h3 className="text-sm font-bold text-indigo-700">お気に入りレシピから固定 (任意)</h3>
                    </div>

                    {fixedMeals.length > 0 ? (
                        <div className="space-y-2">
                            {fixedMeals.map((fm, idx) => {
                                const recipe = FAVORITE_RECIPES.find(r => r.id === fm.recipeId);
                                return (
                                    <div key={idx} className="flex items-center justify-between bg-white p-2 rounded border border-indigo-100 text-xs">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-indigo-600">{fm.mealIndex + 1}食目</span>
                                            <span className="text-zinc-600">{recipe?.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFixedMeals(fixedMeals.filter((_, i) => i !== idx))}
                                            className="text-red-500 hover:text-red-700 font-bold px-2"
                                        >
                                            解除
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-[11px] text-zinc-500">固定したい食事枠とレシピを選択してください。</p>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <select
                            className="p-2 text-xs border border-indigo-200 rounded bg-white"
                            onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const mealIdx = parseInt(val);
                                // Currently only one recipe in preset, so auto-select it if not already fixed
                                if (!fixedMeals.some(fm => fm.mealIndex === mealIdx)) {
                                    setFixedMeals([...fixedMeals, { mealIndex: mealIdx, recipeId: "protein-smoothie" }]);
                                }
                                e.target.value = ""; // Reset select
                            }}
                            value=""
                        >
                            <option value="">＋ 食事枠を選択して固定</option>
                            {Array.from({ length: mealCount }).map((_, i) => (
                                <option key={i} value={i} disabled={fixedMeals.some(fm => fm.mealIndex === i)}>
                                    {i + 1}食目を固定
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center justify-center text-[10px] text-indigo-500 italic">
                            ※現在はシェイクのみ選択可
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Calories */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700  mb-1">
                            目標カロリー (kcal)
                        </label>
                        <input
                            type="number"
                            min="0"
                            value={calories}
                            onKeyDown={handleIntegerKeyDown}
                            onChange={(e) => handleSanitizedChange(e, setCalories)}
                            className="w-full p-2 border border-zinc-300  rounded-md bg-white  focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    {/* Main Ingredient */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700  mb-1">
                            メイン食材 (任意)
                        </label>
                        <input
                            type="text"
                            value={mainIngredient}
                            onChange={(e) => {
                                const val = e.target.value;
                                setMainIngredient(val);
                            }}
                            placeholder="例: 鶏胸肉, 鮭"
                            className="w-full p-2 border border-zinc-300  rounded-md bg-white  focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-zinc-500 mt-1">
                            使いたい食材があれば入力してください。
                        </p>
                    </div>

                    {/* Food Exclusion Section */}
                    <div className="space-y-3 p-4 bg-zinc-50  rounded-lg border border-zinc-200 ">
                        <h3 className="text-sm font-bold text-zinc-700 ">🚫 除外食材</h3>

                        {/* Allergies - Most critical */}
                        <div className="p-3 bg-red-50  rounded-lg border border-red-300 ">
                            <label className="flex items-center gap-1.5 text-sm font-bold text-red-700  mb-1">
                                <ShieldAlert className="w-4 h-4" />
                                アレルギー食材
                            </label>
                            <input
                                type="text"
                                value={allergies}
                                onChange={(e) => setAllergies(e.target.value)}
                                placeholder="例: えび, かに, 小麦, そば"
                                className="w-full p-2 text-sm border border-red-300  rounded-md bg-white  focus:ring-2 focus:ring-red-500"
                            />
                            <p className="text-[10px] text-red-500  mt-1 font-medium">
                                ⚠️ エキス・だし・調味料を含め完全に排除します。カンマ区切りで複数入力可。
                            </p>
                        </div>

                        {/* Disliked Foods */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700  mb-1">
                                😣 苦手な食材
                            </label>
                            <input
                                type="text"
                                value={dislikedFoods}
                                onChange={(e) => setDislikedFoods(e.target.value)}
                                placeholder="例: セロリ, パクチー"
                                className="w-full p-2 text-sm border border-zinc-300  rounded-md bg-white  focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-[10px] text-zinc-400 mt-1">使用しません。カンマ区切りで複数入力可。</p>
                        </div>

                        {/* Avoid Foods */}
                        <div>
                            <label className="block text-sm font-medium text-zinc-700  mb-1">
                                😐 嫌いな食材
                            </label>
                            <input
                                type="text"
                                value={avoidFoods}
                                onChange={(e) => setAvoidFoods(e.target.value)}
                                placeholder="例: ピーマン, なす"
                                className="w-full p-2 text-sm border border-zinc-300  rounded-md bg-white  focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-[10px] text-zinc-400 mt-1">できるだけ避けます。カンマ区切りで複数入力可。</p>
                        </div>
                    </div>

                    {/* Days */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700  mb-2">
                            生成日数
                        </label>
                        <div className="flex gap-2">
                            {[1, 2, 3].map((d) => (
                                <button
                                    key={d}
                                    type="button"
                                    onClick={() => setDays(d)}
                                    className={clsx(
                                        "flex-1 py-2 rounded-md font-bold text-sm border transition-colors",
                                        days === d
                                            ? "bg-emerald-600 text-white border-emerald-600"
                                            : "bg-white  text-zinc-700  border-zinc-300  hover:bg-zinc-50 "
                                    )}
                                >
                                    {d}日分
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                            まとめ買い向け。日ごとに異なるメニューを提案します。
                        </p>
                    </div>

                    {/* Meal Count */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700  mb-2">
                            食事回数（1日あたり）
                        </label>
                        <div className="flex gap-2">
                            {[3, 4, 5, 6].map((count) => (
                                <button
                                    key={count}
                                    type="button"
                                    onClick={() => setMealCount(count)}
                                    className={clsx(
                                        "flex-1 py-2 rounded-md font-bold text-sm border transition-colors",
                                        mealCount === count
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white  text-zinc-700  border-zinc-300  hover:bg-zinc-50 "
                                    )}
                                >
                                    {count}食
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PFC Ratios */}
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-700  mb-1">
                                P (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={pRatio}
                                onKeyDown={handleIntegerKeyDown}
                                onChange={(e) => handleSanitizedChange(e, setPRatio)}
                                className="w-full p-2 border border-zinc-300  rounded-md bg-white  focus:ring-2 focus:ring-blue-500 text-center"
                                required
                            />
                            <div className="text-xs text-center text-zinc-500 mt-1">
                                {grams.p}g
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700  mb-1">
                                F (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={fRatio}
                                onKeyDown={handleIntegerKeyDown}
                                onChange={(e) => handleSanitizedChange(e, setFRatio)}
                                className="w-full p-2 border border-zinc-300  rounded-md bg-white  focus:ring-2 focus:ring-blue-500 text-center"
                                required
                            />
                            <div className="text-xs text-center text-zinc-500 mt-1">
                                {grams.f}g
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-700  mb-1">
                                C (%)
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={cRatio}
                                onKeyDown={handleIntegerKeyDown}
                                onChange={(e) => handleSanitizedChange(e, setCRatio)}
                                className="w-full p-2 border border-zinc-300  rounded-md bg-white  focus:ring-2 focus:ring-blue-500 text-center"
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
                        isInvalidTotal ? "bg-red-50 text-red-600  " : "bg-green-50 text-green-600  "
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
                        <div className="text-red-500 text-sm bg-red-50  p-3 rounded-lg border border-red-200 ">
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
            {showTdeeModal && (
                <TdeeModal
                    onApply={handleTdeeApply}
                    onClose={() => setShowTdeeModal(false)}
                />
            )}
        </>
    );
}
