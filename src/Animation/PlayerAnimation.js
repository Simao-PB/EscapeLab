
import * as THREE from 'three';

export default class PlayerAnimation {

    constructor(jogador) {

        this.jogador = jogador;
        this.estado = 'Idle';
        this.tempo = 0;
        this.direcao = 1;

        // Configuração das animações
        this.configuracoes = {
            Idle: { frames: 10, fps: 8 },
            Run: { frames: 8, fps: 12 },
            Jump: { frames: 10, fps: 10 },
            Shoot: { frames: 4, fps: 12 },
            RunShoot: { frames: 9, fps: 12 },
            JumpShoot: { frames: 5, fps: 12 }
        };

        this.animacoes = {};

        const loader = new THREE.TextureLoader();

        // Carregar os frames de cada animação
        for (const [nome, config] of Object.entries(
            this.configuracoes
        )) {

            this.animacoes[nome] = [];

            for (let i = 1; i <= config.frames; i++) {

                const ficheiro = `${nome} (${i}).png`;

                const caminho =
                    `/assets/images/robot/${nome}/${encodeURIComponent(ficheiro)}`;

                const textura = loader.load(
                    caminho,
                    undefined,
                    undefined,
                    () => console.error(
                        'Erro ao carregar imagem:', caminho
                    )
                );

                textura.colorSpace = THREE.SRGBColorSpace;
                textura.minFilter = THREE.LinearFilter;
                textura.magFilter = THREE.LinearFilter;

                this.animacoes[nome].push(textura);
            }
        }

        // Material do robô
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        // Sprite do robô
        this.sprite = new THREE.Mesh(
            new THREE.PlaneGeometry(1.53, 1.5),
            material
        );

        this.sprite.position.set(0, 0.10, 0.2);

        jogador.add(this.sprite);

        // Começar com animação Idle
        this.sprite.material.map = this.animacoes.Idle[0];
        this.sprite.material.needsUpdate = true;
    }

    // ====================================
    // ATUALIZAR ANIMAÇÃO
    // ====================================

    atualizar(delta, velocidade, noChao, disparar = false) {

        let novoEstado = 'Idle';

        if (!noChao) {
            novoEstado = disparar ? 'JumpShoot' : 'Jump';
        }
        else if (Math.abs(velocidade.x) > 0.1) {
            novoEstado = disparar ? 'RunShoot' : 'Run';
        }
        else {
            novoEstado = disparar ? 'Shoot' : 'Idle';
        }

        // Verificar mudança de estado
        if (novoEstado !== this.estado) {
            this.estado = novoEstado;
            this.tempo = 0;
        }

        // Direção do robô
        if (velocidade.x > 0.1) {
            this.direcao = 1;
        }
        else if (velocidade.x < -0.1) {
            this.direcao = -1;
        }

        this.sprite.scale.x = this.direcao;

        // Atualizar frame da animação
        this.tempo += delta;

        const config = this.configuracoes[this.estado];

        const indice = Math.floor(
            this.tempo * config.fps
        ) % config.frames;

        const textura = this.animacoes[this.estado][indice];

        if (this.sprite.material.map !== textura) {
            this.sprite.material.map = textura;
            this.sprite.material.needsUpdate = true;
        }
    }
}
