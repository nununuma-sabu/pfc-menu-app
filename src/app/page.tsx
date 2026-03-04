"use client";

import { useState, useEffect } from "react";
import InputForm from "@/components/InputForm";
import MenuDisplay from "@/components/MenuDisplay";
import DisclaimerScreen from "@/components/DisclaimerScreen";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { MenuData, GenerateMenuRequest, Nutrition } from "@/types/menu";

export default function Home() {
  const [showDisclaimer, setShowDisclaimer] = useState<boolean | null>(null);
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 設定値（1日あたり）をPfcComparisonChartに渡すために保持
  const [dailyTarget, setDailyTarget] = useState<Nutrition | null>(null);

  useEffect(() => {
    const checkUserAndDisclaimer = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // ログインしている場合、セッションストレージを確認
        const hasSeenDisclaimer = sessionStorage.getItem("disclaimerShown");
        if (!hasSeenDisclaimer) {
          setShowDisclaimer(true);
        } else {
          setShowDisclaimer(false);
        }
      } else {
        // 未ログイン時は表示しない
        setShowDisclaimer(false);
      }
    };

    checkUserAndDisclaimer();
  }, []);

  const handleDisclaimerComplete = () => {
    sessionStorage.setItem("disclaimerShown", "true");
    setShowDisclaimer(false);
  };

  const handleGenerateMenu = async (data: GenerateMenuRequest) => {
    setMenu(null);
    setDailyTarget(null);
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate menu");
      }

      const result: MenuData = await res.json();
      setMenu(result);

      // フォームの calories/p/f/c はすでに1日あたりの値
      setDailyTarget({
        calories: data.calories,
        p: data.p,
        f: data.f,
        c: data.c,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "メニューの生成に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  if (showDisclaimer === null) {
    // 判定中は何も表示しない（チラつき防止）
    return <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-8 font-sans" />;
  }

  if (showDisclaimer) {
    return <DisclaimerScreen onComplete={handleDisclaimerComplete} />;
  }

  return (
    <main className="min-h-screen bg-slate-50  py-12 px-4 sm:px-8 font-sans">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-blue-100  text-blue-700  px-4 py-1.5 rounded-full text-sm font-medium">
            <Sparkles className="w-4 h-4" />
            AI Powered
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-zinc-900  tracking-tight">
            PFC Balancer
          </h1>
          <p className="text-lg text-zinc-600  max-w-lg">
            あなたの目標に合わせて、最適な献立をAIがまとめて提案します。
          </p>
        </div>

        <InputForm onSubmit={handleGenerateMenu} isLoading={loading} />

        {error && (
          <div className="bg-red-50  text-red-600  px-4 py-3 rounded-lg border border-red-200 ">
            {error}
          </div>
        )}

        <MenuDisplay menu={menu} dailyTarget={dailyTarget} />
      </div>
    </main>
  );
}
