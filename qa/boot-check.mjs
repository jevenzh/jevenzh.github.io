#!/usr/bin/env node
/* Deterministic boot-overlay regressions: repeat visit, storage failure, reduced motion. */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fail = [];
const ok = [];

function assert(cond, msg) {
  if (cond) ok.push(msg);
  else fail.push(msg);
}

const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "styles.css"), "utf8");
const introSrc = fs.readFileSync(path.join(root, "intro.js"), "utf8");

assert(
  /\.boot-intro\s*\{[^}]*display:\s*none\s*!important/.test(html),
  "inline CSS hides .boot-intro by default"
);
assert(
  /html\.booting\s+\.boot-intro:not\(\.is-done\)\s*\{[^}]*display:\s*flex\s*!important/.test(html),
  "inline CSS shows overlay only while html.booting and not is-done"
);
assert(
  /\.boot-intro\s*\{[\s\S]*?display:\s*none;/.test(css) &&
    /html\.booting\s+\.boot-intro\s*\{[\s\S]*?display:\s*flex;/.test(css),
  "styles.css hides overlay unless html.booting"
);
assert(/\.boot-intro\.is-done\s*\{[\s\S]*?display:\s*none\s*!important/.test(css), "is-done hides overlay");
assert(
  introSrc.includes('if (!root.classList.contains("booting")') &&
    introSrc.includes("revealNow()"),
  "intro.js dismisses overlay when not booting"
);

const gateMatch = html.match(/<script>\s*(\(function \(\) \{[\s\S]*?\}\)\(\);)\s*<\/script>/);
assert(!!gateMatch, "head boot gate script is present");

function classList() {
  const set = new Set();
  return {
    _set: set,
    contains: (c) => set.has(c),
    add: (c) => set.add(c),
    remove: (c) => set.delete(c)
  };
}

function runGate({ reduce, storage, now }) {
  const rootClass = classList();
  const overlay = {
    classList: classList(),
    attrs: {},
    setAttribute(k, v) {
      this.attrs[k] = v;
    }
  };
  const timers = [];
  const document = {
    documentElement: { classList: rootClass },
    getElementById(id) {
      return id === "boot-intro" ? overlay : null;
    }
  };
  const window = {
    matchMedia(q) {
      if (!q) throw new Error("no query");
      return { matches: !!reduce };
    },
    sessionStorage: storage
  };
  const context = {
    document,
    window,
    setTimeout(fn, ms) {
      timers.push({ fn, ms });
      return timers.length;
    }
  };
  vm.runInNewContext(gateMatch[1], context);
  if (now) {
    for (const t of timers) t.fn();
  }
  return {
    booting: rootClass.contains("booting"),
    overlayDone: overlay.classList.contains("is-done"),
    overlayHidden: Object.prototype.hasOwnProperty.call(overlay.attrs, "hidden"),
    timers
  };
}

const memoryStore = {
  getItem(k) {
    return this._v && this._v[k] != null ? this._v[k] : null;
  },
  setItem(k, v) {
    this._v = this._v || {};
    this._v[k] = String(v);
  },
  _v: {}
};

const first = runGate({ reduce: false, storage: { getItem: () => null, setItem() {} } });
assert(first.booting, "first visit with working storage starts intro");

const repeat = runGate({
  reduce: false,
  storage: { getItem: (k) => (k === "jeven-boot-seen" ? "1" : null), setItem() {} }
});
assert(!repeat.booting, "repeat visit (sessionStorage seen) does not add booting");
assert(!repeat.overlayDone, "repeat visit does not need JS to hide overlay when CSS default is none");

const deniedGet = runGate({
  reduce: false,
  storage: {
    getItem() {
      throw new Error("SecurityError");
    },
    setItem() {
      throw new Error("SecurityError");
    }
  }
});
assert(deniedGet.booting, "storage get failure still allows skippable first-load intro");

const deniedThenTimeout = runGate({
  reduce: false,
  storage: {
    getItem() {
      throw new Error("SecurityError");
    },
    setItem() {}
  },
  now: true
});
assert(!deniedThenTimeout.booting, "safety timeout clears booting if intro never finishes");
assert(deniedThenTimeout.overlayDone, "safety timeout marks overlay is-done");
assert(deniedThenTimeout.overlayHidden, "safety timeout sets hidden on overlay");

const reduceOk = runGate({
  reduce: true,
  storage: { getItem: () => null, setItem() {} }
});
assert(!reduceOk.booting, "reduced motion does not start intro");

const reduceSeen = runGate({
  reduce: true,
  storage: { getItem: () => "1", setItem() {} }
});
assert(!reduceSeen.booting, "reduced motion plus seen storage still skips intro");

const matchMediaThrow = runGate({
  reduce: false,
  storage: memoryStore
});
// override: simulate matchMedia throw via custom
(function () {
  const rootClass = classList();
  const document = { documentElement: { classList: rootClass }, getElementById: () => null };
  const window = {
    matchMedia() {
      throw new Error("matchMedia unavailable");
    },
    sessionStorage: { getItem: () => "1", setItem() {} }
  };
  vm.runInNewContext(gateMatch[1], {
    document,
    window,
    setTimeout() {
      return 0;
    }
  });
  assert(!rootClass.contains("booting"), "matchMedia failure does not trap the page in booting");
})();

function createDom({ booting, reduce }) {
  const rootClass = classList();
  if (booting) rootClass.add("booting");
  const overlay = {
    classList: classList(),
    attrs: {},
    tabIndex: 0,
    setAttribute(k, v) {
      this.attrs[k] = v;
    },
    focus() {}
  };
  const stream = { appendChild() {} };
  const shells = [
    { inert: false },
    { inert: false },
    { inert: false }
  ];
  const listeners = [];
  const document = {
    documentElement: { classList: rootClass },
    getElementById(id) {
      if (id === "boot-intro") return overlay;
      if (id === "boot-stream") return stream;
      return null;
    },
    querySelectorAll(sel) {
      if (sel.indexOf("site-header") !== -1) return shells;
      return [];
    },
    createElement() {
      return {
        className: "",
        setAttribute() {},
        textContent: "",
        appendChild() {}
      };
    }
  };
  const window = {
    matchMedia() {
      return {
        matches: !!reduce,
        addEventListener() {}
      };
    },
    sessionStorage: {
      getItem() {
        throw new Error("SecurityError");
      },
      setItem() {
        throw new Error("SecurityError");
      }
    },
    addEventListener(type, fn, cap) {
      listeners.push({ type, fn, cap });
    },
    removeEventListener() {}
  };
  return { rootClass, overlay, shells, document, window, listeners };
}

function runIntro(dom) {
  const pendingTimeouts = [];
  const context = {
    document: dom.document,
    window: dom.window,
    location: { hash: "" },
    sessionStorage: dom.window.sessionStorage,
    requestAnimationFrame() {
      return 1;
    },
    cancelAnimationFrame() {},
    setTimeout(fn, ms) {
      pendingTimeouts.push({ fn, ms });
      return pendingTimeouts.length;
    },
    clearTimeout() {},
    performance: { now: () => 0 }
  };
  context.window.requestAnimationFrame = context.requestAnimationFrame;
  context.window.setTimeout = context.setTimeout;
  vm.runInNewContext(introSrc, context);
  return pendingTimeouts;
}

const repeatIntro = createDom({ booting: false, reduce: false });
runIntro(repeatIntro);
assert(!repeatIntro.rootClass.contains("booting"), "intro.js on repeat visit leaves html not booting");
assert(repeatIntro.overlay.classList.contains("is-done"), "intro.js marks overlay is-done on repeat visit");
assert(
  Object.prototype.hasOwnProperty.call(repeatIntro.overlay.attrs, "hidden"),
  "intro.js hides overlay on repeat visit"
);
assert(
  repeatIntro.shells.every((s) => s.inert === false),
  "intro.js leaves page interactive on repeat visit"
);

const storageFailPlay = createDom({ booting: true, reduce: false });
const timeouts = runIntro(storageFailPlay);
assert(storageFailPlay.rootClass.contains("booting"), "intro can start when storage writes will fail");
// skip immediately
const pointer = storageFailPlay.listeners.find((l) => l.type === "pointerdown");
assert(!!pointer, "skippable pointer handler is attached when intro plays");
pointer.fn();
assert(!storageFailPlay.rootClass.contains("booting"), "skip works even when sessionStorage set throws");
assert(storageFailPlay.overlay.classList.contains("is-done"), "skip dismisses overlay when storage set throws");
assert(
  storageFailPlay.shells.every((s) => s.inert === false),
  "skip restores interaction when storage set throws"
);
void timeouts;

const reduceIntro = createDom({ booting: true, reduce: true });
runIntro(reduceIntro);
assert(!reduceIntro.rootClass.contains("booting"), "intro.js reveals immediately when reduced motion");
assert(reduceIntro.overlay.classList.contains("is-done"), "reduced motion dismisses overlay");

console.log("BOOT_PASS " + ok.length);
if (fail.length) {
  console.error("BOOT_FAIL " + fail.length);
  for (const item of fail) console.error(" - " + item);
  process.exit(1);
}
console.log("Boot overlay checks passed.");
export { ok, fail };
