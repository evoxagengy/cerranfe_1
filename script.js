document.addEventListener("DOMContentLoaded", function () {

    let empresas = [];
    let materiais = [];
    let linhaAtual = null;

    const empresaInput = document.getElementById("empresaInput");
    const campoCNPJ = document.getElementById("cnpj");
    const operacaoInput = document.getElementById("operacaoInput");
    const transportadoraInput = document.getElementById("transportadora");
    const solicitanteInput = document.getElementById("solicitante");
    const cargoInput = document.getElementById("cargo");
    const observacaoInput = document.getElementById("descricao");

    const tbody = document.getElementById("itens");
    const adicionarLinhaBtn = document.getElementById("adicionarLinhaBtn");

    const modalEmpresa = document.getElementById("modalEmpresa");
    const listaEmpresas = document.getElementById("listaEmpresas");
    const pesquisaEmpresa = document.getElementById("pesquisaEmpresa");

    const modalOperacao = document.getElementById("modalOperacao");
    const listaOperacoes = document.getElementById("listaOperacoes");

    const modalMaterial = document.getElementById("modalMaterial");
    const listaMateriais = document.getElementById("listaMateriais");
    const pesquisaMaterial = document.getElementById("pesquisaMaterial");

    const operacoes = [
        "Remessa p/ Conserto",
        "Remessa p/ Industrialização",
        "Retorno de Industrialização",
        "Remessa p/ Acoplamento",
        "Remessa p/ devolução",
        "Simples Remessa",
        "Venda",
        "Venda de Sucata",
        "Devolução de Mercadoria",
        "Transferência entre Filiais"
    ];

    fetch("empresas.json").then(r => r.json()).then(d => empresas = d);
    fetch("materiais.json").then(r => r.json()).then(d => materiais = d);

    document.getElementById("buscarEmpresa").onclick = () => {
        modalEmpresa.style.display = "flex";
        pesquisaEmpresa.value = "";
        renderizarEmpresas(empresas);
    };

    function renderizarEmpresas(lista) {
        listaEmpresas.innerHTML = "";
        lista.forEach(emp => {
            const div = document.createElement("div");
            div.classList.add("empresa-item");
            div.innerText = `${emp.nome} - ${emp.cnpj}`;
            div.onclick = () => {
                empresaInput.value = emp.nome;
                campoCNPJ.value = emp.cnpj;
                modalEmpresa.style.display = "none";
            };
            listaEmpresas.appendChild(div);
        });
    }

    pesquisaEmpresa.addEventListener("input", function () {
        const termo = this.value.toLowerCase();
        const filtradas = empresas.filter(emp =>
            emp.nome.toLowerCase().includes(termo) ||
            emp.cnpj.toLowerCase().includes(termo)
        );
        renderizarEmpresas(filtradas);
    });

    document.getElementById("buscarOperacao").onclick = () => {
        modalOperacao.style.display = "flex";
        listaOperacoes.innerHTML = "";
        operacoes.forEach(op => {
            const div = document.createElement("div");
            div.classList.add("empresa-item");
            div.innerText = op;
            div.onclick = () => {
                operacaoInput.value = op;
                modalOperacao.style.display = "none";
            };
            listaOperacoes.appendChild(div);
        });
    };
        // ==============================
    // BUSCA MATERIAL
    // ==============================

    function abrirModalMaterial(linha) {
        linhaAtual = linha;
        modalMaterial.style.display = "flex";
        pesquisaMaterial.value = "";
        renderizarMateriais(materiais);
    }

    function renderizarMateriais(lista) {
        listaMateriais.innerHTML = "";
        lista.forEach(mat => {
            const div = document.createElement("div");
            div.classList.add("empresa-item");
            div.innerText = `${mat.codigo} - ${mat.descricao}`;
            div.onclick = () => {
                linhaAtual.querySelector(".cod").value = mat.codigo;
                linhaAtual.querySelector(".desc").value = mat.descricao;
                modalMaterial.style.display = "none";
            };
            listaMateriais.appendChild(div);
        });
    }

    pesquisaMaterial.addEventListener("input", function () {
        const termo = this.value.toLowerCase();
        const filtrados = materiais.filter(mat =>
            mat.codigo.toLowerCase().includes(termo) ||
            mat.descricao.toLowerCase().includes(termo)
        );
        renderizarMateriais(filtrados);
    });

    // ==============================
    // TABELA DINÂMICA
    // ==============================

    function adicionarLinha() {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><input type="text" class="cod"></td>
            <td>
                <div class="item-container">
                    <input type="text" class="desc item-input">
                    <button type="button">
                        <span class="material-symbols-outlined">search</span>
                    </button>
                </div>
            </td>
            <td><input type="number" class="qnt" value="" min="0"></td>
            <td><input type="number" class="valor" value="" min="0" step="0.01"></td>
            <td><input type="text" class="lacre"></td>
        `;

        row.querySelector("button").onclick = () => abrirModalMaterial(row);

        tbody.appendChild(row);
    }

    // Criar 5 linhas iniciais
    for (let i = 0; i < 5; i++) {
        adicionarLinha();
    }

    // Botão adicionar nova linha
    adicionarLinhaBtn.onclick = () => adicionarLinha();

    // ==============================
    // TOTAL AUTOMÁTICO (QNT x VALOR)
    // ==============================

    document.addEventListener("input", function () {

        let totalGeral = 0;

        document.querySelectorAll("#itens tr").forEach(row => {

            const qnt = parseFloat(row.querySelector(".qnt").value) || 0;
            const valor = parseFloat(row.querySelector(".valor").value) || 0;

            totalGeral += qnt * valor;
        });

        document.getElementById("valorTotal").innerText = totalGeral.toFixed(2);

    });

    // ==============================
    // FECHAR MODAIS AO CLICAR FORA
    // ==============================

    window.addEventListener("click", function (e) {
        if (e.target === modalEmpresa) modalEmpresa.style.display = "none";
        if (e.target === modalOperacao) modalOperacao.style.display = "none";
        if (e.target === modalMaterial) modalMaterial.style.display = "none";
    });
        // ==============================
    // GERAR PDF OFICIAL COMPLETO
    // ==============================

    window.gerarPDF = function () {

        const freteSelecionado = document.querySelector('input[name="frete"]:checked');
        if (!freteSelecionado) {
            alert("Selecione quem paga o Frete.");
            return;
        }

        // ===== VALIDAÇÃO POR LINHA =====

        let erroLinha = null;
        let temItemValido = false;

        document.querySelectorAll("#itens tr").forEach((row, index) => {

            const codigo = row.querySelector(".cod").value.trim();
            const descricao = row.querySelector(".desc").value.trim();
            const qnt = row.querySelector(".qnt").value.trim();
            const valor = row.querySelector(".valor").value.trim();

            const linhaAtiva = codigo || descricao;

            if (!linhaAtiva) return;

            if (!codigo || !descricao ||
                !qnt || parseFloat(qnt) <= 0 ||
                !valor || parseFloat(valor) <= 0) {

                erroLinha = index + 1;
            } else {
                temItemValido = true;
            }
        });

        if (erroLinha !== null) {
            alert("Preencha corretamente todos os campos obrigatórios da linha " + erroLinha + ".");
            return;
        }

        if (!temItemValido) {
            alert("Adicione pelo menos um item válido.");
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF("p", "mm", "a4");

        // =========================
        // CABEÇALHO
        // =========================

        doc.autoTable({
            startY: 10,
            body: [
                ["USINA CERRADÃO"],
                ["CNPJ: 08.056.257/0001-77"],
                ["SOLICITAÇÃO DE EMISSÃO DE NOTA FISCAL"]
            ],
            theme: "grid",
            styles: {
                halign: "center",
                fontStyle: "bold",
                fontSize: 11
            }
        });

        let y = doc.lastAutoTable.finalY + 5;

        // =========================
        // DESTINATÁRIO
        // =========================

        doc.autoTable({
            startY: y,
            head: [["DESTINATÁRIO", ""]],
            body: [
                ["Razão Social", empresaInput.value],
                ["CNPJ", campoCNPJ.value],
                ["Natureza da Operação", operacaoInput.value]
            ],
            theme: "grid",
            styles: { fontSize: 9 }
        });

        y = doc.lastAutoTable.finalY + 5;

        // =========================
        // PRODUTOS
        // =========================

        let dadosTabela = [];
        let contador = 1;

        document.querySelectorAll("#itens tr").forEach(row => {

            const codigo = row.querySelector(".cod").value.trim();
            const descricao = row.querySelector(".desc").value.trim();
            const qnt = parseFloat(row.querySelector(".qnt").value) || 0;
            const valor = parseFloat(row.querySelector(".valor").value) || 0;

            if (codigo && descricao && qnt > 0 && valor > 0) {

                const totalLinha = qnt * valor;

                dadosTabela.push([
                    String(contador).padStart(5, "0"),
                    codigo,
                    descricao,
                    qnt,
                    valor.toFixed(2),
                    totalLinha.toFixed(2)
                ]);

                contador++;
            }
        });

        doc.autoTable({
            startY: y,
            head: [["NF REF", "CÓDIGO", "PRODUTO", "QNT", "VALOR UN", "VALOR TOTAL"]],
            body: dadosTabela,
            theme: "grid",
            styles: { fontSize: 8 },
            headStyles: { fillColor: [230, 230, 230] }
        });

        y = doc.lastAutoTable.finalY + 5;

        // =========================
        // TOTAL
        // =========================

        doc.autoTable({
            startY: y,
            body: [
                ["TOTAL", "R$ " + document.getElementById("valorTotal").innerText]
            ],
            theme: "grid",
            styles: {
                fontStyle: "bold",
                halign: "right"
            }
        });

        y = doc.lastAutoTable.finalY + 5;

        // =========================
        // TRANSPORTADOR
        // =========================

        doc.autoTable({
            startY: y,
            head: [["TRANSPORTADOR", ""]],
            body: [
                ["Quem irá transportar", transportadoraInput.value],
                ["Frete", freteSelecionado.value]
            ],
            theme: "grid",
            styles: { fontSize: 9 }
        });

        y = doc.lastAutoTable.finalY + 5;

// =========================
// OBSERVAÇÕES (TEXTO ÚNICO)
// =========================

let textoObservacoes = "";
let contadorObs = 1;

document.querySelectorAll("#itens tr").forEach(row => {

    const descricao = row.querySelector(".desc").value.trim();
    const qnt = parseFloat(row.querySelector(".qnt").value) || 0;
    const valor = parseFloat(row.querySelector(".valor").value) || 0;
    const lacre = row.querySelector(".lacre").value.trim();

    if (descricao && qnt > 0 && valor > 0 && lacre) {

        let ida = "", volta = "";

        if (lacre.includes("/")) {
            const partes = lacre.split("/");
            ida = partes[0]?.trim() || "";
            volta = partes[1]?.trim() || "";
        } else {
            ida = lacre;
        }

        let linha = `[ITEM ${String(contadorObs).padStart(2, "0")}] – ${descricao}`;

        if (ida) linha += ` – LACRE DE IDA: ${ida}`;
        if (volta) linha += ` | LACRE DE VOLTA: ${volta}`;

        textoObservacoes += linha + "\n";

        contadorObs++;
    }
});

// Observação manual
if (observacaoInput.value.trim() !== "") {

    if (textoObservacoes !== "")
        textoObservacoes += "\n";

    textoObservacoes += observacaoInput.value.trim();
}

if (textoObservacoes !== "") {

    doc.autoTable({
        startY: y,
        head: [["OBSERVAÇÕES"]],
        body: [[textoObservacoes]],
        theme: "grid",
        styles: {
            fontSize: 9,
            cellPadding: 4
        }
    });

    y = doc.lastAutoTable.finalY + 10;
}
        // =========================
        // ASSINATURA
        // =========================

        doc.autoTable({
            startY: y,
            body: [
                ["____________________________________________"],
                [solicitanteInput.value + " - " + cargoInput.value]
            ],
            theme: "grid",
            styles: { halign: "center" }
        });

        doc.save("SOLICITACAO_NF_OFICIAL.pdf");
    };

});