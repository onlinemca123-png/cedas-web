/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  C.bases = {};
  C.layers = {};
  C.meta = {};
  C.features = [];

  /* ---------- Classes temáticas ---------- */
  C.classes = {
    ED: { nome: "Edifícios",                 cor: "#8B4513", icone: "fa-building" },
    VA: { nome: "Vias de Acesso",            cor: "#555555", icone: "fa-road" },
    AR: { nome: "Arvoredo",                  cor: "#2E8B57", icone: "fa-tree" },
    RA: { nome: "Reservatório de Água",      cor: "#1E90FF", icone: "fa-water" },
    CA: { nome: "Campo Agrícola",            cor: "#9ACD32", icone: "fa-seedling" },
    RE: { nome: "Relevo (curvas de nível)",  cor: "#A0522D", icone: "fa-mountain" },
    QE: { nome: "Quadro Eléctrico",          cor: "#FFD700", icone: "fa-bolt" },
    PE: { nome: "Postes Eléctricos",         cor: "#FF8C00", icone: "fa-plug" },
    EP: { nome: "Estação Pluviométrica",     cor: "#00CED1", icone: "fa-cloud-rain" },
    PT: { nome: "Posto de Transformação",    cor: "#DC143C", icone: "fa-industry" }
  };

  /* ---------- Estilos ---------- */
  function pointToLayer(feature, latlng) {
    const sigla = (feature.properties && feature.properties._sigla) || "ED";
    const cor = (C.classes[sigla] && C.classes[sigla].cor) || "#2d7a5f";
    return L.circleMarker(latlng, {
      radius: 6, color: "#fff", weight: 1.5,
      fillColor: cor, fillOpacity: 0.9
    });
  }
  function lineStyle() { return { color: "#e99b50", weight: 3, dashArray: "7 5", opacity: 0.9 }; }
  function polygonStyle() { return { color: "#174a35", weight: 2, fillColor: "#2d7a5f", fillOpacity: 0.35 }; }

  /* ---------- Popups ---------- */
  function title(feature) {
    const p = feature.properties || {};
    return p.t || p.nome || p.name || p.id || "Feição";
  }
  function bindPopup(feature, layer) {
    const p = feature.properties || {};
    const sigla = p._sigla;
    const classeNome = sigla && C.classes[sigla] ? C.classes[sigla].nome : null;
    const corClasse = sigla && C.classes[sigla] ? C.classes[sigla].cor : "#174a35";

    const rows = Object.entries(p)
      .filter(function ([k]) { return !k.startsWith("_"); })
      .map(function ([k, v]) { return `<tr><td>${k}</td><td>${v ?? ""}</td></tr>`; })
      .join("");

    const html =
      `<div class="popup-head" style="background:${corClasse}">` +
        `<small>CEDAS · Sábié${sigla ? " · " + sigla : ""}</small>` +
        `<strong>${classeNome || title(feature)}</strong>` +
      `</div>` +
      (rows ? `<table class="popup-table">${rows}</table>` : `<div style="padding:12px;font-size:11px;color:var(--muted)">Sem atributos.</div>`) +
      `<div class="popup-credit">Equipa CEDAS · Ciências de Informação Geográfica</div>`;

    layer.bindPopup(html);
    layer.bindTooltip(title(feature), { sticky: true, direction: "top" });

    layer.on("click", function () {
      if (C.showDetails) C.showDetails(feature, layer, layer._kind || "points");
    });
  }

  /* ---------- Criação das camadas ---------- */
  function createLayers() {
    C.layers.points = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 40,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 17,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        let size = "small";
        if (count > 50) size = "large";
        else if (count > 10) size = "medium";
        return L.divIcon({
          html: '<div class="cluster-icon ' + size + '">' + count + '</div>',
          className: "cluster-wrapper",
          iconSize: L.point(40, 40)
        });
      }
    });
    C.layers.lines = L.geoJSON(null, { style: lineStyle, onEachFeature: bindPopup });
    C.layers.polygons = L.geoJSON(null, { style: polygonStyle, onEachFeature: bindPopup });
  }

  /* ---------- Carregamento ---------- */
  C.load = async function (url, layer, kind) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.features) || data.features.length === 0) {
      throw new Error(`Sem feições em ${url}`);
    }

    if (kind === "points" && layer.addLayers) {
      /* Cluster */
      const markers = data.features.map(function (f) {
        const m = L.circleMarker(
          [f.geometry.coordinates[1], f.geometry.coordinates[0]],
          { radius: 6, color: "#fff", weight: 1.5, fillColor: "#2d7a5f", fillOpacity: 0.9 }
        );
        m.feature = f;
        m._kind = "points";
        bindPopup(f, m);
        C.features.push({ kind: "points", layer: m, feature: f });
        return m;
      });
      layer.addLayers(markers);
    } else {
      layer.addData(data);
      layer.eachLayer(function (l) {
        l._kind = kind;
        C.features.push({ kind: kind, layer: l, feature: l.feature });
      });
    }
    C.meta[kind] = { data: data, url: url };
    return data.features.length;
  };

  /* ---------- Contagens ---------- */
  C.counts = function () {
    const p = C.layers.points.getLayers ? C.layers.points.getLayers().length : 0;
    const l = C.layers.lines.getLayers().length;
    const g = C.layers.polygons.getLayers().length;
    const set = function (id, v) { const el = document.getElementById(id); if (el) el.textContent = v; };
    set("pointCount", p);
    set("lineCount", l);
    set("polygonCount", g);
  };

  /* ---------- Enquadramento ---------- */
  C.fitBounds = function () {
    if (!C.map) return;
    const g = L.featureGroup([C.layers.points, C.layers.lines, C.layers.polygons]);
    if (g.getLayers().length && g.getBounds().isValid()) {
      C.map.fitBounds(g.getBounds(), { padding: [35, 35], maxZoom: 16 });
    } else {
      C.map.setView([-25.32, 32.265], 14);
      if (C.toast) C.toast("Sem feições com extensão válida.", "warning");
    }
  };

  /* ---------- Estado ---------- */
  function state(text, error) {
    const e = document.getElementById("dataState");
    if (e) { e.textContent = text; e.classList.toggle("error", !!error); }
    const s = document.getElementById("mapStatus");
    if (s) s.textContent = error ? "Erro nos dados" : "Dados geográficos";
  }

  /* ---------- Inicialização ---------- */
  C.start = async function () {
    if (!document.getElementById("map")) return;
    try {
      C.map = L.map("map", { preferCanvas: true, zoomAnimation: true })
        .setView([-25.32, 32.265], 14);

      /* Basemaps */
      C.bases.carto = L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd", maxZoom: 20, detectRetina: true
        }
      );
      C.bases.sat = L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        { attribution: "Tiles &copy; Esri", maxZoom: 19 }
      );
      C.bases.topo = L.tileLayer(
        "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        { attribution: "&copy; OpenTopoMap", maxZoom: 17 }
      );
      C.bases.carto.addTo(C.map);

      /* Escala */
      L.control.scale({ imperial: false, metric: true, position: "bottomleft" }).addTo(C.map);

      /* MiniMapa */
      try {
        new L.Control.MiniMap(
          L.tileLayer(
            "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
            { subdomains: "abcd", maxZoom: 20, detectRetina: true }
          ),
          { toggleDisplay: true, position: "bottomright", width: 140, height: 95, zoomLevelOffset: -5 }
        ).addTo(C.map);
      } catch (e) { console.warn("Minimapa indisponível", e); }

      /* Coordenadas */
      C.map.on("mousemove", function (e) {
        const el = document.getElementById("coords");
        if (el) el.textContent = "Lat: " + e.latlng.lat.toFixed(5) + " | Lon: " + e.latlng.lng.toFixed(5);
      });

      /* Camadas */
      createLayers();

      /* Carregar dados */
      const results = await Promise.allSettled([
        C.load("data/pontos.geojson", C.layers.points, "points"),
        C.load("data/linha1.geojson", C.layers.lines, "lines"),
        C.load("data/poligonos.geojson", C.layers.polygons, "polygons")
      ]);

      let errors = 0;
      results.forEach(function (r, i) {
        const key = ["points", "lines", "polygons"][i];
        if (r.status === "fulfilled") {
          C.layers[key].addTo(C.map);
        } else {
          errors++;
          console.error("Falha ao carregar", key, r.reason);
        }
      });

      C.counts();
      C.fitBounds();
      state(errors ? "Alguns GeoJSON não foram carregados" : "GeoJSON carregados: pontos, linha e polígono", !!errors);
      if (errors && C.toast) C.toast("Confirma os ficheiros em data/ e a consola.", "error");
      else if (C.toast) C.toast("Dados carregados com sucesso.", "ok");

      /* Classificar automaticamente */
      if (C.classifyPoints) {
        setTimeout(function () {
          C.classifyPoints();
          if (C.updateLegend) C.updateLegend();
        }, 800);
      }

    } catch (e) {
      console.error(e);
      state("Não foi possível iniciar o mapa", true);
      if (C.toast) C.toast("Falha ao iniciar o mapa. Verifica a consola.", "error");
    } finally {
      setTimeout(function () {
        const l = document.getElementById("loader");
        if (l) l.classList.add("hide");
      }, 350);
      setTimeout(function () { if (C.map) C.map.invalidateSize(); }, 450);
    }
  };

  document.addEventListener("DOMContentLoaded", C.start);
})();