
import * as THREE from 'three';

export default class Enemy {

    constructor(scene, x, y, distanciaPatrulha = 1.8) {

        this.scene = scene;

        this.x = x;
        this.y = y;

        this.largura = 0.9;
        this.altura = 0.9;

        this.vida = 3;
        this.ativo = true;

        this.velocidade = 1.5;
        this.direcao = -1;

        this.limiteEsquerdo = x - distanciaPatrulha;
        this.limiteDireito = x + distanciaPatrulha;

        this.tempo = 0;
        this.tempoDano = 0;

        this.objeto = new THREE.Group();

        this.corpo = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.9),
            new THREE.MeshBasicMaterial({
                color: 0xff405d
            })
        );

        this.objeto.add(this.corpo);

        for (const posX of [-0.2, 0.2]) {

            const olho = new THREE.Mesh(
                new THREE.CircleGeometry(0.08, 16),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff
                })
            );

            olho.position.set(posX, 0.1, 0.1);
            this.objeto.add(olho);
        }

        this.objeto.position.set(x, y, 0.6);
        this.scene.add(this.objeto);
    }

    atualizar(delta) {

        if (!this.ativo) return;

        this.tempo += delta;

        this.x += this.direcao *
                  this.velocidade * delta;

        if (this.x <= this.limiteEsquerdo) {

            this.x = this.limiteEsquerdo;
            this.direcao = 1;

        } else if (this.x >= this.limiteDireito) {

            this.x = this.limiteDireito;
            this.direcao = -1;
        }

        this.objeto.position.x = this.x;

        this.objeto.position.y =
            this.y + Math.sin(this.tempo * 5) * 0.04;

        this.objeto.scale.x = this.direcao;

        if (this.tempoDano > 0) {

            this.tempoDano -= delta;
            this.corpo.material.color.setHex(0xffff00);

        } else {

            this.corpo.material.color.setHex(0xff405d);
        }
    }

    receberDano(dano) {

        if (!this.ativo) return;

        this.vida -= dano;
        this.tempoDano = 0.15;

        console.log(`Vida do inimigo: ${this.vida}`);

        if (this.vida <= 0) {
            this.morrer();
        }
    }

    morrer() {

        this.ativo = false;

        this.scene.remove(this.objeto);

        console.log('Inimigo eliminado!');
    }
}
