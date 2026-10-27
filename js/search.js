/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  /* ---------- Toasts ---------- */
  C.toast = function (msg, type) {
    type = type || "ok";
    const region = document.getElementById("toasts");
    if (!region) return;
    const n = document.createElement("div");
    n.className = "toast " + (type === "error" ? "error" : type === "warning" ? "warning" : "");
    const i = document.createElement("i");
    i.className = "fa-solid " + (
      type === "error" ? "fa-circle-exclamation" :
      type === "warning" ? "fa-triangle-exclamation" :
      "fa-circle-check"
    );
    const s = document.createElement("span");
    s.textContent = msg;
    n.append(i, s);
    region.append(n);
    setTimeout(function () { n.remove(); }, 4300);
  };

  /* ---------- Modal ---------- */
  C.closeModal = function () {
    const b = document.getElementById("backdrop");
    if (b) b.hidden = true;
  };

  C.modal = function (title, content, actions) {
    actions = actions || [];
    const mt = document.getElementById("modalTitle");
    const mc = document.getElementById("modalContent");
    const mf = document.getElementById("modalFooter");
    if (!mt || !mc || !mf) return;

    mt.textContent = title;
    mc.innerHTML = content;
    mf.innerHTML = "";

    actions.forEach(function (a) {
      const b = document.createElement("button");
      b.className = a.primary ? "primary" : "secondary";
      b.textContent = a.label;
      b.onclick = function () { a.action ? a.action() : C.closeModal(); };
      mf.append(b);
    });

    document.getElementById("backdrop").hidden = false;
  };

  /* ---------- Pesquisa ---------- */
  C.search = function () {
    C.modal(
      "Pesquisar atributos",
      '<div class="form-row">' +
        '<label class="form-label" for="query">Texto a procurar</label>' +
        '<input class="form-input" id="query" placeholder="Nome, tipo, código…">' +
      '</div>' +
      '<div class="form-row">' +
        '<label class="form-label" for="kind">Camada</label>' +
        '<select class="form-select" id="kind">' +
          '<option value="all">Todas</option>' +
          '<option value="points">Pontos</option>' +
          '<option value="lines">Linhas</option>' +
          '<option value="polygons">Polígonos</option>' +
        '</select>' +
      '</div>' +
      '<div id="results" class="results"><div class="empty">Escreve um termo para pesquisar atributos.</div></div>'
    );

    const q = document.getElementById("query");
    const kind = document.getElementById("kind");
    const out = document.getElementById("results");

    function run() {
      const term = q.value.trim().toLocaleLowerCase("pt");
      if (!term) {
        out.innerHTML = '<div class="empty">Escreve um termo para pesquisar atributos.</div>';
        return;
      }
      const hits = C.features.filter(function (x) {
        return (kind.value === "all" || x.kind === kind.value) &&
          JSON.stringify(x.feature.properties || {}).toLocaleLowerCase("pt").includes(term);
      }).slice(0, 100);

      out.innerHTML = "";
      if (!hits.length) {
        out.innerHTML = '<div class="empty">Nenhuma feição encontrada.</div>';
        return;
      }
      hits.forEach(function (x) {
        const b = document.createElement("button");
        b.className = "result";
        const sigla = x.feature.properties && x.feature.properties._sigla;
        b.textContent = (sigla ? "[" + sigla + "] " : "") +
                        (x.feature.properties?.t || x.feature.properties?.id || "Feição");
        const s = document.createElement("small");
        s.textContent = x.kind + " · seleccionar para localizar";
        b.append(s);
        b.onclick = function () {
          if (!C.map.hasLayer(C.layers[x.kind])) C.layers[x.kind].addTo(C.map);
          const id = { points: "showPoints", lines: "showLines", polygons: "showPolygons" }[x.kind];
          const cb = document.getElementById(id);
          if (cb) cb.checked = true;
          try {
            if (x.layer.getBounds && x.layer.getBounds().isValid()) {
              C.map.fitBounds(x.layer.getBounds().pad(0.5), { maxZoom: 17 });
            } else if (x.layer.getLatLng) {
              C.map.setView(x.layer.getLatLng(), 17);
            }
            setTimeout(function () { x.layer.openPopup(); }, 200);
          } catch (e) {}
          C.closeModal();
        };
        out.append(b);
      });
    }

    q.oninput = run;
    kind.onchange = run;
    q.focus();
  };

  document.addEventListener("DOMContentLoaded", function () {
    ["searchOpen", "searchQuick"].forEach(function (id) {
      const e = document.getElementById(id);
      if (e) e.onclick = C.search;
    });
    const mc = document.getElementById("modalClose");
    if (mc) mc.onclick = C.closeModal;
    const bd = document.getElementById("backdrop");
    if (bd) bd.onclick = function (e) { if (e.target.id === "backdrop") C.closeModal(); };
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") C.closeModal();
    });
  });
})();