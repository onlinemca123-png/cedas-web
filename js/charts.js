/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  C.showCharts = function () {
    const counts = {
      points: C.layers.points.getLayers ? C.layers.points.getLayers().length : 0,
      lines: C.layers.lines.getLayers().length,
      polygons: C.layers.polygons.getLayers().length
    };

    /* Área e perímetro dos polígonos */
    let totalArea = 0, totalPerim = 0;
    C.layers.polygons.eachLayer(function (l) {
      const p = l.feature.properties || {};
      if (p.Area_m2) totalArea += parseFloat(p.Area_m2) || 0;
      else if (p.Area_ha) totalArea += (parseFloat(p.Area_ha) || 0) * 10000;
      if (p.Perimetro) totalPerim += parseFloat(p.Perimetro) || 0;
    });

    /* Contagem por classe */
    const classCounts = {};
    C.layers.points.eachLayer(function (l) {
      const sigla = (l.feature.properties || {})._sigla || "?";
      classCounts[sigla] = (classCounts[sigla] || 0) + 1;
    });

    const classBars = Object.entries(C.classes).map(function ([sigla, info]) {
      const n = classCounts[sigla] || 0;
      const pct = counts.points ? (n / counts.points * 100) : 0;
      return '<div class="chart-bar">' +
        '<span class="chart-bar-label">' + sigla + '</span>' +
        '<div class="chart-bar-track">' +
          '<div class="chart-bar-fill" style="width:' + pct + '%;background:' + info.cor + '"></div>' +
        '</div>' +
        '<span class="chart-bar-value">' + n + '</span>' +
      '</div>';
    }).join("");

    const html =
      '<div class="charts-grid">' +
        '<div class="chart-card"><b>' + counts.points + '</b><small>Pontos</small></div>' +
        '<div class="chart-card"><b>' + counts.lines + '</b><small>Linhas</small></div>' +
        '<div class="chart-card"><b>' + counts.polygons + '</b><small>Polígonos</small></div>' +
        '<div class="chart-card wide-chart">' +
          '<b>' + (totalArea / 10000).toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + ' ha</b>' +
          '<small>Área total</small>' +
        '</div>' +
        '<div class="chart-card wide-chart">' +
          '<b>' + totalPerim.toLocaleString("pt-PT", { maximumFractionDigits: 2 }) + ' m</b>' +
          '<small>Perímetro total</small>' +
        '</div>' +
      '</div>' +
      '<h3 style="margin:20px 0 10px;font-size:13px;">Distribuição por classe</h3>' +
      '<div class="chart-bars">' + classBars + '</div>';

    C.modal("Estatísticas do projecto", html, [
      { label: "Fechar", primary: true }
    ]);
  };

  document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("openCharts");
    if (btn) btn.onclick = C.showCharts;
  });
})();