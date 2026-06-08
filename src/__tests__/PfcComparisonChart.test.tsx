import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import PfcComparisonChart from "@/components/PfcComparisonChart";
import type { Nutrition } from "@/types/menu";

const target: Nutrition = { calories: 2000, p: 75, f: 56, c: 300 };

describe("PfcComparisonChart", () => {
    it("目標値と提案値が表示される", () => {
        const actual: Nutrition = { calories: 2000, p: 75, f: 56, c: 300 };
        const { container } = render(<PfcComparisonChart target={target} actual={actual} />);
        // カロリーバーが表示される
        expect(container.textContent).toContain("カロリー");
        // 三角グラフのP/F/C考僕が表示される
        expect(container.textContent).toContain("PFCバランス");
        expect(container.textContent).toContain("目標");
        expect(container.textContent).toContain("提案");
    });

    it("達成率100%（目標と提案が一致）でも表示が崩れない", () => {
        const actual: Nutrition = { calories: 2000, p: 75, f: 56, c: 300 };
        const { container } = render(<PfcComparisonChart target={target} actual={actual} />);
        // 各栄養素の数値が表示されていること
        expect(container.textContent).toContain("2000");
        expect(container.textContent).toContain("kcal");
    });

    it("labelプロップが指定された場合に表示される", () => {
        const actual: Nutrition = { calories: 1900, p: 70, f: 52, c: 285 };
        render(<PfcComparisonChart target={target} actual={actual} label="1日目 達成度" />);
        expect(screen.getByText("1日目 達成度")).toBeInTheDocument();
    });

    it("labelが省略された場合はデフォルトタイトルが表示される", () => {
        const actual: Nutrition = { calories: 2100, p: 80, f: 60, c: 315 };
        render(<PfcComparisonChart target={target} actual={actual} />);
        expect(screen.getByText("栄養バランス達成度")).toBeInTheDocument();
    });

    it("提案値と目標値の差分が表示される", () => {
        const actual: Nutrition = { calories: 2200, p: 60, f: 56, c: 300 };
        const { container } = render(<PfcComparisonChart target={target} actual={actual} />);
        // カロリー超過 (+200) が表示される
        expect(container.textContent).toContain("+200");
        // PFC比率が%表示される
        expect(container.textContent).toContain("%");
    });

    it("差分は小数点1桁までに丸めて表示される", () => {
        const actual: Nutrition = { calories: 2001.1, p: 76.1, f: 56, c: 300 };
        const { container } = render(<PfcComparisonChart target={target} actual={actual} />);

        expect(container.textContent).toContain("+1.1kcal");
        expect(container.textContent).toContain("+1.1g");
        expect(container.textContent).not.toContain("1.099999999");
    });

    it("target.calories=0 でもクラッシュしない（ゼロ除算ガード）", () => {
        const zeroTarget: Nutrition = { calories: 0, p: 0, f: 0, c: 0 };
        const actual: Nutrition = { calories: 2000, p: 75, f: 56, c: 300 };
        expect(() => render(<PfcComparisonChart target={zeroTarget} actual={actual} />)).not.toThrow();
    });
});
