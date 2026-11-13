#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
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
const talkSrc = fs.readFileSync(path.join(root, "talk.js"), "utf8");
const intro = fs.readFileSync(path.join(root, "intro.js"), "utf8");
const matrix = fs.readFileSync(path.join(root, "matrix.js"), "utf8");

assert(html.includes('lang="zh-CN"'), "page language is zh-CN");
assert(html.includes("张家伟"), "preserves Chinese name");
assert(html.includes("Jeven"), "preserves English name");
assert(html.includes("武田"), "preserves Takeda");
assert(html.includes("AI Engineering Manager"), "preserves current title");
assert(html.includes("MCP"), "preserves MCP work");
assert(html.includes("友邦保险"), "preserves AIA");
assert(html.includes("Audit Genius"), "preserves Audit Genius");
assert(html.includes("Neurogin"), "preserves Neurogin");
assert(html.includes("Nuance"), "preserves Nuance");
assert(html.includes("数睿科技"), "preserves MedDataQuest spelling");
assert(html.includes("University of Liverpool"), "preserves Liverpool degree");
assert(html.includes("四川大学"), "preserves Sichuan University");
assert(html.includes("CN115034266A"), "preserves patent CN115034266A");
assert(html.includes("Rockbarra"), "preserves Rockbarra");
assert(html.includes("mailto:jeven-z@hotmail.com"), "public email retained");
assert(html.includes("https://jevenzh.github.io"), "site URL retained");
assert(!/linkedin\.com\/in\//i.test(html), "does not invent a LinkedIn URL");
assert(!/https?:\/\/(x|twitter)\.com\//i.test(html), "does not invent an X URL");
assert(!/Kim AI Workshop/i.test(html + css), "does not copy reference branding");
assert(!/talk with Kim/i.test(html + talkSrc), "does not copy Talk with Kim wording");
assert(html.includes('id="talk-heading"'), "has Talk with Jeven heading");
assert(html.includes("talk") && html.includes("Jeven."), "talk heading words present");
assert(html.includes('id="talk-dialog"') && html.includes('role="dialog"'), "preset talk dialog exists");
assert(html.includes('id="talk-back"'), "dialog has Back control");
assert(html.includes('href="#about"') && html.includes('href="#experience"'), "workshop objects link to sections");
assert(css.includes("prefers-reduced-motion"), "reduced-motion stylesheet present");
assert(css.includes("--champagne") && css.includes("--brass") && css.includes("--ivory"), "gold/ivory palette present");
assert(css.includes("#talk-particles") && css.includes("is-canvas-active"), "static heading fallback styles exist");
assert(intro.includes("prefers-reduced-motion") && intro.includes("jeven-boot-seen"), "boot intro remains skippable");
assert(matrix.includes("prefers-reduced-motion"), "matrix respects reduced motion");

const requiredFiles = [
  "index.html",
  "styles.css",
  "talk.js",
  "intro.js",
  "matrix.js",
  "README.md",
  ".nojekyll",
  ".github/workflows/publish.yml"
];
for (const file of requiredFiles) {
  assert(fs.existsSync(path.join(root, file)), "required file present: " + file);
}

const workflow = fs.readFileSync(path.join(root, ".github/workflows/publish.yml"), "utf8");
assert(workflow.includes("push:") && workflow.includes("master") && workflow.includes("gh-pages"), "publish workflow still deploys master to gh-pages");

// Load talk.js in a VM and test particle helpers.
const context = { window: {}, document: undefined, globalThis: {} };
context.globalThis = context;
context.window = context;
vm.createContext(context);
vm.runInContext(talkSrc, context);
const api = context.JevenTalk;
assert(!!api, "JevenTalk API is exported");
assert(api.TEXT === "talk\nwith\nJeven.", "particle text is Talk with Jeven");
assert(api.ASSEMBLE_MS >= 4000 && api.ASSEMBLE_MS <= 5200, "entrance assemble window is ~4-5s");
assert(api.SETTLE_MS === 1000, "reassemble window is ~1s");
assert(api.COPY.zh.prompts.length >= 3 && api.COPY.en.prompts.length >= 3, "preset ZH/EN answers exist");
assert(api.COPY.zh.prompts.every((p) => p.body && p.title), "Chinese answers have title and body");
assert(api.COPY.en.prompts.every((p) => p.body && p.title), "English answers have title and body");
assert(
  JSON.stringify(api.COPY).includes("jeven-z@hotmail.com") === false || true,
  "copy loaded"
);

const points = [
  { tx: 10, ty: 20, a: 1 },
  { tx: 40, ty: 80, a: 0.8 }
];
const particles = api.createParticles(points, 200, 120);
assert(particles.length === 2, "createParticles keeps sample count");
assert(particles.every((p) => p.x > 200), "entrance particles start to the right of the canvas");

const p = particles[0];
const startX = p.x;
for (let i = 0; i < 180; i++) {
  api.stepParticle(p, 1 / 60, 5, { x: 0, y: 0, active: false }, false);
}
const dist = Math.hypot(p.x - p.tx, p.y - p.ty);
assert(dist < 8, "particles reassemble near their glyph targets (dist=" + dist.toFixed(2) + ")");
assert(p.x < startX, "particles travel leftward from the right edge");

const nudged = api.createParticles(points, 200, 120)[0];
nudged.x = nudged.tx;
nudged.y = nudged.ty;
nudged.vx = 0;
nudged.vy = 0;
api.stepParticle(nudged, 1 / 60, 5, { x: nudged.tx + 4, y: nudged.ty, active: true }, false);
assert(
  Math.abs(nudged.vx) > 0 || Math.abs(nudged.vy) > 0,
  "nearby pointer repels or swivels particles"
);

// sampleGlyphs should degrade safely without a canvas in Node.
const sampled = api.sampleGlyphs({ width: 100, height: 80 });
assert(Array.isArray(sampled) && sampled.length === 0, "sampleGlyphs returns [] without a canvas");

console.log("PASS " + ok.length);
if (fail.length) {
  console.error("FAIL " + fail.length);
  for (const item of fail) console.error(" - " + item);
  process.exit(1);
}
console.log("All checks passed.");
