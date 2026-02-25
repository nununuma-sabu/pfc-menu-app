import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import InputForm from "@/components/InputForm";

// TdeeModal は InputForm 内でのみ使用。テスト対象外のためモック。
vi.mock("@/components/TdeeModal", () => ({
    default: () => null,
}));

describe("InputForm - カロリー超過バリデーション (isCalorieExceeded)", () => {
    const mockOnSubmit = vi.fn();

    /**
     * デフォルト状態（目標2000kcal、PFC=15:25:60）でフォームをレンダリング
     */
    function renderForm() {
        return render(<InputForm onSubmit={mockOnSubmit} isLoading={false} />);
    }

    /**
     * ドロップダウンで食事枠を選択して固定メニューを追加するヘルパー
     */
    function addFixedMeal(select: HTMLElement, mealIndex: number) {
        fireEvent.change(select, { target: { value: String(mealIndex) } });
    }

    it("固定メニューなしの場合、Submitボタンが有効", () => {
        renderForm();
        const button = screen.getByRole("button", { name: "献立を提案する" });
        expect(button).not.toBeDisabled();
    });

    it("固定メニュー(270kcal)が目標(2000kcal)未満ならSubmitが有効", () => {
        renderForm();

        // 1食目を固定（プロテインスムージー 270kcal）
        const select = screen.getByRole("combobox");
        addFixedMeal(select, 0);

        const button = screen.getByRole("button", { name: "献立を提案する" });
        expect(button).not.toBeDisabled();
        expect(screen.queryByText(/固定メニューの合計カロリー/)).not.toBeInTheDocument();
    });

    it("固定メニューのカロリーが目標カロリー以上になるとSubmitが無効になる", () => {
        renderForm();

        // 目標カロリーを 270kcal（スムージーと同じ）に変更
        const calorieInput = screen.getByDisplayValue("2000"); // 目標カロリーの初期値
        fireEvent.change(calorieInput, { target: { value: "270" } });

        // 1食目を固定（270kcal）→ 270 >= 270 で超過
        const select = screen.getByRole("combobox");
        addFixedMeal(select, 0);

        const button = screen.getByRole("button", { name: "献立を提案する" });
        expect(button).toBeDisabled();
    });

    it("超過時にエラーメッセージが表示される", () => {
        renderForm();

        const calorieInput = screen.getByDisplayValue("2000"); // 目標カロリーの初期値
        fireEvent.change(calorieInput, { target: { value: "200" } });

        const select = screen.getByRole("combobox");
        addFixedMeal(select, 0);

        expect(screen.getByText(/固定メニューの合計カロリー/)).toBeInTheDocument();
        expect(screen.getByText(/目標カロリーを上げるか/)).toBeInTheDocument();
    });

    it("超過時にエラーメッセージに具体的な数値（kcal）が表示される", () => {
        renderForm();

        const calorieInput = screen.getByDisplayValue("2000"); // 目標カロリーの初期値
        fireEvent.change(calorieInput, { target: { value: "100" } });

        const select = screen.getByRole("combobox");
        addFixedMeal(select, 0);

        // 270 kcal（固定）と 100 kcal（目標）が表示されること
        expect(screen.getByText(/270 kcal/)).toBeInTheDocument();
        expect(screen.getByText(/100 kcal/)).toBeInTheDocument();
    });

    it("超過後に固定メニューを解除するとエラーが消えSubmitが有効になる", () => {
        renderForm();

        const calorieInput = screen.getByDisplayValue("2000"); // 目標カロリーの初期値
        fireEvent.change(calorieInput, { target: { value: "100" } });

        const select = screen.getByRole("combobox");
        addFixedMeal(select, 0);

        // エラー表示を確認
        expect(screen.getByText(/固定メニューの合計カロリー/)).toBeInTheDocument();

        // 「解除」ボタンをクリック
        const releaseButton = screen.getByRole("button", { name: "解除" });
        fireEvent.click(releaseButton);

        // エラーが消えSubmitが有効になる
        expect(screen.queryByText(/固定メニューの合計カロリー/)).not.toBeInTheDocument();
        // 目標100kcalかつPFC合計100%なのでSubmitは有効
        expect(screen.getByRole("button", { name: "献立を提案する" })).not.toBeDisabled();
    });

    it("目標カロリーを引き上げると超過が解消される", () => {
        renderForm();

        const calorieInput = screen.getByDisplayValue("2000"); // 目標カロリーの初期値
        fireEvent.change(calorieInput, { target: { value: "100" } });

        const select = screen.getByRole("combobox");
        addFixedMeal(select, 0);

        expect(screen.getByText(/固定メニューの合計カロリー/)).toBeInTheDocument();

        // 目標を 500 に引き上げる（270 < 500）
        fireEvent.change(calorieInput, { target: { value: "500" } });

        expect(screen.queryByText(/固定メニューの合計カロリー/)).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: "献立を提案する" })).not.toBeDisabled();
    });
});
