import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

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
        limiter: Ratelimit.slidingWindow(5, "1 m"),
        analytics: true,
        prefix: "pfc:ratelimit",
    });
}

export async function middleware(request: NextRequest) {
    // 1. Supabaseのセッションを更新 (全リクエストで実行)
    const res = await updateSession(request);

    // 2. "/api/generate-menu" へのリクエストのみレートリミットを適用
    if (request.nextUrl.pathname.startsWith("/api/generate-menu")) {
        const rl = getRatelimit();
        if (!rl) {
            return res;
        }

        const ip =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
            request.headers.get("x-real-ip") ??
            "anonymous";

        const { success, limit, remaining, reset } = await rl.limit(ip);

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

        res.headers.set("X-RateLimit-Limit", limit.toString());
        res.headers.set("X-RateLimit-Remaining", remaining.toString());
    }

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
