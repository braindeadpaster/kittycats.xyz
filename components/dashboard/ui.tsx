import React from "react";

/** Shared design tokens for the new dashboard (feds-style dark UI). */

export const cardClass =
  "relative rounded-lg border border-white/[0.03] from-[#1a1a1a] to-[#131313] bg-gradient-to-br transition-all duration-500 before:absolute before:inset-0 before:-z-10 before:rounded-lg before:bg-gradient-to-b before:from-white/[0.02] before:to-transparent before:opacity-0 before:transition-opacity after:absolute after:inset-0 after:z-[-1] after:rounded-lg after:bg-gradient-to-t after:from-black/30 after:to-transparent";

export const tileClass =
  "group relative border border-white/[0.03] bg-gradient-to-br transition-all duration-500 before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-gradient-to-b before:from-white/[0.02] before:to-transparent before:opacity-0 before:transition-opacity after:absolute after:inset-0 after:z-[-1] after:rounded-md after:bg-gradient-to-t after:from-black/30 after:to-transparent from-[#1a1a1a] to-[#0a0a0a]";

export const btnBase =
  "inline-flex items-center text-base gap-2 whitespace-nowrap justify-center duration-300 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

export const btnSolid = `${btnBase} bg-pink-600 text-white hover:bg-pink-500 h-9 px-3 text-sm rounded-md`;

export const btnNeutral = `${btnBase} rounded-md border border-neutral-700 bg-neutral-800 text-foreground hover:bg-neutral-700 hover:border-neutral-600 h-9 px-3 text-sm`;

export const btnSoft = `${btnBase} rounded-md border border-pink-500/30 bg-pink-600/15 text-foreground hover:bg-pink-600/25 hover:border-pink-500/30 h-9 px-3 text-sm`;

export const btnGradient = `${btnBase} bg-[linear-gradient(135deg,#db2777,#9d174d)] text-white border border-pink-500/40 hover:opacity-90 h-9 px-3 text-sm rounded-md`;

export const inputClass =
  "hover:bg-input/50 transition-all duration-300 selection:bg-primary-600 selection:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed flex h-10 w-full min-w-0 rounded-md border border-input bg-input/30 px-3 py-1 text-base text-foreground outline-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/70 data-[invalid=true]:border-destructive data-[invalid=true]:ring-destructive/40";

export const formLabel =
  "text-sm text-foreground leading-none block peer-disabled:cursor-not-allowed peer-disabled:opacity-70 data-[error=true]:text-destructive";

export function Card({
  className = "",
  children,
  id,
}: {
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <div data-slot="card" id={id} className={`${cardClass} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  description,
  className = "",
  children,
}: {
  title?: string;
  description?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      data-slot="card-header"
      className={`@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 p-4 ${className}`}
    >
      {title ? (
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTile size="md">{children}</CardTile>
            <div data-slot="card-title" className="text-foreground text-lg leading-none font-semibold">
              {title}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-row items-center justify-between gap-2">{children}</div>
      )}
      {description ? (
        <div data-slot="card-description" className="text-muted-foreground text-sm">
          {description}
        </div>
      ) : null}
    </div>
  );
}

export function CardContent({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-slot="card-content" className={`p-4 space-y-4 pt-0 ${className}`}>
      {children}
    </div>
  );
}

export function CardTile({
  size = "md",
  className = "",
  children,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
  children?: React.ReactNode;
}) {
  const sizeClass =
    size === "sm"
      ? "size-8 rounded-md"
      : size === "lg"
        ? "size-12 rounded-md"
        : "size-10 rounded-md";
  return (
    <div className={`${tileClass} grid shrink-0 place-content-center ${sizeClass} ${className}`}>
      {children}
    </div>
  );
}

export function Divider({ className = "" }: { className?: string }) {
  return (
    <div data-orientation="horizontal" role="none" className={`relative shrink-0 ${className}`}>
      <div className="bg-black h-px w-full" />
      <div className="bg-white/10 h-px w-full" />
    </div>
  );
}

/** Shadcn-style switch. */
export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  label,
}: {
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      data-state={checked ? "checked" : "unchecked"}
      onClick={() => onCheckedChange(!checked)}
      disabled={disabled}
      className={`peer focus-visible:border-ring focus-visible:ring-ring/50 border-foreground/10 inline-flex h-[1.15rem] w-8 shrink-0 items-center rounded-full border transition-all outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-pink-600" : "bg-input"
      }`}
    >
      <span
        data-state={checked ? "checked" : "unchecked"}
        className={`bg-foreground pointer-events-none block size-4 rounded-full ring-0 transition-transform ${
          checked ? "translate-x-[calc(100%-2px)]" : "translate-x-0"
        }`}
      />
      <span className="sr-only">Toggle switch</span>
    </button>
  );
}

/** Toggle pill used for row-style options (Enhancements section). */
export function ToggleCard({
  label,
  checked,
  onCheckedChange,
  icon,
  activeIcon = false,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
  icon?: React.ReactNode;
  activeIcon?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`bg-input/30 border-foreground/5 border flex items-center justify-between gap-2.5 rounded-md p-3 whitespace-nowrap ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-2.5">
        {icon ? (
          <div className={activeIcon ? "text-primary" : "text-foreground/70"}>
            {icon}
          </div>
        ) : null}
        <label className="text-sm text-foreground leading-none block peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-medium">
          {label}
        </label>
      </div>
      <div className="ml-4">
        <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} label={label} />
      </div>
    </div>
  );
}
