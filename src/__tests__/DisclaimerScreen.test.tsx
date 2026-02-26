import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import DisclaimerScreen from "@/components/DisclaimerScreen";

vi.useFakeTimers();

describe("DisclaimerScreen コンポーネント", () => {
    it("免責事項テキストが表示される", () => {
        const onComplete = vi.fn();
        render(<DisclaimerScreen onComplete={onComplete} />);

        expect(screen.getByText("【ご注意】")).toBeInTheDocument();
        expect(
            screen.getByText(/ボディメイクおよびダイエットは/)
        ).toBeInTheDocument();
    });

    it("スキップテキストが表示される", () => {
        const onComplete = vi.fn();
        render(<DisclaimerScreen onComplete={onComplete} />);

        expect(
            screen.getByText("画面をタップしてスキップ")
        ).toBeInTheDocument();
    });

    it("クリック時にonCompleteが呼ばれる", () => {
        const onComplete = vi.fn();
        render(<DisclaimerScreen onComplete={onComplete} />);

        // 画面全体をクリック
        const container = screen.getByText("【ご注意】").closest("div[class*='fixed']");
        if (container) fireEvent.click(container);

        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("タイマー完了後にonCompleteが呼ばれる", () => {
        const onComplete = vi.fn();
        render(<DisclaimerScreen onComplete={onComplete} />);

        act(() => {
            vi.advanceTimersByTime(6200);
        });

        expect(onComplete).toHaveBeenCalled();
    });
});
