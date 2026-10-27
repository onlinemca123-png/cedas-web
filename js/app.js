/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  window.addEventListener("resize", function () {
    if (C.map) C.map.invalidateSize();
  });

  /* Atalhos de teclado */
  document.addEventListener("keydown", function (e) {
    if (["INPUT", "SELECT", "TEXTAREA"].includes(e.target.tagName)) return;
    switch (e.key.toLowerCase()) {
      case "f": C.fitBounds(); break;
      case "t": if (C.toggleTheme) C.toggleTheme(); break;
      case "s": e.preventDefault(); if (C.search) C.search(); break;
      case "l": { const b = document.getElementById("locate"); if (b) b.click(); break; }
      case "p": window.print(); break;
      case "?":
        if (C.toast) C.toast("Atalhos: F=Extensão · T=Tema · S=Pesquisar · L=Localizar · P=Imprimir · ESC=Fechar", "ok");
        break;
    }
  });

  /* Service Worker (PWA) */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function (e) {
        console.warn("Service Worker não registado:", e);
      });
    });
  }
})();