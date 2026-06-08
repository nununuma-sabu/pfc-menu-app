"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import LogoutButton from "./LogoutButton";
import FavoritesModal from "./FavoritesModal";
import HamburgerMenu from "./HamburgerMenu";

export default function HeaderClientActions({ email }: { email: string | undefined }) {
    const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);

    return (
        <div className="flex items-center gap-4">
            <button
                onClick={() => setIsFavoritesOpen(true)}
                className="flex items-center gap-1.5 transition-colors font-semibold hover:opacity-80"
                style={{ color: "var(--md-on-surface-variant)" }}
            >
                <Heart className="w-4 h-4" />
                <span className="hidden sm:inline">お気に入り</span>
            </button>
            <span className="text-gray-300">|</span>
            <span className="hidden md:inline-block" style={{ color: "var(--md-on-surface-variant)" }}>
                {email}
            </span>
            <LogoutButton />

            <FavoritesModal
                isOpen={isFavoritesOpen}
                onClose={() => setIsFavoritesOpen(false)}
            />

            <span className="text-gray-300">|</span>
            <HamburgerMenu />
        </div>
    );
}
