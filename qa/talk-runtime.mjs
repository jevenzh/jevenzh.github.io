#!/usr/bin/env node
/* Execute the real talk.js + lang.js initialization path (not source-string checks). */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fail = [];
const ok = [];
function assert(cond, msg) {
  if (cond) ok.push(msg);
  else fail.push(msg);
}

const talkSrc = fs.readFileSync(path.join(rootDir, "talk.js"), "utf8");
const langSrc = fs.readFileSync(path.join(rootDir, "lang.js"), "utf8");

function classList() {
  const set = new Set();
  return {
    add: function (n) { set.add(n); },
    remove: function (n) { set.delete(n); },
    contains: function (n) { return set.has(n); },
    toggle: function (n, on) {
      if (on === false) set.delete(n);
      else if (on === true) set.add(n);
      else if (set.has(n)) set.delete(n);
      else set.add(n);
    }
  };
}

function el(id, tag) {
  const attrs = {};
  const listeners = {};
  const node = {
    id: id || "",
    tagName: (tag || "div").toUpperCase(),
    hidden: false,
    textContent: "",
    innerHTML: "",
    className: "",
    classList: classList(),
    style: {},
    children: [],
    parentElement: null,
    getAttribute: function (k) { return Object.prototype.hasOwnProperty.call(attrs, k) ? attrs[k] : null; },
    setAttribute: function (k, v) { attrs[k] = String(v); },
    addEventListener: function (type, fn) {
      (listeners[type] || (listeners[type] = [])).push(fn);
    },
    removeEventListener: function () {},
    focus: function () { node.focused = true; },
    click: function () {
      const list = listeners.click || [];
      for (var i = 0; i < list.length; i++) list[i]({ target: node, currentTarget: node, preventDefault: function () {} });
    },
    dispatch: function (type, ev) {
      const list = listeners[type] || [];
      const event = ev || { target: node, currentTarget: node, key: "", preventDefault: function () {} };
      event.target = event.target || node;
      event.currentTarget = event.currentTarget || node;
      for (var i = 0; i < list.length; i++) list[i](event);
    },
    getBoundingClientRect: function () {
      return { width: 480, height: 260, left: 0, top: 0, right: 480, bottom: 260 };
    },
    closest: function (sel) {
      if (sel.indexOf("[data-prompt]") === 0 && attrs["data-prompt"]) return node;
      if (sel.indexOf("[data-site-lang]") === 0 && attrs["data-site-lang"]) return node;
      return null;
    },
    querySelector: function (sel) {
      return node.querySelectorAll(sel)[0] || null;
    },
    querySelectorAll: function (sel) {
      const out = [];
      function walk(n) {
        if (!n) return;
        if (sel === "button[data-prompt]" && n.getAttribute && n.getAttribute("data-prompt")) out.push(n);
        if (sel === "[data-i18n='lead']" && n.getAttribute && n.getAttribute("data-i18n") === "lead") out.push(n);
        if (sel === ".talk-lang-btn" && n.className && n.className.indexOf("talk-lang-btn") !== -1) out.push(n);
        if (n.children) n.children.forEach(walk);
      }
      walk(node);
      return out;
    },
    appendChild: function (child) {
      node.children.push(child);
      child.parentElement = node;
      return child;
    },
    getContext: function () {
      return {
        setTransform: function () {},
        clearRect: function () {},
        fillRect: function () {},
        fillText: function () {},
        getImageData: function () { return { data: [] }; }
      };
    },
    _attrs: attrs,
    _listeners: listeners
  };
  return node;
}

function loadRuntime(options) {
  const opts = options || {};
  const elements = {};
  function put(id, tag) {
    elements[id] = el(id, tag);
    return elements[id];
  }
  const heading = put("talk-heading", "h2");
  const canvas = put("talk-particles", "canvas");
  const screen = put("talk-root", "div");
  const startBtn = put("talk-start", "button");
  const dialogRoot = put("talk-dialog-root", "div");
  dialogRoot.hidden = true;
  const dialog = put("talk-dialog", "div");
  const promptsEl = put("talk-prompts", "ul");
  const leadEl = el("", "p");
  leadEl.setAttribute("data-i18n", "lead");
  dialogRoot.appendChild(leadEl);
  const homePanel = put("talk-panel-home", "div");
  const answerPanel = put("talk-panel-answer", "div");
  answerPanel.hidden = true;
  const answerTitle = put("talk-answer-title", "h3");
  const answerBody = put("talk-answer-body", "p");
  const answerExtra = put("talk-answer-extra", "div");
  const backBtn = put("talk-back", "button");
  const enBtn = el("", "button");
  enBtn.className = "talk-lang-btn is-active";
  enBtn.setAttribute("data-lang", "en");
  const zhBtn = el("", "button");
  zhBtn.className = "talk-lang-btn";
  zhBtn.setAttribute("data-lang", "zh");
  dialogRoot.appendChild(enBtn);
  dialogRoot.appendChild(zhBtn);
  dialogRoot.querySelectorAll = function (sel) {
    if (sel === ".talk-lang-btn") return [enBtn, zhBtn];
    if (sel === "[data-i18n='lead']") return [leadEl];
    return el("talk-dialog-root").querySelectorAll.call(dialogRoot, sel);
  };

  const docListeners = {};
  const documentElement = { classList: classList(), lang: "en" };
  const store = opts.store || { data: {}, getItem: function (k) { return this.data[k] || null; }, setItem: function (k, v) { this.data[k] = String(v); } };

  const document = {
    documentElement: documentElement,
    readyState: "complete",
    body: el("", "body"),
    fonts: undefined,
    getElementById: function (id) { return elements[id] || null; },
    querySelector: function (sel) {
      if (sel === "title") return null;
      if (sel === 'meta[name="description"]') return null;
      if (sel === "[data-i18n='lead']") return leadEl;
      return null;
    },
    querySelectorAll: function (sel) {
      if (sel === "[data-i18n-aria]") return [];
      if (sel === "[data-site-lang]") return [];
      if (sel === ".talk-lang-btn") return [enBtn, zhBtn];
      return [];
    },
    createElement: function (tag) { return el("", tag); },
    addEventListener: function (type, fn) {
      (docListeners[type] || (docListeners[type] = [])).push(fn);
    },
    dispatchEvent: function (event) {
      const list = docListeners[event.type] || [];
      for (var i = 0; i < list.length; i++) list[i](event);
      return true;
    },
    _listeners: docListeners
  };

  const rafQueue = [];
  const context = {
    window: {},
    document: document,
    localStorage: store,
    matchMedia: function (q) {
      return {
        matches: !!opts.reduce || String(q).indexOf("reduce") !== -1 && !!opts.reduce,
        addEventListener: function () {},
        addListener: function () {}
      };
    },
    requestAnimationFrame: function (fn) { rafQueue.push(fn); return rafQueue.length; },
    cancelAnimationFrame: function () {},
    IntersectionObserver: function (cb) {
      return { observe: function () { cb([{ isIntersecting: true }]); }, disconnect: function () {} };
    },
    CustomEvent: function (name, init) { this.type = name; this.detail = init && init.detail; },
    setTimeout: function (fn) { return 0; },
    console: console
  };
  context.window = context;
  context.globalThis = context;
  context.window.matchMedia = context.matchMedia;
  context.window.requestAnimationFrame = context.requestAnimationFrame;
  context.window.cancelAnimationFrame = context.cancelAnimationFrame;
  context.window.addEventListener = function () {};
  context.window.devicePixelRatio = 1;
  context.window.localStorage = store;

  vm.createContext(context);
  vm.runInContext(langSrc, context);
  vm.runInContext(talkSrc, context);

  return {
    context: context,
    document: document,
    startBtn: startBtn,
    dialogRoot: dialogRoot,
    leadEl: leadEl,
    enBtn: enBtn,
    zhBtn: zhBtn,
    homePanel: homePanel,
    answerPanel: answerPanel,
    heading: heading,
    screen: screen,
    store: store,
    docListeners: docListeners
  };
}

let thrown = null;
let runtime;
try {
  runtime = loadRuntime({ reduce: true });
} catch (e) {
  thrown = e;
}
assert(!thrown, "talk.js + lang.js initialize without throwing (" + (thrown && thrown.stack ? thrown.stack : thrown) + ")");

if (runtime && runtime.context.JevenTalk) {
  const api = runtime.context.JevenTalk;
  assert(typeof api.mount === "function", "JevenTalk.mount is available after script evaluation");
  try {
    api.mount(runtime.document);
  } catch (e) {
    assert(false, "JevenTalk.mount does not throw: " + e);
  }
  assert(typeof api.setLang === "function", "JevenTalk.setLang is available after mount");
  assert(runtime.context.JevenLang && runtime.context.JevenLang.get() === "en", "site language is English after a fresh init");
  assert(runtime.leadEl.textContent.indexOf("This is not a live chat") !== -1, "Talk lead uses English copy after init");

  runtime.startBtn.click();
  assert(runtime.dialogRoot.hidden === false, "clicking START opens the Talk dialog");

  runtime.startBtn.dispatch("keydown", { key: "Enter", target: runtime.startBtn, currentTarget: runtime.startBtn, preventDefault: function () {} });

  api.setLang("zh", "site");
  assert(runtime.leadEl.textContent.indexOf("这不是实时对话") !== -1, "JevenTalk.setLang('zh') applies Chinese panel copy");

  runtime.zhBtn.dispatch("click", { currentTarget: runtime.zhBtn, target: runtime.zhBtn, preventDefault: function () {} });
  // already zh; now switch back from the panel and expect site sync
  api.setLang("en", "init");
  runtime.enBtn.dispatch("click", { currentTarget: runtime.enBtn, target: runtime.enBtn, preventDefault: function () {} });
  assert(runtime.context.JevenLang.get() === "en", "Talk EN button keeps site language in sync when already English");

  const synced = loadRuntime({ reduce: true });
  synced.context.JevenLang.mount(synced.document);
  synced.context.JevenTalk.mount(synced.document);
  synced.zhBtn.dispatch("click", { currentTarget: synced.zhBtn, target: synced.zhBtn, preventDefault: function () {} });
  assert(synced.context.JevenLang.get() === "zh", "Talk panel language change updates the site language");
  assert(synced.document.documentElement.lang === "zh-CN", "html lang follows Talk panel Chinese");
  assert(synced.leadEl.textContent.indexOf("这不是实时对话") !== -1, "panel copy is Chinese after Talk toggle");

  synced.context.JevenLang.set("en", "toggle");
  assert(synced.leadEl.textContent.indexOf("This is not a live chat") !== -1, "site language change updates the Talk panel");
}

// A reduced-motion-off path should also boot (canvas stubs) without throwing.
let motionThrown = null;
try {
  const live = loadRuntime({ reduce: false });
  live.context.matchMedia = function () { return { matches: false, addEventListener: function () {} }; };
  live.context.window.matchMedia = live.context.matchMedia;
  live.context.JevenTalk.mount(live.document);
} catch (e) {
  motionThrown = e;
}
assert(!motionThrown, "mount without reduced-motion does not throw (" + motionThrown + ")");

const html = fs.readFileSync(path.join(rootDir, "index.html"), "utf8");
assert(html.includes("开始一段对话"), "Chinese CTA translation is present in the page");
assert(/function\s*\(\s*root\s*\)/.test(talkSrc) && /factory\(\s*root\s*\)/.test(talkSrc), "talk.js factory receives the same root the IIFE uses");

console.log("TALK_RUNTIME_PASS " + ok.length);
if (fail.length) {
  console.error("TALK_RUNTIME_FAIL " + fail.length);
  for (const item of fail) console.error(" - " + item);
  process.exit(1);
}
console.log("Talk runtime checks passed.");
