import { readFileSync, writeFileSync } from "node:fs";

const html = readFileSync("D:/vintage/biolink-main/V3Dashboard/_links_extract.html", "utf8");

const mainStart = html.indexOf('id="mainContent"');
const mainEnd = html.indexOf("next-route-announcer", mainStart);
const main = html.slice(mainStart, mainEnd > 0 ? mainEnd : undefined);

// count tile spans
const tileCount = (main.match(/GUNS__ba-7f5364ea/g) || []).length;
console.log("tile spans:", tileCount);

// extract tiles: each span GUNS__ba contains a div with GUNS__e3 + specific class, containing svg
const tiles = [];
const spanRe = /<span class="GUNS__ba-7f5364ea-c3a36c5d-b0f3d011 ">[\s\S]*?<\/span>/g;
let m;
while ((m = spanRe.exec(main)) !== null) {
  const spanHtml = m[0];
  const divClass = spanHtml.match(/<div class="([^"]+)"/);
  const classes = divClass ? divClass[1].split(/\s+/) : [];
  const specific = classes.filter((c) => c !== "GUNS__e3-6e7b4cbb-160a195b-071bb07c");
  const svg = spanHtml.match(/<svg[\s\S]*?<\/svg>/);
  tiles.push({
    classes: specific,
    svg: svg ? svg[0] : null,
  });
}
console.log("tiles parsed:", tiles.length);

// custom URL card (GUNS__15 tile) - find after last span
const customIdx = main.indexOf("GUNS__15-8ff57f3b");
console.log("custom card idx:", customIdx);
let custom = null;
if (customIdx > 0) {
  // find enclosing tag - search backwards for the opening element that contains it
  const before = main.slice(0, customIdx);
  const openTag = before.lastIndexOf("<div class=");
  // find matching close: walk braces-free approach - find the next "</div></div>" after svg end
  const after = main.slice(customIdx);
  const svgMatch = after.match(/<svg[\s\S]*?<\/svg>/);
  const end = svgMatch ? after.indexOf("</svg>") + 6 : after.indexOf("</div>") + 6;
  const frag = after.slice(0, end);
  // include the inner card div content (h1/h3) - extend to include following h1/h3 text
  let extended = frag;
  const hMatch = after.slice(end).match(/<div[^>]*>[\s\S]*?<h1>[\s\S]*?<\/h1>[\s\S]*?<h3>[\s\S]*?<\/h3>[\s\S]*?<\/div>/);
  if (hMatch) extended += hMatch[0];
  custom = {
    outerClass: main.slice(openTag, openTag + 120).match(/class="([^"]+)"/)?.[1] ?? null,
    html: extended,
  };
}
console.log("custom html len:", custom ? custom.html.length : 0);

// header (h1 + h3)
const headerMatch = main.match(/<div class="GUNS__75-1e5e3ba9[^"]*"[\s\S]*?<\/div>[\s\S]*?<\/div>/);
console.log("header found:", !!headerMatch);

writeFileSync(
  "D:/vintage/biolink-main/V3Dashboard/_links_svgs.json",
  JSON.stringify({ tileCount, tiles, custom, header: headerMatch ? headerMatch[0] : null }, null, 2)
);
console.log("written _links_svgs.json");
