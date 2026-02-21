"use client";

import { useState, useEffect } from "react";

interface DisclaimerScreenProps {
    onComplete: () => void;
}

export default function DisclaimerScreen({ onComplete }: DisclaimerScreenProps) {
    const [phase, setPhase] = useState<"fadeIn" | "visible" | "fadeOut">("fadeIn");

    useEffect(() => {
        // フェードイン完了後 → visible
        const fadeInTimer = setTimeout(() => {
            setPhase("visible");
        }, 1000);

        // 表示維持後 → fadeOut
        const visibleTimer = setTimeout(() => {
            setPhase("fadeOut");
        }, 5000);

        // フェードアウト完了後 → onComplete
        const fadeOutTimer = setTimeout(() => {
            onComplete();
        }, 6200);

        return () => {
            clearTimeout(fadeInTimer);
            clearTimeout(visibleTimer);
            clearTimeout(fadeOutTimer);
        };
    }, [onComplete]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black px-6 cursor-pointer"
            style={{
                opacity: phase === "fadeIn" ? 0 : phase === "fadeOut" ? 0 : 1,
                transition: "opacity 1s ease-in-out",
            }}
            onClick={onComplete}
        >
            <div className="max-w-2xl text-center space-y-8">
                <h2
                    className="text-xl md:text-2xl font-bold tracking-widest"
                    style={{ color: "#c8a45a" }}
                >
                    【ご注意】
                </h2>
                <div className="space-y-6 text-sm md:text-base leading-relaxed text-zinc-300">
                    <p>
                        ボディメイクおよびダイエットは、
                        <br className="hidden sm:inline" />
                        適切な栄養管理のみで達成されるものではありません。
                    </p>
                    <p>
                        理想の身体を維持するためには、
                        <br className="hidden sm:inline" />
                        適度な運動習慣をはじめとする不断の努力が必要不可欠です。
                    </p>
                    <p>
                        本アプリをご利用の際は、
                        <br className="hidden sm:inline" />
                        日々の積み重ねが重要であることを念頭に置き、
                        <br className="hidden sm:inline" />
                        健康的なライフスタイルを心がけてください。
                    </p>
                </div>
            </div>
            <span className="absolute bottom-8 text-xs text-zinc-600 tracking-wide animate-pulse">
                画面をタップしてスキップ
            </span>
        </div>
    );
}
