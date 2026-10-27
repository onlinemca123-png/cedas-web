/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
/* Integração com a linguagem R via WebR */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  C.R = { ready: false, webR: null, output: [], lastCSV: "" };

  /* ---------- Inicializar WebR ---------- */
  C.initR = async function () {
    if (C.R.ready) return true;
    try {
      if (C.toast) C.toast("A inicializar o ambiente R…", "warning");

      /* Carregar WebR */
      if (!window.WebR) {
        await new Promise(function (resolve, reject) {
          const s = document.createElement("script");
          s.type = "module";
          s.innerHTML =
            "import { WebR } from 'https://webr.r-wasm.org/latest/webr.mjs';\n" +
            "window.WebR = WebR;\n" +
            "window.dispatchEvent(new Event('webr-loaded'));";
          document.head.appendChild(s);

          const t = setTimeout(function () {
            reject(new Error("Timeout ao carregar WebR"));
          }, 30000);
          window.addEventListener("webr-loaded", function () {
            clearTimeout(t);
            resolve();
          }, { once: true });
        });
      }

      C.R.webR = new window.WebR();
      await C.R.webR.init();
      C.R.ready = true;
      if (C.toast) C.toast("R pronto! Podes executar comandos.", "ok");
      return true;
    } catch (e) {
      console.error("Erro WebR:", e);
      if (C.toast) C.toast("Não foi possível iniciar o R. Verifica a ligação.", "error");
      return false;
    }
  };

  /* ---------- Executar código R ---------- */
  C.runR = async function (code) {
    if (!C.R.ready) {
      const ok = await C.initR();
      if (!ok) return { error: "R não inicializado" };
    }
    try {
      const result = await C.R.webR.evalR(code);
      const output = await result.toJs();
      C.R.output.push({ code: code, output: output });
      return output;
    } catch (e) {
      return { error: e.message };
    }
  };

  /* ---------- Exportar dados para R ---------- */
  C.exportToR = async function () {
    const rows = [];
    const headers = new Set(["camada"]);

    ["points", "lines", "polygons"].forEach(function (k) {
      if (!C.layers[k] || !C.layers[k].eachLayer) return;
      C.layers[k].eachLayer(function (l) {
        const p = l.feature.properties || {};
        Object.keys(p).forEach(function (key) {
          if (!key.startsWith("_")) headers.add(key);
        });
      });
    });

    const headArr = Array.from(headers);

    ["points", "lines", "polygons"].forEach(function (k) {
      if (!C.layers[k] || !C.layers[k].eachLayer) return;
      C.layers[k].eachLayer(function (l) {
        const p = l.feature.properties || {};
        const row = { camada: k };
        headArr.forEach(function (h) {
          if (h !== "camada") row[h] = p[h] ?? "";
        });
        rows.push(row);
      });
    });

    if (!rows.length) {
      if (C.toast) C.toast("Sem dados para exportar.", "warning");
      return null;
    }

    const csv = [
      headArr.join(","),
      ...rows.map(function (r) {
        return headArr.map(function (h) {
          return '"' + String(r[h] ?? "").replace(/"/g, '""') + '"';
        }).join(",");
      })
    ].join("\n");

    C.R.lastCSV = csv;

    const rCode =
      "dados <- read.csv(text = '" + csv.replace(/'/g, "\\'").replace(/\n/g, "\\n") + "', stringsAsFactors = FALSE)\n" +
      "nrow(dados)";

    const result = await C.runR(rCode);
    if (C.toast) C.toast("Dados exportados para R (" + rows.length + " linhas).", "ok");
    return result;
  };

  /* ---------- Análises rápidas ---------- */
  C.analysesR = {
    resumo: function () {
      return "str(dados)\nsummary(dados)";
    },
    contagemPorClasse: function () {
      return "table(dados$camada, useNA = 'ifany')";
    },
    areaTotal: function () {
      return "if ('Area_m2' %in% names(dados)) sum(as.numeric(dados$Area_m2), na.rm = TRUE) else 'Sem campo Area_m2'";
    },
    estatisticas: function () {
      return "sapply(dados[sapply(dados, is.numeric)], function(x) c(media=mean(x,na.rm=TRUE), mediana=median(x,na.rm=TRUE), min=min(x,na.rm=TRUE), max=max(x,na.rm=TRUE), sd=sd(x,na.rm=TRUE)))";
    },
    kmeans: function () {
      return "if (sum(sapply(dados, is.numeric)) >= 2) { nums <- dados[sapply(dados, is.numeric)]; km <- kmeans(scale(nums), centers=3); table(km$cluster) } else 'Dados insuficientes'";
    }
  };

  /* ---------- UI ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    const btnInit = document.getElementById("rInit");
    const btnRun = document.getElementById("rRun");
    const btnExport = document.getElementById("rExport");
    const txtCode = document.getElementById("rCode");
    const out = document.getElementById("rOutput");

    if (btnInit) {
      btnInit.onclick = async function () {
        const ok = await C.initR();
        if (ok && out) {
          const v = await C.runR("R.version.string");
          out.textContent = "R inicializado com sucesso.\n" + JSON.stringify(v, null, 2);
        }
      };
    }

    if (btnRun) {
      btnRun.onclick = async function () {
        const code = txtCode.value.trim();
        if (!code) { if (C.toast) C.toast("Escreve algum código R.", "warning"); return; }
        if (out) out.textContent = "A executar…";
        const result = await C.runR(code);
        if (out) out.textContent = JSON.stringify(result, null, 2);
      };
    }

    if (btnExport) {
      btnExport.onclick = async function () {
        if (out) out.textContent = "A exportar dados…";
        const result = await C.exportToR();
        if (out) out.textContent = JSON.stringify(result, null, 2);
      };
    }

    document.querySelectorAll("[data-r-analysis]").forEach(function (b) {
      b.onclick = async function () {
        const key = b.dataset.rAnalysis;
        if (!C.analysesR[key]) return;
        if (out) out.textContent = "A executar análise: " + key + "…";
        const result = await C.runR(C.analysesR[key]());
        if (out) out.textContent = JSON.stringify(result, null, 2);
      };
    });
  });
})();