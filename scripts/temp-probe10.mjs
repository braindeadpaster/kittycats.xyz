import fs from "node:fs";
import path from "node:path";
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

  const out = {};

  out.title = await evalJS("document.title");

  out.sectionLabels = await evalJS(
    `[...document.querySelectorAll('#mainContent span')].map(s=>s.textContent.trim()).filter(t=>/Uploader|Customization/.test(t))`
  );

  out.sliders = await evalJS(`(() => {
    const res = [];
    document.querySelectorAll('input[type=range]').forEach((inp) => {
      const row = inp.closest('div.relative.min-h-\\\\[36px\\\\]') || inp.parentElement;
      const fill = row ? row.querySelector('.bg-\\\\[rgb\\\\\\\\(134,142,150\\\\\\\\)\\\\]') : null;
      const thumb = row ? row.querySelector('.border-\\\\[3px\\\\]') : null;
      res.push({
        min: inp.min, max: inp.max, val: inp.value,
        fillW: fill ? fill.style.width : null,
        thumbL: thumb ? thumb.style.left : null,
      });
    });
    return res;
  })()`);

  out.effectsTrigger = await evalJS(
    `(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'None');
      return b ? b.textContent.trim() : '(not found)';
    })()`
  );

  out.toggles = await evalJS(
    `[...document.querySelectorAll('input[type=checkbox]')].map(c => c.checked)`
  );

  out.glowChips = await evalJS(
    `[...document.querySelectorAll('div')].filter(d => /^(Username|Socials|Badges)$/.test(d.textContent.trim())).map(d => ({ t: d.textContent.trim(), cls: d.className.includes('7e2c8b9c') }))`
  );

  // open effects dropdown
  await evalJS(`(() => {
    const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'None');
    b.click();
  })()`);
  await sleep(600);
  out.menuOpen = await evalJS(
    `(() => {
      const pop = [...document.querySelectorAll('div')].find(d => d.querySelector && d.querySelector('ul') && d.querySelectorAll('ul li').length === 9 && d.className.includes('fixed'));
      if (!pop) return { found: false };
      const cs = getComputedStyle(pop);
      const items = [...pop.querySelectorAll('li span')].map(s => s.textContent.trim());
      return { found: true, opacity: cs.opacity, vis: cs.visibility, rect: pop.getBoundingClientRect().toJSON(), items };
    })()`
  );

  // pick Aurora (index 3)
  await evalJS(`(() => {
    const pop = [...document.querySelectorAll('div')].find(d => d.querySelector && d.querySelector('ul') && d.querySelectorAll('ul li').length === 9 && d.className.includes('fixed'));
    pop.querySelectorAll('li')[3].click();
  })()`);
  await sleep(500);
  out.afterSelect = await evalJS(
    `(() => {
      const b = [...document.querySelectorAll('button')].find(x => ['None','Aurora'].includes(x.textContent.trim()));
      return b ? b.textContent.trim() : '(gone)';
    })()`
  );

  // color input typing
  await evalJS(`(() => {
    const inp = [...document.querySelectorAll('input[type=text]')].find(i => i.value === '#000000');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(inp, '#7e2c8b');
    inp.dispatchEvent(new Event('input', { bubbles: true }));
  })()`);
  await sleep(300);
  out.colorInputs = await evalJS(
    `[...document.querySelectorAll('input[type=text]')].map(i => i.value).filter(v => v.startsWith('#'))`
  );
  out.swatches = await evalJS(
    `[...document.querySelectorAll('span.size-full.rounded-full')].map(s => s.style.backgroundColor).filter(Boolean)`
  );

  // toggle a switch (click second switch's label input)
  await evalJS(`(() => {
    const cb = [...document.querySelectorAll('input[type=checkbox]')][3];
    cb.click();
  })()`);
  await sleep(200);
  out.toggleAfter = await evalJS(
    `[...document.querySelectorAll('input[type=checkbox]')].map(c => c.checked)`
  );

  console.log(JSON.stringify(out, null, 1));
  ws.close();
  chrome.kill();
}

main().catch((e) => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});
