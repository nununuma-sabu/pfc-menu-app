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

function formatDiff(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    const normalized = Object.is(rounded, -0) ? 0 : rounded;
    return new Intl.NumberFormat("ja-JP", {
        maximumFractionDigits: 1,
    }).format(normalized);
}

function getStatusStyle(pct: number) {
    if (pct >= 90 && pct <= 110) return { bar: "#006c4c", text: "text-emerald-700", label: "適正", badge: "bg-emerald-100 text-emerald-800" };
    if (pct < 90) return { bar: "#b26a00", text: "text-amber-700", label: "不足", badge: "bg-amber-100 text-amber-800" };
    return { bar: "#ba1a1a", text: "text-red-700", label: "超過", badge: "bg-red-100 text-red-800" };
}

function CalorieBar({ target, actual }: { target: number; actual: number }) {
    const pct = calcPercent(actual, target);
    const clampedPct = Math.min(pct, 130);
    const st = getStatusStyle(pct);
    const diff = actual - target;

    return (
        <div className="space-y-1">
            <div className="text-xs font-semibold text-zinc-600 mb-1">カロリー</div>
            <div className="relative h-5 rounded-full overflow-hidden" style={{ background: "var(--md-surface-container-high)" }}>
                <div className="absolute top-0 bottom-0 w-px z-10" style={{ left: `${(100 / 130) * 100}%`, background: "var(--md-outline)" }} />
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
                            ({diff >= 0 ? "+" : ""}{formatDiff(diff)}kcal / {pct}%)
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
                            stroke={i === 3 ? "#707973" : "#c0c9c2"}
                            strokeWidth={i === 3 ? 1.5 : 0.75}
                        />
                    ))}

                    {/* 軸線 */}
                    {AXES.map(a => {
                        const pt = getPoint(a.angle, 1);
                        return <line key={a.key} x1={CX} y1={CY} x2={pt.x} y2={pt.y} stroke="#c0c9c2" strokeWidth="0.75" />;
                    })}

                    {/* 目標三角形（塗り・実線） */}
                    <polygon
                        points={targetPolygon}
                        fill="#006c4c"
                        fillOpacity="0.12"
                        stroke="#006c4c"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                    />

                    {/* 提案三角形（塗り・破線） */}
                    <polygon
                        points={actualPolygon}
                        fill="#3d6374"
                        fillOpacity="0.18"
                        stroke="#3d6374"
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
                        <span className="inline-block w-5 h-0 border-t-2 border-emerald-700" />
                        目標
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-5 h-0 border-t-2 border-sky-700 border-dashed" style={{ borderStyle: "dashed" }} />
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
                            <div key={a.key} className="flex items-center justify-between px-2 py-1.5 md-card-tonal">
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
                                            ({diff >= 0 ? "+" : ""}{formatDiff(diff)}{a.unit} / {pct}%)
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
        <div className="md-card p-5 space-y-5">
            <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: "var(--md-on-surface)" }}>
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: "var(--md-primary)" }} />
                {label ?? "栄養バランス達成度"}
            </h3>

            <CalorieBar target={target.calories} actual={actual.calories} />

            <hr style={{ borderColor: "var(--md-outline-variant)" }} />

            <RadarChart target={target} actual={actual} />
        </div>
    );
}
