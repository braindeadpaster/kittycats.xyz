import { spawn } from "node:child_process";
process.loadEnvFile();
const { SignJWT } = await import("jose");
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-dev-secret-change-me");
const token = await new SignJWT({}).setSubject("1").setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9334 + Math.floor(Math.random() * 500);
const profile = process.env.TEMP + "/v3probe-" + Date.now();
const proc = spawn(chrome, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1440,900", `--remote-debugging-port=${port}`, "--user-data-dir=" + profile, "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let wsUrl;
for (let i = 0; i < 40; i++) {
  try {
    const pages = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const page = pages.find((p) => p.type === "page");
    if (page) { wsUrl = page.webSocketDebuggerUrl; break; }
  } catch {}
  await sleep(250);
}
const ws = new WebSocket(wsUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
function send(method, params = {}) {
  return new Promise((resolve) => {
    const mid = ++id;
    pending.set(mid, resolve);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });
}
await send("Network.enable");
await send("Network.setCookie", { name: "session", value: token, domain: "localhost", path: "/" });
await send("Page.enable");
await send("Page.navigate", { url: "http://localhost:3000/dashboard/analytics" });
await sleep(6000);
const read = async (expr) => (await send("Runtime.evaluate", { expression: expr, returnByValue: true })).result?.result?.value;
console.log("trigger label:", await read(`document.querySelector('[data-time-range-trigger] span:nth-of-type(2)')?.textContent`));
console.log("stat subs (3d):", await read(`[...document.querySelectorAll('h3')].map(h=>h.textContent).filter(t=>t.includes('last')).join(' | ')`));
// open dropdown, click "Last 7 days"
await send("Runtime.evaluate", { expression: `document.querySelector('[data-time-range-trigger]').click()` });
await sleep(500);
console.log("options:", await read(`[...document.querySelectorAll('[data-time-range-trigger] ~ div ul button')].map(b=>b.textContent.trim()+'('+(b.disabled?'disabled':'enabled')+')').join(' | ')`));
await send("Runtime.evaluate", { expression: `[...document.querySelectorAll('[data-time-range-trigger] ~ div ul button')].find(b=>b.textContent.includes('Last 7 days'))?.click()` });
await sleep(800);
console.log("trigger label (after):", await read(`document.querySelector('[data-time-range-trigger] span:nth-of-type(2)')?.textContent`));
console.log("stat subs (7d):", await read(`[...document.querySelectorAll('h3')].map(h=>h.textContent).filter(t=>t.includes('last')).join(' | ')`));
console.log("chart labels:", await read(`[...document.querySelectorAll('main div.flex-1.truncate')].map(d=>d.textContent).filter(t=>t).slice(0,10).join(',')`));
// disabled option click attempt
await send("Runtime.evaluate", { expression: `document.querySelector('[data-time-range-trigger]').click()` });
await sleep(400);
await send("Runtime.evaluate", { expression: `[...document.querySelectorAll('[data-time-range-trigger] ~ div ul button')].find(b=>b.textContent.includes('14 days'))?.click()` });
await sleep(400);
console.log("trigger after 14d click (should stay 7d):", await read(`document.querySelector('[data-time-range-trigger] span:nth-of-type(2)')?.textContent`));
ws.close(); proc.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
