import { spawn } from "node:child_process";
import fs from "node:fs";
process.loadEnvFile();
const url = process.argv[2];
const out = process.argv[3] ?? "shot.png";
const width = Number(process.argv[4] ?? 1440);
const height = Number(process.argv[5] ?? 900);
const fullPage = process.argv[6] === "full";
const clickSel = process.argv[7] && process.argv[7] !== "full" ? process.argv[7] : null;
const { SignJWT } = await import("jose");
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-dev-secret-change-me");
const token = await new SignJWT({}).setSubject("1").setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9334 + Math.floor(Math.random() * 500);
const profile = process.env.TEMP + "/v3shot-" + Date.now();
const proc = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  `--window-size=${width},${height}`, `--remote-debugging-port=${port}`,
  "--user-data-dir=" + profile, "about:blank",
], { stdio: "ignore" });
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
if (!wsUrl) { console.error("chrome did not start"); proc.kill(); process.exit(1); }
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
const u = new URL(url);
await send("Network.enable");
await send("Network.setCookie", { name: "session", value: token, domain: u.hostname, path: "/" });
await send("Page.enable");
await send("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url });
await sleep(6000);
if (clickSel) {
  await send("Runtime.evaluate", {
    expression: `document.querySelector(${JSON.stringify(clickSel)})?.click()`,
  });
  await sleep(700);
}
const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: fullPage });
if (shot.result?.data) {
  fs.writeFileSync(out, Buffer.from(shot.result.data, "base64"));
  console.log("saved", out);
} else {
  console.log("shot failed:", shot.error ? JSON.stringify(shot.error) : "no data");
}
ws.close(); proc.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
