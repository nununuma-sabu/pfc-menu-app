"use client";

import { useState, useEffect } from "react";
import InputForm from "@/components/InputForm";
import MenuDisplay from "@/components/MenuDisplay";
import DisclaimerScreen from "@/components/DisclaimerScreen";
import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";

import { MenuData, GenerateMenuRequest, Nutrition } from "@/types/menu";
import IngredientSearch from "@/components/ingredients/IngredientSearch";

export default function Home() {
  const [showDisclaimer, setShowDisclaimer] = useState<boolean | null>(null);
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 設定値（1日あたり）をPfcComparisonChartに渡すために保持
  const [dailyTarget, setDailyTarget] = useState<Nutrition | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient();

    const checkDisclaimer = async (user: User | null) => {
      if (!mounted) return;
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

    // 初期チェック
    supabase.auth.getUser().then(({ data: { user } }) => {
      checkDisclaimer(user);
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        checkDisclaimer(session?.user ?? null);
      } else if (event === "SIGNED_OUT") {
        checkDisclaimer(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleDisclaimerComplete = () => {
    sessionStorage.setItem("disclaimerShown", "true");
    setShowDisclaimer(false);
  };

  // ストリーミング進捗表示用 (受信バイト数)
  const [streamProgress, setStreamProgress] = useState<number | null>(null);

  const handleGenerateMenu = async (data: GenerateMenuRequest) => {
    setMenu(null);
    setDailyTarget(null);
    setLoading(true);
    setError(null);
    setStreamProgress(null);

    try {
      const res = await fetch("/api/generate-menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      // バリデーション / 認証 / レートリミット等のエラーは
      // ストリーム開始前に通常の JSON で返される
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate menu");
      }

      // NDJSON ストリームの読み取り
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // 改行区切りで行を処理
        const lines = buffer.split("\n");
        // 最後の要素は不完全な可能性があるため保持
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const event = JSON.parse(trimmed);

            if (event.type === "progress") {
              setStreamProgress(event.bytes);
            } else if (event.type === "done") {
              const result: MenuData = event.data;
              setMenu(result);
              setDailyTarget({
                calories: data.calories,
                p: data.p,
                f: data.f,
                c: data.c,
              });
            } else if (event.type === "error") {
              throw new Error(event.message);
            }
          } catch (parseError) {
            // JSON パースエラー → エラーイベントかもしれないので再throw
            if (parseError instanceof Error && parseError.message !== trimmed) {
              throw parseError;
            }
          }
        }
      }

      // バッファに残ったデータを処理
      if (buffer.trim()) {
        try {
          const event = JSON.parse(buffer.trim());
          if (event.type === "done") {
            const result: MenuData = event.data;
            setMenu(result);
            setDailyTarget({
              calories: data.calories,
              p: data.p,
              f: data.f,
              c: data.c,
            });
          } else if (event.type === "error") {
            throw new Error(event.message);
          }
        } catch (parseError) {
          if (parseError instanceof Error && parseError.message !== buffer.trim()) {
            throw parseError;
          }
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "メニューの生成に失敗しました。");
    } finally {
      setLoading(false);
      setStreamProgress(null);
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

        {/* ストリーミング進捗表示 */}
        {loading && streamProgress !== null && (
          <div className="w-full max-w-md space-y-2">
            <div className="flex items-center gap-3 px-1">
              <div className="relative w-full h-2 bg-zinc-200 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-pulse"
                  style={{ width: `${Math.min(100, (streamProgress / 30000) * 100)}%` }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-500 whitespace-nowrap">
                {(streamProgress / 1024).toFixed(1)} KB
              </span>
            </div>
            <p className="text-xs text-zinc-500 text-center">
              🍳 献立データを受信中...
            </p>
          </div>
        )}

        {/* Search Feature Testing */}
        <section>
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2 mb-6">
            食材検索 (Test)
          </h2>
          <IngredientSearch />
        </section>

        {/* Records & Suggestions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-24">
          {/* Content for this grid would go here */}
        </div>

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
