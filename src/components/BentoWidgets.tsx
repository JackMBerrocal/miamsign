"use client";

import React from "react";

export function TickBar({
  pct,
  total = 48,
  filledColor = "#059669",
  emptyColor = "#E2E8F0",
}: {
  pct: number;
  total?: number;
  filledColor?: string;
  emptyColor?: string;
}) {
  const safePct = Math.max(0, Math.min(100, pct));
  const filled = Math.round((safePct / 100) * total);
  return (
    <div className="flex items-center gap-[3px] h-6 my-2 overflow-hidden" aria-hidden="true">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className="w-[3px] h-[20px] rounded-[2px] shrink-0"
          style={{ backgroundColor: i < filled ? filledColor : emptyColor }}
        />
      ))}
    </div>
  );
}

export interface MonthlyRevenueBucket {
  label: string;
  collected: number;
  pending: number;
}

export function RevenueBarsSvg({ buckets }: { buckets: MonthlyRevenueBucket[] }) {
  const safeBuckets = buckets.length
    ? buckets
    : [{ label: "Actual", collected: 0, pending: 0 }];
  const maxRaw = Math.max(
    5000,
    ...safeBuckets.map((b) => b.collected + b.pending)
  );
  const ceilMax = Math.ceil(maxRaw / 5000) * 5000;
  const W = 490;
  const H = 175;
  const padL = 46;
  const padB = 24;
  const padT = 36;
  const chartW = W - padL - 12;
  const step = chartW / safeBuckets.length;
  const barW = Math.min(36, Math.max(20, step * 0.52));

  const ticks = [0, Math.round(ceilMax / 2), ceilMax];
  const lastIdx = safeBuckets.length - 1;
  const last = safeBuckets[lastIdx];

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block overflow-visible">
      {ticks.map((t) => {
        const y = padT + (1 - t / ceilMax) * (H - padT - padB);
        return (
          <g key={t}>
            <line
              x1={padL}
              y1={y}
              x2={W - 10}
              y2={y}
              stroke="#E2E8F0"
              strokeDasharray={t === 0 ? undefined : "3 3"}
              strokeWidth={1}
            />
            <text
              x={padL - 8}
              y={y + 3.5}
              textAnchor="end"
              fontSize={10}
              fill="#64748B"
              fontFamily="ui-monospace, SFMono-Regular, monospace"
            >
              {t === 0 ? "0" : `S/${Math.round(t / 1000)}k`}
            </text>
          </g>
        );
      })}

      {safeBuckets.map((b, i) => {
        const x = padL + step * i + (step - barW) / 2;
        const hCol = (b.collected / ceilMax) * (H - padT - padB);
        const yCol = H - padB - hCol;
        const hPend = (b.pending / ceilMax) * (H - padT - padB);
        const yPend = yCol - hPend;
        const isLast = i === lastIdx;

        return (
          <g key={b.label}>
            {b.pending > 0 && (
              <rect
                x={x}
                y={yPend}
                width={barW}
                height={Math.max(2, hPend)}
                rx={4}
                fill="rgba(245,158,11,0.12)"
                stroke="#F59E0B"
                strokeWidth={1.2}
                strokeDasharray="3 2"
              />
            )}
            <rect
              x={x}
              y={hCol > 0 ? yCol : H - padB - 2}
              width={barW}
              height={hCol > 0 ? hCol : 2}
              rx={5}
              fill="#059669"
              fillOpacity={isLast ? 0.28 : 0.16}
            />
            {hCol > 2 && (
              <rect
                x={x}
                y={yCol}
                width={barW}
                height={5}
                rx={2.5}
                fill="#059669"
              />
            )}
            {isLast && (
              <rect
                x={x - 4}
                y={padT - 4}
                width={barW + 8}
                height={H - padB - padT + 8}
                rx={8}
                fill="none"
                stroke="#6366F1"
                strokeWidth={1.2}
                strokeOpacity={0.45}
              />
            )}
            <text
              x={x + barW / 2}
              y={H - 6}
              textAnchor="middle"
              fontSize={10.5}
              fontWeight={isLast ? 800 : 600}
              fill={isLast ? "#0F172A" : "#64748B"}
            >
              {b.label}
            </text>
          </g>
        );
      })}

      {/* Floating black tooltip above latest bucket */}
      <g transform={`translate(${Math.max(padL, padL + step * lastIdx + step / 2 - 58)}, 0)`}>
        <rect width={116} height={31} rx={7} fill="#0B0F19" />
        <text x={9} y={12.5} fontSize={8.5} fill="#94A3B8" fontWeight={700}>
          {last.label.toUpperCase()} · COBRADO
        </text>
        <text
          x={9}
          y={25}
          fontSize={11}
          fill="#00E076"
          fontWeight={800}
          fontFamily="ui-monospace, SFMono-Regular, monospace"
        >
          S/ {last.collected.toLocaleString("es-PE", { maximumFractionDigits: 0 })}
        </text>
      </g>
    </svg>
  );
}

export function formatPen(value: number): string {
  return `S/ ${Number(value || 0).toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "Enlace";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatShortDate(iso?: string | null): string {
  if (!iso) return "Por definir";
  const d = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}
