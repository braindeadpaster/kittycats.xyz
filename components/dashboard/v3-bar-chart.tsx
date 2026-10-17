"use client";

import React, { useState } from "react";

export interface BarDatum {
  label: string;
  value: number;
}

export default function V3BarChart({
  data,
  height = 370,
}: {
  data: BarDatum[];
  height?: number;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((a, d) => a + d.value, 0);
  const gridLines = [1, 0.66, 0.33];

  return (
    <div className="relative w-full" style={{ height }}>
      {/* summary */}
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <p className="m-0 text-[26px] font-bold tabular-nums text-white">
          {total.toLocaleString()}
        </p>
        <p className="m-0 text-[12px] text-[#6a6a6a]">
          peak {max.toLocaleString()} · {data.length} buckets
        </p>
      </div>

      <div className="relative w-full" style={{ height: height - 88 }}>
        {/* gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pb-[1px]">
          {gridLines.map((s) => (
            <div key={s} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-right text-[10px] tabular-nums text-[#4a4a4a]">
                {Math.round(max * s)}
              </span>
              <div className="h-px flex-1 bg-[#1a1a1a]" />
            </div>
          ))}
          <div className="flex items-center gap-2">
            <span className="w-6 shrink-0 text-right text-[10px] tabular-nums text-[#4a4a4a]">
              0
            </span>
            <div className="h-px flex-1 bg-[#262626]" />
          </div>
        </div>

        {/* bars */}
        <div className="absolute inset-0 ml-8 flex items-end gap-[6px]">
          {data.map((d, i) => {
            const pct = max === 0 ? 0 : (d.value / max) * 100;
            const isHover = hovered === i;
            const isPeak = d.value === max && max > 0;
            return (
              <div
                key={`${d.label}-${i}`}
                className="group relative flex h-full min-w-0 flex-1 cursor-default flex-col justify-end"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {isHover && (
                  <div className="absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-[10px] border border-[#7e2c8b7c] bg-[#1c1020] px-2.5 py-1 text-center">
                    <p className="m-0 text-[13px] font-bold tabular-nums whitespace-nowrap text-white">
                      {d.value.toLocaleString()}
                    </p>
                    {d.label ? (
                      <p className="m-0 text-[10px] whitespace-nowrap text-[#a1a1a1]">
                        {d.label}
                      </p>
                    ) : null}
                  </div>
                )}
                <div
                  className={`w-full rounded-t-[6px] rounded-b-[2px] transition-all duration-300 ${
                    d.value > 0
                      ? isPeak
                        ? "bg-[linear-gradient(180deg,#d283eb,#7e2c8b)]"
                        : isHover
                          ? "bg-[linear-gradient(180deg,#c06fdd,#8a359b)]"
                          : "bg-[linear-gradient(180deg,#9a45b2,#5e1d6e)]"
                      : "bg-[#1e1e1e]"
                  }`}
                  style={{
                    height: `${Math.max(pct, d.value > 0 ? 5 : 1.5)}%`,
                    transform: isHover && d.value > 0 ? "scaleY(1.01)" : undefined,
                    transformOrigin: "bottom",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* x labels */}
      <div className="ml-8 mt-2 flex gap-[6px]">
        {data.map((d, i) => (
          <div
            key={`${d.label}-l-${i}`}
            className={`min-w-0 flex-1 truncate text-center text-[11px] transition-colors ${
              hovered === i ? "text-[#d7a2e6]" : "text-[#575757]"
            }`}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
