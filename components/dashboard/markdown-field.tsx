"use client";

import { useRef } from "react";
import { escapeHtml, renderInline } from "@/components/profile/markdown";

/**
 * Markdown editor for the profile description with live in-place rendering.
 * A transparent textarea sits on top of a rendered layer with identical
 * metrics, so typing "# h1" instantly shows an H1 right in the editing area.
 * Toolbar buttons wrap the selection (or prefix the line for headings/quotes).
 */

interface MarkdownAction {
  label: string;
  title: string;
  before: string;
  after: string;
  /** Prefix each line of the selection instead of wrapping it. */
  line?: boolean;
}

const ACTIONS: MarkdownAction[] = [
  { label: "H1", title: "Heading 1", before: "# ", after: "", line: true },
  { label: "H2", title: "Heading 2", before: "## ", after: "", line: true },
  { label: "H3", title: "Heading 3", before: "### ", after: "", line: true },
  { label: "H4", title: "Heading 4", before: "#### ", after: "", line: true },
  { label: "H5", title: "Heading 5", before: "##### ", after: "", line: true },
  { label: "H6", title: "Heading 6", before: "###### ", after: "", line: true },
  { label: "B", title: "Bold", before: "**", after: "**" },
  { label: "I", title: "Italic", before: "*", after: "*" },
  { label: "B/I", title: "Bold Italic", before: "***", after: "***" },
  { label: "S", title: "Strikethrough", before: "~~", after: "~~" },
  { label: "U", title: "Underline", before: "++", after: "++" },
  { label: "</>", title: "Inline Code", before: "`", after: "`" },
  { label: "sub", title: "Subscript", before: "~", after: "~" },
  { label: "sup", title: "Superscript", before: "^", after: "^" },
  { label: "hl", title: "Highlight", before: "==", after: "==" },
  { label: "❝", title: "Blockquote", before: "> ", after: "", line: true },
];

/** Every line occupies exactly this many px in BOTH layers so the caret stays aligned. */
const LINE_HEIGHT = 24;

const HEADING_STYLES: Record<number, { fontSize: number; weight: number }> = {
  1: { fontSize: 20, weight: 800 },
  2: { fontSize: 17.5, weight: 700 },
  3: { fontSize: 16, weight: 700 },
  4: { fontSize: 15, weight: 700 },
  5: { fontSize: 15, weight: 700 },
  6: { fontSize: 15, weight: 700 },
};

function applyWrap(value: string, start: number, end: number, before: string, after: string) {
  const selected = value.slice(start, end);
  const next = value.slice(0, start) + before + selected + after + value.slice(end);
  const caret = selected ? start + before.length + selected.length : start + before.length;
  return { next, caret };
}

function applyLine(value: string, start: number, end: number, prefix: string) {
  if (start === end) {
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    return {
      next: value.slice(0, lineStart) + prefix + value.slice(lineStart),
      caret: start + prefix.length,
    };
  }
  const selectionLineStart = value.lastIndexOf("\n", start - 1) + 1;
  const selected = value.slice(selectionLineStart, end);
  const prefixed = selected
    .split("\n")
    .map((line) => prefix + line)
    .join("\n");
  return {
    next: value.slice(0, selectionLineStart) + prefixed + value.slice(end),
    caret: selectionLineStart + prefixed.length,
  };
}

/** One raw markdown line rendered with fixed line-height so both layers stay aligned. */
function RenderedLine({ raw }: { raw: string }) {
  const style = { lineHeight: `${LINE_HEIGHT}px` };

  const heading = raw.match(/^(#{1,6})\s+(.*)$/);
  if (heading) {
    const h = HEADING_STYLES[heading[1].length] ?? HEADING_STYLES[6];
    return (
      <div
        style={{ ...style, fontSize: `${h.fontSize}px`, fontWeight: h.weight }}
        dangerouslySetInnerHTML={{ __html: renderInline(escapeHtml(heading[2])) }}
      />
    );
  }

  const quote = raw.match(/^>\s?(.*)$/);
  if (quote) {
    return (
      <div
        style={{
          ...style,
          borderLeft: "3px solid rgba(255, 255, 255, 0.25)",
          paddingLeft: "0.75em",
          color: "rgba(255, 255, 255, 0.75)",
        }}
        dangerouslySetInnerHTML={{ __html: renderInline(escapeHtml(quote[1])) }}
      />
    );
  }

  if (raw === "") {
    return <div style={style}>{"\u00A0"}</div>;
  }

  return <div style={style} dangerouslySetInnerHTML={{ __html: renderInline(escapeHtml(raw)) }} />;
}

export default function MarkdownField({
  value,
  onChange,
  maxLength,
  rows = 3,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  maxLength?: number;
  rows?: number;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const underRef = useRef<HTMLDivElement>(null);

  function run(action: MarkdownAction) {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const { next, caret } = action.line
      ? applyLine(value, start, end, action.before)
      : applyWrap(value, start, end, action.before, action.after);
    const capped = maxLength != null ? next.slice(0, maxLength) : next;
    onChange(capped);
    requestAnimationFrame(() => {
      el.focus();
      const pos = Math.min(caret, capped.length);
      el.setSelectionRange(pos, pos);
    });
  }

  function syncScroll() {
    if (underRef.current && ref.current) {
      underRef.current.scrollTop = ref.current.scrollTop;
    }
  }

  const lines = value.split("\n");
  const boxClass =
    "min-h-[80px] w-full rounded-b-[15px] border-2 border-t-0 border-transparent px-3 py-2.5 text-[15px]";

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-1 rounded-t-[15px] bg-[#0c0c0c] px-2.5 pb-1.5 pt-2">
        {ACTIONS.map((a) => (
          <button
            key={a.title}
            type="button"
            title={a.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(a)}
            className="cursor-pointer rounded-[7px] border border-[#242424] bg-[#151515] px-[7px] py-[3px] text-[11.5px] font-semibold leading-[1.4] text-[#c9c9c9] transition hover:border-[#333] hover:bg-[#1e1e1e] hover:text-white active:translate-y-[1px]"
          >
            {a.label}
          </button>
        ))}
      </div>
      <div className="relative">
        {/* rendered layer — what the markdown looks like live */}
        <div
          ref={underRef}
          aria-hidden="true"
          className={`markdown-body pointer-events-none overflow-hidden bg-[#0c0c0c] text-[#eee] ${boxClass}`}
          style={{
            lineHeight: `${LINE_HEIGHT}px`,
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
          }}
        >
          {lines.map((raw, i) => (
            <RenderedLine key={i} raw={raw} />
          ))}
        </div>
        {/* editing layer — transparent text, visible caret */}
        <textarea
          ref={ref}
          onScroll={syncScroll}
          autoCorrect="off"
          maxLength={maxLength}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`absolute inset-0 h-full resize-none bg-transparent text-transparent caret-[#f7f7f7] outline-none transition-[0.3s] placeholder:text-[#4a4a4a] select-text hover:border-[#191919] focus:border-[#2a2a2a] ${boxClass} rounded-t-none border-t-0`}
        />
      </div>
    </div>
  );
}