/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};
  const KEY = "cedas-theme";
  const root = document.documentElement;

  function apply(theme) {
    root.setAttribute("data-theme", theme);
    const btn = document.getElementById("themeToggle");
    if (btn) {
      btn.innerHTML = theme === "dark"
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
    }
  }

  C.toggleTheme = function () {
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    apply(next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
  };

  document.addEventListener("DOMContentLoaded", function () {
    let saved = "light";
    try { saved = localStorage.getItem(KEY) || "light"; } catch (e) {}
    apply(saved);
    const btn = document.getElementById("themeToggle");
    if (btn) btn.addEventListener("click", C.toggleTheme);
  });
})();