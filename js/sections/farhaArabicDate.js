(function () {
  var s = document.currentScript;
  var root = s && s.closest ? s.closest("[data-block],.lb-intro") : null;
  try {
    (function () {
      if (typeof root === "undefined" || !root) {
        return;
      }

      var section = null;

      if (root.matches && root.matches("#farhaArabicDate")) {
        section = root;
      }

      if (!section && root.querySelector) {
        section = root.querySelector("#farhaArabicDate");
      }

      if (!section) {
        return;
      }

      if (section._fadCleanup) {
        try {
          section._fadCleanup();
        } catch (e) {}
      }

      var canvases = section.querySelectorAll(".fad-scratch");

      var cleanupFunctions = [];

      function setupCanvas(canvas) {
        var card = canvas.parentElement;

        var ctx = canvas.getContext("2d", {
          willReadFrequently: true,
        });

        if (!ctx) {
          return;
        }

        var drawing = false;
        var revealed = false;

        var lastX = 0;
        var lastY = 0;

        function drawCover() {
          if (revealed) {
            return;
          }

          var rect = canvas.getBoundingClientRect();

          if (rect.width < 1 || rect.height < 1) {
            return;
          }

          var dpr = window.devicePixelRatio || 1;

          dpr = Math.min(Math.max(dpr, 1), 3);

          canvas.width = Math.round(rect.width * dpr);

          canvas.height = Math.round(rect.height * dpr);

          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

          ctx.globalCompositeOperation = "source-over";

          ctx.clearRect(0, 0, rect.width, rect.height);

          var gradient = ctx.createLinearGradient(
            0,
            0,
            rect.width,
            rect.height,
          );

          gradient.addColorStop(0, "#fff9e8");

          gradient.addColorStop(0.3, "#f9eac8");

          gradient.addColorStop(0.65, "#efd29b");

          gradient.addColorStop(1, "#d4a765");

          ctx.fillStyle = gradient;

          ctx.fillRect(0, 0, rect.width, rect.height);

          /* خطوط لمعان خفيفة */

          ctx.save();

          ctx.globalAlpha = 0.18;

          ctx.strokeStyle = "#ffffff";

          ctx.lineWidth = 7;

          for (var x = -rect.height; x < rect.width + rect.height; x += 36) {
            ctx.beginPath();

            ctx.moveTo(x, 0);

            ctx.lineTo(x + rect.height, rect.height);

            ctx.stroke();
          }

          ctx.restore();
        }

        function getPoint(e) {
          var rect = canvas.getBoundingClientRect();

          return {
            x: e.clientX - rect.left,

            y: e.clientY - rect.top,
          };
        }

        function erase(x1, y1, x2, y2) {
          ctx.save();

          ctx.globalCompositeOperation = "destination-out";

          ctx.lineWidth = 30;

          ctx.lineCap = "round";
          ctx.lineJoin = "round";

          ctx.beginPath();

          ctx.moveTo(x1, y1);

          ctx.lineTo(x2, y2);

          ctx.stroke();

          ctx.restore();
        }

        function reveal() {
          if (revealed) {
            return;
          }

          revealed = true;

          canvas.style.transition = "opacity .35s ease";

          canvas.style.opacity = "0";

          canvas.style.pointerEvents = "none";

          if (card) {
            card.classList.add("fad-revealed");
          }

          setTimeout(function () {
            canvas.style.visibility = "hidden";
          }, 380);
        }

        function checkAmount() {
          if (revealed) {
            return;
          }

          var width = canvas.width;

          var height = canvas.height;

          if (!width || !height) {
            return;
          }

          var pixels;

          try {
            pixels = ctx.getImageData(0, 0, width, height).data;
          } catch (e) {
            return;
          }

          var transparent = 0;
          var checked = 0;

          for (var i = 3; i < pixels.length; i += 100) {
            checked++;

            if (pixels[i] < 50) {
              transparent++;
            }
          }

          if (checked > 0 && transparent / checked > 0.4) {
            reveal();
          }
        }

        function pointerDown(e) {
          if (revealed) {
            return;
          }

          drawing = true;

          var point = getPoint(e);

          lastX = point.x;
          lastY = point.y;

          erase(point.x, point.y, point.x, point.y);
        }

        function pointerMove(e) {
          if (!drawing || revealed) {
            return;
          }

          var point = getPoint(e);

          erase(lastX, lastY, point.x, point.y);

          lastX = point.x;
          lastY = point.y;
        }

        function pointerEnd() {
          if (!drawing || revealed) {
            return;
          }

          drawing = false;

          checkAmount();
        }

        canvas.addEventListener("pointerdown", pointerDown);

        canvas.addEventListener("pointermove", pointerMove);

        canvas.addEventListener("pointerup", pointerEnd);

        canvas.addEventListener("pointercancel", pointerEnd);

        /* رسم الطبقة بعد ظهور المقاسات */

        var timers = [];

        [0, 100, 300, 600].forEach(function (delay) {
          var timer = setTimeout(drawCover, delay);

          timers.push(timer);
        });

        cleanupFunctions.push(function () {
          timers.forEach(function (timer) {
            clearTimeout(timer);
          });

          canvas.removeEventListener("pointerdown", pointerDown);

          canvas.removeEventListener("pointermove", pointerMove);

          canvas.removeEventListener("pointerup", pointerEnd);

          canvas.removeEventListener("pointercancel", pointerEnd);
        });
      }

      for (var i = 0; i < canvases.length; i++) {
        setupCanvas(canvases[i]);
      }

      section._fadCleanup = function () {
        for (var i = 0; i < cleanupFunctions.length; i++) {
          try {
            cleanupFunctions[i]();
          } catch (e) {}
        }

        cleanupFunctions = [];
      };
    })();
  } catch (e) {
    console.error("[farha] كود القسم وقع:", e);
  }
})();
