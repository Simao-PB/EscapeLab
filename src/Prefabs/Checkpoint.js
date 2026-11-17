
import * as THREE from 'three';

export default class Checkpoint {

    constructor(cena, x, y) {

        this.cena = cena;
        this.x = x;
        this.y = y;
        this.ativado = false;

        // Carregar as imagens
        const loader = new THREE.TextureLoader();

        this.texturaDesativado = loader.load(
            '/assets/images/checkpoint_off.png'
        );

        this.texturaAtivado = loader.load(
            '/assets/images/checkpoint_on.png'
        );

        this.texturaDesativado.colorSpace =
            THREE.SRGBColorSpace;

        this.texturaAtivado.colorSpace =
            THREE.SRGBColorSpace;

        // Criar material inicial
        this.material = new THREE.MeshBasicMaterial({
            map: this.texturaDesativado,
            transparent: true,
            depthWrite: false
        });

        // Dimensões do checkpoint
        const largura = 1.30;
        const altura = 1.25;

        // Criar objeto visual
        this.objeto = new THREE.Group();

        const imagem = new THREE.Mesh(
            new THREE.PlaneGeometry(largura, altura),
            this.material
        );

        // Base alinhada com o chão
        imagem.position.y = altura / 2;

        this.objeto.add(imagem);

        // Colocar atrás do robô
        this.objeto.position.set(x, y, -0.2);

        cena.add(this.objeto);
    }

    // ====================================
    // VERIFICAR ATIVAÇÃO
    // ====================================

    verificarAtivacao(posicaoJogador) {

        if (this.ativado) {
            return false;
        }

        const diferencaX = Math.abs(
            posicaoJogador.x - this.x
        );

        const diferencaY = Math.abs(
            posicaoJogador.y - (this.y + 0.55)
        );

        if (
            diferencaX < 0.65 &&
            diferencaY < 0.9
        ) {
            this.ativar();
            return true;
        }

        return false;
    }

    // ====================================
    // ATIVAR CHECKPOINT
    // ====================================

    ativar() {

        if (this.ativado) {
            return false;
        }

        this.ativado = true;

        // Trocar a imagem azul pela verde
        this.material.map = this.texturaAtivado;
        this.material.needsUpdate = true;

        console.log(
            'Checkpoint ativado!',
            this.x
        );

        return true;
    }
}
