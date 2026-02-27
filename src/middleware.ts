import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// ─────────────────────────────────────────────
// Upstash Redis レートリミット設定
// ─────────────────────────────────────────────

export async function middleware(request: NextRequest) {
    // 1. Supabaseのセッションを更新 (全リクエストで実行)
    const res = await updateSession(request);

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api/.* (API routes)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|api/.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
