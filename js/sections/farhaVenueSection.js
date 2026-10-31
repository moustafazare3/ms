(function () {
  var s = document.currentScript;
  var root = s && s.closest ? s.closest("[data-block],.lb-intro") : null;
  try {
    (function () {
      "use strict";

      function initialize() {
        var scope = typeof root !== "undefined" && root ? root : document;

        var sections = [];

        if (scope.matches && scope.matches("#farhaVenueSection")) {
          sections.push(scope);
        }

        if (scope.querySelectorAll) {
          var found = scope.querySelectorAll("#farhaVenueSection");

          for (var i = 0; i < found.length; i++) {
            sections.push(found[i]);
          }
        }

        if (!sections.length) {
          return false;
        }

        sections.forEach(function (section) {
          var map = section.querySelector(".fvs-map");
          var button = section.querySelector(".fvs-button");

          if (button) {
            button.href = CLIENT_SETTINGS.mapsLink;
          }

          if (map && CLIENT_SETTINGS.embedCode) {
            var holder = document.createElement("div");
            holder.innerHTML = CLIENT_SETTINGS.embedCode.trim();

            var iframe = holder.querySelector("iframe");

            if (iframe) {
              var oldFrame = map.querySelector("iframe");

              if (!oldFrame || oldFrame.src !== iframe.src) {
                map.replaceChildren(iframe);
              }
            }
          }

          // Never modify the uploaded photo.
        });

        return true;
      }

      function run() {
        if (initialize()) return;

        var attempts = 0;
        var retry = setInterval(function () {
          attempts++;

          if (initialize() || attempts >= 30) {
            clearInterval(retry);
          }
        }, 300);
      }

      /*
  ============================================
              CLIENT SETTINGS

  1. الصق رابط الوصول في mapsLink
  2. الصق كود iframe كامل في embedCode

  ============================================
  */

      var CLIENT_SETTINGS = {
        mapsLink: "https://maps.app.goo.gl/d8oLysWv9J42x5TF8",

        embedCode: `
<iframe src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d1216.0608317909778!2d29.942437571685915!3d31.227742617273652!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMzHCsDEzJzM5LjgiTiAyOcKwNTYnMzIuOSJF!5e0!3m2!1sen!2seg!4v1793262375141!5m2!1sen!2seg" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>
`,
      };

      run();
    })();
  } catch (e) {
    console.error("[farha] كود القسم وقع:", e);
  }
})();
