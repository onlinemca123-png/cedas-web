/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  C.filters = {};

  C.openFilters = function () {
    const kinds = [
      { key: "points", label: "Pontos" },
      { key: "lines", label: "Linhas" },
      { key: "polygons", label: "Polígonos" }
    ];

    let html = '<div class="form-row">' +
      '<label class="form-label" for="filterKind">Camada</label>' +
      '<select class="form-select" id="filterKind">' +
      kinds.map(function (k) {
        return '<option value="' + k.key + '">' + k.label + '</option>';
      }).join("") +
      '</select></div>' +
      '<div class="form-row">' +
      '<label class="form-label" for="filterField">Campo</label>' +
      '<select class="form-select" id="filterField"></select></div>' +
      '<div class="form-row">' +
      '<label class="form-label" for="filterValue">Valor</label>' +
      '<select class="form-select" id="filterValue"></select></div>' +
      '<div id="filterInfo" class="empty">Escolhe os critérios de filtragem.</div>';

    C.modal("Filtrar feições", html, [
      { label: "Limpar", action: function () { C.clearFilter(); C.closeModal(); } },
      { label: "Aplicar", primary: true, action: function () { C.applyFilter(); } }
    ]);

    const kindSel = document.getElementById("filterKind");
    const fieldSel = document.getElementById("filterField");
    const valSel = document.getElementById("filterValue");
    const info = document.getElementById("filterInfo");

    function updateFields() {
      const layer = C.layers[kindSel.value];
      const fields = new Set();
      if (layer && layer.eachLayer) {
        layer.eachLayer(function (l) {
          Object.keys(l.feature.properties || {}).forEach(function (k) {
            if (!k.startsWith("_")) fields.add(k);
          });
        });
      }
      fieldSel.innerHTML = Array.from(fields).map(function (f) {
        return '<option value="' + f + '">' + f + '</option>';
      }).join("") || '<option value="">(sem campos)</option>';
      updateValues();
    }

    function updateValues() {
      const layer = C.layers[kindSel.value];
      const field = fieldSel.value;
      const values = new Set();
      if (layer && layer.eachLayer) {
        layer.eachLayer(function (l) {
          const v = (l.feature.properties || {})[field];
          if (v !== undefined && v !== null) values.add(String(v));
        });
      }
      valSel.innerHTML = Array.from(values).sort().map(function (v) {
        return '<option value="' + v + '">' + v + '</option>';
      }).join("") || '<option value="">(sem valores)</option>';
      info.textContent = values.size + " valor(es) único(s) encontrado(s).";
    }

    kindSel.onchange = updateFields;
    fieldSel.onchange = updateValues;
    updateFields();
  };

  C.applyFilter = function () {
    const kind = document.getElementById("filterKind").value;
    const field = document.getElementById("filterField").value;
    const value = document.getElementById("filterValue").value;

    if (!field || !value) {
      C.toast("Escolhe um campo e um valor.", "warning");
      return;
    }

    C.clearFilter();

    const layer = C.layers[kind];
    const hidden = [];

    layer.eachLayer(function (l) {
      const v = String((l.feature.properties || {})[field] ?? "");
      if (v !== value) {
        layer.removeLayer(l);
        hidden.push(l);
      }
    });

    C.filters[kind] = { field: field, value: value, hidden: hidden };
    C.toast("Filtro: " + field + " = " + value + " (" + hidden.length + " ocultas).", "ok");
    C.closeModal();
    C.counts();
  };

  C.clearFilter = function () {
    Object.keys(C.filters).forEach(function (kind) {
      const f = C.filters[kind];
      if (!f) return;
      f.hidden.forEach(function (l) { C.layers[kind].addLayer(l); });
    });
    C.filters = {};
    C.toast("Filtros removidos.", "ok");
    C.counts();
  };

  document.addEventListener("DOMContentLoaded", function () {
    const btn = document.getElementById("openFilters");
    if (btn) btn.onclick = C.openFilters;
  });
})();