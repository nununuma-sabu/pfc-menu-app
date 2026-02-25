import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// Upstash Redis レートリミット設定
//
// 制限: 1IPアドレスあたり 1分間に5回まで
// 環境変数が未設定の場合はレートリミットをスキップ（開発環境向け）
// ─────────────────────────────────────────────

let ratelimit: Ratelimit | null = null;

if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
) {
    ratelimit = new Ratelimit({
        redis: Redis.fromEnv(),
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
        prefix: "pfc:ratelimit",
    });
}

export async function middleware(request: NextRequest) {
    // レートリミット設定がない場合はスキップ（ローカル開発環境）
    if (!ratelimit) {
        return NextResponse.next();
    }

    // IPアドレスの取得（Vercel の場合 x-forwarded-for が信頼できる）
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        request.headers.get("x-real-ip") ??
        "anonymous";

    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

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

    // 残りリクエスト数をレスポンスヘッダーに付与
    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    return response;
}

// このミドルウェアを適用するパス
export const config = {
    matcher: ["/api/generate-menu"],
};
