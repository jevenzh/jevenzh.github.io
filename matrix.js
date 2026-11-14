/* Cinematic Matrix rain — bright heads, long dark trails, depth layers.
   Disabled when prefers-reduced-motion. Can be paused from the page control. */
(function (root) {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var canvas = document.getElementById("matrix");
  var toggle = document.getElementById("rain-toggle");
  var paused = false;
  var raf = 0;
  var last = 0;
  var fpsInterval = 1000 / 26;
  var visible = true;
  var ctx = null;
  var dpr = 1;
  var streams = [];
  var chars =
    "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ012345789<>/|#";

  function isMobile() {
    return window.innerWidth < 800 ||
      (window.matchMedia && window.matchMedia("(pointer: coarse)").matches && window.innerWidth < 1100);
  }

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function glyph() {
    return chars.charAt(Math.floor(Math.random() * chars.length));
  }

  function stopLoop() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function hideCanvas() {
    if (canvas) canvas.style.display = "none";
  }

  function applyToggle() {
    if (!toggle) return;
    toggle.setAttribute("aria-pressed", paused ? "true" : "false");
    toggle.classList.toggle("is-paused", paused);
    var resume = toggle.querySelector(".rain-label-resume");
    var pause = toggle.querySelector(".rain-label-pause");
    if (resume) resume.hidden = !paused;
    if (pause) pause.hidden = paused;
    var en = paused ? "Resume the code rain" : "Pause the code rain";
    var zh = paused ? "恢复代码雨" : "暂停代码雨";
    var zhPage = document.documentElement.classList.contains("is-zh");
    if (toggle.getAttribute("data-en")) {
      toggle.setAttribute("data-en", en);
      toggle.setAttribute("data-zh", zh);
    }
    toggle.setAttribute("aria-label", zhPage ? zh : en);
  }

  function setPaused(next) {
    if (!ctx || reduce.matches) return;
    paused = !!next;
    applyToggle();
    if (paused) {
      stopLoop();
    } else if (visible && !raf) {
      last = 0;
      raf = requestAnimationFrame(draw);
    }
  }

  function spawn(layer, width, height, startAnywhere) {
    var mobile = isMobile();
    var size, speed, length, headGlow, alpha, color, head;
    if (layer === 0) {
      size = mobile ? 11 : 12;
      speed = rand(0.55, 1.15);
      length = Math.floor(rand(10, 18));
      headGlow = 0;
      alpha = rand(0.28, 0.48);
      color = "#0c7a36";
      head = "#7dff9c";
    } else if (layer === 1) {
      size = mobile ? 14 : 16;
      speed = rand(1.05, 2.05);
      length = Math.floor(rand(12, 24));
      headGlow = 0;
      alpha = rand(0.62, 0.92);
      color = "#00c94a";
      head = "#d8ffe0";
    } else {
      size = mobile ? 17 : 20;
      speed = rand(1.55, 2.85);
      length = Math.floor(rand(14, 28));
      headGlow = mobile ? 5 : 10;
      alpha = 1;
      color = "#00ff66";
      head = "#f3fff5";
    }
    var col = Math.floor(rand(0, Math.max(1, width / size)));
    var y = startAnywhere ? rand(-height * 0.2, height) : rand(-height * 0.9, 0);
    return {
      layer: layer,
      size: size,
      speed: speed,
      length: length,
      headGlow: headGlow,
      alpha: alpha,
      color: color,
      head: head,
      x: col * size,
      y: y,
      glyphs: Array(length)
    };
  }

  function fillGlyphs(s) {
    for (var i = 0; i < s.length; i++) s.glyphs[i] = glyph();
  }

  function populate() {
    if (!canvas || !ctx) return;
    var width = canvas.width / dpr;
    var height = canvas.height / dpr;
    var mobile = isMobile();
    var far = Math.max(8, Math.floor(width / (mobile ? 28 : 18)));
    var mid = Math.max(6, Math.floor(width / (mobile ? 36 : 24)));
    var near = Math.max(3, Math.floor(width / (mobile ? 70 : 48)));
    streams = [];
    var i;
    for (i = 0; i < far; i++) {
      var a = spawn(0, width, height, true);
      fillGlyphs(a);
      streams.push(a);
    }
    for (i = 0; i < mid; i++) {
      var b = spawn(1, width, height, true);
      fillGlyphs(b);
      streams.push(b);
    }
    for (i = 0; i < near; i++) {
      var c = spawn(2, width, height, true);
      fillGlyphs(c);
      streams.push(c);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#050805";
    ctx.fillRect(0, 0, width, height);
  }

  function resize() {
    if (!canvas || !ctx) return;
    var width = window.innerWidth;
    var height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, isMobile() ? 1 : 1.5);
    canvas.width = Math.max(1, Math.floor(width * dpr));
    canvas.height = Math.max(1, Math.floor(height * dpr));
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    populate();
  }

  function paint(advance) {
    if (!ctx || !canvas) return;
    var width = canvas.width / dpr;
    var height = canvas.height / dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    if (advance) {
      ctx.fillStyle = "rgba(5, 8, 5, 0.075)";
      ctx.fillRect(0, 0, width, height);
    } else {
      ctx.fillStyle = "#050805";
      ctx.fillRect(0, 0, width, height);
    }

    for (var i = 0; i < streams.length; i++) {
      var s = streams[i];
      ctx.font = "700 " + s.size + "px \"Share Tech Mono\", \"IBM Plex Mono\", monospace";
      ctx.textBaseline = "top";
      ctx.globalAlpha = s.alpha;

      if (Math.random() < 0.08) {
        var gi = Math.floor(Math.random() * s.length);
        s.glyphs[gi] = glyph();
      }
      s.glyphs[0] = glyph();

      for (var j = 0; j < s.length; j++) {
        var gy = s.y - j * s.size;
        if (gy < -s.size || gy > height) continue;
        var ch = s.glyphs[j] || glyph();
        if (j === 0) {
          if (s.headGlow) {
            ctx.shadowColor = "#00ff66";
            ctx.shadowBlur = s.headGlow;
          }
          ctx.fillStyle = s.head;
          ctx.fillText(ch, s.x, gy);
          ctx.shadowBlur = 0;
        } else if (j === 1) {
          ctx.fillStyle = s.layer === 2 ? "#b8ffc8" : s.color;
          ctx.globalAlpha = s.alpha * 0.95;
          ctx.fillText(ch, s.x, gy);
        } else {
          var fade = 1 - j / s.length;
          ctx.globalAlpha = s.alpha * fade * fade * 0.95;
          ctx.fillStyle = s.color;
          ctx.fillText(ch, s.x, gy);
        }
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      if (advance) {
        s.y += s.speed * s.size * 0.22;
        if (s.y - s.length * s.size > height) {
          var fresh = spawn(s.layer, width, height, false);
          fillGlyphs(fresh);
          streams[i] = fresh;
        }
      }
    }
  }

  function draw(now) {
    raf = requestAnimationFrame(draw);
    if (paused || !visible || !ctx) return;
    var elapsed = now - last;
    if (last && elapsed < fpsInterval) return;
    last = last ? now - (elapsed % fpsInterval) : now;
    paint(true);
  }

  function start() {
    if (reduce.matches || !canvas || paused) return;
    if (!ctx) {
      ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;
    }
    canvas.style.display = "";
    resize();
    paint(false);
    last = 0;
    if (!raf) raf = requestAnimationFrame(draw);
  }

  function teardown() {
    paused = true;
    stopLoop();
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    hideCanvas();
  }

  root.JevenRain = {
    pause: function () { setPaused(true); },
    resume: function () { setPaused(false); },
    toggle: function () { setPaused(!paused); },
    get paused() { return paused; }
  };

  if (reduce.matches || !canvas) {
    if (toggle) toggle.hidden = true;
    if (canvas) hideCanvas();
    return;
  }

  ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return;

  start();
  window.addEventListener("resize", function () {
    if (reduce.matches) return;
    var wasPaused = paused;
    stopLoop();
    resize();
    paint(false);
    if (!wasPaused && visible) {
      last = 0;
      raf = requestAnimationFrame(draw);
    }
  });

  document.addEventListener("visibilitychange", function () {
    visible = document.visibilityState !== "hidden";
    if (!visible) return;
    if (!paused && !raf && !reduce.matches) {
      last = 0;
      raf = requestAnimationFrame(draw);
    }
  });

  if (typeof IntersectionObserver === "function") {
    var io = new IntersectionObserver(
      function (entries) {
        visible = !!(entries[0] && entries[0].isIntersecting) && document.visibilityState !== "hidden";
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);
  }

  if (toggle) {
    toggle.hidden = false;
    toggle.addEventListener("click", function () {
      setPaused(!paused);
    });
    applyToggle();
  }

  reduce.addEventListener("change", function (e) {
    if (e.matches) {
      if (toggle) toggle.hidden = true;
      teardown();
    } else {
      if (toggle) toggle.hidden = false;
      paused = false;
      applyToggle();
      start();
    }
  });
})(typeof window !== "undefined" ? window : globalThis);
