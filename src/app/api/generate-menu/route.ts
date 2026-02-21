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

    const { calories, p, f, c, mainIngredient, mealCount = 3, days = 3 } = await request.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    let prompt = `${days}日分の献立(各日${mealCount}食)を提案。`;

    if (mainIngredient) {
      prompt += `メイン食材:「${mainIngredient}」を活用。`;
    }

    prompt += `
目標(1日あたり): ${calories}kcal, P${p}g, F${f}g, C${c}g

条件:
- 日ごとにジャンル(和/洋/中/エスニック等)と主タンパク源(鶏/魚/豚/牛/豆腐等)を変えて飽き防止
- スーパーで手に入りやすい食材のみ使用
- 共通食材は複数日で使い回し、食材ロスを最小化
- 買い物リストは${days}日分を統合し重複合算

以下のJSON形式で出力(キーは短縮名を使用):
{"days":[{"dl":"1日目","meals":[{"n":"料理名","t":"朝食","cal":数値,"p":数値,"f":数値,"c":数値,"d":"一行説明","ing":[{"n":"材料名","a":"分量"}],"st":["手順(簡潔に)"]}],"total":{"cal":数値,"p":数値,"f":数値,"c":数値}}],"sl":[{"n":"材料名","a":"合計分量","cat":"肉魚/野菜/乾物調味料/乳製品卵/主食"}],"gt":{"cal":数値,"p":数値,"f":数値,"c":数値}}

各日meals配列は${mealCount}要素。${mealCount === 3 ? "朝食・昼食・夕食" : "朝食・昼食・夕食・間食等"}で配分。手順は1文で簡潔に。各日totalと全体gtは目標に近づける。`;

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
      const parsed = JSON.parse(jsonStr);

      // Expand shortened keys to full keys for frontend consumption
      const expanded = expandKeys(parsed);

      return NextResponse.json(expanded);
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

/**
 * Expand shortened JSON keys from Gemini response to full keys for frontend.
 * Handles both multi-day (days array) and legacy single-day (meals array) formats.
 */
function expandKeys(data: any): any {
  // Multi-day format
  if (data.days) {
    return {
      days: data.days.map((day: any) => ({
        dayLabel: day.dl || day.dayLabel || "",
        meals: expandMeals(day.meals || []),
        total: expandTotal(day.total || {}),
      })),
      shoppingList: expandShoppingList(data.sl || data.shoppingList || []),
      grandTotal: expandTotal(data.gt || data.grandTotal || {}),
    };
  }

  // Legacy single-day format (backward compatibility)
  if (data.meals) {
    return {
      days: [{
        dayLabel: "1日目",
        meals: expandMeals(data.meals),
        total: expandTotal(data.total || {}),
      }],
      shoppingList: expandShoppingList(data.shoppingList || []),
      grandTotal: expandTotal(data.total || {}),
    };
  }

  return data;
}

function expandMeals(meals: any[]): any[] {
  return meals.map((m: any) => ({
    name: m.n || m.name || "",
    timeLabel: m.t || m.timeLabel || "",
    calories: m.cal || m.calories || 0,
    p: m.p || 0,
    f: m.f || 0,
    c: m.c || 0,
    description: m.d || m.description || "",
    ingredients: (m.ing || m.ingredients || []).map((i: any) => ({
      name: i.n || i.name || "",
      amount: i.a || i.amount || "",
    })),
    steps: m.st || m.steps || [],
  }));
}

function expandTotal(t: any): any {
  return {
    calories: t.cal || t.calories || 0,
    p: t.p || 0,
    f: t.f || 0,
    c: t.c || 0,
  };
}

function expandShoppingList(list: any[]): any[] {
  return list.map((item: any) => ({
    name: item.n || item.name || "",
    amount: item.a || item.amount || "",
    category: item.cat || item.category || "その他",
  }));
}
