/* Equipa CEDAS | Ciências de Informação Geográfica · 2026 */
(function () {
  const C = window.CEDAS = window.CEDAS || {};

  const PARTICIPANTES = [
    { nome: "Shirley Lapson Matola",      numero: "20233757" },
    { nome: "Suzany Osvaldo Rodrigues",   numero: "20231927" },
    { nome: "Dinis Machava",              numero: "20225518" },
    { nome: "Jordao Machaieie Junior",    numero: "20211636" },
    { nome: "Assane Viador",              numero: "20221013" },
    { nome: "Marília Machava",            numero: "20231477" },
    { nome: "Lúcia Manhice",              numero: "20211648" },
    { nome: "Celso André Manjate",        numero: "20211593" },
    { nome: "Luís Mendes",                numero: "20231450" },
    { nome: "Albertina Luís Chaúque",     numero: "20211578" }
  ];

  C.showWelcome = function () {
    if (sessionStorage.getItem("cedas-welcome") === "1") return;

    const hora = new Date().getHours();
    let saudacao = "Bom dia";
    if (hora >= 12 && hora < 19) saudacao = "Boa tarde";
    else if (hora >= 19 || hora < 6) saudacao = "Boa noite";

    const html =
      '<div class="welcome-hero">' +
        '<i class="fa-solid fa-earth-africa"></i>' +
        '<h2>' + saudacao + '! 👋</h2>' +
        '<p>Bem-vindo ao <b>CEDAS GeoViewer</b>, o visualizador geográfico interactivo da área de estudo em Sábié, Moamba.</p>' +
      '</div>' +
      '<div class="welcome-info">' +
        '<div class="welcome-item"><i class="fa-solid fa-map"></i><div><b>Explora o mapa</b><small>195 pontos, 1 linha e 1 polígono</small></div></div>' +
        '<div class="welcome-item"><i class="fa-solid fa-tags"></i><div><b>10 classes</b><small>ED, VA, AR, RA, CA, RE, QE, PE, EP, PT</small></div></div>' +
        '<div class="welcome-item"><i class="fa-solid fa-object-group"></i><div><b>Vectorização</b><small>Cria polígonos a partir de pontos</small></div></div>' +
        '<div class="welcome-item"><i class="fa-solid fa-code"></i><div><b>Análise em R</b><small>Estatística avançada no navegador</small></div></div>' +
      '</div>' +
      '<div class="welcome-team">' +
        '<h3><i class="fa-solid fa-users"></i> Equipa do projecto</h3>' +
        '<ul class="team-list">' +
          PARTICIPANTES.map(function (p) {
            return '<li><b>' + p.nome + '</b><span>' + p.numero + '</span></li>';
          }).join("") +
        '</ul>' +
        '<p class="team-credit">Ciências de Informação Geográfica · 2026</p>' +
      '</div>';

    C.modal("Bem-vindo ao CEDAS GeoViewer", html, [
      { label: "Explorar mapa", primary: true, action: function () {
        sessionStorage.setItem("cedas-welcome", "1");
        C.closeModal();
        setTimeout(function () {
          if (C.classifyPoints) C.classifyPoints();
          if (C.updateClassLegend) C.updateClassLegend();
        }, 300);
      } }
    ]);
  };

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(C.showWelcome, 1500);
  });

  C.PARTICIPANTES = PARTICIPANTES;
})();