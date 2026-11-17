
export function mostrarMenuInicial(aoIniciarNivel1) {

    if (document.getElementById('menu-inicial-overlay')) {
        return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'menu-inicial-overlay';
    overlay.className = 'ecran-jogo-overlay';

    // Garantir que o menu aparece à frente do jogo
    Object.assign(overlay.style, {
        position: 'fixed',
        inset: '0',
        zIndex: '20000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px',
        boxSizing: 'border-box',
        background: 'rgba(2, 9, 23, 0.94)',
        overflowY: 'auto'
    });

    document.body.appendChild(overlay);

    // ========================================
    // FUNÇÕES AUXILIARES
    // ========================================

    const painel = (titulo, conteudo) => `
        <div class="painel-ecran-jogo" style="
            width:100%;
            max-width:530px;
            padding:36px 28px;
            box-sizing:border-box;
            background:#0b1c30;
            border:2px solid #00d9ff;
            border-radius:16px;
            text-align:center;
            color:#fff;
            font-family:Arial,sans-serif;
        ">
            <h1 style="color:#00d9ff;margin:0 0 20px">
                ${titulo}
            </h1>

            ${conteudo}
        </div>
    `;

    const botao = (id, texto, extra = '') => `
        <button
            id="${id}"
            ${extra}
            style="
                display:block;
                width:100%;
                margin:12px 0;
                padding:15px;
                border:1px solid #00d9ff;
                border-radius:8px;
                background:#07334a;
                color:#fff;
                font-size:17px;
                font-weight:bold;
                cursor:pointer;
            "
        >
            ${texto}
        </button>
    `;

    // ========================================
    // MENU PRINCIPAL
    // ========================================

    function inicio() {

        overlay.innerHTML = painel('ESCAPE LAB', `
            <p>
                Escapa do laboratório, supera os perigos
                e desbloqueia a saída.
            </p>

            ${botao('menu-play', '▶ PLAY')}

            ${botao('menu-creditos', 'CRÉDITOS')}
        `);

        document.getElementById('menu-play')
            .addEventListener('click', niveis);

        document.getElementById('menu-creditos')
            .addEventListener('click', creditos);
    }

    // ========================================
    // SELEÇÃO DE NÍVEIS
    // ========================================

    function niveis() {

        overlay.innerHTML = painel('SELECIONAR NÍVEL', `
            ${botao('nivel-1', 'NÍVEL 1 — LABORATÓRIO')}

            ${botao(
                'nivel-2',
                'NÍVEL 2 — EM DESENVOLVIMENTO',
                'disabled'
            )}

            ${botao('voltar-niveis', '← VOLTAR')}
        `);

        document.getElementById('nivel-1')
            .addEventListener('click', () => {

                overlay.remove();

                aoIniciarNivel1();
            });

        document.getElementById('voltar-niveis')
            .addEventListener('click', inicio);

        document.getElementById('nivel-2')
            .style.opacity = '0.5';
    }

    // ========================================
    // CRÉDITOS
    // ========================================

    function creditos() {

        // Preencher com os teus dados
        const autor = 'Simão Barroso';
        const numero = 'Nº 55071';
        const professor = 'Nuno Carapito';

        overlay.innerHTML = painel('CRÉDITOS', `
            <p><strong>Autor:</strong> ${autor}</p>

            <p><strong>N.º aluno:</strong> ${numero}</p>

            <p><strong>Professor:</strong> ${professor}</p>

            <p>
                <strong>Curso:</strong>
                Informática Web, Móvel e na Nuvem
            </p>

            <p>
                <strong>Universidade:</strong>
                Universidade da Beira Interior
            </p>

            <p>
                <strong>UC:</strong>
                Desenvolvimento de Jogos Web e Móveis
            </p>

            <p>
                <strong>Ano letivo:</strong>
                2026/2027
            </p>

            ${botao('voltar-creditos', '← VOLTAR')}
        `);

        document.getElementById('voltar-creditos')
            .addEventListener('click', inicio);
    }

    // Mostrar o menu quando o jogo abre
    inicio();
}
