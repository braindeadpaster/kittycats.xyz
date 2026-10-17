import fs from "node:fs";
const classes = fs.readFileSync("_customize_classes.txt", "utf8").trim().split("\n");
const cssFiles = fs.readdirSync(".").filter((f) => f.endsWith(".css"));
let css = "";
for (const f of cssFiles) css += fs.readFileSync(f, "utf8") + "\n";
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const out = [];
for (const c of classes) {
  const re = new RegExp("\\." + esc(c) + "(?=[^a-z0-9-])", "g");
  let rules = [];
  let m;
  while ((m = re.exec(css)) !== null) {
    const idx = m.index;
    const open = css.lastIndexOf("{", idx);
    const close = css.indexOf("}", idx);
    if (open === -1 || close === -1) continue;
    const selStart = css.lastIndexOf("}", open) + 1;
    let sel = css.slice(selStart, open).trim();
    let body = css.slice(open + 1, close).replace(/\s+/g, " ").trim();
    if (sel.startsWith("@")) sel = "(at-rule) " + sel.slice(0, 60);
    rules.push(sel + " { " + body + " }");
  }
  out.push("### " + c + "\n" + (rules.length ? rules.join("\n") : "  (none)"));
}
fs.writeFileSync("_customize_css.txt", out.join("\n\n"));
console.log("rules found:", out.filter((x) => !x.includes("(none)")).length, "of", classes.length);
