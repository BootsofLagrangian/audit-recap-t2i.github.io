/* Copy the BibTeX entry to the clipboard. */
(function () {
  var button = document.getElementById("copy-bib");
  var source = document.getElementById("bibtex-text");
  if (!button || !source) return;

  function done(label) {
    button.textContent = label;
    window.setTimeout(function () { button.textContent = "Copy"; }, 1800);
  }

  function fallback(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(area);
    return ok;
  }

  button.addEventListener("click", function () {
    var text = source.textContent;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () { done("Copied"); }, function () {
        done(fallback(text) ? "Copied" : "Select and copy");
      });
    } else {
      done(fallback(text) ? "Copied" : "Select and copy");
    }
  });
})();
