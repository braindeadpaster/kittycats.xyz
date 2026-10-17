import fs from "node:fs";
const html = fs.readFileSync("dashboardlinks.html", "utf8");
const classes = fs.readFileSync("_links_classes.txt", "utf8").trim().split("\n");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let found = 0;
const missing = [];
const css = fs.readFileSync("_links_css.txt", "utf8");
for (const c of classes) {
  const re = new RegExp("\\." + esc(c) + "(?=[^a-z0-9-])", "g");
  const rules = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const idx = m.index;
    const open = html.lastIndexOf("{", idx);
    const close = html.indexOf("}", idx);
    if (open === -1 || close === -1) continue;
    const selStart = html.lastIndexOf("}", open) + 1;
    let sel = html.slice(selStart, open).trim();
    let body = html.slice(open + 1, close).replace(/\s+/g, " ").trim();
    if (sel.startsWith("@")) sel = "(at-rule) " + sel.slice(0, 60);
    if (!sel.startsWith(".") && !sel.includes("GUNS__")) continue;
    rules.push(sel + " { " + body + " }");
  }
  if (rules.length) {
    found++;
    console.log("### " + c);
    console.log(rules.slice(0, 8).join("\n"));
    console.log();
  } else {
    missing.push(c);
  }
}
console.log("found:", found, "of", classes.length);
console.log("missing:", missing.join(", "));
