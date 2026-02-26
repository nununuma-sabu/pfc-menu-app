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

function getStatusStyle(pct: number) {
    if (pct >= 90 && pct <= 110) return { bar: "#22c55e", text: "text-green-600", label: "適正", badge: "bg-green-100 text-green-700" };
    if (pct < 90) return { bar: "#f59e0b", text: "text-amber-600", label: "不足", badge: "bg-amber-100 text-amber-700" };
    return { bar: "#ef4444", text: "text-red-600", label: "超過", badge: "bg-red-100   text-red-700" };
}

function CalorieBar({ target, actual }: { target: number; actual: number }) {
    const pct = calcPercent(actual, target);
    const clampedPct = Math.min(pct, 130);
    const st = getStatusStyle(pct);
    const diff = actual - target;

    return (
        <div className="space-y-1">
            <div className="text-xs font-semibold text-zinc-600 mb-1">カロリー</div>
            <div className="relative h-5 bg-zinc-100 rounded-full overflow-hidden">
                <div className="absolute top-0 bottom-0 w-px bg-zinc-400 z-10" style={{ left: `${(100 / 130) * 100}%` }} />
                <div
                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                    style={{ width: `${(clampedPct / 130) * 100}%`, backgroundColor: st.bar, opacity: 0.85 }}
                />
            </div>
            <div className="flex justify-between items-center text-xs">
                <span className="text-zinc-500">
                    目標 <span className="font-bold text-zinc-700">{target}kcal</span>
                </span>
                <span className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
                    <span className={`font-bold ${st.text}`}>
                        提案 {actual}kcal
                        <span className="ml-1 font-normal text-zinc-400">
                            ({diff >= 0 ? "+" : ""}{diff}kcal / {pct}%)
                        </span>
                    </span>
                </span>
            </div>
        </div>
    );
}

// ===== PFC レーダーチャート（三角形 2枚重ね）=====

const SVG_SIZE = 240;
const CX = SVG_SIZE / 2;
const CY = SVG_SIZE / 2 + 6;
const RADIUS = 84;

// 3軸：P（上）・C（右下）・F（左下）を時計回りに配置
const AXES = [
    { key: "p" as keyof Nutrition, shortLabel: "P", longLabel: "タンパク質", unit: "g", color: "#16a34a", angle: -90 },
    { key: "c" as keyof Nutrition, shortLabel: "C", longLabel: "炭水化物", unit: "g", color: "#2563eb", angle: 30 },
    { key: "f" as keyof Nutrition, shortLabel: "F", longLabel: "脂質", unit: "g", color: "#d97706", angle: 150 },
] as const;

const GRID_RATIOS = [0.25, 0.5, 0.75, 1.0];

function getPoint(angle: number, ratio: number) {
    const rad = (angle * Math.PI) / 180;
    return {
        x: CX + Math.cos(rad) * RADIUS * ratio,
        y: CY + Math.sin(rad) * RADIUS * ratio,
    };
}

function toPoints(pts: { x: number; y: number }[]) {
    return pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
}

function RadarChart({ target, actual }: { target: Nutrition; actual: Nutrition }) {
    // 各軸のスケール = max(target, actual) → 最大値を外枠に当てる
    const axisMax = AXES.map(a => Math.max(target[a.key], actual[a.key], 1));

    const gridPolygons = GRID_RATIOS.map(r =>
        toPoints(AXES.map(a => getPoint(a.angle, r)))
    );

    const targetPolygon = toPoints(
        AXES.map((a, i) => getPoint(a.angle, target[a.key] / axisMax[i]))
    );
    const actualPolygon = toPoints(
        AXES.map((a, i) => getPoint(a.angle, actual[a.key] / axisMax[i]))
    );

    return (
        <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-600">PFCバランス比較</div>
            <div className="flex flex-col items-center">
                <svg viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} className="w-full max-w-[240px]">
                    {/* グリッド三角形 */}
                    {gridPolygons.map((pts, i) => (
                        <polygon
                            key={i}
                            points={pts}
                            fill="none"
                            stroke={i === 3 ? "#a1a1aa" : "#e4e4e7"}
                            strokeWidth={i === 3 ? 1.5 : 0.75}
                        />
                    ))}

                    {/* 軸線 */}
                    {AXES.map(a => {
                        const pt = getPoint(a.angle, 1);
                        return <line key={a.key} x1={CX} y1={CY} x2={pt.x} y2={pt.y} stroke="#d4d4d8" strokeWidth="0.75" />;
                    })}

                    {/* 目標三角形（塗り・実線） */}
                    <polygon
                        points={targetPolygon}
                        fill="#6366f1"
                        fillOpacity="0.12"
                        stroke="#6366f1"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                    />

                    {/* 提案三角形（塗り・破線） */}
                    <polygon
                        points={actualPolygon}
                        fill="#f43f5e"
                        fillOpacity="0.18"
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        strokeDasharray="5,3"
                    />

                    {/* 頂点ラベル */}
                    {AXES.map(a => {
                        const pt = getPoint(a.angle, 1 + 20 / RADIUS);
                        return (
                            <text
                                key={a.key}
                                x={pt.x} y={pt.y}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                fontSize="13"
                                fontWeight="bold"
                                fill={a.color}
                            >
                                {a.shortLabel}
                            </text>
                        );
                    })}
                </svg>

                {/* 凡例 */}
                <div className="flex gap-5 text-[11px] text-zinc-500 -mt-1 mb-2">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-5 h-0 border-t-2 border-indigo-500" />
                        目標
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-5 h-0 border-t-2 border-rose-500 border-dashed" style={{ borderStyle: "dashed" }} />
                        提案
                    </span>
                </div>

                {/* 数値テーブル */}
                <div className="w-full space-y-1 text-xs">
                    {AXES.map(a => {
                        const tVal = target[a.key];
                        const aVal = actual[a.key];
                        const diff = aVal - tVal;
                        const pct = calcPercent(aVal, tVal);
                        const st = getStatusStyle(pct);
                        return (
                            <div key={a.key} className="flex items-center justify-between px-2 py-1.5 bg-zinc-50 rounded-lg">
                                <span className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-[11px]" style={{ color: a.color }}>{a.shortLabel}</span>
                                    <span className="text-zinc-500">{a.longLabel}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${st.badge}`}>{st.label}</span>
                                    <span className="text-zinc-500">目標<span className="font-bold text-zinc-700 ml-0.5">{tVal}{a.unit}</span></span>
                                    <span className={`font-bold ${st.text}`}>
                                        提案{aVal}{a.unit}
                                        <span className="ml-1 font-normal text-zinc-400">
                                            ({diff >= 0 ? "+" : ""}{diff}{a.unit} / {pct}%)
                                        </span>
                                    </span>
                                </span>
                            </div>
                        );
                    })}
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

            <RadarChart target={target} actual={actual} />
        </div>
    );
}
