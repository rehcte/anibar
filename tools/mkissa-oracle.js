#!/usr/bin/env node
// mkissa-oracle: derive anibar's mkissa.to client-crypto constants from the live site.
//
// mkissa.to (allanime) rotates its build id, key mask and the shape of the x-aa-boot signature every
// week or two. Instead of deobfuscating the bundle, this runs the real web client in a headless
// Chromium with SubtleCrypto and fetch hooked, captures what the client signs and sends, recomputes
// the x-aa-boot header from the captured pieces to prove they are right, and prints the mk_* block
// to paste into ani-cli. Same approach as serplay/anidoku's oracle.
//
//   cd tools && npm install          # puppeteer-core only, no browser download
//   node mkissa-oracle.js            # uses Chrome or Edge found on this machine
//   CHROME_EXE=/path/to/chrome node mkissa-oracle.js
//
const puppeteer = require('puppeteer-core');
const crypto = require('crypto');
const fs = require('fs');

const SITE = process.env.SITE || 'https://mkissa.to';
const SHOW = process.env.SHOW || 'ReooPAxPMsHM4KPMY'; // One Piece, long-lived
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const CANDIDATES = [
  process.env.CHROME_EXE,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge',
  '/snap/bin/chromium',
];
const log = (m) => process.stderr.write(`[oracle] ${m}\n`);
const hmac = (keyHex, data) => crypto.createHmac('sha256', Buffer.from(keyHex, 'hex')).update(data).digest('hex');

(async () => {
  const exe = CANDIDATES.find((p) => p && fs.existsSync(p));
  if (!exe) { log('no Chrome/Chromium/Edge found; set CHROME_EXE'); process.exit(1); }
  log(`browser: ${exe}`);
  const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--disable-blink-features=AutomationControlled', '--no-first-run', '--no-default-browser-check'] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(UA);
    await page.setViewport({ width: 1280, height: 800 });
    await page.evaluateOnNewDocument(() => {
      const hex = (b) => { const u = ArrayBuffer.isView(b) ? new Uint8Array(b.buffer, b.byteOffset, b.byteLength) : new Uint8Array(b); return Array.from(u).map((x) => x.toString(16).padStart(2, '0')).join(''); };
      const txt = (b) => { const u = ArrayBuffer.isView(b) ? new Uint8Array(b.buffer, b.byteOffset, b.byteLength) : new Uint8Array(b); return new TextDecoder().decode(u); };
      const cap = { signs: [], aesKeys: [], fetches: [] };
      window.__cap = cap;
      let lastHmacKey = '';
      const S = SubtleCrypto.prototype;
      const oImport = S.importKey;
      S.importKey = function (...a) { try { const alg = a[2]; const name = typeof alg === 'string' ? alg : alg && alg.name; if (name === 'HMAC') lastHmacKey = hex(a[1]); else if (name === 'AES-GCM') cap.aesKeys.push(hex(a[1])); } catch (e) {} return oImport.apply(this, a); };
      const oSign = S.sign;
      S.sign = function (...a) { try { cap.signs.push({ keyHex: lastHmacKey, data: txt(a[2]) }); } catch (e) {} return oSign.apply(this, a); };
      const oFetch = window.fetch;
      window.fetch = function (input, init) {
        const url = typeof input === 'string' ? input : input && input.url ? input.url : String(input);
        if (!/client-crypto/.test(url)) return oFetch.apply(this, arguments);
        const rec = { url, headers: null, response: null };
        try { const h = init && init.headers; if (h) rec.headers = h instanceof Headers ? Object.fromEntries(h.entries()) : h; } catch (e) {}
        cap.fetches.push(rec);
        const p = oFetch.apply(this, arguments);
        p.then((res) => res.clone().text().then((t) => { rec.response = t; }).catch(() => {})).catch(() => {});
        return p;
      };
    });
    const url = `${SITE}/anime/${SHOW}`;
    log(`opening ${url}`);
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    if (!resp || !resp.ok()) { log(`page load failed: HTTP ${resp && resp.status()}`); process.exit(3); }
    const haveBoot = () => page.evaluate(() => window.__cap.fetches.some((f) => f.response));
    for (let i = 0; i < 30 && !(await haveBoot()); i++) { await new Promise((r) => setTimeout(r, 1000)); if (i === 5) await page.mouse.wheel({ deltaY: 600 }); }
    await new Promise((r) => setTimeout(r, 1500));
    const cap = await page.evaluate(() => window.__cap);
    const boot = cap.fetches.find((f) => f.response);
    if (!boot) { log(`no bootstrap observed (signs=${cap.signs.length})`); process.exit(3); }
    const u = new URL(boot.url);
    const buildId = (boot.headers && boot.headers['x-build-id']) || u.searchParams.get('buildId');
    const lane = u.searchParams.get('k');
    const sent = boot.headers && boot.headers['x-aa-boot'];
    const res = JSON.parse(boot.response);
    let inner, outer;
    for (const a of cap.signs) {
      if (a.keyHex.length !== 64) continue;
      const dk = hmac(a.keyHex, a.data);
      const b = cap.signs.find((s) => s.keyHex === dk && hmac(s.keyHex, s.data) === sent);
      if (b) { inner = a; outer = b; break; }
    }
    if (!inner || !outer) { log(`scheme drift: no HMAC chain reproduces x-aa-boot (signs: ${JSON.stringify(cap.signs.map((s) => s.data))})`); process.exit(2); }
    if (!inner.data.endsWith(buildId)) { log(`scheme drift: inner HMAC data "${inner.data}" does not end with build id ${buildId}`); process.exit(2); }
    const mask = inner.keyHex;
    const label = inner.data.slice(0, inner.data.length - buildId.length);
    const host = new URL(page.url()).hostname.replace(/^www\./, '');
    const known = [['build_id', buildId], ['epoch', String(res.epoch)], ['lane', lane], ['referer_host', host]];
    // the signature is the known fields plus one key-group word, joined by a single separator
    const sep = (outer.data.match(/[^A-Za-z0-9.]/g) || [':'])[0];
    const parts = outer.data.split(sep);
    const unknown = [];
    const tpl = parts.map((p) => { const k = known.find(([, v]) => v === p); if (k) return `{${k[0]}}`; unknown.push(p); return '{key_group}'; }).join(sep);
    if (unknown.length !== 1 || known.some(([n]) => !tpl.includes(`{${n}}`))) { log(`scheme drift: signature "${outer.data}" is not <known fields + one key group>`); process.exit(2); }
    const partB = Buffer.from(res.partB, 'base64');
    const m = Buffer.from(mask, 'hex');
    const xored = Buffer.alloc(32); for (let i = 0; i < 32; i++) xored[i] = partB[i] ^ m[i];
    if (cap.aesKeys.length && !cap.aesKeys.includes(xored.toString('hex'))) { log('scheme drift: partB XOR mask is not the AES key the client imported'); process.exit(2); }
    log(`verified x-aa-boot for build ${buildId}, epoch ${res.epoch}${res.epochMs ? `, epoch bucket ${res.epochMs} ms` : ''}`);
    const today = new Date().toISOString().slice(0, 10);
    process.stdout.write([
      `# refresh them with tools/mkissa-oracle.js (see README). Captured ${today}.`,
      `mk_build_id="${buildId}"`,
      `mk_mask="${mask}"`,
      `mk_boot_label="${label}"`,
      `mk_boot_sig="${tpl}"`,
      `mk_key_group="${unknown[0]}"`,
      `mk_lane="${lane}"`,
      `mk_epoch_ms=${res.epochMs || 604800000}`,
      `mk_bootstrap_url="${u.origin}${u.pathname}"`,
      '',
    ].join('\n'));
  } finally { await browser.close(); }
})().catch((e) => { log(`unexpected: ${e.stack || e}`); process.exit(1); });
