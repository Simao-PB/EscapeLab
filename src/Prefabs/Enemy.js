import * as THREE from 'three';

export default class Enemy {

    constructor(scene, x, y, distanciaPatrulha = 1.8, vidaMaxima = 3) {

        this.scene = scene;

        this.x = x;
        this.y = y;

        this.largura = 0.9;
        this.altura = 0.9;

        this.vidaMaxima = vidaMaxima;
        this.vida = vidaMaxima;
        this.ativo = true;

        this.velocidade = 1.5;
        this.direcao = -1;

        this.limiteEsquerdo = x - distanciaPatrulha;
        this.limiteDireito = x + distanciaPatrulha;

        this.tempo = 0;
        this.tempoDano = 0;
        this.tempoMorte = 0;

        // Grupo principal (posição)
        this.objeto = new THREE.Group();

        // Grupo do corpo (vira conforme a direção)
        this.visual = new THREE.Group();
        this.objeto.add(this.visual);

        this.corpo = new THREE.Mesh(
            new THREE.PlaneGeometry(0.9, 0.9),
            new THREE.MeshBasicMaterial({
                color: 0xff405d,
                transparent: true
            })
        );

        this.visual.add(this.corpo);

        for (const posX of [-0.2, 0.2]) {

            const olho = new THREE.Mesh(
                new THREE.CircleGeometry(0.08, 16),
                new THREE.MeshBasicMaterial({
                    color: 0xffffff
                })
            );

            olho.position.set(posX, 0.1, 0.1);
            this.visual.add(olho);
        }

        // ====================================
        // BARRA DE VIDA (não vira com o corpo)
        // ====================================

        this.larguraBarra = 0.9;

        this.barraFundo = new THREE.Mesh(
            new THREE.PlaneGeometry(this.larguraBarra + 0.06, 0.16),
            new THREE.MeshBasicMaterial({ color: 0x111111 })
        );

        this.barraFundo.position.set(0, 0.7, 0.2);

        this.barraVida = new THREE.Mesh(
            new THREE.PlaneGeometry(this.larguraBarra, 0.1),
            new THREE.MeshBasicMaterial({ color: 0x3dff6e })
        );

        this.barraVida.position.set(0, 0.7, 0.25);

        this.objeto.add(this.barraFundo, this.barraVida);

        this.atualizarBarraVida();

        this.objeto.position.set(x, y, 0.6);
        this.scene.add(this.objeto);
    }

    // ====================================
    // BARRA DE VIDA
    // ====================================

    atualizarBarraVida() {

        const percentagem = Math.max(0, this.vida / this.vidaMaxima);

        // Encolher a barra a partir da esquerda
        this.barraVida.scale.x = Math.max(0.0001, percentagem);
        this.barraVida.position.x =
            -this.larguraBarra * (1 - percentagem) / 2;

        // Verde -> amarelo -> vermelho
        let cor = 0x3dff6e;

        if (percentagem <= 0.34) {
            cor = 0xff3b3b;
        } else if (percentagem <= 0.67) {
            cor = 0xffd447;
        }

        this.barraVida.material.color.setHex(cor);

        // Só mostrar a barra depois do primeiro dano
        const visivel = percentagem < 1;
        this.barraFundo.visible = visivel;
        this.barraVida.visible = visivel;
    }

    atualizar(delta) {

        // Pequena animação de morte
        if (!this.ativo) {

            if (this.tempoMorte > 0) {

                this.tempoMorte -= delta;

                const t = Math.max(0, this.tempoMorte / 0.35);

                this.objeto.scale.set(t, t, 1);
                this.corpo.material.opacity = t;

                if (this.tempoMorte <= 0) {
                    this.scene.remove(this.objeto);
                }
            }

            return;
        }

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

        this.visual.scale.x = this.direcao;

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

        this.atualizarBarraVida();

        if (this.vida <= 0) {
            this.morrer();
        }
    }

    morrer() {

        this.ativo = false;
        this.tempoMorte = 0.35;

        this.barraFundo.visible = false;
        this.barraVida.visible = false;
    }
}
