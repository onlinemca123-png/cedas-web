/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  document.addEventListener("DOMContentLoaded", function () {

    /* GeoJSON */
    const eg = document.getElementById("exportGeoJSON");
    if (eg) {
      eg.onclick = function () {
        const out = { type: "FeatureCollection", name: "CEDAS_GeoViewer", features: [] };
        ["points", "lines", "polygons"].forEach(function (k) {
          if (!C.map.hasLayer(C.layers[k])) return;
          C.layers[k].eachLayer(function (l) {
            out.features.push({
              type: "Feature",
              geometry: l.feature ? l.feature.geometry : null,
              properties: { ...(l.feature.properties || {}), _cedas_camada: k }
            });
          });
        });
        if (!out.features.length) { C.toast("Sem feições visíveis.", "warning"); return; }
        const u = URL.createObjectURL(new Blob(
          [JSON.stringify(out, null, 2)], { type: "application/geo+json" }
        ));
        const a = document.createElement("a");
        a.href = u; a.download = "cedas-dados-visiveis.geojson"; a.click();
        URL.revokeObjectURL(u);
        C.toast(out.features.length + " feição(ões) exportadas.", "ok");
      };
    }

    /* CSV */
    const ec = document.getElementById("exportCSV");
    if (ec) {
      ec.onclick = function () {
        const rows = [];
        const headers = new Set(["camada"]);
        ["points", "lines", "polygons"].forEach(function (k) {
          if (!C.map.hasLayer(C.layers[k])) return;
          C.layers[k].eachLayer(function (l) {
            const p = l.feature.properties || {};
            Object.keys(p).forEach(function (key) {
              if (!key.startsWith("_")) headers.add(key);
            });
          });
        });
        const headArr = Array.from(headers);
        ["points", "lines", "polygons"].forEach(function (k) {
          if (!C.map.hasLayer(C.layers[k])) return;
          C.layers[k].eachLayer(function (l) {
            const p = l.feature.properties || {};
            const row = { camada: k };
            headArr.forEach(function (h) { if (h !== "camada") row[h] = p[h] ?? ""; });
            rows.push(row);
          });
        });
        if (!rows.length) { C.toast("Sem feições.", "warning"); return; }
        const csv = [
          headArr.join(","),
          ...rows.map(function (r) {
            return headArr.map(function (h) {
              return '"' + String(r[h] ?? "").replace(/"/g, '""') + '"';
            }).join(",");
          })
        ].join("\n");
        const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = "cedas-dados.csv"; a.click();
        URL.revokeObjectURL(url);
        C.toast(rows.length + " registos exportados.", "ok");
      };
    }

    /* Imagem / PDF */
    const ei = document.getElementById("exportImage");
    if (ei) {
      ei.onclick = function () {
        C.modal(
          "Exportar imagem / PDF",
          '<div class="empty"><i class="fa-regular fa-image" style="font-size:25px"></i>' +
          '<p>A captura directa pode ser bloqueada por CORS. Usa "Imprimir / Guardar PDF".</p></div>',
          [
            { label: "Cancelar" },
            { label: "Imprimir / PDF", primary: true, action: function () {
              C.closeModal(); window.print();
            }}
          ]
        );
      };
    }

    /* Página Sobre */
    const ap = document.getElementById("aboutPage");
    if (ap) ap.onclick = function () { location.href = "pages/sobre.html"; };
  });
})();