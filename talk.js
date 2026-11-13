/* Talk with Jeven: champagne particle text + preset bilingual answers. */
(function (root, factory) {
  var api = factory();
  root.JevenTalk = api;
  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        api.mount(document);
      });
    } else {
      api.mount(document);
    }
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  var TEXT = "talk\nwith\nJeven.";
  var COLORS = ["#f3e6c0", "#e8d5a3", "#d4af37", "#c9a24a", "#b8862b", "#f7efd2"];
  var ASSEMBLE_MS = 4600;
  var SETTLE_MS = 1000;
  var SPRING = 0.085;
  var DAMP = 0.16;
  var REPEL_RADIUS = 72;
  var REPEL_FORCE = 2200;

  var COPY = {
    zh: {
      lead: "这不是实时对话，也不是聊天机器人。下面是一段预设说明；如需联系，请使用已经公开的邮箱或站点。",
      back: "返回",
      prompts: [
        {
          id: "who",
          title: "你是谁？",
          body: "张家伟（Jeven），在成都。现任武田（Takeda）AI Engineering Manager，主做 AI Agent 系统架构与 hands-on 开发（MCP、A2A、集成编排、身份安全等），同时兼顾工程管理，当前管理占比相对较小。"
        },
        {
          id: "work",
          title: "最近在做什么？",
          body: "在制药合规约束下把 Agent 系统做成可用、可审计的交付，而不是演示。此前在友邦保险 AIA TSS 主导集团首个生产级 GenAI 等落地，也曾在 Neurogin、Nuance、数睿科技做数据科学、ASR 与医疗 NLP。"
        },
        {
          id: "contact",
          title: "如何联系？",
          body: "优先写信到公开邮箱，或通过这个站点留下的链接。LinkedIn 与 X 的主页地址还没有在站点上公开，因此这里不会虚构链接。",
          extra: "contact"
        }
      ]
    },
    en: {
      lead: "This is not a live chat or a chatbot. These are prepared answers. To reach me, use the public email or site link already listed on this page.",
      back: "Back",
      prompts: [
        {
          id: "who",
          title: "Who is Jeven?",
          body: "Jeven Zhang (张家伟), based in Chengdu. I am an AI Engineering Manager at Takeda, primarily doing hands-on AI agent architecture and development (MCP, A2A, orchestration, identity and security), with a smaller current share of engineering management."
        },
        {
          id: "work",
          title: "What is the recent work?",
          body: "I focus on making agent systems usable and auditable under pharmaceutical compliance constraints, not demo-only prototypes. Previously at AIA TSS I led flagship work including the group’s first production GenAI application, and earlier I worked on data science, ASR, and medical NLP at Neurogin, Nuance, and MedDataQuest."
        },
        {
          id: "contact",
          title: "How can I get in touch?",
          body: "Please use the public email, or the site link already published here. LinkedIn and X profile URLs are not listed yet, so this panel does not invent them.",
          extra: "contact"
        }
      ]
    }
  };

  function prefersReducedMotion() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function isCoarsePointer() {
    return (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(pointer: coarse)").matches
    );
  }

  function sampleGlyphs(options) {
    var text = (options && options.text) || TEXT;
    var width = (options && options.width) || 520;
    var height = (options && options.height) || 300;
    var font = (options && options.font) || '700 italic 72px "Playfair Display", serif';
    var gap = (options && options.gap) || 3;
    var canvas =
      options && options.canvas
        ? options.canvas
        : typeof document !== "undefined"
          ? document.createElement("canvas")
          : null;
    if (!canvas || !canvas.getContext) return [];
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return [];

    var dpr = 1;
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#ffffff";
    ctx.font = font;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    var lines = String(text).split("\n");
    var lineHeight = estimateLineHeight(ctx, font);
    var block = lineHeight * lines.length;
    var startY = height / 2 - block / 2 + lineHeight / 2;
    for (var i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], width / 2, startY + i * lineHeight);
    }

    var image = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = image.data;
    var points = [];
    var stride = Math.max(1, Math.round(gap * dpr));
    for (var y = 0; y < canvas.height; y += stride) {
      for (var x = 0; x < canvas.width; x += stride) {
        var alpha = data[(y * canvas.width + x) * 4 + 3];
        if (alpha > 120) {
          points.push({
            tx: x / dpr,
            ty: y / dpr,
            a: alpha / 255
          });
        }
      }
    }
    return points;
  }

  function estimateLineHeight(ctx, font) {
    var sizeMatch = /(\\d+(?:\\.\\d+)?)px/.exec(font);
    var px = sizeMatch ? parseFloat(sizeMatch[1]) : 72;
    return px * 0.96;
  }

  function chooseFont(width) {
    var size = Math.max(36, Math.min(84, Math.floor(width * 0.155)));
    return "700 italic " + size + 'px \"Playfair Display\", \"Times New Roman\", serif';
  }

  function createParticles(points, width, height) {
    var list = [];
    for (var i = 0; i < points.length; i++) {
      var p = points[i];
      var delay = (p.tx / Math.max(1, width)) * 0.65 + Math.random() * 0.25;
      list.push({
        x: width + 40 + Math.random() * 180,
        y: p.ty + (Math.random() - 0.5) * height * 0.6,
        vx: -0.6 - Math.random() * 1.2,
        vy: (Math.random() - 0.5) * 0.6,
        tx: p.tx,
        ty: p.ty,
        size: 1 + Math.random() * 1.4,
        color: COLORS[(i + Math.floor(Math.random() * 3)) % COLORS.length],
        delay: delay,
        a: 0.65 + p.a * 0.35
      });
    }
    return list;
  }

  function stepParticle(p, dt, t, pointer, assembling) {
    var ready = t >= p.delay;
    if (!ready) {
      p.x += p.vx * dt * 60 * 0.15;
      return;
    }

    var ax = (p.tx - p.x) * SPRING;
    var ay = (p.ty - p.y) * SPRING;

    if (pointer && pointer.active) {
      var dx = p.x - pointer.x;
      var dy = p.y - pointer.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      if (dist < REPEL_RADIUS) {
        var falloff = (REPEL_RADIUS - dist) / REPEL_RADIUS;
        var force = (REPEL_FORCE * falloff * falloff) / (dist * 60);
        ax += (dx / dist) * force;
        ay += (dy / dist) * force;
        ax += -dy * force * 0.35;
        ay += dx * force * 0.35;
      }
    }

    if (assembling) {
      ax *= 0.55;
      ay *= 0.55;
    }

    p.vx = (p.vx + ax) * (1 - DAMP);
    p.vy = (p.vy + ay) * (1 - DAMP);
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
  }

  function renderParticles(ctx, particles, width, height) {
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }
    ctx.globalAlpha = 1;
  }

  function mount(doc) {
    var reduce = prefersReducedMotion();
    var heading = doc.getElementById("talk-heading");
    var canvas = doc.getElementById("talk-particles");
    var screen = doc.getElementById("talk-root");
    var startBtn = doc.getElementById("talk-start");
    var dialogRoot = doc.getElementById("talk-dialog-root");
    var dialog = doc.getElementById("talk-dialog");
    var promptsEl = doc.getElementById("talk-prompts");
    var leadEl = dialogRoot ? dialogRoot.querySelector("[data-i18n='lead']") : null;
    var homePanel = doc.getElementById("talk-panel-home");
    var answerPanel = doc.getElementById("talk-panel-answer");
    var answerTitle = doc.getElementById("talk-answer-title");
    var answerBody = doc.getElementById("talk-answer-body");
    var answerExtra = doc.getElementById("talk-answer-extra");
    var backBtn = doc.getElementById("talk-back");
    if (!heading || !startBtn || !dialogRoot || !dialog) return;

    var lang = "zh";
    var currentPrompt = null;
    var lastFocus = null;
    var particles = [];
    var ctx = null;
    var raf = 0;
    var startedAt = 0;
    var lastTs = 0;
    var cssW = 0;
    var cssH = 0;
    var pointer = { x: 0, y: 0, active: false };
    var running = false;
    var visible = true;

    function applyCopy() {
      var pack = COPY[lang] || COPY.zh;
      if (leadEl) leadEl.textContent = pack.lead;
      if (backBtn) backBtn.textContent = pack.back;
      if (!promptsEl) return;
      promptsEl.innerHTML = "";
      for (var i = 0; i < pack.prompts.length; i++) {
        var item = pack.prompts[i];
        var li = doc.createElement("li");
        var btn = doc.createElement("button");
        btn.type = "button";
        btn.textContent = item.title;
        btn.setAttribute("data-prompt", item.id);
        li.appendChild(btn);
        promptsEl.appendChild(li);
      }
      if (currentPrompt) showAnswer(currentPrompt);
    }

    function showHome() {
      currentPrompt = null;
      if (homePanel) homePanel.hidden = false;
      if (answerPanel) answerPanel.hidden = true;
      if (answerExtra) answerExtra.innerHTML = "";
    }

    function showAnswer(id) {
      var pack = COPY[lang] || COPY.zh;
      var item = null;
      for (var i = 0; i < pack.prompts.length; i++) {
        if (pack.prompts[i].id === id) item = pack.prompts[i];
      }
      if (!item) return;
      currentPrompt = id;
      if (homePanel) homePanel.hidden = true;
      if (answerPanel) answerPanel.hidden = false;
      if (answerTitle) answerTitle.textContent = item.title;
      if (answerBody) answerBody.textContent = item.body;
      if (answerExtra) {
        answerExtra.innerHTML = "";
        if (item.extra === "contact") {
          var mail = doc.createElement("a");
          mail.href = "mailto:jeven-z@hotmail.com";
          mail.textContent = "jeven-z@hotmail.com";
          var site = doc.createElement("a");
          site.href = "https://jevenzh.github.io";
          site.target = "_blank";
          site.rel = "noopener noreferrer";
          site.textContent = "jevenzh.github.io";
          answerExtra.appendChild(mail);
          answerExtra.appendChild(site);
        }
      }
      if (backBtn) backBtn.focus();
    }

    function openDialog() {
      lastFocus = doc.activeElement;
      dialogRoot.hidden = false;
      startBtn.setAttribute("aria-expanded", "true");
      showHome();
      applyCopy();
      dialog.focus();
    }

    function closeDialog() {
      dialogRoot.hidden = true;
      startBtn.setAttribute("aria-expanded", "false");
      showHome();
      if (lastFocus && lastFocus.focus) lastFocus.focus();
      else startBtn.focus();
    }

    function rebuild() {
      if (!canvas || reduce) return;
      var rect = canvas.getBoundingClientRect();
      cssW = Math.max(240, Math.floor(rect.width) || 520);
      cssH = Math.max(160, Math.floor(rect.height) || 300);
      var dpr = Math.min(window.devicePixelRatio || 1, isCoarsePointer() ? 1.25 : 1.5);
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var gap = cssW < 420 ? 4 : 3;
      var points = sampleGlyphs({
        text: TEXT,
        width: cssW,
        height: cssH,
        font: chooseFont(cssW),
        gap: gap
      });
      if (points.length > 1600) {
        points = points.filter(function (_, i) {
          return i % 2 === 0;
        });
      }
      particles = createParticles(points, cssW, cssH);
      startedAt = 0;
      lastTs = 0;
    }

    function loop(now) {
      if (!running || !ctx) return;
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      if (!startedAt) startedAt = now;
      if (!lastTs) lastTs = now;
      var dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      var t = (now - startedAt) / 1000;
      var assembling = t * 1000 < ASSEMBLE_MS;
      for (var i = 0; i < particles.length; i++) {
        stepParticle(particles[i], dt, t, pointer, assembling);
      }
      renderParticles(ctx, particles, cssW, cssH);
    }

    function startAnim() {
      if (reduce || !canvas || !screen) return;
      screen.classList.add("is-animated");
      heading.classList.add("is-canvas-active");
      rebuild();
      running = true;
      visible = true;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }

    function stopAnim() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    }

    startBtn.addEventListener("click", openDialog);
    heading.addEventListener("click", openDialog);
    if (canvas) {
      canvas.style.cursor = "pointer";
      canvas.addEventListener("click", openDialog);
    }

    dialogRoot.addEventListener("click", function (e) {
      var target = e.target;
      if (target && target.getAttribute && target.getAttribute("data-talk-close")) {
        closeDialog();
      }
    });

    if (promptsEl) {
      promptsEl.addEventListener("click", function (e) {
        var btn = e.target.closest("button[data-prompt]");
        if (!btn) return;
        showAnswer(btn.getAttribute("data-prompt"));
      });
    }

    if (backBtn) {
      backBtn.addEventListener("click", function () {
        showHome();
        if (promptsEl) {
          var first = promptsEl.querySelector("button");
          if (first) first.focus();
        }
      });
    }

    var langBtns = dialogRoot.querySelectorAll(".talk-lang-btn");
    for (var b = 0; b < langBtns.length; b++) {
      langBtns[b].addEventListener("click", function (ev) {
        lang = ev.currentTarget.getAttribute("data-lang") || "zh";
        for (var i = 0; i < langBtns.length; i++) {
          var on = langBtns[i].getAttribute("data-lang") === lang;
          langBtns[i].classList.toggle("is-active", on);
          langBtns[i].setAttribute("aria-pressed", on ? "true" : "false");
        }
        applyCopy();
      });
    }

    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !dialogRoot.hidden) {
        if (currentPrompt) showHome();
        else closeDialog();
      }
    });

    if (canvas && !reduce) {
      var move = function (e) {
        var rect = canvas.getBoundingClientRect();
        pointer.x = e.clientX - rect.left;
        pointer.y = e.clientY - rect.top;
        pointer.active = true;
      };
      canvas.addEventListener("pointermove", move);
      canvas.addEventListener("pointerenter", move);
      canvas.addEventListener("pointerleave", function () {
        pointer.active = false;
      });
      if (isCoarsePointer()) {
        // Touch should open the panel, not trap a hover state.
        canvas.addEventListener("pointerup", function () {
          pointer.active = false;
        });
      }

      window.addEventListener("resize", function () {
        if (!running) return;
        stopAnim();
        startAnim();
      });

      if (typeof IntersectionObserver === "function") {
        var io = new IntersectionObserver(
          function (entries) {
            visible = !!(entries[0] && entries[0].isIntersecting);
          },
          { threshold: 0.05 }
        );
        io.observe(canvas);
      }

      var startWhenReady = function () {
        var booting = doc.documentElement.classList.contains("booting");
        if (booting) {
          setTimeout(startWhenReady, 200);
          return;
        }
        startAnim();
      };
      if (doc.fonts && doc.fonts.ready) {
        doc.fonts.ready.then(startWhenReady).catch(startWhenReady);
      } else {
        startWhenReady();
      }
    } else {
      heading.classList.remove("is-canvas-active");
      if (screen) screen.classList.remove("is-animated");
    }

    applyCopy();
  }

  return {
    TEXT: TEXT,
    COPY: COPY,
    ASSEMBLE_MS: ASSEMBLE_MS,
    SETTLE_MS: SETTLE_MS,
    sampleGlyphs: sampleGlyphs,
    createParticles: createParticles,
    stepParticle: stepParticle,
    mount: mount
  };
});
