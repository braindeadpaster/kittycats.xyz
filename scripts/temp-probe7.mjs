process.loadEnvFile();
import { SignJWT } from "jose";
const port = 9300 + Math.floor(Math.random() * 400);
const spawn = (await import("node:child_process")).spawn;
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new","--no-first-run","--disable-gpu",`--remote-debugging-port=${port}`,"--window-size=1440,900","--user-data-dir=" + process.env.TEMP + "/chr-probe7-" + Date.now(),"about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getWs() { for (let i = 0; i < 50; i++) { try { const res = await fetch(`http://127.0.0.1:${port}/json/list`); const t = await res.json(); const p = t.find((x) => x.type === "page"); if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl; } catch {} await sleep(200); } throw new Error("no ws"); }
const ws = new WebSocket(await getWs());
await new Promise((r) => (ws.onopen = r));
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { const mid = ++id; pending.set(mid, r); ws.send(JSON.stringify({ id: mid, method, params })); });
const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const token = await new SignJWT({ sub: "1" }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("1h").sign(secret);
await send("Network.enable");
await send("Network.setCookie", { name: "session", value: token, url: "http://localhost:3000", httpOnly: true });
await send("Page.enable");
await send("Page.navigate", { url: "http://localhost:3000/dashboard/badges" });
await sleep(3500);
const evalJs = async (expression) => { const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); return res.result?.result?.value; };
const results = {};

await evalJs(`(() => { const s = Array.from(document.querySelectorAll("span")).find(s => s.textContent.includes("Preview Custom Badge")); s.click(); })()`);
await sleep(700);
results.popup = await evalJs(`(() => { const d = document.querySelector("div.fixed.inset-0 div[class*='v3-pop']"); return d ? { exists: true, heading: d.querySelector("h2")?.textContent, hasFileInput: !!d.querySelector("input[type='file']") } : { exists: false }; })()`);

results.upload = await evalJs(`(async () => {
  const inp = document.querySelector("div.fixed.inset-0 input[type='file']");
  if (!inp) return "no input";
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const bin = atob(b64); const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const file = new File([arr], "test.png", { type: "image/png" });
  const dt = new DataTransfer(); dt.items.add(file);
  inp.files = dt.files;
  inp.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise(r => setTimeout(r, 400));
  const img = document.querySelector("div.fixed.inset-0 img[src^='blob:']");
  const badgeText = document.querySelector("div.fixed.inset-0")?.textContent.includes("Custom Badge");
  const placeholder = document.querySelector("div.fixed.inset-0")?.textContent.includes("Please upload");
  return { imgFound: !!img, badgeNameShown: badgeText, placeholderGone: !placeholder };
})()`);

await evalJs(`(() => { const b = document.querySelector("div.fixed.inset-0"); b.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); })()`);
await sleep(500);
results.popupClosed = await evalJs(`!document.querySelector("div.fixed.inset-0")`);

console.log(JSON.stringify(results, null, 2));
chrome.kill();
process.exit(0);
