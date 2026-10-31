(function () {
  var s = document.currentScript;
  var root = s && s.closest ? s.closest("[data-block],.lb-intro") : null;
  try {
    (function () {
      if (typeof root === "undefined" || !root) {
        return;
      }

      var section = root.querySelector
        ? root.querySelector("#farhaArabicCountdown")
        : null;

      if (!section && root.matches && root.matches("#farhaArabicCountdown")) {
        section = root;
      }

      if (!section) {
        return;
      }

      if (typeof section._farhaCountdownCleanup === "function") {
        section._farhaCountdownCleanup();
      }

      var TARGET_DATE = "2026-12-15T18:00:00+03:00";

      var daysEl = section.querySelector("#facdDays");

      var hoursEl = section.querySelector("#facdHours");

      var minutesEl = section.querySelector("#facdMinutes");

      var secondsEl = section.querySelector("#facdSeconds");

      if (!daysEl || !hoursEl || !minutesEl || !secondsEl) {
        return;
      }

      var destroyed = false;
      var timer = null;
      var revealObserver = null;

      var arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

      function toArabicNumber(value) {
        var text = String(value);

        if (text.length < 2) {
          text = "0" + text;
        }

        return text.replace(/[0-9]/g, function (digit) {
          return arabicDigits[Number(digit)];
        });
      }

      function updateCountdown() {
        if (destroyed) {
          return;
        }

        var target = new Date(TARGET_DATE).getTime();

        var diff = target - Date.now();

        if (!isFinite(target) || diff <= 0) {
          daysEl.textContent = "٠٠";
          hoursEl.textContent = "٠٠";
          minutesEl.textContent = "٠٠";
          secondsEl.textContent = "٠٠";

          return;
        }

        var days = Math.floor(diff / 86400000);

        var hours = Math.floor((diff % 86400000) / 3600000);

        var minutes = Math.floor((diff % 3600000) / 60000);

        var seconds = Math.floor((diff % 60000) / 1000);

        daysEl.textContent = toArabicNumber(days);

        hoursEl.textContent = toArabicNumber(hours);

        minutesEl.textContent = toArabicNumber(minutes);

        secondsEl.textContent = toArabicNumber(seconds);
      }

      updateCountdown();

      timer = window.setInterval(updateCountdown, 1000);

      function reveal() {
        if (destroyed) {
          return;
        }

        section.classList.add("facd-show");
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

      var revealTimer = window.setTimeout(reveal, 120);

      section._farhaCountdownCleanup = function () {
        destroyed = true;

        if (timer) {
          window.clearInterval(timer);

          timer = null;
        }

        window.clearTimeout(revealTimer);

        if (revealObserver) {
          revealObserver.disconnect();
          revealObserver = null;
        }
      };
    })();
  } catch (e) {
    console.error("[farha] كود القسم وقع:", e);
  }
})();
