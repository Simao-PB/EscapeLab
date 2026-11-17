import * as THREE from 'three';

export default class SecurityTerminal {

    constructor(cena, x, y, nome) {

        this.x = x;
        this.y = y;
        this.nome = nome;
        this.ativado = false;

        const loader = new THREE.TextureLoader();

        this.texturaDesligado = loader.load(
            '/assets/images/terminal_off.png'
        );

        this.texturaLigado = loader.load(
            '/assets/images/terminal_on.png'
        );

        this.texturaDesligado.colorSpace = THREE.SRGBColorSpace;
        this.texturaLigado.colorSpace = THREE.SRGBColorSpace;

        this.material = new THREE.MeshBasicMaterial({
            map: this.texturaDesligado,
            transparent: true
        });

        this.objeto = new THREE.Mesh(
            new THREE.PlaneGeometry(0.85, 1.6),
            this.material
        );

        // atrás do jogador
        this.objeto.position.set(x, y + 0.8, -0.2);

        cena.add(this.objeto);
    }

    estaPerto(posicao) {
        return (
            Math.abs(posicao.x - this.x) < 1.2 &&
            Math.abs(posicao.y - (this.y + 0.7)) < 1.3
        );
    }

    ativar() {

        if (this.ativado) {
            return false;
        }

        this.ativado = true;

        this.material.map = this.texturaLigado;
        this.material.needsUpdate = true;

        console.log(`${this.nome} ativado!`);

        return true;
    }
}