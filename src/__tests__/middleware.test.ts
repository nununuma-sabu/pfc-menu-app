import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware, config } from "@/middleware";

// モック化
vi.mock("@/lib/supabase/middleware", () => ({
    updateSession: vi.fn(async (req) => {
        return NextResponse.next({ request: req });
    }),
}));

import { updateSession } from "@/lib/supabase/middleware";

describe("middleware (認証セッション更新)", () => {
    it("updateSession がページリクエストで呼ばれる", async () => {
        const req = new NextRequest("http://localhost/");
        const res = await middleware(req);

        expect(updateSession).toHaveBeenCalledWith(req);
        expect(res).toBeInstanceOf(NextResponse);
    });

    it("config.matcher に静的ファイルとAPIルートの除外正規表現が含まれる", () => {
        expect(config.matcher[0]).toContain("!_next/static");
        expect(config.matcher[0]).toContain("api/.*");
    });
});
