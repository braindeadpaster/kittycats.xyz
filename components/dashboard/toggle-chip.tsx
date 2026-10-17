"use client";

/**
 * Single shared dashboard toggle pill. Every on/off chip in the dashboard
 * uses this — same shape, same pink on / dark off, forever.
 */
export default function ToggleChip({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      onClick={onToggle}
      className={`inline-flex cursor-pointer items-center gap-[7px] rounded-md border-2 px-[13px] py-[7px] text-[14px] font-[500] transition-[0.2s] select-none ${
        active
          ? "border-pink-500/60 bg-pink-600/20 text-white"
          : "border-[#252525] bg-[#202020] text-[#c9c9c9] hover:border-[#303030]"
      }`}
    >
      {label}
    </div>
  );
}
