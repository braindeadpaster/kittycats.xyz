import fs from "node:fs";
const html = fs.readFileSync("dashboardlinks.html", "utf8");
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/gi)];
console.log("style blocks:", styles.length, styles.map((s) => s[0].length));
const links = [...html.matchAll(/rel="stylesheet"[^>]*href="([^"]+)"/gi)];
console.log("sheet links:", links.length, links.slice(0, 12).map((l) => l[1]));
const classes = fs.readFileSync("_links_classes.txt", "utf8").trim().split("\n");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
let found = 0;
const missing = [];
for (const c of classes) {
  const re = new RegExp("GUNS__" + esc(c) + "[^}]*\\{[^}]*\\}", "g");
  if ((html.match(re) || []).length) found++;
  else missing.push(c);
}
console.log("classes with inline rules in raw dump:", found, "of", classes.length);
console.log("missing:", missing.join(", "));
