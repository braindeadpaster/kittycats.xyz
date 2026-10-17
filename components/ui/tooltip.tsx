import type { CSSProperties, ReactNode } from "react";

/**
 * Hover tooltip that matches the profile UID tooltip.
 * Always renders above the trigger (top placement).
 * Colors are fully customizable per element (see lib/profile-layout.ts).
 * Pass `count` for a template-style count pill next to (or instead of) the label.
 */
export default function Tooltip({
  label,
  count,
  background = "#18181b",
  border = "#2e2e31",
  color = "#ffffff",
  className,
  style,
  place = "top",
  children,
}: {
  label?: ReactNode;
  count?: ReactNode;
  background?: string;
  border?: string;
  color?: string;
  className?: string;
  style?: CSSProperties;
  place?: "top" | "bottom";
  children: ReactNode;
}) {
  return (
    <span
      className={`ptip ptip-${place}${className ? ` ${className}` : ""}`}
      style={style}
    >
      {children}

      <span
        className="ptip-bubble"
        style={{
          backgroundColor: background,
          borderColor: border,
          color,
        }}
      >
        {label != null && label !== "" ? (
          <span className="ptip-label">{label}</span>
        ) : null}
        {count !== undefined && count !== null ? (
          <span className="ptip-count">{count}</span>
        ) : null}
      </span>
    </span>
  );
}
