(function () {
  var s = document.currentScript;
  var root = s && s.closest ? s.closest("[data-block],.lb-intro") : null;
  try {
    (function () {
      if (typeof root === "undefined" || !root) {
        return;
      }

      var section = root.querySelector
        ? root.querySelector("#farhaArabicWeddingTimeline")
        : null;

      if (
        !section &&
        root.matches &&
        root.matches("#farhaArabicWeddingTimeline")
      ) {
        section = root;
      }

      if (!section) {
        return;
      }

      /*
  CLEAN OLD INSTANCE
*/

      if (typeof section._farhaArabicTimelineCleanup === "function") {
        section._farhaArabicTimelineCleanup();
      }

      var timeline = section.querySelector(".fat-timeline");

      var runner = section.querySelector("#farhaArabicTimelineRunner");

      if (!timeline || !runner) {
        return;
      }

      var rafId = 0;
      var destroyed = false;
      var revealObserver = null;

      /* =========================
   REVEAL
========================= */

      function reveal() {
        if (destroyed) {
          return;
        }

        section.classList.add("fat-show");
      }

      if ("IntersectionObserver" in window) {
        revealObserver = new IntersectionObserver(
          function (entries) {
            for (var i = 0; i < entries.length; i++) {
              if (entries[i].isIntersecting) {
                reveal();

                if (revealObserver) {
                  revealObserver.disconnect();
                  revealObserver = null;
                }

                break;
              }
            }
          },
          {
            threshold: 0.08,
          },
        );

        revealObserver.observe(section);
      } else {
        reveal();
      }

      var revealTimer = window.setTimeout(reveal, 150);

      /* =========================
   FLOWER MOVEMENT

   نفس منطق الكود الناجح
   الذي أرسلته
========================= */

      function updateRunner() {
        rafId = 0;

        if (destroyed || !timeline || !runner) {
          return;
        }

        var rect = timeline.getBoundingClientRect();

        var vh = window.visualViewport
          ? window.visualViewport.height
          : window.innerHeight || document.documentElement.clientHeight || 700;

        var startGuide = vh * 0.68;

        var endGuide = vh * 0.32;

        var travelWindow = rect.height + startGuide - endGuide;

        var progress = (startGuide - rect.top) / travelWindow;

        progress = Math.max(0, Math.min(1, progress));

        var y = progress * rect.height;

        runner.style.transform = "translate3d(0," + y + "px,0)";
      }

      function requestUpdate() {
        if (destroyed || rafId) {
          return;
        }

        rafId = window.requestAnimationFrame(updateRunner);
      }

      /*
  capture:true مهم لأن محرر Farha
  قد يستخدم Scroll Container داخلي
*/

      window.addEventListener("scroll", requestUpdate, {
        passive: true,
        capture: true,
      });

      document.addEventListener("scroll", requestUpdate, {
        passive: true,
        capture: true,
      });

      window.addEventListener("resize", requestUpdate, {
        passive: true,
      });

      if (window.visualViewport) {
        window.visualViewport.addEventListener("scroll", requestUpdate, {
          passive: true,
        });

        window.visualViewport.addEventListener("resize", requestUpdate, {
          passive: true,
        });
      }

      updateRunner();

      var retry1 = window.setTimeout(requestUpdate, 80);

      var retry2 = window.setTimeout(requestUpdate, 300);

      var retry3 = window.setTimeout(requestUpdate, 800);

      /* =========================
   CLEANUP
========================= */

      section._farhaArabicTimelineCleanup = function () {
        destroyed = true;

        if (rafId) {
          window.cancelAnimationFrame(rafId);

          rafId = 0;
        }

        window.clearTimeout(revealTimer);

        window.clearTimeout(retry1);

        window.clearTimeout(retry2);

        window.clearTimeout(retry3);

        if (revealObserver) {
          revealObserver.disconnect();
          revealObserver = null;
        }

        window.removeEventListener("scroll", requestUpdate, true);

        document.removeEventListener("scroll", requestUpdate, true);

        window.removeEventListener("resize", requestUpdate);

        if (window.visualViewport) {
          window.visualViewport.removeEventListener("scroll", requestUpdate);

          window.visualViewport.removeEventListener("resize", requestUpdate);
        }
      };
    })();
  } catch (e) {
    console.error("[farha] كود القسم وقع:", e);
  }
})();
