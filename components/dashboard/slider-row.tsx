"use client";

import { useState } from "react";
import Tooltip from "../ui/tooltip";

/**
 * Single shared dashboard slider. Every slider in the dashboard uses this —
 * marker dots + labels, hover value bubble, gradient fill.
 */
export default function SliderRow({
  label,
  info,
  min,
  max,
  step,
  value,
  onChange,
  unit,
  formatValue,
  infoPlace = "top",
}: {
  label: string;
  info: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  formatValue?: (v: number) => string;
  infoPlace?: "top" | "bottom";
}) {
  const [active, setActive] = useState(false);
  const pct = ((value - min) / (max - min)) * 100;
  const display = (v: number) =>
    formatValue ? formatValue(v) : unit === "%" ? `${Math.round(v)}%` : `${Math.round(v)}${unit}`;
  const markers = [0.2, 0.5, 0.8].map((m) => {
    const markerValue = min + m * (max - min);
    return { left: m * 100, display: display(markerValue), active: value >= markerValue };
  });
  return (
    <div className="w-full">
      <h1 className="m-0 mb-[6px] flex items-center gap-[4px] text-[16px] font-[500] text-[#dddddd]">
        {label}
        <Tooltip label={info} place={infoPlace}>
          <span className="inline-flex cursor-help items-center justify-center text-[18px] text-[#bdbdbd]">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 256 256">
              <path fill="#ffffff" d="M128 24a104 104 0 1 0 104 104A104.11 104.11 0 0 0 128 24m0 168a12 12 0 1 1 12-12a12 12 0 0 1-12 12m8-48.72v.72a8 8 0 0 1-16 0v-8a8 8 0 0 1 8-8c13.23 0 24-9 24-20s-10.77-20-24-20s-24 9-24 20v4a8 8 0 0 1-16 0v-4c0-19.85 17.94-36 40-36s40 16.15 40 36c0 17.38-13.76 31.93-32 35.28"></path>
            </svg>
          </span>
        </Tooltip>
      </h1>
      <div className="w-full">
        <div className="flex w-full items-center gap-[16px]">
          <div className="relative flex w-full min-w-0 flex-1 flex-col gap-[8px]">
            <div className="relative min-h-[36px] w-full pt-[13px]">
              <div className="relative h-[10px] w-full rounded-[999px] bg-[#1d1d1d]">
                <div
                  className="absolute top-0 left-0 h-full rounded-[inherit] bg-[#868e96]"
                  style={{ width: `${pct}%` }}
                />
                <div
                  className="absolute top-1/2 z-[2] size-[15px] -translate-y-1/2 rounded-full border-[3px] border-[#1b1b1d] bg-[#868e96]"
                  style={{ left: `calc(${pct}% - 7.5px)` }}
                >
                  <span
                    data-visible={active}
                    className="invisible absolute -top-[18px] left-1/2 -translate-x-1/2 scale-[0.96] rounded-[8px] bg-[#252525] px-[8px] py-[4px] text-[12px] font-[550] whitespace-nowrap text-[#fafafa] opacity-0 transition-[0.14s] after:absolute after:-bottom-[4px] after:left-1/2 after:size-[8px] after:-translate-x-1/2 after:rotate-45 after:rounded-[2px] after:bg-[#252525] data-[visible=true]:visible data-[visible=true]:scale-100 data-[visible=true]:opacity-100"
                  >
                    {display(value)}
                  </span>
                </div>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                onPointerDown={() => setActive(true)}
                onPointerUp={() => setActive(false)}
                onBlur={() => setActive(false)}
                aria-label={label}
                className="absolute top-0 z-[3] -left-[14px] -right-[14px] h-[36px] w-auto cursor-pointer appearance-none bg-transparent opacity-0"
              />
              <div className="pointer-events-none absolute inset-0 text-[12px] text-[#757575]">
                {markers.map((m) => (
                  <div
                    key={m.display}
                    className="absolute top-0 flex -translate-x-1/2 flex-col items-center gap-[10px]"
                    style={{ left: `${m.left}%` }}
                  >
                    <span
                      data-active={m.active}
                      className="mt-[15px] size-[6px] rounded-full bg-[#606060] data-[active=true]:bg-white"
                    />
                    <span className="text-[clamp(10px,2.2vw,12px)] whitespace-nowrap text-[rgba(255,255,255,0.8)]">
                      {m.display}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
