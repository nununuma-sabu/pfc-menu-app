"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Utensils, Sunrise, Sun, Moon, Coffee, Trash2, Clock, CheckCircle2 } from "lucide-react";
import { getSavedMeals } from "@/app/actions/favorites";
import FavoritesClient from "@/components/FavoritesClient";
import { SavedMeal } from "@/types/menu";

interface FavoritesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FavoritesModal({ isOpen, onClose }: FavoritesModalProps) {
    const [mounted, setMounted] = useState(false);
    const [meals, setMeals] = useState<SavedMeal[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // ESCキーで閉じる
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    // モーダルが開かれた時にデータを取得する
    useEffect(() => {
        if (isOpen) {
            const fetchMeals = async () => {
                setLoading(true);
                setError(null);
                const { success, data, error: fetchError } = await getSavedMeals();
                if (success && data) {
                    setMeals(data);
                } else {
                    setError(fetchError || "お気に入りデータの取得に失敗しました。");
                }
                setLoading(false);
            };
            fetchMeals();
        }
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-slate-50 w-full max-w-5xl max-h-full rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-200 bg-white">
                    <div>
                        <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">お気に入り</h2>
                        <p className="text-zinc-500 text-sm mt-1">保存した食事の一覧です</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors"
                        aria-label="閉じる"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                            <p className="text-zinc-500 font-medium tracking-wide">読み込み中...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center justify-center">
                            エラーが発生しました: {error}
                        </div>
                    ) : (
                        <FavoritesClient initialMeals={meals} />
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
