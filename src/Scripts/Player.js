
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier2d-compat';

import PlayerAnimation from '../Animation/PlayerAnimation.js';

export default class Player {

    constructor(scene, world) {

        this.scene = scene;
        this.world = world;

        this.velocidade = 5.5;
        this.forcaSalto = 9.5;

        // Configuração dos disparos
        this.intervaloDisparo = 0.25;
        this.tempoDisparo = 0;

        this.ratoPressionado = false;

        this.teclas = {
            esquerda: false,
            direita: false,
            disparar: false
        };

        this.pedidoSalto = false;

        // Configuração dos disparos
        this.intervaloDisparo = 0.25;
        this.tempoDisparo = 0;

        this.ratoPressionado = false;
        this.teclaDisparo = false;

        // ====================================
        // OBJETO VISUAL
        // ====================================

        this.objeto = new THREE.Group();
        this.objeto.position.set(-7, -3.2, 0.5);

        scene.add(this.objeto);

        this.animacao = new PlayerAnimation(this.objeto);

        // ====================================
        // FÍSICA RAPIER
        // ====================================

        const descricao = RAPIER.RigidBodyDesc
            .dynamic()
            .setTranslation(-7, -3.2)
            .lockRotations();

        this.corpoFisico = world.createRigidBody(descricao);

        const descricaoCollider = RAPIER.ColliderDesc
            .cuboid(0.45, 0.55)
            .setFriction(0)
            .setRestitution(0);

        this.colisor = world.createCollider(
            descricaoCollider,
            this.corpoFisico
        );

        // ====================================
        // TECLADO
        // ====================================

        window.addEventListener('keydown', (evento) => {

            switch (evento.code) {

                case 'ArrowLeft':
                case 'KeyA':
                    this.teclas.esquerda = true;
                    evento.preventDefault();
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    this.teclas.direita = true;
                    evento.preventDefault();
                    break;

                case 'Space':
                case 'ArrowUp':
                case 'KeyW':
                    if (!evento.repeat) {
                        this.pedidoSalto = true;
                    }
                    evento.preventDefault();
                    break;

                case 'KeyE':
                    this.teclas.disparar = true;
                    evento.preventDefault();
                    break;
            }
        });

        window.addEventListener('keyup', (evento) => {

            switch (evento.code) {

                case 'ArrowLeft':
                case 'KeyA':
                    this.teclas.esquerda = false;
                    break;

                case 'ArrowRight':
                case 'KeyD':
                    this.teclas.direita = false;
                    break;

                case 'KeyE':
                    this.teclas.disparar = false;
                    break;
            }
        });

        // ====================================
        // RATO
        // ====================================

        window.addEventListener('mousedown', (evento) => {

            if (evento.button === 0) {
                this.ratoPressionado = true;
            }
        });

        window.addEventListener('mouseup', (evento) => {

            if (evento.button === 0) {
                this.ratoPressionado = false;
            }
        });

        window.addEventListener('blur', () => {

            this.teclas.esquerda = false;
            this.teclas.direita = false;
            this.teclas.disparar = false;
            this.ratoPressionado = false;
            this.pedidoSalto = false;
        });
    }

    // ====================================
    // VERIFICAR SE ESTÁ NO CHÃO
    // ====================================

    estaNoChao() {

        const posicao = this.corpoFisico.translation();
        const velocidade = this.corpoFisico.linvel();

        const raio = new RAPIER.Ray(
            {
                x: posicao.x,
                y: posicao.y - 0.53
            },
            {
                x: 0,
                y: -1
            }
        );

        const colisao = this.world.castRay(
            raio,
            0.12,
            true,
            undefined,
            undefined,
            this.colisor
        );

        return colisao !== null && velocidade.y <= 0.25;
    }

    // ====================================
    // MOVIMENTO
    // ====================================

    atualizarFisica() {

        let movimentoX = 0;

        if (this.teclas.esquerda) {
            movimentoX -= this.velocidade;
        }

        if (this.teclas.direita) {
            movimentoX += this.velocidade;
        }

        const velocidadeAtual = this.corpoFisico.linvel();

        let velocidadeY = velocidadeAtual.y;

        if (this.pedidoSalto && this.estaNoChao()) {
            velocidadeY = this.forcaSalto;
        }

        this.pedidoSalto = false;

        this.corpoFisico.setLinvel(
            {
                x: movimentoX,
                y: velocidadeY
            },
            true
        );
    }

    // ====================================
    // VERIFICAR SE ESTÁ A DISPARAR
    // ====================================

    estaADisparar() {

        return this.teclas.disparar ||
               this.ratoPressionado;
    }

    // ====================================
    // CRIAR DISPAROS
    // ====================================

    atualizarDisparo(delta, bulletManager) {

        this.tempoDisparo = Math.max(
            0,
            this.tempoDisparo - delta
        );

        if (!this.estaADisparar()) {
            return;
        }

        if (this.tempoDisparo > 0) {
            return;
        }

        const posicao = this.corpoFisico.translation();
        const direcao = this.animacao.direcao;

        // Bala sai à frente do robô
        const x = posicao.x + direcao * 0.75;
        const y = posicao.y + 0.10;

        bulletManager.disparar(x, y, direcao);

        // Intervalo entre disparos
        this.tempoDisparo = this.intervaloDisparo;
    }

    // ====================================
    // ATUALIZAR VISUAL
    // ====================================

    atualizarVisual(delta) {

        const posicao = this.corpoFisico.translation();

        this.objeto.position.x = posicao.x;
        this.objeto.position.y = posicao.y;

        const velocidade = this.corpoFisico.linvel();

        const noChao = this.estaNoChao();

        this.animacao.atualizar(
            delta,
            velocidade,
            noChao,
            this.estaADisparar()
        );
    }
}
