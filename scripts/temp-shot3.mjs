process.loadEnvFile();
import { SignJWT } from "jose";
import fs from "node:fs";
const [url, out, wArg, hArg, clicks] = [process.argv[2], process.argv[3], process.argv[4] || "1440", process.argv[5] || "900", process.argv[6] || ""];
const port = 9300 + Math.floor(Math.random() * 400);
const spawn = (await import("node:child_process")).spawn;
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", ["--headless=new","--no-first-run","--disable-gpu",`--remote-debugging-port=${port}`,`--window-size=${wArg},${hArg}`,"--user-data-dir=" + process.env.TEMP + "/chr-shot3-" + Date.now(),"about:blank"], { stdio: "ignore" });
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
await send("Page.navigate", { url });
await sleep(3500);
if (clicks) {
  await send("Runtime.evaluate", { expression: `(() => { const els = document.querySelectorAll(${JSON.stringify(clicks)}); els[0]?.click(); return els.length; })()` });
  await sleep(600);
}
const res = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
fs.writeFileSync(out, Buffer.from(res.result.data, "base64"));
console.log("saved", out);
chrome.kill();
process.exit(0);
