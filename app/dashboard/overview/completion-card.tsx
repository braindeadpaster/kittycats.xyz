"use client";

import { useState } from "react";
import { V3Icon } from "@/components/dashboard/v3-icons";

export interface CompletionItem {
  label: string;
  icon: string;
  href: string;
  done: boolean;
}

const STORAGE_KEY = "overview-completion-open";

export default function CompletionCard({
  completionPct,
  items,
}: {
  completionPct: number;
  items: CompletionItem[];
}) {
  const [open, setOpen] = useState(() => {
    try {
      if (typeof window === "undefined") return true;
      return window.localStorage.getItem(STORAGE_KEY) !== "0";
    } catch {
      return true;
    }
  });

  function toggle() {
    setOpen((prev) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, prev ? "0" : "1");
      } catch {
        // ignore
      }
      return !prev;
    });
  }

  return (
    <div className="w-full min-w-0 flex-1 rounded-lg border border-[#1e1e1e] bg-[#111111] p-5">
      <div className="flex flex-col gap-[10px]">
        <div className="mb-[10px] flex items-center justify-between gap-2">
          <h1 className="m-0 text-[19px] text-[#fafafa]">Profile Completion</h1>
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-label={open ? "Collapse profile completion" : "Expand profile completion"}
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md border border-[#2a2a2a] bg-[#1a1a1a] text-[#bebebe] transition hover:border-pink-500/50 hover:text-white"
          >
            <V3Icon
              name="chevron-down"
              className={`size-[18px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
        </div>
        <div className="flex items-center gap-[12px]">
          <div className="h-[18px] w-full min-w-0 flex-1 overflow-hidden rounded-full border border-[#232323] bg-[#1b1b1b]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#db2777] to-[#f472b6] transition-all duration-500"
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <span className="shrink-0 text-[14px] whitespace-nowrap tabular-nums text-[#a1a1a1]">
            {completionPct}% completed
          </span>
        </div>
        {completionPct < 100 ? (
          <div className="mt-[10px] rounded-lg border-2 border-[#202020] bg-[#1a1a1a] p-[15px]">
            <h1 className="m-0 flex items-center gap-[7px] text-[19px] font-medium text-[#fafafa]">
              <V3Icon name="alert" className="size-[25px] text-[#f1a342]" />
              Your profile isn&apos;t complete yet!
            </h1>
            <h3 className="m-0 mt-[5px] text-[15px] font-[450] text-[#a1a1a1]">
              Complete your profile to make it more discoverable and appealing.
            </h3>
          </div>
        ) : null}
      </div>
      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="mt-5 flex flex-col gap-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex w-full items-center justify-between gap-[7px] rounded-md border-2 border-[#202020] bg-[#1a1a1a] p-[10px_12px] transition-colors hover:border-[#2c2c2c]"
              >
                <div className="flex min-w-0 items-center">
                  <span className={`grid size-8 shrink-0 place-content-center rounded-md ${item.done ? "bg-pink-600/25 text-pink-300" : "bg-[#222] text-[#707070]"}`}>
                    <V3Icon name={item.icon} className="size-[18px]" />
                  </span>
                  <h1 className="m-0 truncate px-[10px] text-[15px] font-medium text-[#fafafa]">
                    {item.label}
                  </h1>
                </div>
                <a
                  href={item.href}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-full border border-[#2a2a2a] px-3 py-1 text-[12px] text-[#b6b6b6] no-underline transition hover:border-[#3a3a3a] hover:text-white"
                  aria-label={item.label}
                >
                  {item.done ? "Done" : "Go"}
                  <V3Icon name="chevron-right" className="size-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
