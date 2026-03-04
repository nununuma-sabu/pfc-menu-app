"use client";

import { useState } from "react";
import { Utensils, Moon, Sun, Sunrise, Coffee, ShoppingCart, Calendar, ChevronDown, Heart, Sparkles } from "lucide-react";
import clsx from "clsx";

import { saveMenu } from "@/app/actions/favorites";

import { Meal, MenuData, ShoppingListItem, Nutrition } from "../types/menu";
import PfcComparisonChart from "./PfcComparisonChart";

interface MenuDisplayProps {
    menu: MenuData | null;
    /** 1日あたりの目標栄養価（page.tsxから渡される） */
    dailyTarget?: Nutrition | null;
}

function MealCard({ meal }: { meal: Meal }) {
    const getMealStyle = (label: string) => {
        if (label.includes("朝")) return { icon: Sunrise, color: "bg-orange-500" };
        if (label.includes("昼")) return { icon: Sun, color: "bg-yellow-500" };
        if (label.includes("夕") || label.includes("晩")) return { icon: Moon, color: "bg-indigo-500" };
        if (label.includes("間") || label.includes("補")) return { icon: Coffee, color: "bg-pink-500" };
        return { icon: Utensils, color: "bg-teal-500" };
    };

    const { icon: Icon, color } = getMealStyle(meal.timeLabel);

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-zinc-100 hover:shadow-lg transition-shadow flex flex-col">
            <div className={`p-4 ${color} text-white flex items-center gap-2`}>
                <Icon className="w-5 h-5" />
                <h3 className="font-bold text-lg">{meal.timeLabel}</h3>
            </div>
            <div className="p-4 flex-1 flex flex-col">
                <div className="mb-4">
                    <h4 className="font-bold text-xl text-zinc-900  mb-2">{meal.name}</h4>
                    <p className="text-sm text-zinc-600  leading-relaxed">{meal.description}</p>
                </div>

                <div className="mt-auto space-y-4">
                    <div className="bg-zinc-50  p-3 rounded-lg grid grid-cols-4 gap-2 text-center text-sm">
                        <div>
                            <div className="text-zinc-500 text-xs">Cal</div>
                            <div className="font-bold text-zinc-800 ">{meal.calories}</div>
                        </div>
                        <div>
                            <div className="text-zinc-500 text-xs">P</div>
                            <div className="font-bold text-zinc-800 ">{meal.p}g</div>
                        </div>
                        <div>
                            <div className="text-zinc-500 text-xs">F</div>
                            <div className="font-bold text-zinc-800 ">{meal.f}g</div>
                        </div>
                        <div>
                            <div className="text-zinc-500 text-xs">C</div>
                            <div className="font-bold text-zinc-800 ">{meal.c}g</div>
                        </div>
                    </div>

                    {/* Recipe Details (Accordion) */}
                    {(meal.ingredients || meal.steps) && (
                        <div className="pt-2 space-y-2 border-t border-zinc-50">
                            {meal.ingredients && meal.ingredients.length > 0 && (
                                <AnimatedAccordion title={<span className="flex items-center gap-1"><Utensils className="w-4 h-4" /> 材料</span>}>
                                    <ul className="list-disc list-inside text-zinc-600 pl-3 pt-2 pb-2 space-y-1 text-xs">
                                        {meal.ingredients.map((ing, i) => (
                                            <li key={i}>{ing.name} <span className="text-zinc-400">({ing.amount})</span></li>
                                        ))}
                                    </ul>
                                </AnimatedAccordion>
                            )}
                            {meal.steps && meal.steps.length > 0 && (
                                <AnimatedAccordion title={<span>調理手順</span>}>
                                    <ol className="list-decimal list-inside text-zinc-600 pl-3 pt-2 pb-2 space-y-1.5 text-xs">
                                        {meal.steps.map((step, i) => (
                                            <li key={i}>{step}</li>
                                        ))}
                                    </ol>
                                </AnimatedAccordion>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} function TotalBar({ total, label }: { total: Nutrition; label: string }) {
    return (
        <div className="bg-zinc-100  p-4 rounded-xl flex flex-wrap justify-between items-center gap-4">
            <h3 className="font-bold text-zinc-700  flex items-center gap-2">
                <Utensils className="w-5 h-5" />
                {label}
            </h3>
            <div className="flex gap-6 text-sm md:text-base">
                <div><span className="text-zinc-500 mr-1">Cal:</span><span className="font-bold">{total.calories}</span></div>
                <div><span className="text-zinc-500 mr-1">P:</span><span className="font-bold">{total.p}g</span></div>
                <div><span className="text-zinc-500 mr-1">F:</span><span className="font-bold">{total.f}g</span></div>
                <div><span className="text-zinc-500 mr-1">C:</span><span className="font-bold">{total.c}g</span></div>
            </div>
        </div>
    );
}

function AnimatedAccordion({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between cursor-pointer text-sm font-bold text-zinc-700 hover:text-indigo-600 transition-colors bg-zinc-50 p-2 rounded-md"
            >
                {title}
                <span className={clsx("transition-transform duration-300", isOpen ? "rotate-180" : "rotate-0")}>
                    <ChevronDown className="w-4 h-4" />
                </span>
            </button>
            <div
                className={clsx(
                    "grid transition-all duration-300 ease-in-out",
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
            >
                <div className="overflow-hidden">
                    {children}
                </div>
            </div>
        </div>
    );
}

const CATEGORY_ORDER = ["肉魚", "野菜", "乳製品卵", "主食", "乾物調味料", "その他"];

function groupByCategory(list: ShoppingListItem[]) {
    const groups: Record<string, { name: string; amount: string }[]> = {};
    for (const item of list) {
        const cat = item.category || "その他";
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push({ name: item.name, amount: item.amount });
    }
    // Sort by predefined order
    const sorted: [string, { name: string; amount: string }[]][] = [];
    for (const cat of CATEGORY_ORDER) {
        if (groups[cat]) {
            sorted.push([cat, groups[cat]]);
            delete groups[cat];
        }
    }
    // Remaining categories
    for (const [cat, items] of Object.entries(groups)) {
        sorted.push([cat, items]);
    }
    return sorted;
}

export default function MenuDisplay({ menu, dailyTarget }: MenuDisplayProps) {
    const [activeDay, setActiveDay] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    if (!menu || !menu.days || menu.days.length === 0) return null;

    const isMultiDay = menu.days.length > 1;
    const currentDay = menu.days[activeDay];

    const handleSaveMenu = async () => {
        setIsSaving(true);
        setSaveError(null);
        try {
            const res = await saveMenu(menu);
            if (res.success) {
                setSaveSuccess(true);
            } else {
                setSaveError(res.error || "保存に失敗しました。ログインしているか確認してください。");
            }
        } catch (error) {
            setSaveError("保存中にエラーが発生しました。");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="w-full max-w-5xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <h2 className="text-2xl font-bold text-zinc-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    AIが提案する献立
                </h2>
                <button
                    onClick={handleSaveMenu}
                    disabled={isSaving || saveSuccess}
                    className={clsx(
                        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all",
                        saveSuccess
                            ? "bg-pink-50 text-pink-600 border border-pink-200 shadow-inner cursor-default"
                            : "bg-white text-zinc-700 border border-zinc-200 hover:border-pink-300 hover:text-pink-500 hover:shadow-md hover:-translate-y-0.5"
                    )}
                >
                    <Heart className={clsx("w-4 h-4 transition-transform", saveSuccess ? "fill-pink-500 scale-110" : "scale-100 group-hover:scale-110")} />
                    {isSaving ? "保存中..." : saveSuccess ? "お気に入りに保存しました" : "お気に入りに保存"}
                </button>
            </div>

            {saveError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                    <span className="font-bold">エラー:</span> {saveError}
                </div>
            )}

            {/* Day Tabs */}
            {isMultiDay && (
                <div className="flex gap-2">
                    {menu.days.map((day, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveDay(index)}
                            className={clsx(
                                "flex-1 py-3 px-4 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2",
                                activeDay === index
                                    ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/20"
                                    : "bg-white  text-zinc-600  border-zinc-200  hover:border-emerald-300 "
                            )}
                        >
                            <Calendar className="w-4 h-4" />
                            {day.dayLabel}
                        </button>
                    ))}
                </div>
            )}

            {/* Meals for selected day */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {currentDay.meals && currentDay.meals.map((meal, index) => (
                    <MealCard key={`${activeDay}-${index}`} meal={meal} />
                ))}
            </div>

            {/* Day Total */}
            <TotalBar total={currentDay.total} label={isMultiDay ? `${currentDay.dayLabel} 合計栄養価` : "合計栄養価"} />

            {/* 1日ごとの比較チャート */}
            {dailyTarget && (
                <PfcComparisonChart
                    target={dailyTarget}
                    actual={currentDay.total}
                    label={isMultiDay ? `${currentDay.dayLabel} 達成度` : "栄養バランス達成度"}
                />
            )}

            {/* Grand Total (multi-day only) */}
            {isMultiDay && menu.grandTotal && (
                <>
                    <TotalBar total={menu.grandTotal} label={`${menu.days.length}日分 総合計`} />
                    {/* 全日分の比較チャート（目標 × 日数 vs 提案合計） */}
                    {dailyTarget && (() => {
                        const totalTarget: Nutrition = {
                            calories: dailyTarget.calories * menu.days.length,
                            p: dailyTarget.p * menu.days.length,
                            f: dailyTarget.f * menu.days.length,
                            c: dailyTarget.c * menu.days.length,
                        };
                        return (
                            <PfcComparisonChart
                                target={totalTarget}
                                actual={menu.grandTotal}
                                label={`${menu.days.length}日分 総合計 達成度`}
                            />
                        );
                    })()}
                </>
            )}

            {/* Shopping List */}
            {menu.shoppingList && menu.shoppingList.length > 0 && (
                <div className="bg-white  p-6 rounded-xl shadow-md border border-zinc-100 ">
                    <h3 className="font-bold text-xl text-zinc-800  mb-4 flex items-center gap-2">
                        <span className="bg-indigo-100  text-indigo-600  p-2 rounded-lg">
                            <ShoppingCart className="w-5 h-5" />
                        </span>
                        買い物リスト {isMultiDay && <span className="text-sm font-normal text-zinc-500">（{menu.days.length}日分統合）</span>}
                    </h3>
                    {groupByCategory(menu.shoppingList).map(([category, items]) => (
                        <div key={category} className="mb-4">
                            <h4 className="text-sm font-bold text-zinc-600  mb-2 border-b border-zinc-200  pb-1">
                                {category}
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {items.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 rounded-lg hover:bg-zinc-50  transition-colors">
                                        <input type="checkbox" className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500" />
                                        <span className="text-sm text-zinc-700 ">
                                            {item.name} <span className="text-zinc-400 text-xs">({item.amount})</span>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {/* 注意書き */}
            <p className="text-xs text-zinc-400 text-center pt-2">
                ※ AIの提案したレシピには栄養価の誤差が生じる可能性があります。ご承知おきください。
            </p>
        </div>
    );
}
