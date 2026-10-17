import type { CSSProperties } from "react";

/**
 * Tiny safe markdown renderer for profile descriptions.
 * HTML is escaped first, then a fixed set of rules is applied:
 * headings, blockquote, bold, italic, bold+italic, strikethrough,
 * underline (++), inline code, subscript, superscript, highlight (==).
 */

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderInline(src: string): string {
  const codes: string[] = [];
  let out = src.replace(/`([^`\n]+)`/g, (_, code: string) => {
    codes.push(`<code>${code}</code>`);
    return `%%CODE${codes.length - 1}%%`;
  });

  out = out
    .replace(/\*\*\*([\s\S]+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>")
    .replace(/(?<!\w)_([^_\n]+)_(?!\w)/g, "<em>$1</em>")
    .replace(/~~([\s\S]+?)~~/g, "<del>$1</del>")
    .replace(/\+\+([\s\S]+?)\+\+/g, "<u>$1</u>")
    .replace(/==([\s\S]+?)==/g, "<mark>$1</mark>")
    .replace(/\^([^^]+)\^/g, "<sup>$1</sup>")
    .replace(/~([^~\n]+)~/g, "<sub>$1</sub>");

  out = out.replace(/%%CODE(\d+)%%/g, (_, i: string) => codes[Number(i)] ?? "");
  return out;
}

export function renderMarkdown(text: string): string {
  const lines = escapeHtml(text ?? "").split("\n");
  const html: string[] = [];
  let quote: string[] = [];

  const flushQuote = () => {
    if (quote.length > 0) {
      html.push(`<blockquote>${quote.map((l) => renderInline(l)).join("<br/>")}</blockquote>`);
      quote = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^\s*$/.test(line)) {
      flushQuote();
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushQuote();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }
    const q = line.match(/^>\s?(.*)$/);
    if (q) {
      quote.push(q[1]);
      continue;
    }
    flushQuote();
    html.push(`<p>${renderInline(line)}</p>`);
  }
  flushQuote();
  return html.join("");
}

export default function MarkdownText({
  text,
  className = "",
  style,
}: {
  text: string;
  className?: string;
  style?: CSSProperties;
}) {
  if (!text || !text.trim()) return null;
  return (
    <div
      className={`markdown-body ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(text) }}
    />
  );
}
