"use client";

import { Nutrition } from "@/types/menu";

interface PfcComparisonChartProps {
    /** 1日あたりの目標栄養価 */
    target: Nutrition;
    /** AIが提案した合計栄養価 */
    actual: Nutrition;
    /** チャートタイトル（省略可） */
    label?: string;
}

// ===== カロリーバー =====

function calcPercent(actual: number, target: number): number {
    if (target <= 0) return 0;
    return Math.round((actual / target) * 100);
}

function getStatusColor(pct: number) {
    if (pct >= 90 && pct <= 110) return { bar: "#22c55e", text: "text-green-600", label: "適正", labelClass: "bg-green-100 text-green-700" };
    if (pct < 90) return { bar: "#f59e0b", text: "text-amber-600", label: "不足", labelClass: "bg-amber-100 text-amber-700" };
    return { bar: "#ef4444", text: "text-red-600", label: "超過", labelClass: "bg-red-100   text-red-700" };
}

function CalorieBar({ target, actual }: { target: number; actual: number }) {
    const pct = calcPercent(actual, target);
    const clampedPct = Math.min(pct, 130);
    const status = getStatusColor(pct);
    const diff = actual - target;
    const sign = diff >= 0 ? "+" : "";

    return (
        <div className="space-y-1">
            <div className="text-xs font-semibold text-zinc-600 mb-1">カロリー</div>
            <div className="relative h-5 bg-zinc-100 rounded-full overflow-hidden">
                <div
                    className="absolute top-0 bottom-0 w-px bg-zinc-400 z-10"
                    style={{ left: `${(100 / 130) * 100}%` }}
                />
                <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                    style={{ width: `${(clampedPct / 130) * 100}%`, backgroundColor: status.bar, opacity: 0.85 }}
                />
            </div>
            <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">
                    目標 <span className="font-bold text-zinc-700">{target}kcal</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${status.labelClass}`}>
                        {status.label}
                    </span>
                    <span className={`font-bold ${status.text}`}>
                        提案 {actual}kcal
                        <span className="ml-1 font-normal text-zinc-500">
                            ({sign}{diff}kcal / {pct}%)
                        </span>
                    </span>
                </span>
            </div>
        </div>
    );
}

// ===== 三角グラフ（三成分図 / Ternary Diagram）=====

const SVG_W = 300;
const MARGIN_X = 44;
const MARGIN_TOP = 36;
const MARGIN_BOTTOM = 28;
const TRI_W = SVG_W - MARGIN_X * 2;
const TRI_H = TRI_W * (Math.sqrt(3) / 2);
const SVG_H = TRI_H + MARGIN_TOP + MARGIN_BOTTOM;

// 頂点座標（SVG座標系）
// P = 上、F = 左下、C = 右下
const vP = { x: SVG_W / 2, y: MARGIN_TOP };
const vF = { x: MARGIN_X, y: MARGIN_TOP + TRI_H };
const vC = { x: SVG_W - MARGIN_X, y: MARGIN_TOP + TRI_H };

/** 三成分座標 (pn, fn, cn) → SVG (x, y) */
function ternaryToSVG(pn: number, fn: number, cn: number) {
    return {
        x: vP.x * pn + vF.x * fn + vC.x * cn,
        y: vP.y * pn + vF.y * fn + vC.y * cn,
    };
}

/** 栄養価 → カロリー比（P×4 / F×9 / C×4）*/
function calcPFCRatios(n: Nutrition) {
    const pCal = n.p * 4;
    const fCal = n.f * 9;
    const cCal = n.c * 4;
    const total = pCal + fCal + cCal;
    if (total <= 0) return { pn: 1 / 3, fn: 1 / 3, cn: 1 / 3 };
    return { pn: pCal / total, fn: fCal / total, cn: cCal / total };
}

const GRID_VALUES = [0.25, 0.5, 0.75];

function TernaryChart({ target, actual }: { target: Nutrition; actual: Nutrition }) {
    const tRatio = calcPFCRatios(target);
    const aRatio = calcPFCRatios(actual);
    const tPt = ternaryToSVG(tRatio.pn, tRatio.fn, tRatio.cn);
    const aPt = ternaryToSVG(aRatio.pn, aRatio.fn, aRatio.cn);
    const pct = (n: number) => Math.round(n * 100);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-zinc-600">PFCバランス（カロリー比）</div>
                <div className="text-[10px] text-zinc-400">頂点に近いほどその栄養素の比率が高い</div>
            </div>

            <div className="flex flex-col items-center">
                <svg
                    viewBox={`0 0 ${SVG_W} ${SVG_H}`}
                    className="w-full max-w-xs"
                    aria-label="PFCバランス三角グラフ"
                >
                    {/* グリッド線（各成分の25/50/75%ライン） */}
                    {GRID_VALUES.map(k => {
                        const lines = [
                            // P = k 線（PF辺〜PC辺）
                            [ternaryToSVG(k, 1 - k, 0), ternaryToSVG(k, 0, 1 - k)],
                            // F = k 線（PF辺〜FC辺）
                            [ternaryToSVG(1 - k, k, 0), ternaryToSVG(0, k, 1 - k)],
                            // C = k 線（PC辺〜FC辺）
                            [ternaryToSVG(1 - k, 0, k), ternaryToSVG(0, 1 - k, k)],
                        ];
                        return lines.map(([s, e], i) => (
                            <line
                                key={`grid-${k}-${i}`}
                                x1={s.x} y1={s.y} x2={e.x} y2={e.y}
                                stroke="#e4e4e7" strokeWidth="0.75"
                            />
                        ));
                    })}

                    {/* 三角形の外枠 */}
                    <polygon
                        points={`${vP.x},${vP.y} ${vF.x},${vF.y} ${vC.x},${vC.y}`}
                        fill="none" stroke="#a1a1aa" strokeWidth="1.5"
                    />

                    {/* 目標点 → 提案点 の破線 */}
                    <line
                        x1={tPt.x} y1={tPt.y} x2={aPt.x} y2={aPt.y}
                        stroke="#94a3b8" strokeWidth="1.2" strokeDasharray="4,3"
                    />

                    {/* 目標点（塗りなし・縁） */}
                    <circle cx={tPt.x} cy={tPt.y} r="7" fill="white" stroke="#6366f1" strokeWidth="2.5" />
                    <circle cx={tPt.x} cy={tPt.y} r="2.5" fill="#6366f1" />

                    {/* 提案点（塗りあり） */}
                    <circle cx={aPt.x} cy={aPt.y} r="7" fill="#f43f5e" opacity="0.9" />
                    <circle cx={aPt.x} cy={aPt.y} r="7" fill="none" stroke="white" strokeWidth="1.5" />

                    {/* 頂点ラベル */}
                    <text x={vP.x} y={vP.y - 10} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#16a34a">P</text>
                    <text x={vF.x - 12} y={vF.y + 16} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#d97706">F</text>
                    <text x={vC.x + 12} y={vC.y + 16} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#2563eb">C</text>
                </svg>

                {/* 凡例・数値 */}
                <div className="w-full space-y-1.5 mt-1 text-xs">
                    <div className="flex items-center justify-between px-2 py-1.5 bg-indigo-50 rounded-lg">
                        <span className="flex items-center gap-2 text-zinc-600">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border-2 border-indigo-500 bg-white">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 block" />
                            </span>
                            目標
                        </span>
                        <span className="font-mono text-zinc-700">
                            P <span className="font-bold">{pct(tRatio.pn)}%</span>
                            F <span className="font-bold">{pct(tRatio.fn)}%</span>
                            C <span className="font-bold">{pct(tRatio.cn)}%</span>
                        </span>
                    </div>
                    <div className="flex items-center justify-between px-2 py-1.5 bg-rose-50 rounded-lg">
                        <span className="flex items-center gap-2 text-zinc-600">
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-rose-500">
                                <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                            </span>
                            提案
                        </span>
                        <span className="font-mono text-zinc-700">
                            P <span className="font-bold">{pct(aRatio.pn)}%</span>
                            F <span className="font-bold">{pct(aRatio.fn)}%</span>
                            C <span className="font-bold">{pct(aRatio.cn)}%</span>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== メインコンポーネント =====

export default function PfcComparisonChart({ target, actual, label }: PfcComparisonChartProps) {
    return (
        <div className="bg-white rounded-xl shadow-md border border-zinc-100 p-5 space-y-5">
            <h3 className="font-bold text-zinc-700 text-sm flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400" />
                {label ?? "栄養バランス達成度"}
            </h3>

            <CalorieBar target={target.calories} actual={actual.calories} />

            <hr className="border-zinc-100" />

            <TernaryChart target={target} actual={actual} />
        </div>
    );
}
