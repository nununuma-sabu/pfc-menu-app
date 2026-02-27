import { NextResponse } from "next/server";
import { z } from "zod";
import { generateMenuRequestSchema } from "./validation";
import { generateMenu } from "@/services/geminiService";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "認証されていません。" }, { status: 401 });
    }

    const rawBody = await request.json();
    const parseResult = generateMenuRequestSchema.safeParse(rawBody);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: "入力データが不正です。", details: z.flattenError(parseResult.error) },
        { status: 400 }
      );
    }

    // ドメインロジック（geminiService.ts）へ委譲
    const menuData = await generateMenu(parseResult.data);

    return NextResponse.json(menuData);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "メニューの生成に失敗しました。";
    console.error("Gemini API Error:", error);

    // 429 (レート制限) の場合は専用メッセージと 429 ステータスを返す
    if (
      errorMessage.includes("サーバーが混み合っています") ||
      errorMessage.includes("429") ||
      errorMessage.includes("Too Many Requests") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("RESOURCE_EXHAUSTED")
    ) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 429 }
      );
    }

    // ガード等でのエラー (目標カロリー違反など)
    if (errorMessage.includes("固定メニューのカロリーが目標カロリー以上です")) {
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "メニューの生成に失敗しました。", details: errorMessage },
      { status: 500 }
    );
  }
}
