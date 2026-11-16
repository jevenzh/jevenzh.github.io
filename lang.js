/* Site language: English default, optional Chinese. Storage failures must not block the page. */
(function (root) {
  var KEY = "jeven-lang";
  var current = "en";
  var docRef = null;

  function normalize(value) {
    return value === "zh" ? "zh" : "en";
  }

  function readStored() {
    try {
      if (!root.localStorage) return "en";
      return normalize(root.localStorage.getItem(KEY));
    } catch (e) {
      return "en";
    }
  }

  function writeStored(value) {
    try {
      if (root.localStorage) root.localStorage.setItem(KEY, normalize(value));
    } catch (e) {}
  }

  function attr(lang, en, zh) {
    return lang === "zh" ? zh : en;
  }

  function apply(lang, options) {
    var opts = options || {};
    current = normalize(lang);
    var doc = docRef || (typeof document !== "undefined" ? document : null);
    if (!doc || !doc.documentElement) return current;

    doc.documentElement.lang = current === "zh" ? "zh-CN" : "en";
    doc.documentElement.classList.toggle("is-zh", current === "zh");

    var title = doc.querySelector("title");
    if (title && title.getAttribute("data-en")) {
      title.textContent = attr(current, title.getAttribute("data-en"), title.getAttribute("data-zh"));
    }
    var meta = doc.querySelector('meta[name="description"]');
    if (meta && meta.getAttribute("data-en")) {
      meta.setAttribute("content", attr(current, meta.getAttribute("data-en"), meta.getAttribute("data-zh")));
    }
    var nodes = doc.querySelectorAll("[data-i18n-aria]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      el.setAttribute("aria-label", attr(current, el.getAttribute("data-en"), el.getAttribute("data-zh")));
    }

    var buttons = doc.querySelectorAll("[data-site-lang]");
    for (var b = 0; b < buttons.length; b++) {
      var on = buttons[b].getAttribute("data-site-lang") === current;
      buttons[b].classList.toggle("is-active", on);
      buttons[b].setAttribute("aria-pressed", on ? "true" : "false");
    }

    if (opts.persist) writeStored(current);

    if (opts.source !== "talk" && root.JevenTalk && typeof root.JevenTalk.setLang === "function") {
      root.JevenTalk.setLang(current, "site");
    }

    if (doc.dispatchEvent) {
      try {
        doc.dispatchEvent(new CustomEvent("jeven:lang", { detail: { lang: current } }));
      } catch (e) {}
    }
    return current;
  }

  function set(lang, source) {
    return apply(lang, { persist: true, source: source || "site" });
  }

  function mount(doc) {
    docRef = doc || document;
    current = readStored();
    apply(current, { persist: false, source: "init" });
    docRef.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("[data-site-lang]") : null;
      if (!btn) return;
      set(btn.getAttribute("data-site-lang"), "toggle");
    });
  }

  root.JevenLang = {
    KEY: KEY,
    get: function () { return current; },
    readStored: readStored,
    apply: apply,
    set: set,
    mount: mount
  };

  if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () { mount(document); });
    } else {
      mount(document);
    }
  }
})(typeof window !== "undefined" ? window : globalThis);
