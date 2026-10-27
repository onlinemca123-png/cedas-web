/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  C.showDetails = function (feature, layer, kind) {
    const panel = document.getElementById("detailsPanel");
    const content = document.getElementById("detailsContent");
    const titleEl = document.getElementById("detailsTitle");
    if (!panel || !content || !titleEl) return;

    const p = feature.properties || {};
    const layerNames = { points: "Ponto", lines: "Linha", polygons: "Polígono" };
    const layerColors = { points: "#2d7a5f", lines: "#e99b50", polygons: "#174a35" };

    const sigla = p._sigla;
    const classeNome = sigla && C.classes && C.classes[sigla] ? C.classes[sigla].nome : null;
    const cor = sigla && C.classes && C.classes[sigla] ? C.classes[sigla].cor : layerColors[kind];

    titleEl.innerHTML =
      '<span class="details-kind" style="background:' + cor + '">' +
        (sigla ? sigla + " · " + classeNome : layerNames[kind]) +
      '</span>' +
      '<span class="details-name">' + (p.t || p.nome || p.name || p.id || "Feição") + '</span>';

    const entries = Object.entries(p).filter(function ([k]) { return !k.startsWith("_"); });

    if (!entries.length) {
      content.innerHTML = '<div class="empty">Sem atributos disponíveis.</div>';
    } else {
      content.innerHTML = '<table class="details-table">' +
        entries.map(function ([k, v]) {
          return '<tr><td>' + k + '</td><td>' + (v ?? "—") + '</td></tr>';
        }).join("") +
        '</table>';
    }

    const actions = document.getElementById("detailsActions");
    if (actions) {
      actions.innerHTML = "";

      const zoomBtn = document.createElement("button");
      zoomBtn.className = "wide";
      zoomBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass-plus"></i> Zoom para a feição';
      zoomBtn.onclick = function () {
        try {
          if (layer.getBounds && layer.getBounds().isValid()) {
            C.map.fitBounds(layer.getBounds().pad(0.5), { maxZoom: 18 });
          } else if (layer.getLatLng) {
            C.map.setView(layer.getLatLng(), 18);
          }
        } catch (e) {}
      };
      actions.append(zoomBtn);

      const copyBtn = document.createElement("button");
      copyBtn.className = "wide";
      copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar coordenadas';
      copyBtn.onclick = function () {
        let coords = "";
        try {
          if (layer.getLatLng) {
            const ll = layer.getLatLng();
            coords = ll.lat + ", " + ll.lng;
          } else if (layer.getBounds) {
            const b = layer.getBounds();
            coords = b.getSouth() + "," + b.getWest() + " : " + b.getNorth() + "," + b.getEast();
          }
        } catch (e) {}
        if (coords) {
          navigator.clipboard.writeText(coords);
          if (C.toast) C.toast("Coordenadas copiadas.", "ok");
        } else {
          if (C.toast) C.toast("Não foi possível obter coordenadas.", "warning");
        }
      };
      actions.append(copyBtn);
    }

    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
  };

  C.closeDetails = function () {
    const panel = document.getElementById("detailsPanel");
    if (panel) {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    const closeBtn = document.getElementById("detailsClose");
    if (closeBtn) closeBtn.onclick = C.closeDetails;

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") C.closeDetails();
    });
  });
})();