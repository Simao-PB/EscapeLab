
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier2d-compat';

import Player from './Scripts/Player.js';
import './style.css';
import BulletManager from './Scripts/BulletManager.js';

// ========================================
// 1. INICIALIZAR RAPIER
// ========================================

await RAPIER.init();

const world = new RAPIER.World({
    x: 0,
    y: -19
});

// ========================================
// 2. CENA
// ========================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101827);

// ========================================
// 3. CÂMARA
// ========================================

const camera = new THREE.OrthographicCamera(
    -9, 9, 5, -5, 0.1, 100
);

camera.position.z = 10;

// ========================================
// 4. RENDERER
// ========================================

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setSize(
    window.innerWidth,
    window.innerHeight
);

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

document.getElementById('game')
    .appendChild(renderer.domElement);

// ========================================
// 5. CRIAR RETÂNGULOS
// ========================================

function criarRetangulo(x, y, largura, altura, cor) {

    const geometria = new THREE.PlaneGeometry(
        largura,
        altura
    );

    const material = new THREE.MeshBasicMaterial({
        color: cor
    });

    const objeto = new THREE.Mesh(
        geometria,
        material
    );

    objeto.position.set(x, y, 0);
    scene.add(objeto);

    return objeto;
}

// ========================================
// 6. CRIAR CÍRCULOS
// ========================================

function criarCirculo(x, y, raio, cor) {

    const geometria = new THREE.CircleGeometry(
        raio,
        32
    );

    const material = new THREE.MeshBasicMaterial({
        color: cor
    });

    const objeto = new THREE.Mesh(
        geometria,
        material
    );

    objeto.position.set(x, y, 0.1);
    scene.add(objeto);

    return objeto;
}

// 7. CRIAR COLLIDERS ESTÁTICOS


function criarColisorEstatico(x, y, largura, altura) {

    const descricao = RAPIER.ColliderDesc
        .cuboid(largura / 2, altura / 2)
        .setTranslation(x, y);

    return world.createCollider(descricao);
}

// 8. CENÁRIO DO LABORATÓRIO

// Painéis decorativos
for (let i = -8; i <= 8; i += 4) {

    criarRetangulo(i, 1, 2.5, 5, 0x17243b);

    criarRetangulo(
        i,
        3.2,
        2,
        0.1,
        0x00bcd4
    );
}

// Chão visual
criarRetangulo(0, -4.3, 18, 1, 0x34445e);

// Faixa luminosa
criarRetangulo(0, -3.8, 18, 0.08, 0x00e5ff);

// Collider do chão
criarColisorEstatico(0, -4.3, 18, 1);

// 9. PLATAFORMAS COM COLLIDERS

function criarPlataforma(x, y, largura) {

    // Parte visual
    criarRetangulo(
        x,
        y,
        largura,
        0.35,
        0x526784
    );

    criarRetangulo(
        x,
        y + 0.18,
        largura,
        0.07,
        0x00e5ff
    );

    // Parte física
    criarColisorEstatico(
        x,
        y,
        largura,
        0.35
    );
}

criarPlataforma(-4, -2, 2.8);
criarPlataforma(0, -0.5, 3);
criarPlataforma(4, 1, 2.5);


// 10. JOGADOR


const player = new Player(scene, world);
// Sistema de disparos
const bulletManager = new BulletManager(scene);


// INIMIGO 

// Corpo e olhos do inimigo
const corpoInimigo = criarRetangulo(
    3, -3.3, 0.9, 0.9, 0xff405d
);

const olho1 = criarCirculo(
    2.8, -3.2, 0.08, 0xffffff
);

const olho2 = criarCirculo(
    3.2, -3.2, 0.08, 0xffffff
);

// Dados do inimigo
const inimigo = {
    x: 3,
    y: -3.3,
    largura: 0.9,
    altura: 0.9,
    vida: 3,
    ativo: true,

    receberDano(dano) {

        if (!this.ativo) return;

        this.vida -= dano;

        console.log(
            `Inimigo atingido! Vida restante: ${this.vida}`
        );

        if (this.vida <= 0) {

            this.ativo = false;

            // Remover o inimigo do cenário
            scene.remove(corpoInimigo);
            scene.remove(olho1);
            scene.remove(olho2);

            console.log('Inimigo destruído!');
        }
        else {
            // Mudar de cor ao receber dano
            corpoInimigo.material.color.setHex(
                this.vida === 2 ? 0xff8800 : 0xffff00
            );
        }
    }
};


// 12. PORTA DE SAÍDA

criarRetangulo(7.2, -2.9, 1.4, 1.8, 0x008577);
criarRetangulo(7.2, -2.9, 1, 1.5, 0x062b35);
criarCirculo(7.2, -2.6, 0.25, 0x00ffba);

// 13. ENERGIAS

const energias = [];

const posicoesEnergia = [
    [-4, -1.4],
    [0, 0.1],
    [4, 1.6]
];

for (const [x, y] of posicoesEnergia) {

    const energia = criarCirculo(
        x,
        y,
        0.22,
        0xffd447
    );

    energias.push({
        objeto: energia,
        yInicial: y
    });
}

// 14. REDIMENSIONAMENTO

function redimensionar() {

    const largura = window.innerWidth;
    const altura = window.innerHeight;

    const proporcao = largura / altura;

    const larguraVisivel = Math.max(
        18,
        10 * proporcao
    );

    const alturaVisivel = larguraVisivel / proporcao;

    camera.left = -larguraVisivel / 2;
    camera.right = larguraVisivel / 2;
    camera.top = alturaVisivel / 2;
    camera.bottom = -alturaVisivel / 2;

    camera.updateProjectionMatrix();

    renderer.setSize(largura, altura);
}

window.addEventListener('resize', redimensionar);

redimensionar();

// 15. LOOP DO JOGO

const clock = new THREE.Clock();

const passoFisica = 1 / 60;
let acumulador = 0;
let tempo = 0;

function atualizar() {

    const delta = Math.min(clock.getDelta(), 0.05);

    tempo += delta;
    acumulador += delta;

    // Atualizar física a 60 passos por segundo
    while (acumulador >= passoFisica) {

        player.atualizarFisica();

        world.step();

        acumulador -= passoFisica;
    }

    // Atualizar posição visual do jogador
    player.atualizarVisual(delta);

    // Verificar se o jogador está a disparar
    player.atualizarDisparo(delta, bulletManager);

    // Movimentar balas e detetar colisões
    bulletManager.atualizar(delta, [inimigo]);

    // Animação das energias
    energias.forEach((energia, indice) => {

        energia.objeto.position.y =
            energia.yInicial +
            Math.sin(tempo * 3 + indice) * 0.12;
    });

    renderer.render(scene, camera);
}

renderer.setAnimationLoop(atualizar);
