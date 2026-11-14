#!/usr/bin/env node
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
const langSrc = fs.readFileSync(path.join(root, "lang.js"), "utf8");
const talkSrc = fs.readFileSync(path.join(root, "talk.js"), "utf8");
const intro = fs.readFileSync(path.join(root, "intro.js"), "utf8");

assert(/<html lang="en">/.test(html), "html lang defaults to en");
assert(!html.includes('lang="zh-CN"') || html.includes('data-zh'), "no Chinese default lang attribute on html");
assert(/<title[^>]*>Jeven Zhang/.test(html), "document title defaults to English");
assert(/meta name="description"[^>]*content="Jeven Zhang/.test(html), "meta description defaults to English");
assert(html.includes('data-site-lang="en"') && html.includes('data-site-lang="zh"'), "visible EN / 中文 toggle exists");
assert(html.includes("lang.js"), "lang.js is included");
assert(!/navigator\.language|navigator\.languages/.test(langSrc + html), "language is not auto-detected from the browser locale");
assert(langSrc.includes("jeven-lang"), "language preference key is jeven-lang");
assert(/var lang = \(root\.JevenLang[\s\S]*\? "zh" : "en"/.test(talkSrc), "Talk panel defaults from site language, otherwise English");
assert(talkSrc.includes('setLang(lang, "init")'), "Talk applies language on mount");
assert(intro.includes("identity: Jeven Zhang") && intro.includes("identity: 张家伟"), "boot identity line is bilingual");

const maxMatch = css.match(/--max:\s*(\d+)px/);
const max = maxMatch ? Number(maxMatch[1]) : 0;
assert(max >= 1440 && max <= 1560, "desktop wrap is about 1500px (got " + max + ")");
const gutterMatch = css.match(/--gutter:\s*(\d+)px/);
const gutter = gutterMatch ? Number(gutterMatch[1]) : 0;
assert(gutter >= 32 && gutter <= 64, "desktop gutters are 32-64px (got " + gutter + ")");
assert(
  /min\(\s*100%\s*-\s*\(2\s*\*\s*var\(--gutter\)\)/.test(css),
  "wrap applies the same gutter on both sides"
);
assert(
  !/\.hero-shell\s*\{[^}]*width:\s*100%/.test(css),
  "hero shell shares the wrap instead of flushing to the viewport"
);
assert(css.includes("hero-rail") && css.includes("hero-shell"), "desktop hero uses a wide shell and section rail");
assert(css.includes("html:not(.is-zh) .lang-zh") && css.includes("html.is-zh .lang-en"), "inactive language is hidden in CSS");
assert(css.includes("max-width: 42rem") || css.includes("max-width: 38rem"), "body copy keeps a readable measure");
assert(
  /grid-template-columns:\s*minmax\(0,\s*1\.15fr\)\s*minmax\(0,\s*0\.85fr\)/.test(css),
  "hero grid columns can shrink (min-width 0) to avoid overflow"
);
assert(
  /#talk-particles\s*\{[\s\S]*?min-width:\s*0/.test(css),
  "Talk canvas can shrink instead of forcing page overflow"
);
assert(
  !/html\s*\{[^}]*overflow-x:\s*hidden/.test(css) && !/body\s*\{[^}]*overflow-x:\s*hidden/.test(css),
  "root overflow-x is not hidden to mask clipping"
);
assert(
  html.includes('class="name-visual"') &&
    html.includes('aria-hidden="true"') &&
    html.includes('class="visually-hidden lang-en"') &&
    html.includes('class="visually-hidden lang-zh"'),
  "decorative name is aria-hidden with a single accessible heading"
);
assert(/--label-min:\s*0\.8125rem/.test(css), "labels have a 13px minimum");
assert(!/\.rail-mode\s*\{[^}]*font-size:\s*0\.7[0-8]rem/.test(css), "rail mode labels are not below 13px");
assert(/--bg-panel:\s*rgba\([^)]*0\.9/.test(css), "reading surfaces use a strong rain veil");

function collect(tagClass) {
  const re = new RegExp(
    "<([a-zA-Z0-9]+)([^>]*\\b" + tagClass + "\\b[^>]*)>([\\s\\S]*?)</\\1>",
    "g"
  );
  const items = [];
  let m;
  while ((m = re.exec(html))) {
    const inner = m[3].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    items.push(inner);
  }
  return items;
}

const enItems = collect("lang-en");
const zhItems = collect("lang-zh");
assert(enItems.length >= 40 && zhItems.length >= 40, "translation pairs exist at scale (en=" + enItems.length + ", zh=" + zhItems.length + ")");
assert(enItems.every((s) => s.length > 0) && zhItems.every((s) => s.length > 0), "no empty English or Chinese translation strings");
assert(Math.abs(enItems.length - zhItems.length) <= 2, "English and Chinese string counts are aligned (en=" + enItems.length + ", zh=" + zhItems.length + ")");

const requiredZh = ["张家伟", "武田", "友邦保险", "数睿科技", "四川大学", "技术细节 / 展开完整经历", "链接待补全"];
for (const s of requiredZh) {
  assert(html.includes(s), "Chinese copy retains: " + s);
}
const requiredEn = [
  "Jeven Zhang",
  "From research to systems that ship",
  "Selected experience",
  "Technical details / full role history",
  "first production GenAI",
  "Link to be added",
  "Skip to content",
  "Public channels",
  "BSc Applied Mathematics"
];
for (const s of requiredEn) {
  assert(html.includes(s), "English copy includes: " + s);
}

function loadLang(storage) {
  const classNames = new Set();
  const title = { textContent: "Jeven Zhang (张家伟)", getAttribute: (k) => ({ "data-en": "Jeven Zhang (张家伟)", "data-zh": "张家伟 · Jeven" }[k] || null) };
  const meta = { content: "en", getAttribute: (k) => ({ "data-en": "EN desc", "data-zh": "ZH desc", name: "description" }[k] || null), setAttribute: function (k, v) { this[k] = v; } };
  const buttons = [
    { lang: "en", classList: { toggle: function () {} }, setAttribute: function () {}, getAttribute: function (k) { return k === "data-site-lang" ? "en" : null; } },
    { lang: "zh", classList: { toggle: function () {} }, setAttribute: function () {}, getAttribute: function (k) { return k === "data-site-lang" ? "zh" : null; } }
  ];
  const document = {
    documentElement: {
      lang: "en",
      classList: {
        toggle: function (name, on) { if (on) classNames.add(name); else classNames.delete(name); },
        contains: function (name) { return classNames.has(name); },
        add: function (name) { classNames.add(name); },
        remove: function (name) { classNames.delete(name); }
      }
    },
    querySelector: function (sel) {
      if (sel === "title") return title;
      if (sel === 'meta[name="description"]') return meta;
      return null;
    },
    querySelectorAll: function (sel) {
      if (sel === "[data-i18n-aria]") return [];
      if (sel === "[data-site-lang]") return buttons;
      return [];
    },
    addEventListener: function () {},
    dispatchEvent: function () { return true; },
    readyState: "complete"
  };
  const context = {
    window: {},
    document: document,
    localStorage: storage,
    CustomEvent: function (name, init) { this.type = name; this.detail = init && init.detail; }
  };
  context.window = context;
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(langSrc, context);
  return { api: context.JevenLang, document, classNames, title, meta };
}

const defaultStore = { getItem: function () { return null; }, setItem: function () {} };
const fresh = loadLang(defaultStore);
assert(fresh.api.readStored() === "en", "missing storage value defaults to English");
fresh.api.mount(fresh.document);
assert(fresh.api.get() === "en", "mount applies English by default");
assert(fresh.document.documentElement.lang === "en", "documentElement.lang is en by default");

const throwingGet = {
  getItem: function () { throw new Error("blocked"); },
  setItem: function () {}
};
const deniedGet = loadLang(throwingGet);
assert(deniedGet.api.readStored() === "en", "storage read failure still defaults to English");
deniedGet.api.mount(deniedGet.document);
assert(deniedGet.api.get() === "en" && deniedGet.document.documentElement.lang === "en", "mount stays English when storage get throws");

let wrote = false;
const throwingSet = {
  getItem: function () { return "en"; },
  setItem: function () { wrote = true; throw new Error("blocked"); }
};
const deniedSet = loadLang(throwingSet);
deniedSet.api.mount(deniedSet.document);
deniedSet.api.set("zh", "toggle");
assert(deniedSet.api.get() === "zh", "language still switches when storage set throws");
assert(deniedSet.document.documentElement.lang === "zh-CN", "html lang becomes zh-CN after a Chinese toggle");
assert(deniedSet.classNames.has("is-zh"), "is-zh class is applied even if storage set fails");
assert(deniedSet.title.textContent === "张家伟 · Jeven", "title updates with the language switch");

const storedZh = { getItem: function () { return "zh"; }, setItem: function () {} };
const restored = loadLang(storedZh);
assert(restored.api.readStored() === "zh", "stored zh is honored when storage is available");
restored.api.mount(restored.document);
assert(restored.api.get() === "zh" && restored.document.documentElement.lang === "zh-CN", "mount restores Chinese from storage");

const talkContext = { window: {}, document: undefined, globalThis: {} };
talkContext.window = talkContext;
talkContext.globalThis = talkContext;
vm.createContext(talkContext);
vm.runInContext(talkSrc, talkContext);
assert(talkContext.JevenTalk && typeof talkContext.JevenTalk.setLang === "function", "JevenTalk.setLang is exported for site sync");

console.log("LANG_PASS " + ok.length);
if (fail.length) {
  console.error("LANG_FAIL " + fail.length);
  for (const item of fail) console.error(" - " + item);
  process.exit(1);
}
console.log("Language checks passed.");
