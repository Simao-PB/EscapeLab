
import * as THREE from 'three';

export default class BulletManager {

    constructor(scene) {

        this.scene = scene;
        this.balas = [];

        // Propriedades das balas
        this.velocidade = 12;
        this.duracao = 2;

        // Carregar sprite da bala
        const loader = new THREE.TextureLoader();

        this.textura = loader.load(
            '/assets/images/robot/Bullets/Bullet_000.png',
            undefined,
            undefined,
            (erro) => {
                console.error('Erro ao carregar bala:', erro);
            }
        );

        this.textura.colorSpace = THREE.SRGBColorSpace;

        // Geometria partilhada pelas balas
        this.geometria = new THREE.PlaneGeometry(
            0.55,
            0.35
        );
    }

    // ====================================
    // CRIAR UMA BALA
    // ====================================

    disparar(x, y, direcao) {

        const material = new THREE.MeshBasicMaterial({
            map: this.textura,
            transparent: true,
            depthWrite: false,
            side: THREE.DoubleSide
        });

        const bala = new THREE.Mesh(
            this.geometria,
            material
        );

        bala.position.set(x, y, 1.2);

        // Virar bala conforme a direção
        bala.scale.x = direcao;

        this.scene.add(bala);

        this.balas.push({
            objeto: bala,
            direcao: direcao,
            tempo: 0
        });
    }

    // ====================================
    // REMOVER BALA
    // ====================================

    removerBala(indice) {

        const bala = this.balas[indice];

        this.scene.remove(bala.objeto);

        bala.objeto.material.dispose();

        this.balas.splice(indice, 1);
    }

    // ====================================
    // ATUALIZAR BALAS E COLISÕES
    // ====================================

    atualizar(delta, inimigos = []) {

        for (let i = this.balas.length - 1; i >= 0; i--) {

            const bala = this.balas[i];

            // Movimentar bala
            bala.objeto.position.x +=
                bala.direcao * this.velocidade * delta;

            bala.tempo += delta;

            let acertou = false;

            // Verificar colisões com inimigos
            for (const inimigo of inimigos) {

                if (!inimigo.ativo) {
                    continue;
                }

                const diferencaX = Math.abs(
                    bala.objeto.position.x - inimigo.x
                );

                const diferencaY = Math.abs(
                    bala.objeto.position.y - inimigo.y
                );

                // Colisão entre retângulos
                const colisaoX =
                    diferencaX < inimigo.largura / 2 + 0.20;

                const colisaoY =
                    diferencaY < inimigo.altura / 2 + 0.15;

                if (colisaoX && colisaoY) {

                    inimigo.receberDano(1);

                    acertou = true;
                    break;
                }
            }

            // Remover se acertar ou acabar o tempo
            if (acertou || bala.tempo >= this.duracao) {
                this.removerBala(i);
            }
        }
    }
}
