import { spawn } from "node:child_process";
import { SignJWT } from "jose";

process.loadEnvFile?.();
const url = process.argv[2];
const port = 9222 + Math.floor(Math.random() * 500);
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--window-size=1440,900",
  `--remote-debugging-port=${port}`,
  "about:blank",
]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function target() {
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await res.json();
      const page = list.find((t) => t.type === "page");
      if (page) return page;
    } catch {}
    await sleep(100);
  }
  throw new Error("no page target");
}

async function main() {
  const page = await target();
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };
  await new Promise((r) => (ws.onopen = r));
  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const mid = ++id;
      pending.set(mid, resolve);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });

  const secret = process.env.JWT_SECRET;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject("1")
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(secret));
  await send("Network.enable");
  await send("Network.setCookie", {
    name: "session",
    value: token,
    url: "http://localhost:3000",
  });
  await send("Page.enable");
  await send("Page.navigate", { url });
  await sleep(3500);

  const evalJS = async (expr) => {
    const r = await send("Runtime.evaluate", {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return r.result?.result?.value;
  };

  const out = await evalJS(`(() => {
    const res = [];
    document.querySelectorAll('input[type=range]').forEach((inp) => {
      const track = inp.parentElement.firstElementChild;
      const fill = track.firstElementChild;
      const thumb = track.children[1];
      res.push({
        min: inp.min, max: inp.max, val: inp.value,
        fillW: fill.style.width,
        thumbL: thumb.style.left,
      });
    });
    return res;
  })()`);
  console.log(JSON.stringify(out, null, 1));

  // drag opacity slider to 50%
  const drag = await evalJS(`(() => {
    const inp = [...document.querySelectorAll('input[type=range]')][0];
    const rect = inp.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    inp.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y }));
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '0.5');
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    inp.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y }));
    return inp.value;
  })()`);
  await sleep(300);
  const after = await evalJS(`(() => {
    const inp = [...document.querySelectorAll('input[type=range]')][0];
    const track = inp.parentElement.firstElementChild;
    return {
      val: inp.value,
      fillW: track.firstElementChild.style.width,
      thumbL: track.children[1].style.left,
    };
  })()`);
  console.log("drag set:", drag, "after:", JSON.stringify(after));

  ws.close();
  chrome.kill();
}

main().catch((e) => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
