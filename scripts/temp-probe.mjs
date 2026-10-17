import { spawn } from "node:child_process";
process.loadEnvFile();
const url = process.argv[2] ?? "http://localhost:3000/dashboard/analytics";
const { SignJWT } = await import("jose");
const secret = new TextEncoder().encode(process.env.JWT_SECRET ?? "fallback-dev-secret-change-me");
const token = await new SignJWT({}).setSubject("1").setProtectedHeader({ alg: "HS256" }).setExpirationTime("7d").sign(secret);
const chrome = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const port = 9334 + Math.floor(Math.random() * 500);
const profile = process.env.TEMP + "/v3probe-" + Date.now();
const proc = spawn(chrome, [
  "--headless=new", "--disable-gpu", "--hide-scrollbars",
  "--window-size=1440,900", `--remote-debugging-port=${port}`,
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
const events = [];
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
  else if (msg.method === "Runtime.consoleAPICalled") events.push(msg.params.type + ": " + (msg.params.args ?? []).map(a => a.value ?? a.description ?? "").join(" ").slice(0, 300));
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
await send("Runtime.enable");
await send("Page.navigate", { url });
await sleep(6000);
const probe = `(() => {
  const btn = document.querySelector('[data-time-range-trigger]');
  if (!btn) return 'NO TRIGGER FOUND';
  btn.click();
  return 'clicked';
})()`;
await send("Runtime.evaluate", { expression: probe });
await sleep(900);
const state = await send("Runtime.evaluate", {
  expression: `(() => {
    const btn = document.querySelector('[data-time-range-trigger]');
    const menu = btn ? btn.nextElementSibling : null;
    return JSON.stringify({
      ariaExpanded: btn?.getAttribute('aria-expanded'),
      menuExists: !!menu,
      menuClass: menu?.className ?? null,
      menuRect: menu ? (() => { const r = menu.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; })() : null,
    });
  })()`,
  returnByValue: true,
});
console.log("STATE:", state.result?.result?.value);
console.log("CONSOLE:");
for (const e of events) console.log("  ", e);
ws.close(); proc.kill();
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
process.exit(0);
