"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import {
  btnNeutral,
  btnSolid,
  Card,
  CardContent,
  formLabel,
  inputClass,
  Switch,
} from "@/components/dashboard/ui";
import { useToastStack } from "@/components/ui/toast-stack";
import type { WidgetState } from "@/lib/widget-types";

interface WidgetMeta {
  type: string;
  label: string;
  color: string;
  description: string;
}

const WIDGET_META: WidgetMeta[] = [
  {
    type: "clock",
    label: "Timezone",
    color: "rgb(14, 165, 233)",
    description: "A live clock on your profile.",
  },
  {
    type: "weather",
    label: "Weather",
    color: "rgb(245, 158, 11)",
    description: "Show the weather in your city.",
  },
  {
    type: "lanyard",
    label: "Discord",
    color: "rgb(88, 101, 242)",
    description: "Your live Discord status.",
  },
  {
    type: "valorant",
    label: "Valorant",
    color: "rgb(255, 70, 85)",
    description: "Your Valorant rank and stats.",
  },
];

const WIDGET_ICONS: Record<string, React.ReactNode> = {
  clock: (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  weather: (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  ),
  lanyard: (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
      <path d="M8 12h.01" />
      <path d="M12 12h.01" />
      <path d="M16 12h.01" />
    </svg>
  ),
  valorant: (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="2" y2="22" />
      <line x1="2" x2="22" y1="12" y2="12" />
    </svg>
  ),
};

function SkeletonWidgets() {
  return (
    <div className="animate-fade-in h-36 w-full max-w-64 overflow-hidden [mask-image:linear-gradient(transparent,black_10%,black_90%,transparent)] px-4">
      <div className="animate-scroll-y flex flex-col gap-y-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-muted w-full rounded-md border">
            <div className="flex items-center justify-between p-2">
              <div className="flex items-center gap-2">
                <div className="bg-accent relative size-8 rounded-md" />
                <div className="flex flex-col gap-1">
                  <div className="bg-accent h-2.5 w-12 rounded-sm" />
                  <div className="bg-accent h-2.5 w-20 rounded-sm" />
                </div>
              </div>
              <div className="bg-accent size-4 rounded-sm" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WidgetsClient({ widgets }: { widgets: WidgetState[] }) {
  const router = useRouter();
  const { pushToast } = useToastStack();

  const [state, setState] = useState<WidgetState[]>(widgets);
  const [busy, setBusy] = useState(false);

  const [dialogMounted, setDialogMounted] = useState(false);
  const [dialogShown, setDialogShown] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);

  const openDialog = (type: string) => {
    setActiveType(type);
    setDialogMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setDialogShown(true)));
  };

  const closeDialog = useCallback(() => {
    setDialogShown(false);
    window.setTimeout(() => setDialogMounted(false), 250);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [closeDialog]);

  async function persist(next: WidgetState[]) {
    setBusy(true);
    try {
      const response = await fetch("/api/widgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: next }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.error ?? "Could not save widgets.");
      }
      setState(data.widgets ?? next);
      router.refresh();
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Could not save widgets.");
    } finally {
      setBusy(false);
    }
  }

  const activeMeta = activeType ? WIDGET_META.find((m) => m.type === activeType) : null;
  const activeState = activeType ? state.find((w) => w.type === activeType) : null;
  const enabledCount = state.filter((w) => w.enabled).length;

  const enabled = state.filter((w) => w.enabled);

  return (
    <div className="space-y-6">
      <nav className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {WIDGET_META.map((meta) => {
          const widget = state.find((w) => w.type === meta.type);
          const isEnabled = !!widget?.enabled;
          return (
            <button
              key={meta.type}
              type="button"
              title={meta.label}
              onClick={() => openDialog(meta.type)}
              className={`flex min-h-16 items-center gap-3 rounded-lg px-3 py-2.5 text-white duration-300 hover:opacity-85 ${
                isEnabled ? "ring-2 ring-white/40 ring-offset-2 ring-offset-transparent" : ""
              }`}
              style={{ backgroundColor: meta.color }}
            >
              <span className="bg-white/15 grid size-9 shrink-0 place-items-center rounded-md">
                {WIDGET_ICONS[meta.type]}
              </span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium">{meta.label}</span>
                <span className="flex items-center gap-1 text-xs text-white/75">
                  {isEnabled ? (
                    <>
                      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Added
                    </>
                  ) : (
                    <>
                      <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                      Add widget
                    </>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      {enabled.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-6 py-10 md:min-h-[400px]">
            <SkeletonWidgets />
            <div className="max-w-sm text-center text-pretty">
              <span className="text-foreground text-base font-medium">No Widgets Found</span>
              <p className="mt-2 text-sm text-pretty text-white/50">
                Widgets are a great way to add dynamic content and integrate
                your other platforms to your page.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {enabled.map((widget) => {
            const meta = WIDGET_META.find((m) => m.type === widget.type);
            if (!meta) return null;
            return (
              <div
                key={widget.type}
                className="border-foreground/5 bg-input/30 flex items-center justify-between gap-3 rounded-xl border p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div
                    className="relative grid size-9 shrink-0 place-items-center rounded-lg text-white"
                    style={{ backgroundColor: meta.color }}
                  >
                    {WIDGET_ICONS[widget.type]}
                    <div className="absolute right-0 bottom-0 z-10 size-2 rounded-full bg-green-500" />
                    <div className="absolute right-0 bottom-0 z-10 size-2 animate-ping rounded-full bg-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-foreground truncate text-sm font-medium">{meta.label}</p>
                    <p className="text-muted-foreground truncate text-xs">{meta.description}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Switch
                    checked
                    onCheckedChange={(checked) =>
                      persist(
                        state.map((w) =>
                          w.type === widget.type ? { ...w, enabled: checked } : w
                        )
                      )
                    }
                    label={`Disable ${meta.label}`}
                  />
                  <button
                    type="button"
                    aria-label={`Remove ${meta.label}`}
                    disabled={busy}
                    onClick={() =>
                      persist(
                        state.map((w) =>
                          w.type === widget.type ? { ...w, enabled: false } : w
                        )
                      )
                    }
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 grid size-8 place-items-center rounded-lg transition-colors disabled:opacity-50"
                  >
                    <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {dialogMounted && activeMeta && activeState
        ? createPortal(
            <WidgetDialog
              shown={dialogShown}
              busy={busy}
              meta={activeMeta}
              state={activeState}
              enabledCount={enabledCount}
              onClose={closeDialog}
              onConfirm={(config) =>
                persist(
                  state.map((w) =>
                    w.type === activeMeta.type ? { ...w, enabled: true, config } : w
                  )
                ).then(() => {
                  pushToast(`${activeMeta.label} widget added!`);
                  closeDialog();
                })
              }
            />,
            document.body
          )
        : null}
    </div>
  );
}

function WidgetDialog({
  shown,
  busy,
  meta,
  state,
  enabledCount,
  onClose,
  onConfirm,
}: {
  shown: boolean;
  busy: boolean;
  meta: WidgetMeta;
  state: WidgetState;
  enabledCount: number;
  onClose: () => void;
  onConfirm: (config: Record<string, string>) => void;
}) {
  const [city, setCity] = useState(state.config.city ?? "");
  const [units, setUnits] = useState(state.config.units ?? "celsius");
  const [discordId, setDiscordId] = useState(state.config.discordId ?? "");
  const [riotId, setRiotId] = useState(
    state.config.riotId ??
      (state.config.name && state.config.tag
        ? `${state.config.name}#${state.config.tag}`
        : "")
  );
  const [format, setFormat] = useState(state.config.format ?? "24");

  const atLimit = enabledCount >= 4 && !state.enabled;

  const canConfirm = (() => {
    switch (meta.type) {
      case "clock":
        return true;
      case "weather":
        return city.trim().length > 0;
      case "lanyard":
        return discordId.trim().length > 0;
      case "valorant":
        return riotId.trim().length > 0;
      default:
        return false;
    }
  })();

  const buildConfig = (): Record<string, string> => {
    switch (meta.type) {
      case "clock":
        return { format };
      case "weather":
        return { city: city.trim(), units };
      case "lanyard":
        return { discordId: discordId.trim() };
      case "valorant":
        return { riotId: riotId.trim() };
      default:
        return {};
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-250 ease-out ${
        shown ? "opacity-100" : "opacity-0"
      }`}
    >
      <div onClick={onClose} className="absolute inset-0 bg-black/80" />
      <div
        className={`relative w-full max-w-md transform-gpu rounded-lg border border-white/[0.03] bg-gradient-to-br from-[#1a1a1a] to-[#131313] p-5 transition-[transform,opacity] duration-250 ease-out will-change-transform ${
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-95 opacity-0"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-lg text-white"
              style={{ backgroundColor: meta.color }}
            >
              {WIDGET_ICONS[meta.type]}
            </span>
            <div>
              <h3 className="text-foreground text-base font-semibold">{meta.label}</h3>
              <p className="text-muted-foreground mt-0.5 text-xs">{meta.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-white/40 hover:bg-white/5 hover:text-white flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {meta.type === "clock" ? (
            <div className="space-y-2">
              <label className={formLabel} htmlFor="clock-format">
                Time format
              </label>
              <select
                id="clock-format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className={inputClass}
              >
                <option value="24">24-hour</option>
                <option value="12">12-hour</option>
              </select>
            </div>
          ) : null}

          {meta.type === "weather" ? (
            <>
              <div className="space-y-2">
                <label className={formLabel} htmlFor="weather-city">
                  City
                </label>
                <input
                  id="weather-city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="London"
                  maxLength={60}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className={formLabel} htmlFor="weather-units">
                  Units
                </label>
                <select
                  id="weather-units"
                  value={units}
                  onChange={(e) => setUnits(e.target.value)}
                  className={inputClass}
                >
                  <option value="celsius">Celsius</option>
                  <option value="fahrenheit">Fahrenheit</option>
                </select>
              </div>
            </>
          ) : null}

          {meta.type === "lanyard" ? (
            <div className="space-y-2">
              <label className={formLabel} htmlFor="lanyard-id">
                Discord user ID
              </label>
              <input
                id="lanyard-id"
                value={discordId}
                onChange={(e) => setDiscordId(e.target.value.replace(/\D/g, ""))}
                placeholder="123456789012345678"
                maxLength={20}
                inputMode="numeric"
                className={inputClass}
              />
              <p className="text-muted-foreground text-xs">
                Enable developer mode in Discord to copy your user ID.
              </p>
            </div>
          ) : null}

          {meta.type === "valorant" ? (
            <div className="space-y-2">
              <label className={formLabel} htmlFor="valorant-riot">
                Riot ID
              </label>
              <input
                id="valorant-riot"
                value={riotId}
                onChange={(e) => setRiotId(e.target.value)}
                placeholder="Name#TAG"
                maxLength={40}
                className={inputClass}
              />
            </div>
          ) : null}

          {atLimit ? (
            <p className="text-destructive text-xs">
              You can enable at most 4 widgets. Remove one first.
            </p>
          ) : null}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className={`${btnNeutral} w-fit`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(buildConfig())}
            disabled={busy || !canConfirm || atLimit}
            className={btnSolid}
          >
            {busy ? "Saving…" : state.enabled ? "Update" : "Add widget"}
          </button>
        </div>
      </div>
    </div>
  );
}
