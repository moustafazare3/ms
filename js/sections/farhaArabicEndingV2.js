(function () {
  var s = document.currentScript;
  var root = s && s.closest ? s.closest("[data-block],.lb-intro") : null;
  try {
    (function () {
      if (typeof root === "undefined" || !root) {
        return;
      }

      var section = root.querySelector
        ? root.querySelector("#farhaArabicEndingV2")
        : null;

      if (!section && root.matches && root.matches("#farhaArabicEndingV2")) {
        section = root;
      }

      if (!section) {
        return;
      }

      if (typeof section._farhaArabicEndingV2Cleanup === "function") {
        section._farhaArabicEndingV2Cleanup();
      }

      var destroyed = false;
      var observer = null;

      function reveal() {
        if (destroyed) {
          return;
        }

        section.classList.add("fae-show");
      }

      if ("IntersectionObserver" in window) {
        observer = new IntersectionObserver(
          function (entries) {
            for (var i = 0; i < entries.length; i++) {
              if (entries[i].isIntersecting) {
                reveal();

                if (observer) {
                  observer.disconnect();
                  observer = null;
                }

                break;
              }
            }
          },
          {
            threshold: 0.08,
          },
        );

        observer.observe(section);
      } else {
        reveal();
      }

      var timer = window.setTimeout(reveal, 120);

      section._farhaArabicEndingV2Cleanup = function () {
        destroyed = true;

        window.clearTimeout(timer);

        if (observer) {
          observer.disconnect();
          observer = null;
        }
      };
    })();
  } catch (e) {
    console.error("[farha] كود القسم وقع:", e);
  }
})();
