
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier2d-compat';

export default class MovingPlatform {

    constructor(
        cena,
        mundo,
        materialPlataforma,
        x,
        y,
        largura,
        amplitude = 0.9,
        velocidade = 1.2,
        eixo = 'vertical'
    ) {

        // Posição inicial
        this.xInicial = x;
        this.yInicial = y;

        // Dimensões
        this.largura = largura;
        this.alturaCollider = 0.35;

        // Movimento
        this.amplitude = amplitude;
        this.velocidade = velocidade;
        this.eixo = eixo;

        this.tempo = 0;
        this.velocidadeHorizontal = 0;

        // ====================================
        // CORPO FÍSICO
        // ====================================

        const corpoDesc = RAPIER.RigidBodyDesc
            .kinematicPositionBased()
            .setTranslation(x, y);

        this.corpoFisico = mundo.createRigidBody(
            corpoDesc
        );

        // Collider
        const colliderDesc = RAPIER.ColliderDesc
            .cuboid(
                largura / 2,
                this.alturaCollider / 2
            )
            .setFriction(0.7)
            .setRestitution(0);

        this.colisor = mundo.createCollider(
            colliderDesc,
            this.corpoFisico
        );

        // ====================================
        // IMAGEM DA PLATAFORMA
        // ====================================

        const alturaVisual = largura * 0.30;

        // Mesmo ajuste das plataformas estáticas
        const ajusteVertical = 0.35;

        this.deslocamentoVisual =
            this.alturaCollider / 2 -
            alturaVisual / 2 +
            ajusteVertical;

        this.objeto = new THREE.Mesh(
            new THREE.PlaneGeometry(
                largura,
                alturaVisual
            ),
            materialPlataforma
        );

        this.objeto.position.set(
            x,
            y + this.deslocamentoVisual,
            0.3
        );

        cena.add(this.objeto);
    }

    // ====================================
    // VERIFICAR JOGADOR SOBRE A PLATAFORMA
    // ====================================

    estaJogadorEmCima(corpoJogador) {

        if (this.eixo !== 'horizontal') {
            return false;
        }

        const jogador = corpoJogador.translation();
        const plataforma = this.corpoFisico.translation();

        // Metade da altura do collider do jogador
        const fundoJogador = jogador.y - 0.55;

        const topoPlataforma =
            plataforma.y + this.alturaCollider / 2;

        const velocidadeY = corpoJogador.linvel().y;

        // Sobreposição horizontal
        const overlapX =
            Math.abs(jogador.x - plataforma.x) <
            this.largura / 2 + 0.35;

        // Pés próximos do topo do collider
        const apoioY =
            Math.abs(fundoJogador - topoPlataforma) <
            0.14;

        // Ignorar jogador que está a saltar
        const apoiado =
            velocidadeY <= 0.4 &&
            velocidadeY > -1.2;

        return overlapX && apoioY && apoiado;
    }

    // ====================================
    // ATUALIZAR FÍSICA
    // ====================================

    atualizarFisica(delta) {

        this.tempo += delta;

        // Movimento suave de ida e volta
        const deslocamento =
            Math.sin(
                this.tempo * this.velocidade
            ) * this.amplitude;

        const posicaoAtual =
            this.corpoFisico.translation();

        let novoX = this.xInicial;
        let novoY = this.yInicial;

        if (this.eixo === 'horizontal') {

            novoX += deslocamento;

        } else {

            novoY += deslocamento;
        }

        // Velocidade utilizada para transportar
        // o jogador horizontalmente
        this.velocidadeHorizontal =
            (novoX - posicaoAtual.x) / delta;

        // Próxima posição física
        this.corpoFisico.setNextKinematicTranslation({
            x: novoX,
            y: novoY
        });
    }

    // ====================================
    // SINCRONIZAR IMAGEM
    // ====================================

    atualizarVisual() {

        const posicao =
            this.corpoFisico.translation();

        this.objeto.position.set(
            posicao.x,
            posicao.y + this.deslocamentoVisual,
            0.3
        );
    }
}
