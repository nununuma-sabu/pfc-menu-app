import { NextResponse } from "next/server";
import { z } from "zod";
import { generateMenuRequestSchema } from "./validation";
import { generateMenuStream } from "@/services/geminiService";
import { createClient } from "@/lib/supabase/server";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Vercel Serverless Function のタイムアウト延長
// Hobby: 最大60秒, Pro: 最大300秒
export const maxDuration = 60;

// ─────────────────────────────────────────────
// Upstash Redis レートリミット設定
// ─────────────────────────────────────────────
function getRatelimit(): Ratelimit | null {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return null;
  }
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, "1 m"),
    analytics: true,
    prefix: "pfc:ratelimit",
  });
}

// ─────────────────────────────────────────────
// NDJSON ストリーミング用ヘルパー型
// ─────────────────────────────────────────────
type StreamEvent =
  | { type: "progress"; bytes: number }
  | { type: "done"; data: unknown }
  | { type: "error"; message: string };

export async function POST(request: Request) {
  // ─── 事前バリデーション (ストリーム開始前に完了) ───
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "認証されていません。" }, { status: 401 });
  }

  // --- レートリミット (ユーザー単位) ---
  // Upstash Redis が利用不可の場合でもAPI処理は続行する
  const rl = getRatelimit();
  if (rl) {
    try {
      const { success, limit, reset } = await rl.limit(user.id);
      if (!success) {
        const retryAfterSec = Math.ceil((reset - Date.now()) / 1000);
        return NextResponse.json(
          {
            error: `リクエストが多すぎます。約${retryAfterSec}秒後に再度お試しください。`,
          },
          {
            status: 429,
            headers: {
              "X-RateLimit-Limit": limit.toString(),
              "X-RateLimit-Remaining": "0",
              "Retry-After": retryAfterSec.toString(),
            },
          }
        );
      }
    } catch (rlError) {
      console.warn("Rate limiter unavailable, skipping:", rlError instanceof Error ? rlError.message : rlError);
    }
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      { error: "リクエストボディの解析に失敗しました。" },
      { status: 400 }
    );
  }

  const parseResult = generateMenuRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "入力データが不正です。", details: z.flattenError(parseResult.error) },
      { status: 400 }
    );
  }

  const validatedData = parseResult.data;
  const userId = user.id;

  // ─── NDJSON ストリーミングレスポンス ───
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      /** NDJSON 形式で1行送信 */
      const sendEvent = (event: StreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        const menuData = await generateMenuStream(
          validatedData,
          userId,
          (receivedBytes: number) => {
            // チャンク受信ごとにプログレスイベントを送信
            sendEvent({ type: "progress", bytes: receivedBytes });
          }
        );

        // 後処理済みの最終結果を送信
        sendEvent({ type: "done", data: menuData });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "メニューの生成に失敗しました。";
        console.error("Gemini API Error:", error);
        sendEvent({ type: "error", message: errorMessage });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}
