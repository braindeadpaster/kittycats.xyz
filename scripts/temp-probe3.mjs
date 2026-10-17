process.loadEnvFile();
import { SignJWT } from "jose";

const url = "http://localhost:3000/dashboard/badges";
const port = 9300 + Math.floor(Math.random() * 400);
const spawn = (await import("node:child_process")).spawn;

const chrome = spawn(
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  [
    "--headless=new",
    "--no-first-run",
    "--disable-gpu",
    `--remote-debugging-port=${port}`,
    "--window-size=1440,900",
    "--user-data-dir=" + process.env.TEMP + "/chr-probe3-" + Date.now(),
    "about:blank",
  ],
  { stdio: "ignore" }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getWs() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(200);
  }
  throw new Error("no ws");
}

const ws = new WebSocket(await getWs());
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};
const send = (method, params = {}) =>
  new Promise((r) => {
    const mid = ++id;
    pending.set(mid, r);
    ws.send(JSON.stringify({ id: mid, method, params }));
  });

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const token = await new SignJWT({ sub: "1" })
  .setProtectedHeader({ alg: "HS256" })
  .setIssuedAt()
  .setExpirationTime("1h")
  .sign(secret);

await send("Network.enable");
await send("Network.setCookie", {
  name: "session",
  value: token,
  url: "http://localhost:3000",
  httpOnly: true,
});
await send("Page.enable");
await send("Page.navigate", { url });
await sleep(3500);

const evalJs = async (expression) => {
  const res = await send("Runtime.evaluate", {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  return res.result?.result?.value;
};

const results = {};

// 1. Find collapse chevron button (aria-label or the one next to All Badges)
results.gridExists = await evalJs(`!!Array.from(document.querySelectorAll("button")).find(b => b.getAttribute("aria-label")?.toLowerCase().includes("collapse") || b.querySelector("svg"))`);
results.gridMaxHeight = await evalJs(`(() => { const b = Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("All Badges") === false && b.closest("div")?.textContent?.includes("All Badges")); const grid = b?.parentElement?.parentElement?.querySelector(".grid, [style*='max-height'], [style*='maxHeight']"); return grid ? grid.style.maxHeight : "notfound"; })()`);

// Better: find button whose previousElementSibling contains "All Badges" h1
results.collapseBtnFound = await evalJs(`(() => { const h = Array.from(document.querySelectorAll("h1")).find(h => h.textContent === "All Badges"); const row = h.parentElement; const btn = row.querySelector("button"); return { found: !!btn, aria: btn?.getAttribute("aria-label") }; })()`);

// Click collapse and check grid style
results.afterCollapse = await evalJs(`(() => { const h = Array.from(document.querySelectorAll("h1")).find(h => h.textContent === "All Badges"); const btn = h.parentElement.querySelector("button"); btn.click(); const grid = btn.parentElement.nextElementSibling; return { gridClass: grid?.className?.slice(0, 60), maxH: grid?.style?.maxHeight, opacity: grid?.style?.opacity }; })()`);

await sleep(600);
results.afterCollapseAnim = await evalJs(`(() => { const h = Array.from(document.querySelectorAll("h1")).find(h => h.textContent === "All Badges"); const btn = h.parentElement.querySelector("button"); const grid = btn.parentElement.nextElementSibling; return { maxH: grid?.style?.maxHeight, ariaExpanded: btn.getAttribute("aria-expanded"), rot: btn.querySelector("svg")?.style?.transform }; })()`);

// Re-expand
await evalJs(`(() => { const h = Array.from(document.querySelectorAll("h1")).find(h => h.textContent === "All Badges"); h.parentElement.querySelector("button").click(); })()`);
await sleep(600);

// 2. Open Preview Custom Badge popup
results.popupBtnFound = await evalJs(`Array.from(document.querySelectorAll("button")).some(b => b.textContent.includes("Preview Custom Badge"))`);
await evalJs(`Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Preview Custom Badge")).click()`);
await sleep(700);
results.popup = await evalJs(`(() => { const d = document.querySelector("[role='dialog']") || document.querySelector("div.fixed.inset-0 div[class*='v3-pop']"); return d ? { exists: true, text: d.textContent.slice(0, 120) } : { exists: false }; })()`);

// Close popup via backdrop
await evalJs(`(() => { const b = document.querySelector("div.fixed.inset-0"); b.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })); })()`);
await sleep(500);
results.popupClosed = await evalJs(`!document.querySelector("div.fixed.inset-0")`);

// 3. File upload preview via DataTransfer
results.upload = await evalJs(`(async () => {
  const input = document.querySelector("input[type='file']");
  if (!input) return "no input";
  // open popup again first? popup was closed. Reopen:
  Array.from(document.querySelectorAll("button")).find(b => b.textContent.includes("Preview Custom Badge")).click();
  await new Promise(r => setTimeout(r, 500));
  const inp = document.querySelector("input[type='file']");
  const b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const file = new File([arr], "test.png", { type: "image/png" });
  const dt = new DataTransfer();
  dt.items.add(file);
  inp.files = dt.files;
  inp.dispatchEvent(new Event("change", { bubbles: true }));
  await new Promise(r => setTimeout(r, 400));
  const img = document.querySelector("img[src^='blob:']");
  return { imgFound: !!img, previewText: document.body.textContent.includes("Custom Badge") ? "ok" : "no" };
})()`);

console.log(JSON.stringify(results, null, 2));
chrome.kill();
process.exit(0);
