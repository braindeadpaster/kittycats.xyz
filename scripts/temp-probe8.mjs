process.loadEnvFile();
import { SignJWT } from "jose";
const port = 9300 + Math.floor(Math.random() * 400);
const spawn = (await import("node:child_process")).spawn;
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new","--no-first-run","--disable-gpu",`--remote-debugging-port=${port}`,"--window-size=1440,900","--user-data-dir=" + process.env.TEMP + "/chr-probe8-" + Date.now(),"about:blank"], { stdio: "ignore" });
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

// 1. language dropdown
const trigger = await evalJs(`Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("English")) ? "found" : "missing"`);
results.trigger = trigger;
await evalJs(`Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("English")).click()`);
await sleep(400);
results.langMenu = await evalJs(`(() => {
  const btns = Array.from(document.querySelectorAll("button")).filter(b => /(Español|Português|Français|Deutsch|Türkçe|Русский|العربية|English \(United)/.test(b.textContent));
  return { optionCount: btns.length, texts: btns.map(b => b.textContent.trim().slice(0, 25)) };
})()`);
// click Español
await evalJs(`Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Español")).click()`);
await sleep(400);
results.afterSelect = await evalJs(`(() => {
  const t = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("English") || b.textContent.includes("Español") && !b.textContent.includes("(España)"));
  const btns = Array.from(document.querySelectorAll("button"));
  const tr = btns.find(b => (b.textContent.includes("Español") || b.textContent.includes("English")) && !/(España|United States)/.test(b.textContent));
  return { triggerText: tr?.textContent.trim(), menuGone: !btns.some(b => b.textContent.includes("Deutsch")) };
})()`);

// 2. email eye toggle
results.emailTypeBefore = await evalJs(`document.querySelector("input[type='password'], input[type='text'][maxlength='72']")?.type`);
await evalJs(`document.querySelector("p.absolute")?.dispatchEvent(new MouseEvent("click", { bubbles: true }))`);
await sleep(300);
results.emailTypeAfter = await evalJs(`document.querySelector("input[maxlength='72']")?.type`);

// 3. toggle switches flip
results.switchesBefore = await evalJs(`Array.from(document.querySelectorAll("input[type='checkbox']")).map(c => c.checked)`);
await evalJs(`document.querySelectorAll("input[type='checkbox']")[0].click()`);
await sleep(300);
results.switchesAfter = await evalJs(`Array.from(document.querySelectorAll("input[type='checkbox']")).map(c => c.checked)`);

// 4. flags rendered
results.flags = await evalJs(`Array.from(document.querySelectorAll("span[class*='size-[25px]'] svg")).length`);

console.log(JSON.stringify(results, null, 2));
chrome.kill();
process.exit(0);
