"use client";

import { useEffect, useState } from "react";

export type ToastItem = { id: number; title: string; leaving?: boolean };

const toastStackLimit = 3;
const toastDurationMs = 4000;
let globalToasts: ToastItem[] = [];
const listeners = new Set<(next: ToastItem[]) => void>();

function emit() {
  listeners.forEach((listener) => listener([...globalToasts]));
}

export function showToast(title: string) {
  if (typeof window === "undefined") return;

  const nextToast = { id: Date.now() + Math.random(), title };
  globalToasts = [...globalToasts.slice(-(toastStackLimit - 1)), nextToast];
  emit();

  window.setTimeout(() => {
    globalToasts = globalToasts.map((toast) =>
      toast.id === nextToast.id ? { ...toast, leaving: true } : toast
    );
    emit();
  }, toastDurationMs - 400);

  window.setTimeout(() => {
    globalToasts = globalToasts.filter((toast) => toast.id !== nextToast.id);
    emit();
  }, toastDurationMs);
}

export function useToastStack() {
  const [toasts, setToasts] = useState<ToastItem[]>(globalToasts);

  useEffect(() => {
    const listener = (next: ToastItem[]) => setToasts(next);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    toasts,
    pushToast: showToast,
  };
}

export function ToastStack() {
  const { toasts } = useToastStack();

  if (!toasts.length) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-4 z-[200] flex w-full max-w-[calc(100vw-32px)] -translate-x-1/2 flex-col items-center gap-2">
      <style>{`@keyframes egirls-toast-in { from { opacity: 0; transform: translateY(-12px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }`}</style>
      {toasts.slice(-toastStackLimit).map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex w-fit max-w-full items-center gap-2.5 rounded-[999px] border border-[#135315] bg-[#103310]/70 py-2.5 pl-4 pr-5 backdrop-blur-md transition-all duration-300"
          style={{
            opacity: toast.leaving ? 0 : 1,
            transform: toast.leaving ? "translateY(-8px) scale(0.97)" : undefined,
            animation: toast.leaving ? undefined : "egirls-toast-in 240ms cubic-bezier(0.2, 0.75, 0.2, 1)",
          }}
        >
          <span className="grid size-6 shrink-0 place-content-center text-[#4ade80]">
            <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 1024 1024" className="size-5">
              <path fill="currentColor" d="M512 64a448 448 0 1 1 0 896a448 448 0 0 1 0-896m-55.808 536.384l-99.52-99.584a38.4 38.4 0 1 0-54.336 54.336l126.72 126.72a38.27 38.27 0 0 0 54.336 0l262.4-262.464a38.4 38.4 0 1 0-54.272-54.336z" />
            </svg>
          </span>
          <span className="truncate text-[14px] font-medium text-white">{toast.title}</span>
        </div>
      ))}
    </div>
  );
}
