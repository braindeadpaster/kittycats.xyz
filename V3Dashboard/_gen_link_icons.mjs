import { readFileSync, writeFileSync } from "node:fs";

const j = JSON.parse(readFileSync("D:/vintage/biolink-main/V3Dashboard/_links_svgs.json", "utf8"));

const NAMES = [
  ["Snapchat", "#fffc00"], ["YouTube", "#ff0000"], ["Discord", "#5865f2"], ["Spotify", "#1ed760"],
  ["Instagram", "#e4405f"], ["X", "#ffffff"], ["TikTok", "#69c9d0"], ["Telegram", "#229ed9"],
  ["SoundCloud", "#ff5500"], ["PayPal", "#0070ba"], ["GitHub", "#ffffff"], ["Roblox", "#ffffff"],
  ["CashApp", "#00d632"], ["Venmo", "#3d95ce"], ["PlayStation", "#0070d1"], ["Xbox", "#107c10"],
  ["Apple Music", "#fa243c"], ["GitLab", "#fc6d26"], ["Twitch", "#9146ff"], ["Reddit", "#ff4500"],
  ["VK", "#0077ff"], ["Tellonym", "#2f4d7a"], ["Bluesky", "#0285ff"], ["NameMC", "#6aa84f"],
  ["OnlyFans", "#00aff0"], ["LinkedIn", "#0a66c2"], ["Steam", "#ffffff"], ["Kick", "#53fc18"],
  ["Pinterest", "#bd081c"], ["LastFM", "#d51007"], ["stats.fm", "#1db954"], ["Payhip", "#4c8bf5"],
  ["Buy Me a Coffee", "#ffdd00"], ["Ko-fi", "#ff5e5b"], ["Facebook", "#1877f2"], ["Threads", "#ffffff"],
  ["Signal", "#3a76f0"], ["Patreon", "#ff424d"], ["Ethereum", "#627eea"], ["Bitcoin", "#f7931a"],
  ["Monero", "#ff6600"], ["Litecoin", "#bfbbbb"], ["XRP", "#ffffff"], ["Solana", "#14f195"],
  ["Email", "#ffffff"],
];

if (NAMES.length !== 45) throw new Error("expected 45 names, got " + NAMES.length);
if (j.tiles.length !== 46) throw new Error("expected 46 tiles, got " + j.tiles.length);

const customSvg = j.tiles[45].svg.match(/<svg[\s\S]*?<\/svg>/)?.[0];
if (!customSvg) throw new Error("custom svg missing");

const lines = [];
lines.push(`export interface V3LinkPlatform {`);
lines.push(`  name: string;`);
lines.push(`  color: string;`);
lines.push(`  svg: string;`);
lines.push(`}`);
lines.push(``);
lines.push(`export const v3LinkPlatforms: V3LinkPlatform[] = [`);
j.tiles.slice(0, 45).forEach((t, i) => {
  const [name, color] = NAMES[i];
  const svg = t.svg.match(/<svg[\s\S]*?<\/svg>/)?.[0];
  if (!svg) throw new Error("svg missing at " + i);
  lines.push(`  { name: ${JSON.stringify(name)}, color: ${JSON.stringify(color)}, svg: ${JSON.stringify(svg)} },`);
});
lines.push(`];`);
lines.push(``);
lines.push(`export const v3LinkCustomSvg = ${JSON.stringify(customSvg)};`);
lines.push(``);

writeFileSync("D:/vintage/biolink-main/components/dashboard/v3-link-icons.ts", lines.join("\n"));
console.log("written v3-link-icons.ts,", lines.length, "lines");
