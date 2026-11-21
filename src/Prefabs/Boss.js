import * as THREE from 'three';

// ========================================
// BOSS FINAL - "SENTINELA X-01"
// ----------------------------------------
// Estados:
//   adormecido -> espera que o jogador entre na arena
//   mover      -> flutua até uma nova posição
//   aviso      -> pisca antes de atacar (dá tempo ao jogador)
//   disparar   -> lança projéteis apontados ao jogador
//   saltar     -> sobe e cai em cima do jogador
//   impacto    -> ao cair cria ondas de choque no chão
//   morrer     -> animação de explosão
//
// Fase 2 (vida <= 50%): mais rápido e mais projéteis.
// ========================================

const COR_CORPO = 0x5a1a2e;
const COR_CORPO_FASE2 = 0x8a0f1f;
const COR_OLHO = 0xff304f;
const COR_AVISO = 0xffa500;

export default class Boss {

    constructor(cena, x, yChao, limiteEsquerdo, limiteDireito) {

        this.cena = cena;

        // Dimensões (usadas também pelo BulletManager e GameManager)
        this.largura = 2.2;
        this.altura = 2.2;

        this.yChao = yChao;
        this.yBase = yChao + this.altura / 2 + 0.45;

        // Ao deslocar-se voa mais alto (o jogador pode passar por baixo)
        this.yAlto = this.yBase + 1.9;

        this.x = x;
        this.y = this.yBase;

        this.limiteEsquerdo = limiteEsquerdo;
        this.limiteDireito = limiteDireito;

        this.vidaMaxima = 25;
        this.vida = this.vidaMaxima;

        // "ativo" = pode levar dano e causar dano por contacto
        this.ativo = false;
        this.derrotado = false;

        this.estado = 'adormecido';
        this.tempoEstado = 0;
        this.proximoAtaque = 'disparar';
        this.contadorAtaques = 0;

        this.alvoX = x;
        this.tempo = 0;
        this.tempoDano = 0;

        // Salto
        this.saltoInicioX = x;
        this.saltoAlvoX = x;

        // Disparos
        this.disparosRestantes = 0;
        this.tempoEntreDisparos = 0;

        this.projeteis = [];
        this.ondas = [];

        this.aoSerDerrotado = null;

        this.criarVisual();
        this.criarHUD();
    }

    // ====================================
    // VISUAL
    // ====================================

    criarVisual() {

        this.objeto = new THREE.Group();

        // Corpo principal
        this.materialCorpo = new THREE.MeshBasicMaterial({
            color: COR_CORPO,
            transparent: true
        });

        this.corpo = new THREE.Mesh(
            new THREE.PlaneGeometry(2.2, 1.8),
            this.materialCorpo
        );

        this.corpo.position.y = -0.1;

        // Contorno
        const contorno = new THREE.Mesh(
            new THREE.PlaneGeometry(2.36, 1.96),
            new THREE.MeshBasicMaterial({ color: 0x1a0710 })
        );

        contorno.position.set(0, -0.1, -0.01);

        // Visor
        const visor = new THREE.Mesh(
            new THREE.PlaneGeometry(1.6, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x0b0b14 })
        );

        visor.position.set(0, 0.25, 0.02);

        // Olho que segue o jogador
        this.materialOlho = new THREE.MeshBasicMaterial({
            color: COR_OLHO
        });

        this.olho = new THREE.Mesh(
            new THREE.CircleGeometry(0.18, 24),
            this.materialOlho
        );

        this.olho.position.set(0, 0.25, 0.04);

        // Canhões laterais
        this.canhoes = [];

        for (const lado of [-1, 1]) {

            const canhao = new THREE.Mesh(
                new THREE.PlaneGeometry(0.45, 0.3),
                new THREE.MeshBasicMaterial({ color: 0x9aa6b8 })
            );

            canhao.position.set(lado * 1.3, -0.35, 0.01);

            this.canhoes.push(canhao);
        }

        // Antena
        const antena = new THREE.Mesh(
            new THREE.PlaneGeometry(0.08, 0.45),
            new THREE.MeshBasicMaterial({ color: 0x9aa6b8 })
        );

        antena.position.set(0, 1.0, 0);

        this.luzAntena = new THREE.Mesh(
            new THREE.CircleGeometry(0.1, 16),
            new THREE.MeshBasicMaterial({ color: COR_OLHO })
        );

        this.luzAntena.position.set(0, 1.25, 0.02);

        // Grelha da "boca"
        for (let i = -2; i <= 2; i++) {

            const ranhura = new THREE.Mesh(
                new THREE.PlaneGeometry(0.12, 0.35),
                new THREE.MeshBasicMaterial({ color: 0x1a0710 })
            );

            ranhura.position.set(i * 0.25, -0.5, 0.02);

            this.corpo.add(ranhura);
        }

        this.objeto.add(
            contorno,
            this.corpo,
            visor,
            this.olho,
            antena,
            this.luzAntena,
            ...this.canhoes
        );

        this.objeto.position.set(this.x, this.y, 0.7);

        this.cena.add(this.objeto);

        // Geometrias partilhadas pelos ataques
        this.geometriaProjetil = new THREE.CircleGeometry(0.2, 20);
        this.geometriaOnda = new THREE.PlaneGeometry(0.45, 0.55);
    }

    criarHUD() {

        this.hud = document.createElement('div');
        this.hud.id = 'boss-hud';

        this.hud.innerHTML = `
            <div class="boss-nome">SENTINELA X-01</div>
            <div class="boss-barra">
                <div class="boss-barra-vida"></div>
            </div>
        `;

        this.hud.style.display = 'none';

        document.body.appendChild(this.hud);

        this.hudBarra = this.hud.querySelector('.boss-barra-vida');
    }

    atualizarHUD() {

        const percentagem = Math.max(
            0,
            this.vida / this.vidaMaxima
        ) * 100;

        this.hudBarra.style.width = `${percentagem}%`;

        this.hud.classList.toggle(
            'boss-fase2',
            this.estaNaFase2()
        );
    }

    // ====================================
    // ESTADO GERAL
    // ====================================

    estaNaFase2() {
        return this.vida <= this.vidaMaxima / 2;
    }

    ativar() {

        if (this.estado !== 'adormecido') {
            return;
        }

        this.ativo = true;
        this.hud.style.display = 'block';
        this.atualizarHUD();

        this.mudarEstado('mover');
        this.escolherNovaPosicao();
    }

    mudarEstado(novoEstado) {

        this.estado = novoEstado;
        this.tempoEstado = 0;

        if (novoEstado === 'aviso') {
            this.yInicioAviso = this.y;
        }
    }

    escolherNovaPosicao(posicaoJogador) {

        const minimo = this.limiteEsquerdo + this.largura;
        const maximo = this.limiteDireito - this.largura;

        let alvo = THREE.MathUtils.randFloat(minimo, maximo);

        // Manter alguma distância do jogador
        if (
            posicaoJogador &&
            Math.abs(alvo - posicaoJogador.x) < 3
        ) {
            alvo = posicaoJogador.x < (minimo + maximo) / 2
                ? maximo
                : minimo;
        }

        this.alvoX = alvo;
    }

    // Chamado quando o jogador perde uma vida e reaparece
    reiniciarAtaques() {

        this.limparAtaques();

        if (this.ativo) {

            this.y = this.yAlto;
            this.mudarEstado('mover');
            this.alvoX = this.limiteDireito - this.largura;
        }
    }

    limparAtaques() {

        for (const projetil of this.projeteis) {
            this.cena.remove(projetil.objeto);
            projetil.objeto.material.dispose();
        }

        for (const onda of this.ondas) {
            this.cena.remove(onda.objeto);
            onda.objeto.material.dispose();
        }

        this.projeteis = [];
        this.ondas = [];
    }

    // ====================================
    // ATUALIZAÇÃO
    // ====================================

    atualizar(delta, posicaoJogador, gameManager) {

        if (this.estado === 'adormecido') {
            // Pequena respiração enquanto espera
            this.tempo += delta;
            this.objeto.position.y =
                this.yBase + Math.sin(this.tempo * 1.5) * 0.05;
            this.materialOlho.color.setHex(0x441018);
            return;
        }

        this.tempo += delta;
        this.tempoEstado += delta;

        const fase2 = this.estaNaFase2();
        const rapidez = fase2 ? 1.4 : 1;

        switch (this.estado) {

            case 'mover':
                this.estadoMover(delta, rapidez, posicaoJogador);
                break;

            case 'aviso':
                this.estadoAviso(rapidez, posicaoJogador);
                break;

            case 'disparar':
                this.estadoDisparar(delta, fase2, posicaoJogador);
                break;

            case 'saltar':
                this.estadoSaltar(rapidez);
                break;

            case 'impacto':
                this.estadoImpacto(rapidez, posicaoJogador);
                break;

            case 'morrer':
                this.estadoMorrer(delta);
                break;
        }

        this.atualizarProjeteis(delta, posicaoJogador, gameManager);
        this.atualizarOndas(delta, posicaoJogador, gameManager);
        this.atualizarVisual(delta, posicaoJogador);
    }

    estadoMover(delta, rapidez, posicaoJogador) {

        const velocidade = 3.5 * rapidez;
        const diferenca = this.alvoX - this.x;

        this.x += Math.sign(diferenca) *
            Math.min(Math.abs(diferenca), velocidade * delta);

        // Subir suavemente até à altura de voo
        const alvoY = this.yAlto + Math.sin(this.tempo * 3) * 0.2;
        this.y += (alvoY - this.y) * Math.min(1, delta * 4);

        const chegou = Math.abs(diferenca) < 0.05;
        const tempoMinimo = 1.2 / rapidez;

        if (chegou && this.tempoEstado > tempoMinimo) {
            this.mudarEstado('aviso');
        }

        // Evitar ficar preso a mover
        if (this.tempoEstado > 4) {
            this.mudarEstado('aviso');
        }

    }

    estadoAviso(rapidez, posicaoJogador) {

        const duracao = 0.7 / rapidez;

        // Descer para a altura de ataque enquanto avisa
        const t = Math.min(1, this.tempoEstado / duracao);

        this.y = THREE.MathUtils.lerp(this.yInicioAviso, this.yBase, t);

        if (this.tempoEstado < duracao) {
            return;
        }

        // Alternar ataques: disparo, disparo, salto...
        this.contadorAtaques++;

        const fazerSalto =
            this.contadorAtaques % (this.estaNaFase2() ? 2 : 3) === 0;

        if (fazerSalto) {

            this.saltoInicioX = this.x;
            this.saltoAlvoX = THREE.MathUtils.clamp(
                posicaoJogador.x,
                this.limiteEsquerdo + this.largura / 2,
                this.limiteDireito - this.largura / 2
            );

            this.mudarEstado('saltar');

        } else {

            this.disparosRestantes = this.estaNaFase2() ? 5 : 3;
            this.tempoEntreDisparos = 0;

            this.mudarEstado('disparar');
        }
    }

    estadoDisparar(delta, fase2, posicaoJogador) {

        this.y = this.yBase + Math.sin(this.tempo * 3) * 0.1;

        this.tempoEntreDisparos -= delta;

        if (this.tempoEntreDisparos > 0) {
            return;
        }

        if (this.disparosRestantes <= 0) {

            this.escolherNovaPosicao(posicaoJogador);
            this.mudarEstado('mover');
            return;
        }

        this.disparosRestantes--;
        this.tempoEntreDisparos = fase2 ? 0.28 : 0.45;

        // Disparar do canhão do lado do jogador
        const lado = posicaoJogador.x < this.x ? -1 : 1;

        const origem = {
            x: this.x + lado * 1.3,
            y: this.y - 0.35
        };

        const velocidade = fase2 ? 7.5 : 6;

        this.criarProjetil(origem, posicaoJogador, velocidade, 0);

        // Na fase 2 dispara também em leque
        if (fase2) {
            this.criarProjetil(origem, posicaoJogador, velocidade, 0.3);
            this.criarProjetil(origem, posicaoJogador, velocidade, -0.3);
        }
    }

    estadoSaltar(rapidez) {

        const duracao = 0.9 / rapidez;
        const t = Math.min(1, this.tempoEstado / duracao);

        // Movimento em arco
        this.x = THREE.MathUtils.lerp(
            this.saltoInicioX,
            this.saltoAlvoX,
            t
        );

        const alturaSalto = 4.5;

        this.y = this.yBase +
            Math.sin(t * Math.PI) * alturaSalto;

        // Na descida, cair mais rápido até ao chão
        if (t > 0.5) {

            const queda = (t - 0.5) * 2;
            const yChao = this.yChao + this.altura / 2;

            this.y = THREE.MathUtils.lerp(
                this.yBase + alturaSalto,
                yChao,
                queda * queda
            );
        }

        if (t >= 1) {

            this.y = this.yChao + this.altura / 2;

            // Criar ondas de choque para os dois lados
            const velocidadeOnda = this.estaNaFase2() ? 8 : 6.5;

            this.criarOnda(this.x - this.largura / 2, -1, velocidadeOnda);
            this.criarOnda(this.x + this.largura / 2, 1, velocidadeOnda);

            this.mudarEstado('impacto');
        }
    }

    estadoImpacto(rapidez, posicaoJogador) {

        // Fica um momento no chão (boa altura para levar tiros!)
        const duracao = 1.1 / rapidez;

        if (this.tempoEstado < duracao) {
            return;
        }

        this.escolherNovaPosicao(posicaoJogador);
        this.mudarEstado('mover');
    }

    estadoMorrer(delta) {

        const duracao = 1.6;
        const t = Math.min(1, this.tempoEstado / duracao);

        // Tremer e piscar
        this.objeto.position.x =
            this.x + (Math.random() - 0.5) * 0.3 * (1 - t);

        this.objeto.position.y =
            this.y + (Math.random() - 0.5) * 0.3 * (1 - t);

        const piscar = Math.floor(this.tempoEstado * 16) % 2 === 0;

        this.materialCorpo.color.setHex(piscar ? 0xffffff : COR_CORPO_FASE2);

        const escala = 1 - t * 0.9;
        this.objeto.scale.set(escala, escala, 1);
        this.objeto.rotation.z = t * 1.5;

        if (t >= 1) {

            this.cena.remove(this.objeto);
            this.estado = 'derrotado';
            this.hud.style.display = 'none';

            if (this.aoSerDerrotado) {
                this.aoSerDerrotado();
            }
        }
    }

    // ====================================
    // VISUAL A CADA FRAME
    // ====================================

    atualizarVisual(delta, posicaoJogador) {

        if (this.estado === 'morrer' || this.estado === 'derrotado') {
            return;
        }

        this.objeto.position.x = this.x;
        this.objeto.position.y = this.y;

        // Olho segue o jogador
        if (posicaoJogador) {

            const dx = posicaoJogador.x - this.x;
            const dy = posicaoJogador.y - this.y;
            const distancia = Math.hypot(dx, dy) || 1;

            this.olho.position.x = (dx / distancia) * 0.55;
            this.olho.position.y = 0.25 + (dy / distancia) * 0.08;
        }

        // Cores conforme estado
        const fase2 = this.estaNaFase2();

        let corCorpo = fase2 ? COR_CORPO_FASE2 : COR_CORPO;
        let corOlho = COR_OLHO;

        if (this.estado === 'aviso') {

            const piscar =
                Math.floor(this.tempoEstado * 12) % 2 === 0;

            corOlho = piscar ? COR_AVISO : 0xffffff;

            // Pequeno tremor
            this.objeto.position.x += (Math.random() - 0.5) * 0.08;
        }

        if (this.tempoDano > 0) {
            this.tempoDano -= delta;
            corCorpo = 0xffffff;
        }

        this.materialCorpo.color.setHex(corCorpo);
        this.materialOlho.color.setHex(corOlho);

        this.luzAntena.visible =
            Math.floor(this.tempo * (fase2 ? 8 : 3)) % 2 === 0;
    }

    // ====================================
    // PROJÉTEIS
    // ====================================

    criarProjetil(origem, alvo, velocidade, desvioAngulo) {

        const dx = alvo.x - origem.x;
        const dy = alvo.y - origem.y;

        const angulo = Math.atan2(dy, dx) + desvioAngulo;

        const objeto = new THREE.Mesh(
            this.geometriaProjetil,
            new THREE.MeshBasicMaterial({
                color: this.estaNaFase2() ? 0xff304f : 0xff8a3d
            })
        );

        objeto.position.set(origem.x, origem.y, 1.1);

        this.cena.add(objeto);

        this.projeteis.push({
            objeto,
            vx: Math.cos(angulo) * velocidade,
            vy: Math.sin(angulo) * velocidade,
            tempo: 0
        });
    }

    atualizarProjeteis(delta, posicaoJogador, gameManager) {

        for (let i = this.projeteis.length - 1; i >= 0; i--) {

            const projetil = this.projeteis[i];
            const posicao = projetil.objeto.position;

            posicao.x += projetil.vx * delta;
            posicao.y += projetil.vy * delta;

            projetil.tempo += delta;

            // Pulsar
            const escala = 1 + Math.sin(projetil.tempo * 20) * 0.15;
            projetil.objeto.scale.set(escala, escala, 1);

            const acertou =
                posicaoJogador &&
                Math.abs(posicao.x - posicaoJogador.x) < 0.45 + 0.15 &&
                Math.abs(posicao.y - posicaoJogador.y) < 0.55 + 0.15;

            if (acertou) {
                gameManager.receberDano();
            }

            const foraDoMapa =
                projetil.tempo > 4 ||
                posicao.y < this.yChao ||
                posicao.x < this.limiteEsquerdo - 1 ||
                posicao.x > this.limiteDireito + 1;

            if (acertou || foraDoMapa) {
                this.cena.remove(projetil.objeto);
                projetil.objeto.material.dispose();
                this.projeteis.splice(i, 1);
            }
        }
    }

    // ====================================
    // ONDAS DE CHOQUE (saltar por cima!)
    // ====================================

    criarOnda(x, direcao, velocidade) {

        const objeto = new THREE.Mesh(
            this.geometriaOnda,
            new THREE.MeshBasicMaterial({
                color: 0xffa500,
                transparent: true,
                opacity: 0.9
            })
        );

        objeto.position.set(x, this.yChao + 0.275, 1.0);

        this.cena.add(objeto);

        this.ondas.push({
            objeto,
            direcao,
            velocidade,
            tempo: 0
        });
    }

    atualizarOndas(delta, posicaoJogador, gameManager) {

        for (let i = this.ondas.length - 1; i >= 0; i--) {

            const onda = this.ondas[i];
            const posicao = onda.objeto.position;

            posicao.x += onda.direcao * onda.velocidade * delta;
            onda.tempo += delta;

            // Tremeluzir
            onda.objeto.scale.y = 1 + Math.sin(onda.tempo * 30) * 0.2;

            const acertou =
                posicaoJogador &&
                Math.abs(posicao.x - posicaoJogador.x) < 0.45 + 0.2 &&
                Math.abs(posicao.y - posicaoJogador.y) < 0.55 + 0.25;

            if (acertou) {
                gameManager.receberDano();
            }

            const fora =
                posicao.x < this.limiteEsquerdo ||
                posicao.x > this.limiteDireito;

            if (fora) {
                this.cena.remove(onda.objeto);
                onda.objeto.material.dispose();
                this.ondas.splice(i, 1);
            }
        }
    }

    // ====================================
    // DANO
    // ====================================

    receberDano(dano) {

        if (!this.ativo) return;

        this.vida -= dano;
        this.tempoDano = 0.1;

        this.atualizarHUD();

        if (this.vida <= 0) {
            this.morrer();
        }
    }

    morrer() {

        this.vida = 0;
        this.ativo = false;
        this.derrotado = true;

        this.atualizarHUD();
        this.limparAtaques();

        this.mudarEstado('morrer');
    }
}
