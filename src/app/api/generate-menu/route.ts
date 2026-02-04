import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API キーが設定されていません。.env.localを確認してください。" },
        { status: 500 }
      );
    }

    const { calories, p, f, c, mainIngredient } = await request.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    let prompt = `
      あなたはプロの管理栄養士です。
      以下の栄養目標に合わせた1日の献立（朝食、昼食、夕食）を提案してください。
    `;

    if (mainIngredient) {
      prompt += `\n      【重要】メイン食材として「${mainIngredient}」を使用してください。\n`;
    }

    prompt += `
      目標:
      - 総摂取カロリー: 約 ${calories} kcal
      - タンパク質(P): 約 ${p}g
      - 脂質(F): 約 ${f}g
      - 炭水化物(C): 約 ${c}g

      以下のJSON形式で出力してください。日本語で回答してください。
      {
        "breakfast": { "name": "料理名", "calories": 数値, "p": 数値, "f": 数値, "c": 数値, "description": "簡単な説明" },
        "lunch": { ... },
        "dinner": { ... },
        "total": { "calories": 数値, "p": 数値, "f": 数値, "c": 数値 }
      }
      合計値ができるだけ目標に近づくように調整してください。
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Clean up markdown code blocks if present
    const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
    console.log("Gemini Raw Response:", text); // Debug log

    try {
      // Extract JSON object if there is extra text
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : cleanText;

      return NextResponse.json(JSON.parse(jsonStr));
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Failed text:", cleanText);
      return NextResponse.json(
        { error: "JSON parsing failed", details: cleanText },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "メニューの生成に失敗しました。", details: error.message },
      { status: 500 }
    );
  }
}
