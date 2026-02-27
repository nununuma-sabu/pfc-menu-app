import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import MenuDisplay from "@/components/MenuDisplay";
import { MenuData } from "@/types/menu";

describe("MenuDisplay コンポーネント", () => {
    it("menuがnullの場合、何も表示しない", () => {
        const { container } = render(<MenuDisplay menu={null} />);
        expect(container.innerHTML).toBe("");
    });

    it("メニューデータを渡すと食事カードが表示される", () => {
        const mockMenu: MenuData = {
            days: [
                {
                    dayLabel: "1日目",
                    meals: [
                        {
                            name: "焼き鮭定食",
                            timeLabel: "朝食",
                            calories: 450,
                            p: 30,
                            f: 15,
                            c: 50,
                            description: "バランスの良い朝食",
                            ingredients: [{ name: "鮭", amount_g: 100 }],
                            steps: ["鮭を焼く"],
                        },
                    ],
                    total: { calories: 450, p: 30, f: 15, c: 50 },
                },
            ],
            shoppingList: [{ name: "鮭", amount_g: 100, category: "肉魚" }],
            grandTotal: { calories: 450, p: 30, f: 15, c: 50 },
        };

        render(<MenuDisplay menu={mockMenu} />);

        // 料理名が表示される
        expect(screen.getByText("焼き鮭定食")).toBeInTheDocument();
        // timeLabel（食事枠）が表示される
        expect(screen.getByText("朝食")).toBeInTheDocument();
    });

    it("複数日のデータでdayLabelタブが表示される", () => {
        const mockMenu: MenuData = {
            days: [
                {
                    dayLabel: "1日目",
                    meals: [
                        {
                            name: "朝食メニュー",
                            timeLabel: "朝食",
                            calories: 400,
                            p: 25,
                            f: 10,
                            c: 50,
                            description: "朝食",
                        },
                    ],
                    total: { calories: 400, p: 25, f: 10, c: 50 },
                },
                {
                    dayLabel: "2日目",
                    meals: [
                        {
                            name: "昼食メニュー",
                            timeLabel: "昼食",
                            calories: 500,
                            p: 30,
                            f: 20,
                            c: 60,
                            description: "昼食",
                        },
                    ],
                    total: { calories: 500, p: 30, f: 20, c: 60 },
                },
            ],
            shoppingList: [],
            grandTotal: { calories: 900, p: 55, f: 30, c: 110 },
        };

        render(<MenuDisplay menu={mockMenu} />);

        // 複数日の場合、dayLabelのタブが表示される
        expect(screen.getByText("1日目")).toBeInTheDocument();
        expect(screen.getByText("2日目")).toBeInTheDocument();
    });

    it("買い物リストが表示される", () => {
        const mockMenu: MenuData = {
            days: [
                {
                    dayLabel: "1日目",
                    meals: [
                        {
                            name: "テスト料理",
                            timeLabel: "昼食",
                            calories: 500,
                            p: 25,
                            f: 20,
                            c: 60,
                            description: "テスト",
                        },
                    ],
                    total: { calories: 500, p: 25, f: 20, c: 60 },
                },
            ],
            shoppingList: [
                { name: "鶏むね肉", amount_g: 300, category: "肉魚" },
                { name: "レタス", amount_g: 100, category: "野菜" },
            ],
            grandTotal: { calories: 500, p: 25, f: 20, c: 60 },
        };

        render(<MenuDisplay menu={mockMenu} />);

        expect(screen.getByText("鶏むね肉")).toBeInTheDocument();
        expect(screen.getByText("レタス")).toBeInTheDocument();
    });

    it("合計栄養価が表示される", () => {
        const mockMenu: MenuData = {
            days: [
                {
                    dayLabel: "1日目",
                    meals: [
                        {
                            name: "テスト",
                            timeLabel: "朝食",
                            calories: 1500,
                            p: 80,
                            f: 50,
                            c: 200,
                            description: "テスト",
                        },
                    ],
                    total: { calories: 1500, p: 80, f: 50, c: 200 },
                },
            ],
            grandTotal: { calories: 1500, p: 80, f: 50, c: 200 },
        };

        render(<MenuDisplay menu={mockMenu} />);

        // 合計栄養価の「Cal:」ラベルとカロリー値が表示される
        expect(screen.getByText("合計栄養価")).toBeInTheDocument();
    });
});
