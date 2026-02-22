import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { Meal, DayMenu, MenuData, ShoppingListItem, Nutrition, GenerateMenuRequest, FixedMeal } from "@/types/menu";

// お気に入りレシピプリセット: プロテインスムージー
const PRESET_SMOOTHIE: Meal = {
  name: "プロテインスムージー",
  timeLabel: "固定メニュー",
  calories: 270,
  p: 26,
  f: 2,
  c: 46,
  description: "ホエイプロテイン+冷凍バナナ+ベリー+イヌリンのスムージー",
  ingredients: [
    { name: "ホエイプロテイン", amount: "30g" },
    { name: "冷凍バナナ", amount: "1本" },
    { name: "冷凍ミックスベリー", amount: "100g" },
    { name: "イヌリン", amount: "大さじ1" },
  ],
  steps: ["全材料をブレンダーに入れて撹拌する"],
};

const PRESET_SMOOTHIE_SHOPPING: ShoppingListItem[] = [
  { name: "ホエイプロテイン", amount: "30g", category: "乾物調味料" },
  { name: "冷凍バナナ", amount: "1本", category: "野菜" },
  { name: "冷凍ミックスベリー", amount: "100g", category: "野菜" },
  { name: "イヌリン", amount: "大さじ1", category: "乾物調味料" },
];

export async function POST(request: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API キーが設定されていません。.env.localを確認してください。" },
        { status: 500 }
      );
    }

    const {
      calories, p, f, c, mainIngredient,
      allergies = "", dislikedFoods = "", avoidFoods = "",
      mealCount = 3, days = 3, fixedMeals = []
    }: GenerateMenuRequest = await request.json();

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    // 固定メニューの栄養価を計算
    let fixedP = 0, fixedF = 0, fixedC = 0, fixedCal = 0;
    fixedMeals.forEach(fm => {
      // 現在はスムージーのみを想定
      if (fm.recipeId === "protein-smoothie") {
        fixedP += PRESET_SMOOTHIE.p;
        fixedF += PRESET_SMOOTHIE.f;
        fixedC += PRESET_SMOOTHIE.c;
        fixedCal += PRESET_SMOOTHIE.calories;
      }
    });

    const targetCal = Math.max(0, calories - fixedCal);
    const targetP = Math.max(0, p - fixedP);
    const targetF = Math.max(0, f - fixedF);
    const targetC = Math.max(0, c - fixedC);

    // AIが生成する食事の数
    const aiGeneratedMealCount = mealCount - fixedMeals.length;

    let prompt = `
      ${days}日分の献立を提案してください。
      一日${mealCount}食。
      ${fixedMeals.length > 0 ? `ただし、そのうち以下の食事枠は固定レシピ（プロテインスムージー等）をこちらで挿入するため、AIは提案しないでください：
      固定枠: ${fixedMeals.map(fm => `${fm.mealIndex + 1}食目`).join(", ")}
      AIが提案すべき食事数: 1日あたり ${mealCount - fixedMeals.length}食分` : ""}
      ${mainIngredient ? `メイン食材の希望: ${mainIngredient}` : ""}
      アレルギー: ${allergies || "なし"}
      苦手な食材: ${dislikedFoods || "なし"}
      避けてほしい食材: ${avoidFoods || "なし"}

      目標栄養価 (AIが提案する食事の合計):
      - エネルギー: ${targetCal} kcal
      - タンパク質: ${targetP} g
      - 脂質: ${targetF} g
      - 炭水化物: ${targetC} g
      (誤差±10%以内)

      条件:
      - 日ごとにジャンル(和/洋/中/エスニック等)と主タンパク源(鶏/魚/豚/牛/豆腐等)を変えて飽き防止
      - 1食あたり主食(ごはん/パン/麺/芋類等)は必ず1種類のみ。ラーメン+ライス、カレーライス+ナンのような主食の重複は禁止
      - スーパーで手に入りやすい食材のみ使用
      - 共通食材は複数日で使い回し、食材ロスを最小化
      - 買い物リストは${days}日分を統合し重複合算

      【重要】出力は必ず以下のJSON形式（日本語）で行ってください。
      {
        "days": [
          {
            "dl": "1日目",
            "meals": [
              { "n": "料理名", "t": "食事枠名", "cal": 数値, "p": 数値, "f": 数値, "c": 数値, "d": "説明", "ing": [{"n":"材料","a":"分量"}], "st": ["手順1"] }
            ],
            "total": { "cal": 合計, "p": 合計, "f": 合計, "c": 合計 }
          }
        ],
        "sl": [ { "n": "食材名", "a": "分量", "cat": "肉魚/野菜/乳製品卵/主食/乾物調味料/その他" } ],
        "gt": { "cal": 全日程合計, "p": 全日程合計, "f": 全日程合計, "c": 全日程合計 }
      }
      
      ※ meals配列には、AIが提案する ${aiGeneratedMealCount}食分のみを含めてください。
      ※ t (食事枠名) は「朝食」「昼食」「夕食」だけでなく「間食」など適切に割り振ってください。
      ※ sl (買い物リスト) には、AIが提案した分のみを含めてください（固定メニュー分はこちらで合算します）。
      ※ dl (dayLabel) は「1日目」「2日目」としてください。
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
      const parsed = JSON.parse(jsonStr);

      // Expand shortened keys to full keys for frontend consumption
      const menuData = expandKeys(parsed);

      // 固定メニューの挿入と買い物リストの合算
      if (fixedMeals.length > 0) {
        if (!menuData.shoppingList) menuData.shoppingList = [];

        menuData.days.forEach((day, dIdx) => {
          const sortedFixedMeals = [...fixedMeals].sort((a, b) => a.mealIndex - b.mealIndex);
          sortedFixedMeals.forEach(fm => {
            let mealToInsert: Meal | null = null;
            if (fm.recipeId === "protein-smoothie") {
              mealToInsert = { ...PRESET_SMOOTHIE, timeLabel: `${fm.mealIndex + 1}食目（固定）` };
            }

            if (mealToInsert) {
              day.meals.splice(fm.mealIndex, 0, mealToInsert);
            }
          });

          // 1日の合計を再計算
          day.total.calories = day.meals.reduce((sum, m) => sum + m.calories, 0);
          day.total.p = day.meals.reduce((sum, m) => sum + m.p, 0);
          day.total.f = day.meals.reduce((sum, m) => sum + m.f, 0);
          day.total.c = day.meals.reduce((sum, m) => sum + m.c, 0);
        });

        // 買い物リストの合算（全日分）
        fixedMeals.forEach(fm => {
          if (fm.recipeId === "protein-smoothie") {
            PRESET_SMOOTHIE_SHOPPING.forEach(item => {
              const existing = menuData.shoppingList!.find(si => si.name === item.name);
              if (existing) {
                // 既存のアイテムがある場合、分量を更新（例: "30g" -> "30g x 3日分"）
                // 簡単のため、ここでは既存のamountに日数を追記する形にする
                if (!existing.amount.includes("x")) { // 既に追記済みでなければ
                  existing.amount = `${existing.amount} x ${days}日分`;
                }
              } else {
                // 新しいアイテムとして追加
                menuData.shoppingList!.push({
                  ...item,
                  amount: `${item.amount} x ${days}日分`
                });
              }
            });
          }
        });

        // 総合計を再計算
        menuData.grandTotal.calories = menuData.days.reduce((sum, d) => sum + d.total.calories, 0);
        menuData.grandTotal.p = menuData.days.reduce((sum, d) => sum + d.total.p, 0);
        menuData.grandTotal.f = menuData.days.reduce((sum, d) => sum + d.total.f, 0);
        menuData.grandTotal.c = menuData.days.reduce((sum, d) => sum + d.total.c, 0);
      }

      return NextResponse.json(menuData);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);
      console.error("Failed text:", cleanText);
      return NextResponse.json(
        { error: "JSON parsing failed", details: cleanText },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "メニューの生成に失敗しました。";
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { error: "メニューの生成に失敗しました。", details: errorMessage },
      { status: 500 }
    );
  }
}

/**
 * Expand shortened JSON keys from Gemini response to full keys for frontend.
 * Handles both multi-day (days array) and legacy single-day (meals array) formats.
 */
function expandKeys(data: any): MenuData {
  // Multi-day format
  if (data.days) {
    return {
      days: data.days.map((day: any): DayMenu => ({
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
    const total = expandTotal(data.total || {});
    return {
      days: [{
        dayLabel: "1日目",
        meals: expandMeals(data.meals),
        total,
      }],
      shoppingList: expandShoppingList(data.shoppingList || []),
      grandTotal: total,
    };
  }

  return data;
}

function expandMeals(meals: any[]): Meal[] {
  return meals.map((m: any): Meal => ({
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

function expandTotal(t: any): Nutrition {
  return {
    calories: t.cal || t.calories || 0,
    p: t.p || 0,
    f: t.f || 0,
    c: t.c || 0,
  };
}

function expandShoppingList(list: any[]): ShoppingListItem[] {
  return list.map((item: any): ShoppingListItem => ({
    name: item.n || item.name || "",
    amount: item.a || item.amount || "",
    category: item.cat || item.category || "その他",
  }));
}
