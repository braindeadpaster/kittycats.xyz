import fs from "node:fs";
let html = fs.readFileSync("_settings_extract.html", "utf8");
const start = html.indexOf('id="mainContent"');
const end = html.indexOf("</body>", start);
const seg = html.slice(start, end > start ? end : html.length);

// Simple tokenizer: walk tags and text with depth
const re = /<(\/?)([a-zA-Z0-9]+)((?:"[^"]*"|'[^']*'|[^>"'])*)>|([^<]+)/g;
let m, depth = 0, out = [];
const selfClosing = new Set(["input", "img", "br", "hr", "meta", "link", "path", "svg", "circle", "rect"]);
while ((m = re.exec(seg)) !== null) {
  if (m[4] !== undefined) {
    const t = m[4].replace(/\s+/g, " ").trim();
    if (t) out.push("  ".repeat(depth) + "T: " + t.slice(0, 90));
    continue;
  }
  const closing = m[1] === "/";
  const tag = m[2].toLowerCase();
  let attrs = m[3] || "";
  const cls = (attrs.match(/class="([^"]+)"/) || [])[1] || "";
  const short = cls.split(/\s+/).map((c) => (c.startsWith("GUNS__") ? c.split("-")[1] : c)).join(" ");
  const data = (attrs.match(/data-dashboard-feature-label="([^"]+)"/) || [])[1] || "";
  const type = (attrs.match(/type="([^"]+)"/) || [])[1] || "";
  const value = (attrs.match(/value="([^"]*)"/) || [])[1] || "";
  const ph = (attrs.match(/placeholder="([^"]*)"/) || [])[1] || "";
  const role = (attrs.match(/role="([^"]+)"/) || [])[1] || "";
  if (closing) {
    depth = Math.max(0, depth - 1);
    if (!selfClosing.has(tag)) continue;
  }
  const extra = [data && "label=" + data, type && "type=" + type, value && "value=" + value.slice(0, 30), ph && "ph=" + ph, role && "role=" + role]
    .filter(Boolean)
    .join(" ");
  if (tag === "svg") {
    out.push("  ".repeat(depth) + "<svg>");
    depth++;
    continue;
  }
  out.push("  ".repeat(depth) + `<${tag}${short ? " [" + short + "]" : ""}${extra ? " " + extra : ""}>`);
  if (!selfClosing.has(tag)) depth++;
  else if (tag === "svg") depth--;
}
fs.writeFileSync("_settings_tree.txt", out.join("\n"));
console.log(out.slice(0, 120).join("\n"));
