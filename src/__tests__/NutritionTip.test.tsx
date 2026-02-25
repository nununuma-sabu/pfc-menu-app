import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NutritionTip from "@/components/NutritionTip";

// タイマーのモック化（setInterval / setTimeout を制御可能にする）
vi.useFakeTimers();

describe("NutritionTip コンポーネント", () => {
    it("正常にレンダリングされる", () => {
        render(<NutritionTip />);
        // 「豆知識」ラベルが表示される
        expect(screen.getByText("豆知識")).toBeInTheDocument();
    });

    it("ローディングメッセージが表示される", () => {
        render(<NutritionTip />);
        expect(
            screen.getByText("AIが最適な献立を考えています...")
        ).toBeInTheDocument();
    });

    it("栄養素のTipが表示される", () => {
        render(<NutritionTip />);
        // いずれかのTipのタイトルが表示されているはず
        const tipElements = screen.getAllByRole("heading", { level: 3 });
        expect(tipElements.length).toBeGreaterThanOrEqual(1);
    });
});
