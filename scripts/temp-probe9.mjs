process.loadEnvFile();
import { SignJWT } from "jose";
const port = 9300 + Math.floor(Math.random() * 400);
const spawn = (await import("node:child_process")).spawn;
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new","--no-first-run","--disable-gpu",`--remote-debugging-port=${port}`,"--window-size=1440,900","--user-data-dir=" + process.env.TEMP + "/chr-probe9-" + Date.now(),"about:blank"], { stdio: "ignore" });
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
await send("Page.navigate", { url: "http://localhost:3000/dashboard/settings" });
await sleep(3500);
const evalJs = async (expression) => { const res = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true }); return res.result?.result?.value; };
const results = {};

const trig = `document.querySelector("div.relative.w-full > button")`;
results.triggerText = await evalJs(`${trig}?.textContent.replace(/\s+/g,' ').trim()`);
results.menuClosed = await evalJs(`(() => { const m = document.querySelector("div.relative.w-full > div"); const s = getComputedStyle(m); return { opacity: s.opacity, pe: s.pointerEvents }; })()`);
await evalJs(`${trig}.click()`);
await sleep(350);
results.menuOpen = await evalJs(`(() => { const m = document.querySelector("div.relative.w-full > div"); const s = getComputedStyle(m); return { opacity: s.opacity, pe: s.pointerEvents, rect: m.getBoundingClientRect().toJSON() }; })()`);
results.menuOptions = await evalJs(`Array.from(document.querySelectorAll("div.relative.w-full > div button")).map(b => b.textContent.replace(/\s+/g,' ').trim())`);
// select Português
await evalJs(`Array.from(document.querySelectorAll("div.relative.w-full > div button")).find(b => b.textContent.includes("Português")).click()`);
await sleep(350);
results.afterSelect = await evalJs(`({ trigger: ${trig}.textContent.replace(/\s+/g,' ').trim(), opacity: getComputedStyle(document.querySelector("div.relative.w-full > div")).opacity })`);
// flag count in trigger
results.triggerFlag = await evalJs(`${trig}.querySelectorAll("svg").length`);

console.log(JSON.stringify(results, null, 2));
chrome.kill();
process.exit(0);
