/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  /* ---------- Medição ---------- */
  C.measure = { mode: null, points: [], markers: [], line: null, finished: false };

  C.dist = function (m) {
    return m >= 1000
      ? (m / 1000).toLocaleString("pt-PT", { maximumFractionDigits: 3 }) + " km"
      : m.toLocaleString("pt-PT", { maximumFractionDigits: 1 }) + " m";
  };

  C.area = function (pts) {
    const R = 6378137;
    const a = pts.map(function (p) { return [p.lat * Math.PI / 180, p.lng * Math.PI / 180]; });
    let s = 0;
    for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      s += (a[i][1] - a[j][1]) * (2 + Math.sin(a[j][0]) + Math.sin(a[i][0]));
    }
    return Math.abs(s * R * R / 2);
  };

  C.areaText = function (m) {
    return m >= 1e6
      ? (m / 1e6).toLocaleString("pt-PT", { maximumFractionDigits: 4 }) + " km²"
      : m.toLocaleString("pt-PT", { maximumFractionDigits: 1 }) + " m²";
  };

  C.clearMeasure = function (hide) {
    if (hide === undefined) hide = true;
    if (C.map) {
      C.map.off("click", C.addPoint);
      C.map.off("dblclick", C.finishMeasure);
      if (C.measure.line) C.map.removeLayer(C.measure.line);
      C.measure.markers.forEach(function (m) { C.map.removeLayer(m); });
      C.map.getContainer().style.cursor = "";
    }
    C.measure = { mode: null, points: [], markers: [], line: null, finished: false };
    ["measureDistance", "measureArea"].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.classList.remove("active");
    });
    if (hide) {
      const s = document.getElementById("measureStatus");
      if (s) s.hidden = true;
    }
  };

  C.startMeasure = function (mode) {
    C.clearMeasure(false);
    C.measure.mode = mode;
    const st = document.getElementById("measureStatus");
    const tx = document.getElementById("measureText");
    if (st) st.hidden = false;
    if (tx) tx.textContent = mode === "distance"
      ? "Clica para adicionar pontos à linha."
      : "Clica para desenhar o limite da área.";
    const btn = document.getElementById(mode === "distance" ? "measureDistance" : "measureArea");
    if (btn) btn.classList.add("active");
    C.map.getContainer().style.cursor = "crosshair";
    C.map.on("click", C.addPoint);
    C.map.on("dblclick", C.finishMeasure);
    if (C.toast) C.toast("Ferramenta de medição activa.", "warning");
  };

  C.addPoint = function (e) {
    if (!C.measure.mode || C.measure.finished) return;
    C.measure.points.push(e.latlng);
    C.measure.markers.push(
      L.circleMarker(e.latlng, {
        radius: 4, color: "#fff", weight: 2,
        fillColor: "#174a35", fillOpacity: 1, interactive: false
      }).addTo(C.map)
    );
    if (C.measure.line) C.map.removeLayer(C.measure.line);

    const tx = document.getElementById("measureText");

    if (C.measure.mode === "distance") {
      C.measure.line = L.polyline(C.measure.points, {
        color: "#f4a261", weight: 3, dashArray: "7 5"
      }).addTo(C.map);
      let d = 0;
      for (let i = 1; i < C.measure.points.length; i++) {
        d += C.measure.points[i - 1].distanceTo(C.measure.points[i]);
      }
      if (tx) tx.textContent = C.measure.points.length < 2
        ? "Adiciona mais um ponto."
        : "Distância: " + C.dist(d);
    } else {
      if (C.measure.points.length >= 2) {
        C.measure.line = L.polygon(C.measure.points, {
          color: "#174a35", weight: 2, fillColor: "#2d7a5f",
          fillOpacity: 0.2, dashArray: "5 4"
        }).addTo(C.map);
      }
      if (tx) tx.textContent = C.measure.points.length < 3
        ? "Adiciona pelo menos três pontos."
        : "Área: " + C.areaText(C.area(C.measure.points));
    }
  };

  C.finishMeasure = function (e) {
    if (e && e.originalEvent) L.DomEvent.stop(e);
    if (!C.measure.mode) return;
    const min = C.measure.mode === "distance" ? 2 : 3;
    if (C.measure.points.length < min) {
      if (C.toast) C.toast("Adiciona pelo menos " + min + " pontos.", "warning");
      return;
    }
    C.measure.finished = true;
    C.map.off("click", C.addPoint);
    C.map.off("dblclick", C.finishMeasure);
    C.map.getContainer().style.cursor = "";
    const tx = document.getElementById("measureText");
    if (tx) tx.textContent += " · Concluída.";
    const b1 = document.getElementById("measureDistance");
    const b2 = document.getElementById("measureArea");
    if (b1) b1.classList.remove("active");
    if (b2) b2.classList.remove("active");
  };

  /* ---------- Modo apresentação ---------- */
  C.togglePresentation = function () {
    document.body.classList.toggle("presentation-mode");
    if (C.map) setTimeout(function () { C.map.invalidateSize(); }, 300);
    if (document.body.classList.contains("presentation-mode")) {
      if (C.toast) C.toast("Modo apresentação activo. Prime ESC para sair.", "ok");
    }
  };

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("presentation-mode")) {
      document.body.classList.remove("presentation-mode");
      if (C.map) setTimeout(function () { C.map.invalidateSize(); }, 300);
    }
  });

  /* ---------- UI ---------- */
  document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll("[data-panel]").forEach(function (b) {
      b.onclick = function () {
        const p = document.getElementById(b.dataset.panel);
        const open = b.getAttribute("aria-expanded") !== "true";
        b.setAttribute("aria-expanded", open);
        if (p) p.hidden = !open;
      };
    });

    const collapse = document.getElementById("collapse");
    if (collapse) {
      collapse.onclick = function () {
        document.getElementById("sidebar").classList.toggle("collapsed");
        setTimeout(function () { if (C.map) C.map.invalidateSize(); }, 260);
      };
    }

    const mobile = document.getElementById("mobileMenu");
    if (mobile) {
      mobile.onclick = function () {
        document.getElementById("sidebar").classList.toggle("collapsed");
        setTimeout(function () { if (C.map) C.map.invalidateSize(); }, 260);
      };
    }

    const extent = document.getElementById("extent");
    const reset = document.getElementById("reset");
    if (extent) extent.onclick = C.fitBounds;
    if (reset) reset.onclick = C.fitBounds;

    const md = document.getElementById("measureDistance");
    const ma = document.getElementById("measureArea");
    const fm = document.getElementById("finishMeasure");
    const cm = document.getElementById("cancelMeasure");
    if (md) md.onclick = function () { C.startMeasure("distance"); };
    if (ma) ma.onclick = function () { C.startMeasure("area"); };
    if (fm) fm.onclick = function () { C.finishMeasure(); };
    if (cm) cm.onclick = function () { C.clearMeasure(); };

    const locate = document.getElementById("locate");
    if (locate) {
      locate.onclick = function () {
        if (!navigator.geolocation) {
          if (C.toast) C.toast("Este navegador não suporta geolocalização.", "error");
          return;
        }
        if (C.toast) C.toast("A pedir autorização de localização.", "warning");
        navigator.geolocation.getCurrentPosition(
          function (p) {
            const ll = [p.coords.latitude, p.coords.longitude];
            C.map.setView(ll, 16);
            L.circleMarker(ll, {
              radius: 8, color: "#fff", weight: 3,
              fillColor: "#2878d0", fillOpacity: 1
            }).addTo(C.map)
              .bindPopup("A tua localização · precisão " + Math.round(p.coords.accuracy) + " m")
              .openPopup();
          },
          function (e) {
            if (C.toast) C.toast(
              e.code === 1 ? "Acesso à localização recusado." : "Não foi possível obter a localização.",
              "error"
            );
          },
          { enableHighAccuracy: true, timeout: 12000 }
        );
      };
    }

    const fs = document.getElementById("fullscreen");
    if (fs) {
      fs.onclick = async function () {
        try {
          if (!document.fullscreenElement) {
            await document.getElementById("workspace").requestFullscreen();
          } else {
            await document.exitFullscreen();
          }
        } catch (e) {
          if (C.toast) C.toast("Ecrã inteiro indisponível.", "warning");
        }
      };
    }
    document.addEventListener("fullscreenchange", function () {
      setTimeout(function () { if (C.map) C.map.invalidateSize(); }, 200);
    });

    const pr = document.getElementById("print");
    if (pr) pr.onclick = function () { window.print(); };

    const pres = document.getElementById("presentation");
    if (pres) pres.onclick = C.togglePresentation;

    /* Toggles */
    [["showPoints", "points"], ["showLines", "lines"], ["showPolygons", "polygons"]].forEach(function (pair) {
      const el = document.getElementById(pair[0]);
      if (!el) return;
      el.onchange = function (e) {
        const k = pair[1];
        if (e.target.checked) C.layers[k].addTo(C.map);
        else C.map.removeLayer(C.layers[k]);
      };
    });

    /* Opacidades */
    [["opacityPoints", "points"], ["opacityLines", "lines"], ["opacityPolygons", "polygons"]].forEach(function (pair) {
      const el = document.getElementById(pair[0]);
      if (!el) return;
      el.oninput = function (e) {
        const k = pair[1];
        const v = +e.target.value / 100;
        C.layers[k].eachLayer(function (l) {
          if (k === "points") l.setStyle({ fillOpacity: v, opacity: v });
          else if (k === "lines") l.setStyle({ opacity: v });
          else l.setStyle({ fillOpacity: v });
        });
      };
    });

    /* Basemaps */
    document.querySelectorAll("[data-base]").forEach(function (b) {
      b.onclick = function () {
        Object.values(C.bases).forEach(function (l) { C.map.removeLayer(l); });
        C.bases[b.dataset.base].addTo(C.map);
        document.querySelectorAll("[data-base]").forEach(function (x) {
          x.classList.toggle("selected", x === b);
        });
      };
    });
  });
})();