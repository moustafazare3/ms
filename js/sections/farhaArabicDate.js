(function () {
  var s = document.currentScript;
  var root = s && s.closest ? s.closest("[data-block],.lb-intro") : null;
  try {
    (function () {
      if (!root) {
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

      // التاريخ ظاهر مباشرة — بدون طبقة مسح
      var cards = section.querySelectorAll(".fad-card");
      for (var i = 0; i < cards.length; i++) {
        cards[i].classList.add("fad-revealed");
      }

      var canvases = section.querySelectorAll(".fad-scratch");
      for (var j = 0; j < canvases.length; j++) {
        canvases[j].remove();
      }

      section._fadCleanup = function () {};
    })();
  } catch (e) {
    console.error("[farha] كود القسم وقع:", e);
  }
})();
