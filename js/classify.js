/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  /* Palavras-chave para classificação automática */
  const KEYWORDS = {
    ED: ["edificio", "edifício", "casa", "construcao", "construção", "building", "ed"],
    VA: ["via", "estrada", "caminho", "acesso", "road", "rua", "va"],
    AR: ["arvore", "árvore", "arvoredo", "tree", "vegetacao", "vegetação", "ar"],
    RA: ["reservatorio", "reservatório", "agua", "água", "tanque", "water", "ra"],
    CA: ["campo", "agricola", "agrícola", "cultivo", "crop", "machamba", "ca"],
    RE: ["relevo", "curva", "nivel", "nível", "elevacao", "elevação", "re"],
    QE: ["quadro", "electrico", "eléctrico", "qe"],
    PE: ["poste", "pe"],
    EP: ["estacao", "estação", "pluviometrica", "pluviométrica", "chuva", "ep"],
    PT: ["posto", "transformacao", "transformação", "transformador", "pt"]
  };

  function detectClass(properties) {
    const texto = (
      (properties.t || "") + " " +
      (properties.nome || "") + " " +
      (properties.name || "") + " " +
      (properties.classe || "") + " " +
      (properties.type || "")
    ).toLowerCase().trim();

    /* Verificar sigla directa primeiro */
    const siglas = Object.keys(KEYWORDS);
    for (const sigla of siglas) {
      if (texto === sigla.toLowerCase()) return sigla;
    }

    /* Verificar palavras-chave */
    for (const [sigla, palavras] of Object.entries(KEYWORDS)) {
      for (const p of palavras) {
        if (p.length > 2 && texto.includes(p)) return sigla;
      }
    }
    return null;
  }

  /* ---------- Classificar todos os pontos ---------- */
  C.classifyPoints = function () {
    let classificados = 0;
    const contagem = {};
    const siglas = Object.keys(C.classes);

    C.layers.points.eachLayer(function (l) {
      const props = l.feature.properties || {};
      let sigla = detectClass(props);

      /* Fallback: usar id cíclico */
      if (!sigla) {
        const idNum = parseInt(props.id) || 0;
        sigla = siglas[idNum % siglas.length];
      }

      props._sigla = sigla;
      props._classe = C.classes[sigla].nome;
      contagem[sigla] = (contagem[sigla] || 0) + 1;
      classificados++;

      /* Actualizar estilo */
      if (l.setStyle) {
        l.setStyle({
          fillColor: C.classes[sigla].cor,
          color: "#ffffff",
          weight: 2,
          radius: 6,
          fillOpacity: 0.9
        });
      }

      /* Popup melhorado */
      const rows = Object.entries(props)
        .filter(function ([k]) { return !k.startsWith("_"); })
        .map(function ([k, v]) { return '<tr><td>' + k + '</td><td>' + (v ?? "—") + '</td></tr>'; })
        .join("");

      l.bindPopup(
        '<div class="popup-head" style="background:' + C.classes[sigla].cor + '">' +
          '<small>' + sigla + ' · ' + C.classes[sigla].nome + '</small>' +
          '<strong>' + (props.t || props.nome || props.id || "Ponto") + '</strong>' +
        '</div>' +
        (rows ? '<table class="popup-table">' + rows + '</table>' : '') +
        '<div class="popup-credit">Equipa CEDAS · Ciências de Informação Geográfica</div>'
      );

      l.bindTooltip(sigla + " · " + C.classes[sigla].nome, { sticky: true, direction: "top" });
    });

    if (C.toast) {
      C.toast(
        "Classificação aplicada: " + classificados + " pontos em " +
        Object.keys(contagem).length + " classes.",
        "ok"
      );
    }

    /* Actualizar legenda */
    C.updateClassLegend(contagem);
    return contagem;
  };

  /* ---------- Actualizar legenda de classes ---------- */
  C.updateClassLegend = function (contagem) {
    const el = document.getElementById("classLegend");
    if (!el) return;
    contagem = contagem || {};

    el.innerHTML = Object.entries(C.classes).map(function ([sigla, info]) {
      const n = contagem[sigla] || 0;
      return '<div class="class-legend-item">' +
        '<span class="class-swatch" style="background:' + info.cor + '"></span>' +
        '<span class="class-sigla">' + sigla + '</span>' +
        '<span>' + info.nome + '</span>' +
        '<span class="class-count">' + n + '</span>' +
        '</div>';
    }).join("");
  };

  /* ---------- Filtro por classe (combobox) ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    const sel = document.getElementById("classFilter");
    if (sel) {
      sel.onchange = function () {
        const val = sel.value;
        C.layers.points.eachLayer(function (l) {
          const sigla = l.feature.properties && l.feature.properties._sigla;
          const visible = val === "all" || sigla === val;
          if (visible) C.layers.points.addLayer(l);
          else C.layers.points.removeLayer(l);
        });
        if (C.toast) {
          C.toast(
            val === "all" ? "A mostrar todas as classes." : "A mostrar apenas: " + val,
            "ok"
          );
        }
      };
    }
  });
})();