"use client";

import { useState } from "react";
import { SavedMenu } from "@/types/menu";
import { deleteSavedMenu } from "@/app/actions/favorites";
import { HeartOff, Calendar, ChevronDown, ChevronUp, Trash2, Clock, CheckCircle2 } from "lucide-react";
import MenuDisplay from "@/components/MenuDisplay";
import clsx from "clsx";

interface FavoritesClientProps {
    initialMenus: SavedMenu[];
}

export default function FavoritesClient({ initialMenus }: FavoritesClientProps) {
    const [menus, setMenus] = useState<SavedMenu[]>(initialMenus);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const toggleExpand = (id: string) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("このお気に入りメニューを削除しますか？")) return;

        setIsDeleting(id);
        const res = await deleteSavedMenu(id);
        if (res.success) {
            setMenus(prev => prev.filter(m => m.id !== id));
        } else {
            alert(res.error || "削除に失敗しました");
        }
        setIsDeleting(null);
    };

    if (menus.length === 0) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                    <HeartOff className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-zinc-800 mb-2">保存されたメニューがありません</h2>
                <p className="text-zinc-500 max-w-md">
                    献立作成ページで「これは良さそう！」と思ったメニューがあれば、「お気に入りに保存」ボタンを押してここにストックしていきましょう。
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {menus.map((saved) => {
                const isExpanded = expandedId === saved.id;
                const menu = saved.menu_data;
                const date = new Date(saved.created_at);
                const isDeletingThis = isDeleting === saved.id;

                return (
                    <div
                        key={saved.id}
                        className={clsx(
                            "bg-white rounded-2xl shadow-sm border transition-shadow overflow-hidden",
                            isExpanded ? "border-indigo-200 shadow-md ring-1 ring-indigo-50" : "border-zinc-200 hover:shadow-md"
                        )}
                    >
                        {/* Summary Header */}
                        <div
                            className="p-4 sm:p-6 cursor-pointer flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
                            onClick={() => toggleExpand(saved.id)}
                        >
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
                                        <Calendar className="w-3.5 h-3.5" />
                                        {menu.days.length}日分プラン
                                    </span>
                                    <span className="text-xs text-zinc-500 font-medium flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        {date.toLocaleDateString("ja-JP", { year: 'numeric', month: 'long', day: 'numeric' })} 保存
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-sm max-w-md">
                                    <div className="bg-zinc-50 rounded px-2 py-1">
                                        <span className="text-zinc-400 text-xs mr-1">Cal</span>
                                        <span className="font-bold text-zinc-700">{menu.grandTotal.calories}</span>
                                    </div>
                                    <div className="bg-zinc-50 rounded px-2 py-1">
                                        <span className="text-zinc-400 text-xs mr-1">P</span>
                                        <span className="font-bold text-zinc-700">{menu.grandTotal.p}g</span>
                                    </div>
                                    <div className="bg-zinc-50 rounded px-2 py-1">
                                        <span className="text-zinc-400 text-xs mr-1">F</span>
                                        <span className="font-bold text-zinc-700">{menu.grandTotal.f}g</span>
                                    </div>
                                    <div className="bg-zinc-50 rounded px-2 py-1">
                                        <span className="text-zinc-400 text-xs mr-1">C</span>
                                        <span className="font-bold text-zinc-700">{menu.grandTotal.c}g</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(saved.id); }}
                                    disabled={isDeletingThis}
                                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100 disabled:opacity-50"
                                    aria-label="削除"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <div className="p-2 bg-zinc-50 rounded-lg text-zinc-400">
                                    {isExpanded ? <ChevronUp className="w-5 h-5 text-indigo-500" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isExpanded && (
                            <div className="border-t border-zinc-100 bg-zinc-50/50 p-4 sm:p-6 animate-in slide-in-from-top-2 fade-in duration-200">
                                <MenuDisplay menu={menu} />
                            </div>
                        )}
                    </div>
                );
            })}

            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 pt-8">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>全 {menus.length} 件のお気に入りメニュー</span>
            </div>
        </div>
    );
}
