/* Matrix wake-up. Skipped when prefers-reduced-motion or this tab already finished it. */
(function () {
  var root = document.documentElement;
  if (!root.classList.contains("booting")) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var overlay = document.getElementById("boot-intro");
  var stream = document.getElementById("boot-stream");
  var shells = document.querySelectorAll(".site-header, main, .site-footer");

  function revealNow() {
    root.classList.remove("booting");
    if (overlay) overlay.classList.add("is-done");
    for (var i = 0; i < shells.length; i++) shells[i].inert = false;
  }

  if (reduce.matches || !overlay || !stream) {
    revealNow();
    return;
  }

  var rabbit = "(\u005c(\u005c\n( -.-)\no_(\")(\")";
  var script = [
    { at: 200, dur: 500, text: "WAKE UP, JEVEN...", cls: "is-wake" },
    { at: 780, dur: 640, text: "The Matrix has you.", cls: "is-dim" },
    { at: 1550, dur: 760, text: "follow the white rabbit.", cls: "is-rabbit", rabbit: true },
    { at: 2500, dur: 500, text: "> boot jeven.sys", cls: "is-cmd" },
    { at: 3100, dur: 520, text: "[ OK ] matrix_rain.ko", cls: "is-ok" },
    { at: 3720, dur: 560, text: "[ OK ] identity: 张家伟", cls: "is-id" },
    { at: 4380, dur: 500, text: "[ OK ] tty1 — ONLINE", cls: "is-ok" }
  ];
  var FADE_AT = 5300;
  var FADE_MS = 420;

  var finished = false;
  var started = 0;
  var loopId = 0;
  var safetyId = 0;
  var spawned = [];

  var cursor = document.createElement("span");
  cursor.className = "boot-cursor cursor-blink";
  cursor.setAttribute("aria-hidden", "true");
  cursor.textContent = "_";

  for (var s = 0; s < shells.length; s++) shells[s].inert = true;

  overlay.tabIndex = -1;

  function remember() {
    try {
      sessionStorage.setItem("jeven-boot-seen", "1");
    } catch (e) {}
  }

  function finish(immediate) {
    if (finished) return;
    finished = true;
    if (loopId) cancelAnimationFrame(loopId);
    if (safetyId) clearTimeout(safetyId);
    window.removeEventListener("keydown", onKey, true);
    window.removeEventListener("pointerdown", onPointer, true);
    remember();
    for (var i = 0; i < shells.length; i++) shells[i].inert = false;
    if (location.hash) {
      var hashId = decodeURIComponent(location.hash.slice(1));
      requestAnimationFrame(function () {
        var target = document.getElementById(hashId);
        if (target && target.scrollIntoView) target.scrollIntoView();
      });
    }
    if (immediate) {
      root.classList.add("boot-skip");
      overlay.classList.add("is-done");
      root.classList.remove("booting");
      return;
    }
    overlay.classList.add("is-leaving");
    root.classList.remove("booting");
    setTimeout(function () {
      overlay.classList.add("is-done");
    }, FADE_MS);
  }

  function onKey(e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "F5" || e.key === "F11" || e.key === "F12") return;
    e.preventDefault();
    e.stopPropagation();
    finish(true);
  }

  function onPointer() {
    finish(true);
  }

  function placeCursor(row) {
    row.appendChild(cursor);
  }

  function typeInto(node, text, duration) {
    var t0 = performance.now();
    function frame(now) {
      if (finished) return;
      var p = duration <= 0 ? 1 : Math.min(1, (now - t0) / duration);
      var n = Math.max(1, Math.ceil(p * text.length));
      node.textContent = text.slice(0, n);
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function spawn(line) {
    var row = document.createElement("div");
    row.className = "boot-line " + line.cls;
    if (line.rabbit) {
      var art = document.createElement("pre");
      art.className = "boot-rabbit-art";
      art.textContent = rabbit;
      row.appendChild(art);
    }
    var copy = document.createElement("span");
    copy.className = "boot-line-copy";
    var text = document.createElement("span");
    text.className = "boot-line-text";
    copy.appendChild(text);
    row.appendChild(copy);
    stream.appendChild(row);
    placeCursor(copy);
    typeInto(text, line.text, line.dur);
  }

  function loop(now) {
    if (finished) return;
    if (!started) started = now;
    var t = now - started;
    for (var i = 0; i < script.length; i++) {
      if (!spawned[i] && t >= script[i].at) {
        spawned[i] = true;
        spawn(script[i]);
      }
    }
    if (t >= FADE_AT) {
      finish(false);
      return;
    }
    loopId = requestAnimationFrame(loop);
  }

  window.addEventListener("keydown", onKey, true);
  window.addEventListener("pointerdown", onPointer, true);
  reduce.addEventListener("change", function (e) {
    if (e.matches) finish(true);
  });

  safetyId = setTimeout(function () {
    finish(true);
  }, 8000);

  try {
    overlay.focus({ preventScroll: true });
  } catch (e) {
    overlay.focus();
  }

  loopId = requestAnimationFrame(loop);
})();
