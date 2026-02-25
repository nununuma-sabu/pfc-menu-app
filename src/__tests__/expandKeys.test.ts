import { describe, it, expect } from "vitest";
import {
    expandKeys,
    expandMeals,
    expandTotal,
    expandShoppingList,
    PRESET_SMOOTHIE,
    PRESET_SMOOTHIE_SHOPPING,
} from "@/app/api/generate-menu/route";

// --- expandTotal ---
describe("expandTotal", () => {
    it("省略キー(cal)からフルキー(calories)に変換する", () => {
        const result = expandTotal({ cal: 500, p: 30, f: 20, c: 50 });
        expect(result).toEqual({ calories: 500, p: 30, f: 20, c: 50 });
    });

    it("フルキーをそのまま返す", () => {
        const result = expandTotal({ calories: 500, p: 30, f: 20, c: 50 });
        expect(result).toEqual({ calories: 500, p: 30, f: 20, c: 50 });
    });

    it("空のオブジェクトに対してデフォルト値(0)を返す", () => {
        const result = expandTotal({});
        expect(result).toEqual({ calories: 0, p: 0, f: 0, c: 0 });
    });
});

// --- expandMeals ---
describe("expandMeals", () => {
    it("省略キーからフルキーに変換する", () => {
        const meals = [
            {
                n: "焼き鮭定食",
                t: "朝食",
                cal: 450,
                p: 30,
                f: 15,
                c: 50,
                d: "バランスの良い朝食",
                ing: [{ n: "鮭", a: "1切れ" }],
                st: ["鮭を焼く"],
            },
        ];
        const result = expandMeals(meals);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: "焼き鮭定食",
            timeLabel: "朝食",
            calories: 450,
            p: 30,
            f: 15,
            c: 50,
            description: "バランスの良い朝食",
            ingredients: [{ name: "鮭", amount: "1切れ" }],
            steps: ["鮭を焼く"],
        });
    });

    it("フルキーをそのまま受け付ける", () => {
        const meals = [
            {
                name: "カレー",
                timeLabel: "昼食",
                calories: 600,
                p: 20,
                f: 25,
                c: 80,
                description: "スパイスカレー",
                ingredients: [{ name: "鶏肉", amount: "200g" }],
                steps: ["煮込む"],
            },
        ];
        const result = expandMeals(meals);
        expect(result[0].name).toBe("カレー");
        expect(result[0].timeLabel).toBe("昼食");
    });

    it("空の配列を処理できる", () => {
        const result = expandMeals([]);
        expect(result).toEqual([]);
    });

    it("フィールドが不足している場合にデフォルト値を返す", () => {
        const result = expandMeals([{}]);
        expect(result[0]).toEqual({
            name: "",
            timeLabel: "",
            calories: 0,
            p: 0,
            f: 0,
            c: 0,
            description: "",
            ingredients: [],
            steps: [],
        });
    });
});

// --- expandShoppingList ---
describe("expandShoppingList", () => {
    it("省略キーからフルキーに変換する", () => {
        const list = [{ n: "鶏むね肉", a: "300g", cat: "肉魚" }];
        const result = expandShoppingList(list);
        expect(result).toEqual([
            { name: "鶏むね肉", amount: "300g", category: "肉魚" },
        ]);
    });

    it("カテゴリ未指定時に「その他」をデフォルト設定する", () => {
        const list = [{ n: "塩", a: "適量" }];
        const result = expandShoppingList(list);
        expect(result[0].category).toBe("その他");
    });

    it("空の配列を処理できる", () => {
        expect(expandShoppingList([])).toEqual([]);
    });
});

// --- expandKeys ---
describe("expandKeys", () => {
    it("Multi-day形式（省略キー）を正しく変換する", () => {
        const data = {
            days: [
                {
                    dl: "1日目",
                    meals: [
                        { n: "朝食メニュー", t: "朝食", cal: 400, p: 25, f: 15, c: 45, d: "説明" },
                    ],
                    total: { cal: 400, p: 25, f: 15, c: 45 },
                },
            ],
            sl: [{ n: "鶏肉", a: "100g", cat: "肉魚" }],
            gt: { cal: 400, p: 25, f: 15, c: 45 },
        };

        const result = expandKeys(data);

        expect(result.days).toHaveLength(1);
        expect(result.days[0].dayLabel).toBe("1日目");
        expect(result.days[0].meals[0].name).toBe("朝食メニュー");
        expect(result.shoppingList).toHaveLength(1);
        expect(result.shoppingList![0].name).toBe("鶏肉");
        expect(result.grandTotal.calories).toBe(400);
    });

    it("レガシー形式（single-day）をMulti-day形式に正規化する", () => {
        const data = {
            meals: [
                { name: "サラダ", timeLabel: "昼食", calories: 200, p: 10, f: 5, c: 20, description: "ヘルシー" },
            ],
            total: { calories: 200, p: 10, f: 5, c: 20 },
            shoppingList: [{ name: "レタス", amount: "1玉" }],
        };

        const result = expandKeys(data);

        expect(result.days).toHaveLength(1);
        expect(result.days[0].dayLabel).toBe("1日目");
        expect(result.days[0].meals[0].name).toBe("サラダ");
    });

    it("複数日のデータを正しく処理する", () => {
        const data = {
            days: [
                { dl: "1日目", meals: [], total: { cal: 1500, p: 80, f: 50, c: 200 } },
                { dl: "2日目", meals: [], total: { cal: 1600, p: 85, f: 55, c: 210 } },
                { dl: "3日目", meals: [], total: { cal: 1400, p: 75, f: 45, c: 190 } },
            ],
            sl: [],
            gt: { cal: 4500, p: 240, f: 150, c: 600 },
        };

        const result = expandKeys(data);
        expect(result.days).toHaveLength(3);
        expect(result.days[1].dayLabel).toBe("2日目");
        expect(result.grandTotal.calories).toBe(4500);
    });
});

// --- プリセットデータ ---
describe("プリセット定数", () => {
    it("PRESET_SMOOTHIEが正しい栄養価を持つ", () => {
        expect(PRESET_SMOOTHIE.name).toBe("プロテインスムージー");
        expect(PRESET_SMOOTHIE.calories).toBe(270);
        expect(PRESET_SMOOTHIE.p).toBe(26);
        expect(PRESET_SMOOTHIE.f).toBe(2);
        expect(PRESET_SMOOTHIE.c).toBe(46);
        expect(PRESET_SMOOTHIE.ingredients).toBeDefined();
        expect(PRESET_SMOOTHIE.ingredients!.length).toBe(4);
    });

    it("PRESET_SMOOTHIE_SHOPPINGが正しいアイテム数を持つ", () => {
        expect(PRESET_SMOOTHIE_SHOPPING).toHaveLength(4);
        PRESET_SMOOTHIE_SHOPPING.forEach((item) => {
            expect(item.name).toBeTruthy();
            expect(item.amount).toBeTruthy();
            expect(item.category).toBeTruthy();
        });
    });
});
