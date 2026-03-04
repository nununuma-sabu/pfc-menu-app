"use client";

import { useState } from "react";
import { SavedMeal } from "@/types/menu";
import { deleteSavedMeal } from "@/app/actions/favorites";
import { HeartOff, Calendar, ChevronDown, ChevronUp, Trash2, Clock, CheckCircle2, Utensils, Sunrise, Sun, Moon, Coffee } from "lucide-react";
import clsx from "clsx";

interface FavoritesClientProps {
    initialMeals: SavedMeal[];
}

export default function FavoritesClient({ initialMeals }: FavoritesClientProps) {
    const [meals, setMeals] = useState<SavedMeal[]>(initialMeals);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!window.confirm("このお気に入りメニューを削除しますか？")) return;

        setIsDeleting(id);
        const res = await deleteSavedMeal(id);
        if (res.success) {
            setMeals(prev => prev.filter(m => m.id !== id));
        } else {
            alert(res.error || "削除に失敗しました");
        }
        setIsDeleting(null);
    };

    const getMealStyle = (label: string) => {
        if (label.includes("朝")) return { icon: Sunrise, color: "bg-orange-500" };
        if (label.includes("昼")) return { icon: Sun, color: "bg-yellow-500" };
        if (label.includes("夕") || label.includes("晩")) return { icon: Moon, color: "bg-indigo-500" };
        if (label.includes("間") || label.includes("補")) return { icon: Coffee, color: "bg-pink-500" };
        return { icon: Utensils, color: "bg-teal-500" };
    };

    if (meals.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                    <HeartOff className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-zinc-800 mb-2">保存された食事がありません</h2>
                <p className="text-zinc-500 max-w-md">
                    献立作成ページで「これは良さそう！」と思った食事カードがあれば、右上のハートボタンを押してここにストックしていきましょう。
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
                {meals.map((saved) => {
                    const { dayLabel, meal } = saved.menu_data;
                    const date = new Date(saved.created_at);
                    const isDeletingThis = isDeleting === saved.id;
                    const { icon: Icon, color } = getMealStyle(meal.timeLabel);

                    return (
                        <div
                            key={saved.id}
                            className="bg-white rounded-xl shadow-md overflow-hidden border border-zinc-100 hover:shadow-lg transition-all flex flex-col relative group"
                        >
                            {/* Delete Button Overlay */}
                            <button
                                onClick={() => handleDelete(saved.id)}
                                disabled={isDeletingThis}
                                title="削除する"
                                className="absolute top-3 right-3 p-2 bg-black/20 text-white rounded-full opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-500 transition-all z-10 disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>

                            <div className={`p-4 ${color} text-white flex items-center gap-2 pr-12`}>
                                <Icon className="w-5 h-5" />
                                <h3 className="font-bold text-lg">{dayLabel}: {meal.timeLabel}</h3>
                            </div>

                            <div className="p-4 flex-1 flex flex-col">
                                <div className="mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-xl text-zinc-900 leading-tight pr-2">{meal.name}</h4>
                                    </div>
                                    <p className="text-sm text-zinc-600 leading-relaxed">{meal.description}</p>
                                </div>

                                <div className="mt-auto space-y-4">
                                    <div className="bg-zinc-50 p-3 rounded-lg grid grid-cols-4 gap-2 text-center text-sm">
                                        <div>
                                            <div className="text-zinc-500 text-xs">Cal</div>
                                            <div className="font-bold text-zinc-800">{meal.calories}</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500 text-xs">P</div>
                                            <div className="font-bold text-zinc-800">{meal.p}g</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500 text-xs">F</div>
                                            <div className="font-bold text-zinc-800">{meal.f}g</div>
                                        </div>
                                        <div>
                                            <div className="text-zinc-500 text-xs">C</div>
                                            <div className="font-bold text-zinc-800">{meal.c}g</div>
                                        </div>
                                    </div>

                                    {(meal.ingredients || meal.steps) && (
                                        <div className="pt-2 space-y-2 border-t border-zinc-50">
                                            {meal.ingredients && meal.ingredients.length > 0 && (
                                                <div className="text-sm">
                                                    <h5 className="font-bold text-zinc-700 mb-1 flex items-center gap-1"><Utensils className="w-4 h-4" /> 材料</h5>
                                                    <ul className="list-disc list-inside text-zinc-600 pl-1 space-y-0.5 text-xs">
                                                        {meal.ingredients.map((ing, i) => (
                                                            <li key={i}>{ing.name} <span className="text-zinc-400">({ing.amount})</span></li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-3 border-t border-zinc-50 text-xs text-zinc-400 flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {date.toLocaleDateString("ja-JP", { year: 'numeric', month: 'long', day: 'numeric' })} 保存
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 pt-8 mt-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>全 {meals.length} 件の保存された食事</span>
            </div>
        </div>
    );
}
