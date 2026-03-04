"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import LogoutButton from "./LogoutButton";
import FavoritesModal from "./FavoritesModal";

export default function HeaderClientActions({ email }: { email: string | undefined }) {
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={() => setIsFavoritesOpen(true)}
                className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 hover:text-indigo-600 transition-colors font-semibold"
            >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">お気に入り</span>
            </button>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-gray-600 dark:text-gray-300 hidden md:inline-block">
                {email}
            </span>
            <LogoutButton />

            <FavoritesModal
                isOpen={isFavoritesOpen}
                onClose={() => setIsFavoritesOpen(false)}
            />
        </div>
    );
}
