
export default class GameManager {

    constructor(player, inimigos) {

        this.player = player;
        this.inimigos = inimigos;

        this.vidasMaximas = 3;
        this.vidas = 3;

        this.invulnerabilidade = 0;
        this.duracaoInvulnerabilidade = 1.5;

        this.terminou = false;

        // HUD das vidas
        this.hud = document.getElementById('vidas-hud');

        if (!this.hud) {
            this.hud = document.createElement('div');
            this.hud.id = 'vidas-hud';
            document.body.appendChild(this.hud);
        }

        this.atualizarHUD();
    }

    // ========================================
    // HUD
    // ========================================

    atualizarHUD() {

        const coracoes =
            '❤️'.repeat(this.vidas) +
            '🖤'.repeat(this.vidasMaximas - this.vidas);

        this.hud.textContent = `VIDAS  ${coracoes}`;
    }

    // ========================================
    // ATUALIZAÇÃO DO JOGO
    // ========================================

    atualizar(delta) {

        if (this.terminou) return;

        this.invulnerabilidade = Math.max(
            0,
            this.invulnerabilidade - delta
        );

        const invulneravel =
            this.invulnerabilidade > 0;

        // Piscar depois de receber dano
        this.player.objeto.visible =
            !invulneravel ||
            Math.floor(this.invulnerabilidade * 12) % 2 === 0;

        if (invulneravel) return;

        const posicao =
            this.player.corpoFisico.translation();

        for (const inimigo of this.inimigos) {

            if (!inimigo.ativo) continue;

            const colisaoX =
                Math.abs(posicao.x - inimigo.x) <
                0.45 + inimigo.largura / 2;

            const colisaoY =
                Math.abs(posicao.y - inimigo.y) <
                0.55 + inimigo.altura / 2;

            if (colisaoX && colisaoY) {

                this.receberDano();
                break;
            }
        }
    }

    // ========================================
    // RECEBER DANO
    // ========================================

    receberDano() {

        if (
            this.terminou ||
            this.invulnerabilidade > 0
        ) {
            return;
        }

        this.vidas = Math.max(0, this.vidas - 1);

        this.atualizarHUD();

        if (this.vidas === 0) {

            this.fimDoJogo();

        } else {

            this.invulnerabilidade =
                this.duracaoInvulnerabilidade;
        }
    }

    // ========================================
    // ECRÃ DE GAME OVER
    // ========================================

    fimDoJogo() {

        if (this.terminou) return;

        this.terminou = true;
        this.player.objeto.visible = true;

        if (document.getElementById('game-over-overlay')) {
            return;
        }

        const overlay = document.createElement('div');

        overlay.id = 'game-over-overlay';
        overlay.className = 'ecran-jogo-overlay';

        // Estilo independente do CSS antigo
        Object.assign(overlay.style, {
            position: 'fixed',
            inset: '0',
            zIndex: '20000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(2, 7, 18, 0.94)',
            padding: '20px',
            boxSizing: 'border-box'
        });

        overlay.innerHTML = `
            <div
                id="game-over-painel"
                class="painel-ecran-jogo"
                style="
                    max-width: 520px;
                    width: 100%;
                    box-sizing: border-box;
                    background: #091a2d;
                    border: 2px solid #ff405d;
                    border-radius: 16px;
                    padding: 40px 30px;
                    text-align: center;
                    color: white;
                    font-family: Arial, sans-serif;
                "
            >

                <div class="ecran-etiqueta">
                    MISSÃO FALHADA
                </div>

                <h1 style="
                    color: #ff405d;
                    font-size: 46px;
                    margin: 18px 0;
                ">
                    GAME OVER
                </h1>

                <p style="
                    color: #c8d5e8;
                    font-size: 17px;
                    line-height: 1.6;
                    margin-bottom: 30px;
                ">
                    O robô ficou sem energia!
                    Tenta novamente escapar do laboratório.
                </p>

                <button
                    id="botao-recomecar"
                    class="botao-ecran-jogo"
                    style="margin-bottom: 15px;"
                >
                    RECOMEÇAR
                </button>

                <button
                    id="botao-voltar-menu-gameover"
                    class="botao-ecran-jogo botao-secundario"
                >
                    ← VOLTAR AO MENU
                </button>

            </div>
        `;

        document.body.appendChild(overlay);

        // Reiniciar diretamente o Nível 1
        document.getElementById('botao-recomecar')
            .addEventListener('click', () => {

                window.location.assign(
                    window.location.pathname + '?reiniciar=1'
                );
            });

        // Regressar ao menu principal
        document.getElementById(
            'botao-voltar-menu-gameover'
        ).addEventListener('click', () => {

            window.location.assign(
                window.location.pathname
            );
        });
    }
}
