/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  C.vectorize = {
    mode: null, points: [], markers: [], layer: null, radius: 50
  };

  /* ---------- Iniciar selecção ---------- */
  C.startVectorize = function (mode) {
    C.clearVectorize();
    C.vectorize.mode = mode;

    const st = document.getElementById("vectorizeStatus");
    const tx = document.getElementById("vectorizeText");
    if (st) st.hidden = false;
    if (tx) tx.textContent = mode === "buffer"
      ? "Clica nos pontos para agrupar (buffer " + C.vectorize.radius + "m)."
      : "Clica nos pontos para criar o limite.";

    C.map.getContainer().style.cursor = "crosshair";

    C.layers.points.eachLayer(function (l) {
      l.off("click");
      l.on("click", function (e) {
        L.DomEvent.stopPropagation(e);
        C.addVectorizePoint(l);
      });
    });

    C.map.on("click", C.finishVectorize);
    if (C.toast) C.toast("Seleciona pontos no mapa. Clica no vazio para terminar.", "warning");
  };

  /* ---------- Adicionar ponto ---------- */
  C.addVectorizePoint = function (layer) {
    const ll = layer.getLatLng();
    if (!ll) return;
    C.vectorize.points.push(ll);

    const marker = L.circleMarker(ll, {
      radius: 9, color: "#f4a261", weight: 3,
      fillColor: "#fff", fillOpacity: 1, interactive: false
    }).addTo(C.map);
    C.vectorize.markers.push(marker);

    C.previewVectorize();

    const tx = document.getElementById("vectorizeText");
    if (tx) tx.textContent = C.vectorize.points.length + " ponto(s). Clica no vazio para terminar.";
  };

  /* ---------- Pré-visualização ---------- */
  C.previewVectorize = function () {
    if (C.vectorize.layer) {
      C.map.removeLayer(C.vectorize.layer);
      C.vectorize.layer = null;
    }
    if (C.vectorize.points.length < 2) return;

    if (!window.turf) { C.loadTurf().then(C.previewVectorize); return; }

    const features = C.vectorize.points.map(function (ll) {
      return turf.point([ll.lng, ll.lat]);
    });
    const fc = turf.featureCollection(features);

    if (C.vectorize.mode === "buffer") {
      const buffered = turf.buffer(fc, C.vectorize.radius, { units: "meters" });
      let result = buffered.features[0];
      if (buffered.features.length > 1) {
        try {
          result = buffered.features.reduce(function (acc, f) {
            return acc ? turf.union(acc, f) : f;
          }, null);
        } catch (e) { result = buffered.features[0]; }
      }
      C.vectorize.layer = L.geoJSON(result, {
        style: {
          color: "#2d7a5f", weight: 2.5,
          fillColor: "#2d7a5f", fillOpacity: 0.3,
          dashArray: "6 4"
        }
      }).addTo(C.map);
    } else if (C.vectorize.mode === "hull") {
      const hull = turf.convex(fc);
      if (hull) {
        C.vectorize.layer = L.geoJSON(hull, {
          style: {
            color: "#2d7a5f", weight: 2.5,
            fillColor: "#2d7a5f", fillOpacity: 0.3,
            dashArray: "6 4"
          }
        }).addTo(C.map);
      }
    }
  };

  /* ---------- Terminar ---------- */
  C.finishVectorize = function () {
    if (C.vectorize.points.length < 2) {
      if (C.toast) C.toast("Seleciona pelo menos 2 pontos.", "warning");
      return;
    }
    C.map.off("click", C.finishVectorize);
    C.map.getContainer().style.cursor = "";

    if (C.vectorize.layer) {
      C.vectorize.layer.setStyle({
        color: "#174a35", weight: 3,
        fillColor: "#2d7a5f", fillOpacity: 0.4,
        dashArray: null
      });
      C.vectorize.layer.bindPopup(
        '<div class="popup-head" style="background:#174a35">' +
          '<small>VECTORIZAÇÃO</small>' +
          '<strong>' + C.vectorize.mode.toUpperCase() + ' · ' + C.vectorize.points.length + ' pontos</strong>' +
        '</div>' +
        '<div class="popup-credit">Equipa CEDAS · Ciências de Informação Geográfica</div>'
      );
    }

    const st = document.getElementById("vectorizeStatus");
    if (st) st.hidden = true;
    if (C.toast) C.toast("Vectorização concluída: " + C.vectorize.points.length + " pontos agrupados.", "ok");
  };

  /* ---------- Limpar ---------- */
  C.clearVectorize = function () {
    if (!C.map) return;
    C.map.off("click", C.finishVectorize);
    C.vectorize.markers.forEach(function (m) { C.map.removeLayer(m); });
    if (C.vectorize.layer) C.map.removeLayer(C.vectorize.layer);
    C.vectorize = { mode: null, points: [], markers: [], layer: null, radius: C.vectorize.radius || 50 };
    const st = document.getElementById("vectorizeStatus");
    if (st) st.hidden = true;
  };

  /* ---------- Carregar Turf ---------- */
  C.loadTurf = function () {
    if (window.turf) return Promise.resolve();
    return new Promise(function (resolve) {
      const s = document.createElement("script");
      s.src = "https://unpkg.com/@turf/turf@6/turf.min.js";
      s.onload = resolve;
      document.head.appendChild(s);
    });
  };

  /* ---------- UI ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    const btnBuffer = document.getElementById("vectorizeBuffer");
    const btnHull = document.getElementById("vectorizeHull");
    const btnClear = document.getElementById("vectorizeClear");
    const btnFinish = document.getElementById("vectorizeFinish");
    const slider = document.getElementById("bufferRadius");

    if (btnBuffer) btnBuffer.onclick = function () {
      C.loadTurf().then(function () { C.startVectorize("buffer"); });
    };
    if (btnHull) btnHull.onclick = function () {
      C.loadTurf().then(function () { C.startVectorize("hull"); });
    };
    if (btnClear) btnClear.onclick = C.clearVectorize;
    if (btnFinish) btnFinish.onclick = C.finishVectorize;

    if (slider) {
      slider.oninput = function (e) {
        C.vectorize.radius = +e.target.value;
        const lbl = document.getElementById("bufferRadiusValue");
        if (lbl) lbl.textContent = e.target.value + " m";
        if (C.vectorize.points.length) C.previewVectorize();
      };
    }
  });
})();