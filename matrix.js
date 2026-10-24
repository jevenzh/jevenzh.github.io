/* Lightweight Matrix rain — disabled when prefers-reduced-motion */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduce.matches) return;

  var canvas = document.getElementById("matrix");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var chars =
    "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ01アイウエオカキクケコサシスセソABCDEF<>/#[]{}";
  var fontSize = 14;
  var columns = 0;
  var drops = [];
  var raf = 0;
  var last = 0;
  var fpsInterval = 1000 / 22;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    columns = Math.floor(canvas.width / fontSize);
    drops = [];
    for (var i = 0; i < columns; i++) {
      drops[i] = Math.random() * -40;
    }
  }

  function draw(now) {
    raf = requestAnimationFrame(draw);
    var elapsed = now - last;
    if (elapsed < fpsInterval) return;
    last = now - (elapsed % fpsInterval);

    ctx.fillStyle = "rgba(5, 8, 5, 0.08)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = fontSize + "px monospace";

    for (var i = 0; i < drops.length; i++) {
      var ch = chars.charAt(Math.floor(Math.random() * chars.length));
      var x = i * fontSize;
      var y = drops[i] * fontSize;
      var head = Math.random() > 0.96;
      ctx.fillStyle = head ? "#e8ffe8" : "#00ff66";
      ctx.globalAlpha = head ? 0.9 : 0.55 + Math.random() * 0.35;
      ctx.fillText(ch, x, y);
      ctx.globalAlpha = 1;

      if (y > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  resize();
  window.addEventListener("resize", resize);
  raf = requestAnimationFrame(draw);

  reduce.addEventListener("change", function (e) {
    if (e.matches) {
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = "none";
    }
  });
})();
