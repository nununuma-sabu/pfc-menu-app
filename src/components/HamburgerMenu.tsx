"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";

export default function HamburgerMenu() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-1 text-gray-600 dark:text-gray-300 hover:text-indigo-600 transition-colors"
                aria-label="メニューを開く"
            >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* オーバーレイ */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* サイドメニュー */}
            <div
                className={`fixed top-0 right-0 h-full w-64 bg-white dark:bg-gray-900 border-l border-zinc-200 dark:border-zinc-800 z-[70] transform transition-transform duration-300 ease-in-out shadow-2xl ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                <div className="p-4 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="font-bold text-lg text-zinc-800 dark:text-zinc-200">メニュー</h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 text-zinc-500 hover:text-red-500 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        aria-label="メニューを閉じる"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="p-4">
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 px-2">
                        ※ メニュー内容は未定です
                    </p>
                    <ul className="space-y-1">
                        {/* 将来的にここに追加していく */}
                        <li>
                            <Link 
                                href="#" 
                                onClick={(e) => {
                                    e.preventDefault();
                                    // setIsOpen(false);
                                }}
                                className="block px-4 py-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                            >
                                メニュー項目 1 (予定)
                            </Link>
                        </li>
                        <li>
                            <Link 
                                href="#" 
                                onClick={(e) => {
                                    e.preventDefault();
                                }}
                                className="block px-4 py-3 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-zinc-700 dark:text-zinc-300 font-medium transition-colors"
                            >
                                メニュー項目 2 (予定)
                            </Link>
                        </li>
                    </ul>
                </div>
            </div>
        </>
    );
}
