"use client";

import { useState } from "react";
import InputForm from "@/components/InputForm";
import MenuDisplay from "@/components/MenuDisplay";
import NutritionTip from "@/components/NutritionTip";
import DisclaimerScreen from "@/components/DisclaimerScreen";
import { Sparkles } from "lucide-react";

import { MenuData, GenerateMenuRequest } from "@/types/menu";

export default function Home() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateMenu = async (data: GenerateMenuRequest) => {
    setMenu(null);
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

      const result = await res.json();
      setMenu(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "メニューの生成に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  if (showDisclaimer) {
    return <DisclaimerScreen onComplete={() => setShowDisclaimer(false)} />;
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

        {loading && <NutritionTip />}

        {error && (
          <div className="bg-red-50  text-red-600  px-4 py-3 rounded-lg border border-red-200 ">
            {error}
          </div>
        )}

        <MenuDisplay menu={menu} />
      </div>
    </main>
  );
}
