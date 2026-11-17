
import * as THREE from 'three';
import RAPIER from '@dimforge/rapier2d-compat';

import Player from './Scripts/Player.js';
import BulletManager from './Scripts/BulletManager.js';
import Enemy from './Prefabs/Enemy.js';
import GameManager from './Scripts/GameManager.js';
import Checkpoint from './Prefabs/Checkpoint.js';
import MovingPlatform from './Prefabs/MovingPlatform.js';
import SecurityTerminal from './Prefabs/SecurityTerminal.js';
import { mostrarMenuInicial } from './Scenes/MenuScene.js';

import './style.css';

// ========================================
// 1. CONFIGURAÇÃO E MOTOR
// ========================================

const INICIO_NIVEL = -9;
const FIM_NIVEL = 49;
const PASSO_FISICA = 1 / 60;
const Y_CHAO = -3.8;

await RAPIER.init();

const mundo = new RAPIER.World({
    x: 0,
    y: -19
});

mundo.timestep = PASSO_FISICA;

const cena = new THREE.Scene();
cena.background = new THREE.Color(0x101827);

const camera = new THREE.OrthographicCamera(
    -9, 9, 5, -5, 0.1, 100
);

camera.position.set(0, 0, 10);

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
);

const elementoJogo = document.getElementById('game');

if (!elementoJogo) {
    throw new Error(
        'Falta o elemento #game no index.html'
    );
}

elementoJogo.appendChild(renderer.domElement);

const loader = new THREE.TextureLoader();

// ========================================
// 2. FUNÇÕES AUXILIARES
// ========================================

function carregarTextura(caminho) {

    const textura = loader.load(
        caminho,
        undefined,
        undefined,
        (erro) => {
            console.error(
                `Não foi possível carregar: ${caminho}`,
                erro
            );
        }
    );

    textura.colorSpace = THREE.SRGBColorSpace;

    return textura;
}

function criarRetangulo(
    x, y, largura, altura, cor, z = 0
) {

    const objeto = new THREE.Mesh(
        new THREE.PlaneGeometry(largura, altura),
        new THREE.MeshBasicMaterial({
            color: cor
        })
    );

    objeto.position.set(x, y, z);

    cena.add(objeto);

    return objeto;
}

function criarColisorEstatico(
    x, y, largura, altura
) {

    return mundo.createCollider(
        RAPIER.ColliderDesc
            .cuboid(largura / 2, altura / 2)
            .setTranslation(x, y)
    );
}

function criarHUD(id, conteudo) {

    let elemento = document.getElementById(id);

    if (!elemento) {
        elemento = document.createElement('div');
        elemento.id = id;
        document.body.appendChild(elemento);
    }

    elemento.textContent = conteudo;

    return elemento;
}

// ========================================
// 3. FUNDO DO LABORATÓRIO
// ========================================

const materialFundo = new THREE.MeshBasicMaterial({
    map: carregarTextura(
        '/assets/images/background_lab.jpg'
    ),
    depthWrite: false
});

const alturaFundo = 12;
const larguraFundo = alturaFundo * (2048 / 1143);

for (
    let x = INICIO_NIVEL;
    x < FIM_NIVEL;
    x += larguraFundo
) {

    const fundo = new THREE.Mesh(
        new THREE.PlaneGeometry(
            larguraFundo + 0.02,
            alturaFundo
        ),
        materialFundo
    );

    fundo.position.set(
        x + larguraFundo / 2,
        -0.7,
        -5
    );

    cena.add(fundo);
}

// ========================================
// 4. CHÃO E PAREDES
// ========================================

const larguraChao = FIM_NIVEL - INICIO_NIVEL;
const centroChao = (INICIO_NIVEL + FIM_NIVEL) / 2;

criarRetangulo(
    centroChao,
    -4.3,
    larguraChao,
    1,
    0x34445e,
    0.05
);

criarRetangulo(
    centroChao,
    Y_CHAO,
    larguraChao,
    0.07,
    0x00e5ff,
    0.1
);

criarColisorEstatico(
    centroChao,
    -4.3,
    larguraChao,
    1
);

criarColisorEstatico(
    INICIO_NIVEL - 0.15,
    0,
    0.3,
    12
);

criarColisorEstatico(
    FIM_NIVEL + 0.15,
    0,
    0.3,
    12
);

// ========================================
// 5. PLATAFORMAS ESTÁTICAS
// ========================================

const materialPlataforma = new THREE.MeshBasicMaterial({
    map: carregarTextura(
        '/assets/images/platform_lab.png'
    ),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
});

function criarPlataforma(x, y, largura) {

    const alturaCollider = 0.35;
    const alturaVisual = largura * 0.30;
    const ajusteVertical = 0.35;

    const objeto = new THREE.Mesh(
        new THREE.PlaneGeometry(
            largura,
            alturaVisual
        ),
        materialPlataforma
    );

    objeto.position.set(
        x,
        y + alturaCollider / 2 -
            alturaVisual / 2 +
            ajusteVertical,
        0.3
    );

    cena.add(objeto);

    criarColisorEstatico(
        x,
        y,
        largura,
        alturaCollider
    );
}

const plataformas = [
    [-4, -2, 2.8],
    [0, -0.5, 3],
    [4, 1, 2.5],
    [10, -2, 3],
    [14, -1.1, 2.7],
    [18, 0, 2.8],
    [29, -0.9, 2.6],
    [39, -1.1, 2.6],
    [44, 0, 3]
];

plataformas.forEach(([x, y, largura]) => {
    criarPlataforma(x, y, largura);
});

// ========================================
// 6. PLATAFORMAS MÓVEIS
// ========================================

const plataformasMoveis = [

    new MovingPlatform(
        cena,
        mundo,
        materialPlataforma,
        24,
        -2,
        3,
        0.9,
        1.2,
        'vertical'
    ),

    new MovingPlatform(
        cena,
        mundo,
        materialPlataforma,
        34,
        -2,
        3,
        1.4,
        1.2,
        'horizontal'
    )

];

// ========================================
// 7. JOGADOR, INIMIGOS E VIDAS
// ========================================

const player = new Player(cena, mundo);

const bulletManager = new BulletManager(cena);

const inimigos = [
    new Enemy(cena, 3, -3.3, 1.8),
    new Enemy(cena, 13, -3.3, 1.5),
    new Enemy(cena, 27, -3.3, 1.7),
    new Enemy(cena, 37, -3.3, 1.4)
];

const gameManager = new GameManager(
    player,
    inimigos
);

let jogoIniciado = false;

// ========================================
// 8. TERMINAIS DE SEGURANÇA
// ========================================

const terminais = [
    new SecurityTerminal(
        cena, 11, Y_CHAO, 'Terminal 1'
    ),
    new SecurityTerminal(
        cena, 26, Y_CHAO, 'Terminal 2'
    ),
    new SecurityTerminal(
        cena, 43, Y_CHAO, 'Terminal 3'
    )
];

const hudTerminais = criarHUD(
    'terminais-hud',
    'TERMINAIS: 0/3'
);

const mensagemTerminal = criarHUD(
    'mensagem-terminal',
    ''
);

mensagemTerminal.style.display = 'none';

function todosTerminaisAtivos() {
    return terminais.every(
        terminal => terminal.ativado
    );
}

function terminalPorAtivarPerto() {

    const posicao =
        player.corpoFisico.translation();

    return terminais.find(
        terminal =>
            !terminal.ativado &&
            terminal.estaPerto(posicao)
    );
}

function atualizarMensagemTerminal() {

    const terminal = terminalPorAtivarPerto();

    mensagemTerminal.style.display =
        terminal ? 'block' : 'none';

    if (terminal) {
        mensagemTerminal.textContent =
            `Pressiona F para ativar ${terminal.nome}`;
    }
}

window.addEventListener('keydown', (evento) => {

    if (
        !jogoIniciado ||
        gameManager.terminou ||
        evento.repeat ||
        evento.code !== 'KeyF'
    ) {
        return;
    }

    const terminal = terminalPorAtivarPerto();

    if (!terminal || !terminal.ativar()) {
        return;
    }

    const ativos = terminais.filter(
        item => item.ativado
    ).length;

    hudTerminais.textContent =
        `TERMINAIS: ${ativos}/${terminais.length}`;

    atualizarMensagemTerminal();
});

// ========================================
// 9. CHECKPOINTS E RESPAWN
// ========================================

const checkpoints = [
    new Checkpoint(cena, 16, Y_CHAO),
    new Checkpoint(cena, 32, Y_CHAO)
];

let pontoRespawn = {
    x: -7,
    y: -3.2
};

function atualizarCheckpoints() {

    const posicao =
        player.corpoFisico.translation();

    for (const checkpoint of checkpoints) {

        if (checkpoint.verificarAtivacao(posicao)) {

            pontoRespawn = {
                x: checkpoint.x,
                y: -3.2
            };
        }
    }
}

function reaparecerNoCheckpoint() {

    player.corpoFisico.setTranslation(
        pontoRespawn,
        true
    );

    player.corpoFisico.setLinvel(
        { x: 0, y: 0 },
        true
    );

    player.atualizarVisual(0);

    atualizarCamera(1);
}

// ========================================
// 10. LASERS DE SEGURANÇA
// ========================================

function criarLaser(x, y, altura, atraso = 0) {

    const objeto = new THREE.Mesh(
        new THREE.PlaneGeometry(
            0.15,
            altura
        ),
        new THREE.MeshBasicMaterial({
            color: 0xff304f,
            transparent: true,
            opacity: 0.85,
            depthWrite: false
        })
    );

    objeto.position.set(x, y, 0.9);

    cena.add(objeto);

    return {
        x,
        y,
        altura,
        atraso,
        objeto
    };
}

const lasers = [
    criarLaser(8, -3.0, 1.6),
    criarLaser(22, -3.0, 1.6, 1),
    criarLaser(41, -3.0, 1.6, 2)
];

function atualizarLasers(tempo) {

    const posicao =
        player.corpoFisico.translation();

    for (const laser of lasers) {

        const ligado =
            (tempo + laser.atraso) % 3 < 2;

        laser.objeto.visible = ligado;

        if (!ligado) {
            continue;
        }

        const pertoX =
            Math.abs(posicao.x - laser.x) < 0.55;

        const pertoY =
            Math.abs(posicao.y - laser.y) <
            0.55 + laser.altura / 2;

        if (pertoX && pertoY) {
            gameManager.receberDano();
        }
    }
}

// ========================================
// 11. ENERGIAS
// ========================================

function criarEnergia(x, y) {

    const grupo = new THREE.Group();

    const brilho = new THREE.Mesh(
        new THREE.RingGeometry(
            0.25, 0.32, 32
        ),
        new THREE.MeshBasicMaterial({
            color: 0xfff3a0,
            transparent: true,
            opacity: 0.65,
            side: THREE.DoubleSide
        })
    );

    const nucleo = new THREE.Mesh(
        new THREE.CircleGeometry(0.22, 32),
        new THREE.MeshBasicMaterial({
            color: 0xffd447
        })
    );

    nucleo.position.z = 0.01;

    grupo.add(brilho, nucleo);
    grupo.position.set(x, y, 0.5);

    cena.add(grupo);

    return {
        x,
        y,
        grupo,
        recolhida: false
    };
}

const energias = [
    [-4, -1.4],
    [0, 0.1],
    [4, 1.6],
    [10, -1.4],
    [18, 0.6],
    [29, -0.3],
    [44, 0.6]
].map(([x, y]) => criarEnergia(x, y));

let energiasRecolhidas = 0;

const totalEnergias = energias.length;

const hudEnergia = criarHUD(
    'energia-hud',
    `⚡ ENERGIA: 0/${totalEnergias}`
);

function atualizarEnergias(
    tempo,
    posicaoJogador
) {

    for (const energia of energias) {

        if (energia.recolhida) {
            continue;
        }

        energia.grupo.position.y =
            energia.y +
            Math.sin(tempo * 3 + energia.x) * 0.12;

        energia.grupo.rotation.z += 0.01;

        const pertoX =
            Math.abs(
                posicaoJogador.x - energia.x
            ) < 0.65;

        const pertoY =
            Math.abs(
                posicaoJogador.y -
                energia.grupo.position.y
            ) < 0.75;

        if (!pertoX || !pertoY) {
            continue;
        }

        energia.recolhida = true;

        cena.remove(energia.grupo);

        energia.grupo.traverse(objeto => {

            if (objeto.isMesh) {
                objeto.geometry.dispose();
                objeto.material.dispose();
            }
        });

        energiasRecolhidas++;

        hudEnergia.textContent =
            `⚡ ENERGIA: ${energiasRecolhidas}/${totalEnergias}`;
    }
}

// ========================================
// 12. PORTA DE SAÍDA
// ========================================

const portaX = 47;
const portaY = -2.9;

let portaDesbloqueada = false;

const texturaPortaFechada = carregarTextura(
    '/assets/images/door_locked.png'
);

const texturaPortaAberta = carregarTextura(
    '/assets/images/door_unlocked.png'
);

const materialPorta = new THREE.MeshBasicMaterial({
    map: texturaPortaFechada,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
});

const alturaPorta = 2;

const objetoPorta = new THREE.Mesh(
    new THREE.PlaneGeometry(
        2,
        alturaPorta
    ),
    materialPorta
);

objetoPorta.position.set(
    portaX,
    Y_CHAO + alturaPorta / 2,
    0.25
);

cena.add(objetoPorta);

const estadoPorta = criarHUD(
    'estado-porta',
    '🔒 SAÍDA BLOQUEADA'
);

function verificarObjetivos() {

    if (portaDesbloqueada) {
        return;
    }

    if (
        energiasRecolhidas !== totalEnergias ||
        !todosTerminaisAtivos()
    ) {
        return;
    }

    portaDesbloqueada = true;

    materialPorta.map = texturaPortaAberta;
    materialPorta.needsUpdate = true;

    estadoPorta.textContent =
        '🔓 SAÍDA DESBLOQUEADA';

    console.log(
        'Objetivos concluídos: porta desbloqueada!'
    );
}

// ========================================
// 13. CONCLUSÃO DO NÍVEL
// ========================================

function concluirNivel1() {

    if (gameManager.terminou) {
        return;
    }

    gameManager.terminou = true;
    player.objeto.visible = true;

    mensagemTerminal.style.display = 'none';

    const overlay = document.createElement('div');

    overlay.id = 'nivel-concluido-overlay';
    overlay.className = 'ecran-jogo-overlay';

    overlay.style.cssText = `
        position:fixed;
        inset:0;
        z-index:20000;
        display:flex;
        align-items:center;
        justify-content:center;
        background:rgba(2,7,18,.94);
        padding:20px;
        box-sizing:border-box;
    `;

    overlay.innerHTML = `
        <div
            class="painel-ecran-jogo painel-vitoria"
            style="
                background:#091a2d;
                border:2px solid #00ffab;
                color:white;
                max-width:520px;
                width:100%;
                padding:36px;
                text-align:center;
                border-radius:16px;
                font-family:Arial,sans-serif;
                box-sizing:border-box;
            "
        >
            <h1 style="color:#00ffab">
                NÍVEL 1 CONCLUÍDO!
            </h1>

            <p>
                Conseguiste escapar do laboratório!
            </p>

            <p>
                ⚡ ${totalEnergias}/${totalEnergias} energias
                · ✓ ${terminais.length}/${terminais.length} terminais
            </p>

            <button
                id="voltar-menu-vitoria"
                class="botao-ecran-jogo"
                style="
                    cursor:pointer;
                    padding:14px 25px;
                    margin-top:20px;
                "
            >
                VOLTAR AO MENU
            </button>
        </div>
    `;

    document.body.appendChild(overlay);

    document.getElementById('voltar-menu-vitoria')
        .addEventListener('click', () => {

            window.location.reload();
        });
}

function verificarPorta() {

    if (!portaDesbloqueada || gameManager.terminou) {
        return;
    }

    const posicao =
        player.corpoFisico.translation();

    if (
        Math.abs(posicao.x - portaX) < 0.8 &&
        Math.abs(posicao.y - portaY) < 1.1
    ) {
        concluirNivel1();
    }
}

// ========================================
// 14. CÂMARA E REDIMENSIONAMENTO
// ========================================

function redimensionar() {

    const largura = window.innerWidth;
    const altura = window.innerHeight;

    const proporcao = largura / altura;

    const larguraVisivel = Math.max(
        18,
        10 * proporcao
    );

    const alturaVisivel =
        larguraVisivel / proporcao;

    camera.left = -larguraVisivel / 2;
    camera.right = larguraVisivel / 2;

    camera.top = alturaVisivel / 2;
    camera.bottom = -alturaVisivel / 2;

    camera.updateProjectionMatrix();

    renderer.setSize(largura, altura);
}

window.addEventListener(
    'resize',
    redimensionar
);

redimensionar();

function atualizarCamera(delta) {

    const posicao =
        player.corpoFisico.translation();

    const metadeVista =
        (camera.right - camera.left) / 2;

    const minimo =
        INICIO_NIVEL + metadeVista;

    const maximo =
        FIM_NIVEL - metadeVista;

    const alvoX = THREE.MathUtils.clamp(
        posicao.x,
        Math.min(minimo, maximo),
        Math.max(minimo, maximo)
    );

    camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        alvoX,
        Math.min(1, delta * 5)
    );
}

// ========================================
// 15. LOOP PRINCIPAL
// ========================================

const clock = new THREE.Clock();

let acumulador = 0;
let tempoTotal = 0;

function atualizar() {

    const delta = Math.min(
        clock.getDelta(),
        0.05
    );

    // Esperar pelo menu ou fim do jogo
    if (!jogoIniciado || gameManager.terminou) {
        renderer.render(cena, camera);
        return;
    }

    acumulador += delta;
    tempoTotal += delta;

    // Física do jogador e plataformas móveis
    while (acumulador >= PASSO_FISICA) {

        player.atualizarFisica();

        let transporteHorizontal = 0;

        for (const plataforma of plataformasMoveis) {

            const apoiado =
                plataforma.estaJogadorEmCima(
                    player.corpoFisico
                );

            plataforma.atualizarFisica(
                PASSO_FISICA
            );

            if (apoiado) {
                transporteHorizontal =
                    plataforma.velocidadeHorizontal;
            }
        }

        if (transporteHorizontal !== 0) {

            const velocidade =
                player.corpoFisico.linvel();

            player.corpoFisico.setLinvel(
                {
                    x: velocidade.x +
                        transporteHorizontal,
                    y: velocidade.y
                },
                true
            );
        }

        mundo.step();

        acumulador -= PASSO_FISICA;
    }

    // Sincronizar imagens
    for (const plataforma of plataformasMoveis) {
        plataforma.atualizarVisual();
    }

    player.atualizarVisual(delta);

    // Terminais
    atualizarMensagemTerminal();

    // Inimigos e disparos
    for (const inimigo of inimigos) {
        inimigo.atualizar(delta);
    }

    player.atualizarDisparo(
        delta,
        bulletManager
    );

    bulletManager.atualizar(
        delta,
        inimigos
    );

    // Checkpoints
    atualizarCheckpoints();

    // Sistema de vidas
    const vidasAntes = gameManager.vidas;

    gameManager.atualizar(delta);

    // Lasers
    if (!gameManager.terminou) {
        atualizarLasers(tempoTotal);
    }

    // Reaparecer se perdeu uma vida
    if (
        !gameManager.terminou &&
        gameManager.vidas < vidasAntes
    ) {
        reaparecerNoCheckpoint();
    }

    // Objetivos do nível
    if (!gameManager.terminou) {

        const posicao =
            player.corpoFisico.translation();

        atualizarEnergias(
            tempoTotal,
            posicao
        );

        verificarObjetivos();
        verificarPorta();
        atualizarCamera(delta);
    }

    renderer.render(cena, camera);
}

renderer.setAnimationLoop(atualizar);


// ========================================
// MENU INICIAL OU RECOMEÇAR NÍVEL
// ========================================

const parametros = new URLSearchParams(
    window.location.search
);

const reiniciarDiretamente =
    parametros.get('reiniciar') === '1';

if (reiniciarDiretamente) {

    // Limpar o parâmetro da barra de endereço
    window.history.replaceState(
        null,
        '',
        window.location.pathname
    );

    // Entrar diretamente no Nível 1
    jogoIniciado = true;

    clock.getDelta();

} else {

    // Mostrar o menu principal normalmente
    mostrarMenuInicial(() => {

        jogoIniciado = true;

        clock.getDelta();
    });
}
