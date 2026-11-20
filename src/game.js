/**
 * Motor Principal y Game Loop a 60 FPS - TrigoHeads: Soccer League
 * Marcador visible solo durante el partido/pausa y oculto en menús/estadísticas.
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Referencias UI Marcador y Energía
const uiScoreboard = document.querySelector(".scoreboard");
const uiScore1 = document.getElementById("score1");
const uiScore2 = document.getElementById("score2");
const uiBadge1 = document.getElementById("badge1");
const uiBadge2 = document.getElementById("badge2");
const uiPowerBar1 = document.getElementById("powerBar1");
const uiPowerBar2 = document.getElementById("powerBar2");
const uiPowerLabel1 = document.getElementById("powerLabel1");
const uiPowerLabel2 = document.getElementById("powerLabel2");
const uiTimer = document.getElementById("timer");
const uiStatus = document.getElementById("gameStatus");
const uiFormulaTag = document.getElementById("activeFormulaTag");

// Referencias UI Telemetría
const uiBallPos = document.getElementById("ballPos");
const uiBallVel = document.getElementById("ballVel");
const uiImpactAngle = document.getElementById("impactAngle");
const uiEuclideanDist = document.getElementById("euclideanDist");
const btnDebug = document.getElementById("toggleDebugBtn");

// Referencias Pausa y Estadísticas
const pauseMatchBtn = document.getElementById("pauseMatchBtn");
const pauseModal = document.getElementById("pauseModal");
const btnResumeMatch = document.getElementById("btnResumeMatch");
const btnQuitToStats = document.getElementById("btnQuitToStats");

const screenStats = document.getElementById("screenStats");
const statTeam1Label = document.getElementById("statTeam1Label");
const statTeam2Label = document.getElementById("statTeam2Label");
const statFinalScore = document.getElementById("statFinalScore");
const statTouches1 = document.getElementById("statTouches1");
const statTouches2 = document.getElementById("statTouches2");
const statShots1 = document.getElementById("statShots1");
const statShots2 = document.getElementById("statShots2");
const statPowers1 = document.getElementById("statPowers1");
const statPowers2 = document.getElementById("statPowers2");
const statMaxSpeed = document.getElementById("statMaxSpeed");
const statTimePlayed = document.getElementById("statTimePlayed");
const statsBackToMenuBtn = document.getElementById("statsBackToMenuBtn");
const statsNextMatchBtn = document.getElementById("statsNextMatchBtn");

// Referencias Menú Arcade
const setupOverlay = document.getElementById("setupOverlay");
const screenStart = document.getElementById("screenStart");
const screenTeams = document.getElementById("screenTeams");
const screenPitch = document.getElementById("screenPitch");

const btnStartCPU = document.getElementById("btnStartCPU");
const btnStart2P = document.getElementById("btnStart2P");
const btnQuickMatch = document.getElementById("btnQuickMatch");
const openMenuBtn = document.getElementById("openMenuBtn");

const prevTeam1 = document.getElementById("prevTeam1");
const nextTeam1 = document.getElementById("nextTeam1");
const prevTeam2 = document.getElementById("prevTeam2");
const nextTeam2 = document.getElementById("nextTeam2");
const flag1 = document.getElementById("flag1");
const flag2 = document.getElementById("flag2");
const nameTeam1 = document.getElementById("nameTeam1");
const nameTeam2 = document.getElementById("nameTeam2");
const jerseyPreview1 = document.getElementById("jerseyPreview1");
const jerseyPreview2 = document.getElementById("jerseyPreview2");
const powerTag1 = document.getElementById("powerTag1");
const powerTag2 = document.getElementById("powerTag2");

const backToStartBtn = document.getElementById("backToStartBtn");
const goToPitchBtn = document.getElementById("goToPitchBtn");
const backToTeamsBtn = document.getElementById("backToTeamsBtn");
const launchGameBtn = document.getElementById("launchGameBtn");

const prevPitch = document.getElementById("prevPitch");
const nextPitch = document.getElementById("nextPitch");
const pitchPreviewBox = document.getElementById("pitchPreviewBox");
const pitchLabel = document.getElementById("pitchLabel");
const ballClassicBtn = document.getElementById("ballClassicBtn");
const ballNeonBtn = document.getElementById("ballNeonBtn");

const chkWind = document.getElementById("chkWind");
const chkTrail = document.getElementById("chkTrail");
const chkAudio = document.getElementById("chkAudio");
const chkTurbo = document.getElementById("chkTurbo");

const LISTA_EQUIPOS = Object.keys(CATALOGO_EQUIPOS);
const ESTADIOS = [
    { nombre: "Estadio Clásico", clase: "estadio-clasico", cieloTop: "#0c4a6e", cieloBot: "#0369a1", cesped: "#15803d" },
    { nombre: "Estadio Nocturno", clase: "estadio-nocturno", cieloTop: "#090d16", cieloBot: "#1e1b4b", cesped: "#14532d" },
    { nombre: "Estadio Atardecer", clase: "estadio-atardecer", cieloTop: "#7c2d12", cieloBot: "#c2410c", cesped: "#15803d" }
];

// Estado del Juego
const teclas = {};
let modoCPU = true;
let idxEquipo1 = 0;
let idxEquipo2 = 1;
let idxEstadio = 0;
let estiloBalon = "clasico";
let vientoActivo = false;
let estelaActiva = true;
let audioActivo = true;
let modoTurbo = false;

let mostrarVectores = false;
let mensajeGolTimer = 0;
let ultimoGoleador = 1;
let cameraShake = 0;
let particulasConfeti = [];
let ultimoSegundo = performance.now();
let cooldownSonidoGolpe = 0;

const statsPartido = {
    toques1: 0,
    toques2: 0,
    remates1: 0,
    remates2: 0,
    superTiros1: 0,
    superTiros2: 0,
    velocidadMaxima: 0,
    segundosJugados: 0
};

const VEL_MAXIMA_BALON = 17.5;

function actualizarVisibilidadMarcador() {
    const enPartido = MATRIZ_MARCADOR[3] === 0 || MATRIZ_MARCADOR[3] === 3;
    uiScoreboard.classList.toggle("hidden", !enPartido);
}

// --- NAVEGACIÓN ENTRE PANTALLAS ---
function mostrarPantalla(pantallaElemento) {
    [screenStart, screenTeams, screenPitch, screenStats].forEach((s) => s.classList.remove("active"));
    pantallaElemento.classList.add("active");
}

function abrirModalPausa() {
    if (MATRIZ_MARCADOR[3] === 0 && mensajeGolTimer === 0) {
        MATRIZ_MARCADOR[3] = 3;
        pauseModal.classList.remove("hidden");
        uiStatus.textContent = "PAUSADO";
        uiStatus.style.color = "#facc15";
        actualizarVisibilidadMarcador();
    }
}

function continuarPartido() {
    if (MATRIZ_MARCADOR[3] === 3) {
        pauseModal.classList.add("hidden");
        MATRIZ_MARCADOR[3] = 0;
        ultimoSegundo = performance.now();
        uiStatus.textContent = MATRIZ_MARCADOR[4] === 1 ? "⚡ ¡GOL DE ORO! ⚡" : "EN JUEGO";
        uiStatus.style.color = MATRIZ_MARCADOR[4] === 1 ? "#facc15" : "#4ade80";
        actualizarVisibilidadMarcador();
    }
}

function salirYMostrarEstadisticas() {
    pauseModal.classList.add("hidden");
    MATRIZ_MARCADOR[3] = 1;
    actualizarVisibilidadMarcador();
    if (audioActivo) AudioEngine.sonarSilbato(true);

    const eq1 = CATALOGO_EQUIPOS[jugador1.equipoKey];
    const eq2 = CATALOGO_EQUIPOS[jugador2.equipoKey];

    statTeam1Label.textContent = `${eq1.bandera} ${eq1.nombre}`;
    statTeam2Label.textContent = `${eq2.bandera} ${eq2.nombre}`;
    statFinalScore.textContent = `${MATRIZ_MARCADOR[0]} : ${MATRIZ_MARCADOR[1]}`;

    statTouches1.textContent = statsPartido.toques1;
    statTouches2.textContent = statsPartido.toques2;
    statShots1.textContent = statsPartido.remates1;
    statShots2.textContent = statsPartido.remates2;
    statPowers1.textContent = statsPartido.superTiros1;
    statPowers2.textContent = statsPartido.superTiros2;
    statMaxSpeed.textContent = `${statsPartido.velocidadMaxima.toFixed(1)} px/f`;

    const min = Math.floor(statsPartido.segundosJugados / 60);
    const seg = statsPartido.segundosJugados % 60;
    statTimePlayed.textContent = `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;

    uiStatus.textContent = "ESTADÍSTICAS";
    uiStatus.style.color = "#38bdf8";

    setupOverlay.classList.remove("hidden");
    mostrarPantalla(screenStats);
}

pauseMatchBtn.addEventListener("click", () => {
    if (MATRIZ_MARCADOR[3] === 3) continuarPartido();
    else abrirModalPausa();
});

btnResumeMatch.addEventListener("click", continuarPartido);
btnQuitToStats.addEventListener("click", salirYMostrarEstadisticas);

statsBackToMenuBtn.addEventListener("click", () => {
    MATRIZ_MARCADOR[3] = 2;
    actualizarVisibilidadMarcador();
    uiStatus.textContent = "MENÚ";
    uiStatus.style.color = "#38bdf8";
    mostrarPantalla(screenStart);
});

statsNextMatchBtn.addEventListener("click", () => {
    setupOverlay.classList.add("hidden");
    reiniciarPartidoCompleto();
});

function sincronizarVistaEquipos() {
    const eq1 = CATALOGO_EQUIPOS[LISTA_EQUIPOS[idxEquipo1]];
    const eq2 = CATALOGO_EQUIPOS[LISTA_EQUIPOS[idxEquipo2]];

    flag1.textContent = eq1.bandera;
    nameTeam1.textContent = eq1.nombre;
    jerseyPreview1.style.background = `linear-gradient(180deg, ${eq1.colorPrimario} 50%, ${eq1.colorSecundario} 50%)`;
    powerTag1.textContent = eq1.tipoPoder === "senoidal" ? "Onda Senoidal" : "Tiro Bala";

    flag2.textContent = eq2.bandera;
    nameTeam2.textContent = eq2.nombre;
    jerseyPreview2.style.background = `linear-gradient(180deg, ${eq2.colorPrimario} 50%, ${eq2.colorSecundario} 50%)`;
    powerTag2.textContent = eq2.tipoPoder === "senoidal" ? "Onda Senoidal" : "Tiro Bala";
}

function sincronizarVistaEstadio() {
    const est = ESTADIOS[idxEstadio];
    pitchLabel.textContent = est.nombre;
    pitchPreviewBox.className = `pitch-box ${est.clase}`;
}

btnStartCPU.addEventListener("click", () => {
    modoCPU = true;
    sincronizarVistaEquipos();
    mostrarPantalla(screenTeams);
});

btnStart2P.addEventListener("click", () => {
    modoCPU = false;
    sincronizarVistaEquipos();
    mostrarPantalla(screenTeams);
});

btnQuickMatch.addEventListener("click", () => {
    modoCPU = true;
    aplicarConfiguracionYArrancar();
});

openMenuBtn.addEventListener("click", () => {
    pauseModal.classList.add("hidden");
    MATRIZ_MARCADOR[3] = 2;
    actualizarVisibilidadMarcador();
    setupOverlay.classList.remove("hidden");
    mostrarPantalla(screenStart);
    uiStatus.textContent = "MENÚ";
    uiStatus.style.color = "#38bdf8";
});

prevTeam1.addEventListener("click", () => {
    idxEquipo1 = (idxEquipo1 - 1 + LISTA_EQUIPOS.length) % LISTA_EQUIPOS.length;
    sincronizarVistaEquipos();
});

nextTeam1.addEventListener("click", () => {
    idxEquipo1 = (idxEquipo1 + 1) % LISTA_EQUIPOS.length;
    sincronizarVistaEquipos();
});

prevTeam2.addEventListener("click", () => {
    idxEquipo2 = (idxEquipo2 - 1 + LISTA_EQUIPOS.length) % LISTA_EQUIPOS.length;
    sincronizarVistaEquipos();
});

nextTeam2.addEventListener("click", () => {
    idxEquipo2 = (idxEquipo2 + 1) % LISTA_EQUIPOS.length;
    sincronizarVistaEquipos();
});

backToStartBtn.addEventListener("click", () => mostrarPantalla(screenStart));
goToPitchBtn.addEventListener("click", () => {
    sincronizarVistaEstadio();
    mostrarPantalla(screenPitch);
});
backToTeamsBtn.addEventListener("click", () => mostrarPantalla(screenTeams));

prevPitch.addEventListener("click", () => {
    idxEstadio = (idxEstadio - 1 + ESTADIOS.length) % ESTADIOS.length;
    sincronizarVistaEstadio();
});

nextPitch.addEventListener("click", () => {
    idxEstadio = (idxEstadio + 1) % ESTADIOS.length;
    sincronizarVistaEstadio();
});

ballClassicBtn.addEventListener("click", () => {
    estiloBalon = "clasico";
    ballClassicBtn.classList.add("selected");
    ballNeonBtn.classList.remove("selected");
});

ballNeonBtn.addEventListener("click", () => {
    estiloBalon = "neon";
    ballNeonBtn.classList.add("selected");
    ballClassicBtn.classList.remove("selected");
});

launchGameBtn.addEventListener("click", aplicarConfiguracionYArrancar);

function aplicarConfiguracionYArrancar() {
    vientoActivo = chkWind.checked;
    estelaActiva = chkTrail.checked;
    audioActivo = chkAudio.checked;
    modoTurbo = chkTurbo.checked;

    if (audioActivo) AudioEngine.init();

    const key1 = LISTA_EQUIPOS[idxEquipo1];
    const key2 = LISTA_EQUIPOS[idxEquipo2];
    const eq1 = CATALOGO_EQUIPOS[key1];
    const eq2 = CATALOGO_EQUIPOS[key2];

    jugador1.aplicarEquipo(key1);
    jugador2.aplicarEquipo(key2);

    jugador1.velocidadMovimiento = modoTurbo ? 6.6 : 5.2;
    jugador2.velocidadMovimiento = modoTurbo ? 6.6 : 5.2;

    uiBadge1.textContent = `${eq1.bandera} ${eq1.nombre} (J1)`;
    uiBadge1.style.backgroundColor = eq1.colorPrimario;
    uiBadge1.style.color = eq1.colorTextoBadge;

    uiBadge2.textContent = `${eq2.bandera} ${eq2.nombre} (${modoCPU ? "CPU" : "J2"})`;
    uiBadge2.style.backgroundColor = eq2.colorPrimario;
    uiBadge2.style.color = eq2.colorTextoBadge;

    pauseModal.classList.add("hidden");
    setupOverlay.classList.add("hidden");
    reiniciarPartidoCompleto();
}

// --- LISTENERS DE TECLADO ---
window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;
    if (audioActivo && MATRIZ_MARCADOR[3] === 0) AudioEngine.init();

    if (e.code === "KeyM") toggleModoDebug();
    if (e.code === "KeyP" || e.code === "Escape") {
        if (MATRIZ_MARCADOR[3] === 0) abrirModalPausa();
        else if (MATRIZ_MARCADOR[3] === 3) continuarPartido();
    }
    if (e.code === "KeyR" && (MATRIZ_MARCADOR[3] === 0 || MATRIZ_MARCADOR[3] === 3)) {
        pauseModal.classList.add("hidden");
        reiniciarPartidoCompleto();
    }
});

window.addEventListener("keyup", (e) => {
    teclas[e.code] = false;
});

btnDebug.addEventListener("click", toggleModoDebug);

function toggleModoDebug() {
    mostrarVectores = !mostrarVectores;
    btnDebug.textContent = `Vectores (Tecla M): ${mostrarVectores ? "ON" : "OFF"}`;
    btnDebug.classList.toggle("active", mostrarVectores);
}

function reiniciarPartidoCompleto() {
    MATRIZ_MARCADOR[0] = 0;
    MATRIZ_MARCADOR[1] = 0;
    MATRIZ_MARCADOR[2] = 90;
    MATRIZ_MARCADOR[3] = 0;
    MATRIZ_MARCADOR[4] = 0;

    statsPartido.toques1 = 0;
    statsPartido.toques2 = 0;
    statsPartido.remates1 = 0;
    statsPartido.remates2 = 0;
    statsPartido.superTiros1 = 0;
    statsPartido.superTiros2 = 0;
    statsPartido.velocidadMaxima = 0;
    statsPartido.segundosJugados = 0;

    uiScore1.textContent = "0";
    uiScore2.textContent = "0";
    uiStatus.textContent = "EN JUEGO";
    uiStatus.style.color = "#4ade80";
    particulasConfeti = [];
    jugador1.energia = 0;
    jugador2.energia = 0;
    jugador1.reiniciar();
    jugador2.reiniciar();
    balon.reiniciar(0);
    ultimoSegundo = performance.now();
    actualizarRelojUI();
    actualizarBarrasEnergiaUI();
    actualizarVisibilidadMarcador();
    if (audioActivo) AudioEngine.sonarSilbato(false);
}

// --- CONFETI ---
function generarExplosionConfeti(xOrigen, yOrigen, colorPrincipal) {
    const colores = [colorPrincipal, "#facc15", "#ffffff", "#38bdf8", "#4ade80"];
    for (let i = 0; i < 65; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const velocidad = 3 + Math.random() * 9;
        particulasConfeti.push({
            x: xOrigen,
            y: yOrigen,
            vx: Math.cos(angulo) * velocidad,
            vy: Math.sin(angulo) * velocidad - 4,
            tamano: 4 + Math.random() * 5,
            color: colores[Math.floor(Math.random() * colores.length)],
            vida: 85 + Math.random() * 30
        });
    }
}

function actualizarConfeti() {
    for (let i = particulasConfeti.length - 1; i >= 0; i--) {
        const p = particulasConfeti[i];
        p.vy += 0.25;
        p.vx *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        p.vida--;
        if (p.vida <= 0) particulasConfeti.splice(i, 1);
    }
}

// --- IA CPU ---
function procesarIA_CPU() {
    const distBalon = MathEngine.distanciaEuclidiana(jugador2.x, jugador2.y, balon.x, balon.y);
    const objetivoX = balon.x > 380 ? balon.x + 18 : 680;

    if (jugador2.x < objetivoX - 10) {
        jugador2.vx = jugador2.velocidadMovimiento * 0.92;
    } else if (jugador2.x > objetivoX + 10) {
        jugador2.vx = -jugador2.velocidadMovimiento * 0.92;
    } else {
        jugador2.vx = MathEngine.aplicarFriccion(jugador2.vx, FISICA.FRICCION_SUELO);
    }

    if (balon.y < jugador2.y - 35 && Math.abs(balon.x - jugador2.x) < 95 && jugador2.enSuelo) {
        jugador2.vy = jugador2.fuerzaSalto;
        jugador2.enSuelo = false;
    }

    if (distBalon < 72 && balon.x <= jugador2.x) {
        if (jugador2.energia >= 100) {
            intentarActivarSuperTiro(jugador2);
        } else if (!jugador2.pateando) {
            jugador2.pateando = true;
            jugador2.tiempoPatada = 12;
            jugador2.expresion = "enojado";
            jugador2.timerExpresion = 20;
        }
    }
}

// --- SUPER TIROS ---
function intentarActivarSuperTiro(j) {
    if (j.energia < 100) return false;

    const dist = MathEngine.distanciaEuclidiana(j.x, j.y, balon.x, balon.y);
    if (dist <= 95) {
        j.energia = 0;
        j.pateando = true;
        j.tiempoPatada = 16;
        j.expresion = "enojado";
        j.timerExpresion = 35;

        if (j.id === 1) statsPartido.superTiros1++;
        else statsPartido.superTiros2++;

        balon.superTiroActivo = j.tipoPoder;
        balon.superTiroOrigenX = balon.x;
        balon.superTiroBaseY = Math.min(balon.y, FISICA.SUELO_Y - 75);
        balon.superTiroDueno = j.id;

        if (j.tipoPoder === "senoidal") {
            balon.vx = j.mirada * 11.5;
            balon.vy = 0;
        } else {
            balon.vx = j.mirada * 21;
            balon.vy = 0;
        }

        cameraShake = 12;
        if (audioActivo) AudioEngine.sonarSuperTiro();
        actualizarBarrasEnergiaUI();
        return true;
    }
    return false;
}

// --- BUCLE PRINCIPAL: ACTUALIZAR ---
function actualizar() {
    actualizarConfeti();
    if (cameraShake > 0) cameraShake--;
    if (cooldownSonidoGolpe > 0) cooldownSonidoGolpe--;

    if (MATRIZ_MARCADOR[3] !== 0) return;

    const ahora = performance.now();
    if (ahora - ultimoSegundo >= 1000 && mensajeGolTimer === 0) {
        ultimoSegundo = ahora;
        statsPartido.segundosJugados++;

        if (MATRIZ_MARCADOR[2] > 0) {
            MATRIZ_MARCADOR[2]--;
            actualizarRelojUI();

            if (MATRIZ_MARCADOR[2] === 0) {
                if (MATRIZ_MARCADOR[0] === MATRIZ_MARCADOR[1]) {
                    MATRIZ_MARCADOR[4] = 1;
                    uiTimer.textContent = "EXTRA";
                    uiStatus.textContent = "⚡ ¡GOL DE ORO! ⚡";
                    uiStatus.style.color = "#facc15";
                    if (audioActivo) AudioEngine.sonarSilbato(false);
                } else {
                    salirYMostrarEstadisticas();
                    return;
                }
            }
        }
    }

    if (mensajeGolTimer > 0) {
        mensajeGolTimer--;
        if (mensajeGolTimer === 0) {
            if (MATRIZ_MARCADOR[4] === 1) {
                salirYMostrarEstadisticas();
                return;
            } else {
                jugador1.reiniciar();
                jugador2.reiniciar();
                if (audioActivo) AudioEngine.sonarSilbato(false);
            }
        }
        return;
    }

    // Jugador 1
    if (teclas["KeyA"]) jugador1.vx = -jugador1.velocidadMovimiento;
    else if (teclas["KeyD"]) jugador1.vx = jugador1.velocidadMovimiento;
    else jugador1.vx = MathEngine.aplicarFriccion(jugador1.vx, FISICA.FRICCION_SUELO);

    if (teclas["KeyW"] && jugador1.enSuelo) {
        jugador1.vy = jugador1.fuerzaSalto;
        jugador1.enSuelo = false;
    }

    if (teclas["KeyS"]) intentarActivarSuperTiro(jugador1);

    if (teclas["Space"] && !jugador1.pateando) {
        jugador1.pateando = true;
        jugador1.tiempoPatada = 12;
        jugador1.expresion = "enojado";
        jugador1.timerExpresion = 18;
    }

    // Jugador 2 / CPU
    if (modoCPU) {
        procesarIA_CPU();
    } else {
        if (teclas["ArrowLeft"]) jugador2.vx = -jugador2.velocidadMovimiento;
        else if (teclas["ArrowRight"]) jugador2.vx = jugador2.velocidadMovimiento;
        else jugador2.vx = MathEngine.aplicarFriccion(jugador2.vx, FISICA.FRICCION_SUELO);

        if (teclas["ArrowUp"] && jugador2.enSuelo) {
            jugador2.vy = jugador2.fuerzaSalto;
            jugador2.enSuelo = false;
        }

        if (teclas["ArrowDown"]) intentarActivarSuperTiro(jugador2);

        if ((teclas["Enter"] || teclas["NumpadEnter"]) && !jugador2.pateando) {
            jugador2.pateando = true;
            jugador2.tiempoPatada = 12;
            jugador2.expresion = "enojado";
            jugador2.timerExpresion = 18;
        }
    }

    actualizarJugador(jugador1);
    actualizarJugador(jugador2);
    actualizarBalon();

    resolverColisionEntreJugadores(jugador1, jugador2);
    resolverColisionJugadorBalon(jugador1);
    resolverColisionJugadorBalon(jugador2);

    limitarEntidadesEnCancha();

    const rapidezActual = Math.hypot(balon.vx, balon.vy);
    if (rapidezActual > statsPartido.velocidadMaxima) {
        statsPartido.velocidadMaxima = rapidezActual;
    }

    verificarEventosCancha();
    actualizarTelemetriaUI();
}

function actualizarJugador(j) {
    j.vy += FISICA.GRAVEDAD;
    j.x += j.vx;
    j.y += j.vy;

    if (j.pateando) {
        j.tiempoPatada--;
        if (j.tiempoPatada <= 0) j.pateando = false;
    }

    if (j.timerExpresion > 0) {
        j.timerExpresion--;
        if (j.timerExpresion <= 0) j.expresion = "normal";
    }
}

function actualizarBalon() {
    balon.historialPosiciones.push({ x: balon.x, y: balon.y });
    if (balon.historialPosiciones.length > 10) {
        balon.historialPosiciones.shift();
    }

    if (balon.superTiroActivo === "senoidal") {
        balon.x += balon.vx;
        const dx = Math.abs(balon.x - balon.superTiroOrigenX);
        balon.y = MathEngine.calcularOndaSenoidal(balon.superTiroBaseY, 55, 0.035, dx);
        balon.anguloGiro += balon.vx * 0.08;
        uiFormulaTag.textContent = "ACTIVO: y(x) = y₀ + 55·sin(0.035x)";
    } else if (balon.superTiroActivo === "bala") {
        balon.x += balon.vx;
        balon.vy = 0;
        balon.anguloGiro += balon.vx * 0.1;
        uiFormulaTag.textContent = "ACTIVO: Rectilíneo Uniforme (g = 0)";
    } else {
        balon.vy += FISICA.GRAVEDAD * 0.82;
        if (vientoActivo) {
            balon.vx += Math.sin(performance.now() * 0.002) * 0.08;
        }
        balon.vx = MathEngine.aplicarFriccion(balon.vx, FISICA.FRICCION_AIRE);
        balon.x += balon.vx;
        balon.y += balon.vy;
        balon.anguloGiro += balon.vx * 0.04;
        uiFormulaTag.textContent = vientoActivo
            ? "Física + Viento: vx(t) = vx + F_viento"
            : "Física Estándar: y(t) = y₀ + vᵧt - ½gt²";
    }
}

function resolverColisionEntreJugadores(j1, j2) {
    const dist = MathEngine.distanciaEuclidiana(j1.x, j1.y, j2.x, j2.y);
    const minDist = j1.radioCabeza + j2.radioCabeza;

    if (dist < minDist) {
        const angulo = dist === 0 ? 0 : MathEngine.calcularAnguloImpacto(j1.x, j1.y, j2.x, j2.y);
        const solapamiento = (minDist - dist) / 2;

        const sepX = Math.cos(angulo) * solapamiento;
        const sepY = Math.sin(angulo) * solapamiento;

        j1.x -= sepX;
        j1.y -= sepY;
        j2.x += sepX;
        j2.y += sepY;

        const tempVx = j1.vx;
        j1.vx = j2.vx * 0.5;
        j2.vx = tempVx * 0.5;

        if (j1.y < j2.y - 20 && j1.vy > 0) {
            j1.vy = -5.5;
            j1.enSuelo = false;
        } else if (j2.y < j1.y - 20 && j2.vy > 0) {
            j2.vy = -5.5;
            j2.enSuelo = false;
        }
    }
}

function resolverColisionJugadorBalon(j) {
    const distCabeza = MathEngine.distanciaEuclidiana(j.x, j.y, balon.x, balon.y);
    const sumaRadios = j.radioCabeza + balon.radio;

    if (distCabeza <= sumaRadios) {
        if (balon.superTiroActivo && balon.superTiroDueno !== j.id) {
            balon.superTiroActivo = null;
        }

        const angulo = MathEngine.calcularAnguloImpacto(j.x, j.y, balon.x, balon.y);
        balon.ultimoAnguloImpacto = angulo;

        const solapamiento = sumaRadios - distCabeza + 0.5;
        balon.x += Math.cos(angulo) * solapamiento;
        balon.y += Math.sin(angulo) * solapamiento;

        const relVx = balon.vx - j.vx;
        const relVy = balon.vy - j.vy;
        const normalX = Math.cos(angulo);
        const normalY = Math.sin(angulo);
        const velocidadImpacto = relVx * normalX + relVy * normalY;

        if (velocidadImpacto < 0) {
            const elasticidad = j.enSuelo ? 0.55 : 0.85;
            const impulso = -(1 + elasticidad) * velocidadImpacto;

            balon.vx += impulso * normalX + j.vx * 0.45;
            balon.vy += impulso * normalY + j.vy * 0.35;

            if (j.enSuelo && balon.y + balon.radio >= FISICA.SUELO_Y - 4) {
                balon.vx = j.vx * 1.25;
                balon.vy = Math.min(balon.vy, -1.8);
            }

            if (j.id === 1) statsPartido.toques1++;
            else statsPartido.toques2++;

            j.cargarEnergia(8);
            actualizarBarrasEnergiaUI();

            if (audioActivo && Math.abs(velocidadImpacto) > 2.5 && cooldownSonidoGolpe === 0) {
                AudioEngine.sonarGolpe(false);
                cooldownSonidoGolpe = 8;
            }
        }
    }

    if (j.pateando) {
        const pieX = j.x + j.mirada * 28;
        const pieY = j.y + 20;
        const distPie = MathEngine.distanciaEuclidiana(pieX, pieY, balon.x, balon.y);

        if (distPie <= 25 + balon.radio) {
            balon.superTiroActivo = null;
            const anguloRemate = j.mirada === 1 ? -0.48 : Math.PI + 0.48;
            balon.ultimoAnguloImpacto = anguloRemate;

            const vectorRemate = MathEngine.descomponerVector(15.5, anguloRemate);
            balon.vx = vectorRemate.vx;
            balon.vy = vectorRemate.vy;
            j.pateando = false;

            if (j.id === 1) statsPartido.remates1++;
            else statsPartido.remates2++;

            j.cargarEnergia(15);
            actualizarBarrasEnergiaUI();
            if (audioActivo) AudioEngine.sonarGolpe(true);
        }
    }
}

function limitarEntidadesEnCancha() {
    if (balon.superTiroActivo !== "bala") {
        const rapidezActual = Math.hypot(balon.vx, balon.vy);
        if (rapidezActual > VEL_MAXIMA_BALON) {
            const factor = VEL_MAXIMA_BALON / rapidezActual;
            balon.vx *= factor;
            balon.vy *= factor;
        }
    }

    [jugador1, jugador2].forEach((j) => {
        if (j.y + j.radioCabeza >= FISICA.SUELO_Y) {
            j.y = FISICA.SUELO_Y - j.radioCabeza;
            j.vy = 0;
            j.enSuelo = true;
        }
        if (j.y - j.radioCabeza < 0) {
            j.y = j.radioCabeza;
            j.vy = 0;
        }
        if (j.x - j.radioCabeza < 20) {
            j.x = 20 + j.radioCabeza;
            j.vx = 0;
        }
        if (j.x + j.radioCabeza > canvas.width - 20) {
            j.x = canvas.width - 20 - j.radioCabeza;
            j.vx = 0;
        }
    });

    if (balon.y + balon.radio >= FISICA.SUELO_Y) {
        balon.y = FISICA.SUELO_Y - balon.radio;
        balon.superTiroActivo = null;
        if (balon.vy > 0) {
            balon.vy = -balon.vy * 0.72;
            if (Math.abs(balon.vy) < 1.1) balon.vy = 0;
        }
        balon.vx = MathEngine.aplicarFriccion(balon.vx, 0.94);
    }

    if (balon.y - balon.radio <= 0) {
        balon.y = balon.radio;
        balon.superTiroActivo = null;
        if (balon.vy < 0) balon.vy = -balon.vy * 0.65;
    }
}

function verificarEventosCancha() {
    const yTravesano = MATRIZ_ARCOS[0][2];
    const xArcoIzq = MATRIZ_ARCOS[0][1];
    const xArcoDer = MATRIZ_ARCOS[1][0];

    if (balon.x - balon.radio < xArcoIzq && Math.abs(balon.y - yTravesano) < balon.radio + 6) {
        balon.superTiroActivo = null;
        balon.vy = -Math.abs(balon.vy) * 0.75;
        balon.vx = Math.abs(balon.vx) * 0.75 + 1.5;
        if (audioActivo) AudioEngine.sonarPoste();
    }
    if (balon.x + balon.radio > xArcoDer && Math.abs(balon.y - yTravesano) < balon.radio + 6) {
        balon.superTiroActivo = null;
        balon.vy = -Math.abs(balon.vy) * 0.75;
        balon.vx = -Math.abs(balon.vx) * 0.75 - 1.5;
        if (audioActivo) AudioEngine.sonarPoste();
    }

    if (balon.x - balon.radio <= xArcoIzq - 15 && balon.y > yTravesano) {
        anotarGol(2, balon.x, balon.y);
        return;
    }

    if (balon.x + balon.radio >= xArcoDer + 15 && balon.y > yTravesano) {
        anotarGol(1, balon.x, balon.y);
        return;
    }

    if (balon.x - balon.radio <= 0 && balon.y <= yTravesano) {
        balon.x = balon.radio;
        balon.superTiroActivo = null;
        balon.vx = -balon.vx * 0.75;
    }
    if (balon.x + balon.radio >= canvas.width && balon.y <= yTravesano) {
        balon.x = canvas.width - balon.radio;
        balon.superTiroActivo = null;
        balon.vx = -balon.vx * 0.75;
    }
}

function anotarGol(jugadorQueAnoto, xGol, yGol) {
    ultimoGoleador = jugadorQueAnoto;
    cameraShake = 22;

    if (jugadorQueAnoto === 1) {
        MATRIZ_MARCADOR[0]++;
        uiScore1.textContent = MATRIZ_MARCADOR[0];
        generarExplosionConfeti(xGol, yGol, jugador1.colorCamiseta);
        jugador2.cargarEnergia(35);
        jugador2.expresion = "sorpresa";
        jugador2.timerExpresion = 95;
        if (audioActivo) AudioEngine.celebrarGol(jugador1.nombreEquipo);
        balon.reiniciar(1);
    } else {
        MATRIZ_MARCADOR[1]++;
        uiScore2.textContent = MATRIZ_MARCADOR[1];
        generarExplosionConfeti(xGol, yGol, jugador2.colorCamiseta);
        jugador1.cargarEnergia(35);
        jugador1.expresion = "sorpresa";
        jugador1.timerExpresion = 95;
        if (audioActivo) AudioEngine.celebrarGol(jugador2.nombreEquipo);
        balon.reiniciar(-1);
    }

    actualizarBarrasEnergiaUI();
    mensajeGolTimer = 95;
}

function actualizarBarrasEnergiaUI() {
    uiPowerBar1.style.width = `${jugador1.energia}%`;
    uiPowerBar2.style.width = `${jugador2.energia}%`;

    if (jugador1.energia >= 100) {
        uiPowerBar1.classList.add("ready");
        uiPowerLabel1.textContent = "🔥 ¡SUPER TIRO LISTO (Tecla S)!";
        uiPowerLabel1.style.color = "#facc15";
    } else {
        uiPowerBar1.classList.remove("ready");
        uiPowerLabel1.textContent = `ENERGÍA: ${jugador1.energia}%`;
        uiPowerLabel1.style.color = "#94a3b8";
    }

    if (jugador2.energia >= 100) {
        uiPowerBar2.classList.add("ready");
        uiPowerLabel2.textContent = modoCPU ? "🔥 ¡CPU SUPER TIRO LISTO!" : "🔥 ¡SUPER TIRO LISTO (Flecha ↓)!";
        uiPowerLabel2.style.color = "#facc15";
    } else {
        uiPowerBar2.classList.remove("ready");
        uiPowerLabel2.textContent = `ENERGÍA: ${jugador2.energia}%`;
        uiPowerLabel2.style.color = "#94a3b8";
    }
}

function actualizarRelojUI() {
    const min = Math.floor(MATRIZ_MARCADOR[2] / 60);
    const seg = MATRIZ_MARCADOR[2] % 60;
    uiTimer.textContent = `${String(min).padStart(2, "0")}:${String(seg).padStart(2, "0")}`;
}

function actualizarTelemetriaUI() {
    uiBallPos.textContent = `(${Math.round(balon.x)}, ${Math.round(balon.y)})`;
    uiBallVel.textContent = `(${balon.vx.toFixed(1)}, ${balon.vy.toFixed(1)})`;
    uiImpactAngle.textContent = `${MathEngine.radianesAGrados(balon.ultimoAnguloImpacto)}°`;

    const d1 = Math.round(MathEngine.distanciaEuclidiana(jugador1.x, jugador1.y, balon.x, balon.y));
    const d2 = Math.round(MathEngine.distanciaEuclidiana(jugador2.x, jugador2.y, balon.x, balon.y));
    uiEuclideanDist.textContent = `${d1} px / ${d2} px`;
}

// --- BUCLE PRINCIPAL: DIBUJAR ---
function dibujar() {
    ctx.save();

    if (cameraShake > 0) {
        const dx = (Math.random() - 0.5) * 14;
        const dy = (Math.random() - 0.5) * 14;
        ctx.translate(dx, dy);
    }

    const est = ESTADIOS[idxEstadio];

    const gradCielo = ctx.createLinearGradient(0, 0, 0, FISICA.SUELO_Y);
    gradCielo.addColorStop(0, est.cieloTop);
    gradCielo.addColorStop(1, est.cieloBot);
    ctx.fillStyle = gradCielo;
    ctx.fillRect(0, 0, canvas.width, FISICA.SUELO_Y);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 0);
    ctx.lineTo(canvas.width / 2, FISICA.SUELO_Y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(canvas.width / 2, FISICA.SUELO_Y - 80, 70, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = est.cesped;
    ctx.fillRect(0, FISICA.SUELO_Y, canvas.width, canvas.height - FISICA.SUELO_Y);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, FISICA.SUELO_Y, canvas.width, 4);

    dibujarArco(MATRIZ_ARCOS[0], true);
    dibujarArco(MATRIZ_ARCOS[1], false);

    dibujarJugador(jugador1);
    dibujarJugador(jugador2);

    if (estelaActiva) dibujarEstelaBalon();
    dibujarBalon();

    for (const p of particulasConfeti) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.tamano, p.tamano);
    }

    if (mostrarVectores) dibujarVectoresDebug();

    if (mensajeGolTimer > 0) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const escalaPulso = 1 + Math.sin(mensajeGolTimer * 0.25) * 0.12;
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2 - 15);
        ctx.scale(escalaPulso, escalaPulso);

        ctx.font = "900 76px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.lineWidth = 8;
        ctx.strokeStyle = "#0f172a";
        ctx.strokeText(MATRIZ_MARCADOR[4] === 1 ? "¡GOL DE ORO!" : "¡GOOOOOL!", 0, 0);

        ctx.fillStyle = ultimoGoleador === 1 ? jugador1.colorCamiseta : jugador2.colorCamiseta;
        ctx.fillText(MATRIZ_MARCADOR[4] === 1 ? "¡GOL DE ORO!" : "¡GOOOOOL!", 0, 0);

        ctx.font = "bold 24px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#facc15";
        const nombreAnotador = ultimoGoleador === 1 ? jugador1.nombreEquipo : jugador2.nombreEquipo;
        ctx.fillText(`ANOTA ${nombreAnotador}`, 0, 42);
        ctx.restore();
    }

    ctx.restore();
}

function dibujarArco(datosArco, esIzquierdo) {
    const [xIni, xFin, yTrav, ySuelo] = datosArco;
    const ancho = xFin - xIni;
    const alto = ySuelo - yTrav;

    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(xIni, yTrav, ancho, alto);

    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.lineWidth = 1;
    for (let x = xIni; x <= xFin; x += 12) {
        ctx.beginPath();
        ctx.moveTo(x, yTrav);
        ctx.lineTo(x, ySuelo);
        ctx.stroke();
    }
    for (let y = yTrav; y <= ySuelo; y += 12) {
        ctx.beginPath();
        ctx.moveTo(xIni, y);
        ctx.lineTo(xFin, y);
        ctx.stroke();
    }

    ctx.strokeStyle = "#f8fafc";
    ctx.lineWidth = 6;
    ctx.beginPath();
    if (esIzquierdo) {
        ctx.moveTo(xIni, yTrav);
        ctx.lineTo(xFin, yTrav);
        ctx.lineTo(xFin, ySuelo);
    } else {
        ctx.moveTo(xFin, yTrav);
        ctx.lineTo(xIni, yTrav);
        ctx.lineTo(xIni, ySuelo);
    }
    ctx.stroke();
}

function dibujarJugador(j) {
    if (j.energia >= 100) {
        ctx.save();
        ctx.strokeStyle = "rgba(250, 204, 21, 0.75)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(j.x, j.y, j.radioCabeza + 6 + Math.sin(performance.now() * 0.01) * 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    ctx.save();
    const pieX = j.pateando ? j.x + j.mirada * 32 : j.x + j.mirada * 10;
    const pieY = j.pateando ? j.y + 18 : j.y + 28;
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.ellipse(pieX, pieY, 16, 9, j.pateando ? -0.4 * j.mirada : 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.arc(j.x, j.y, j.radioCabeza, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1e293b";
    ctx.stroke();

    ctx.fillStyle = j.colorCamiseta;
    ctx.beginPath();
    ctx.arc(j.x, j.y, j.radioCabeza, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.fill();

    ctx.fillStyle = j.colorDetalle;
    ctx.beginPath();
    ctx.arc(j.x, j.y, j.radioCabeza, 0.35 * Math.PI, 0.65 * Math.PI);
    ctx.fill();

    const ojoX = j.x + j.mirada * 14;
    const ojoY = j.y - 6;
    const anguloMiradaBalon = Math.atan2(balon.y - ojoY, balon.x - ojoX);

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ojoX, ojoY, j.expresion === "sorpresa" ? 8.5 : 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(
        ojoX + Math.cos(anguloMiradaBalon) * 3,
        ojoY + Math.sin(anguloMiradaBalon) * 3,
        j.expresion === "sorpresa" ? 2.5 : 3.5,
        0,
        Math.PI * 2
    );
    ctx.fill();

    if (j.expresion === "enojado") {
        ctx.strokeStyle = "#0f172a";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(ojoX - 6, ojoY - 10);
        ctx.lineTo(ojoX + 6, ojoY - 6);
        ctx.stroke();
    }
}

function dibujarEstelaBalon() {
    const rapidez = Math.hypot(balon.vx, balon.vy);
    if (rapidez < 9 && !balon.superTiroActivo) return;

    for (let i = 0; i < balon.historialPosiciones.length; i++) {
        const pos = balon.historialPosiciones[i];
        const ratio = (i + 1) / balon.historialPosiciones.length;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, balon.radio * ratio * 0.85, 0, Math.PI * 2);

        if (balon.superTiroActivo === "senoidal") {
            ctx.fillStyle = `rgba(56, 189, 248, ${ratio * 0.45})`;
        } else if (balon.superTiroActivo === "bala") {
            ctx.fillStyle = `rgba(239, 68, 68, ${ratio * 0.55})`;
        } else {
            ctx.fillStyle = `rgba(250, 204, 21, ${ratio * 0.3})`;
        }
        ctx.fill();
    }
}

function dibujarBalon() {
    ctx.save();
    ctx.translate(balon.x, balon.y);
    ctx.rotate(balon.anguloGiro);

    if (balon.superTiroActivo) {
        ctx.shadowColor = balon.superTiroActivo === "senoidal" ? "#38bdf8" : "#ef4444";
        ctx.shadowBlur = 18;
    }

    if (estiloBalon === "neon") {
        ctx.fillStyle = balon.superTiroActivo === "bala" ? "#fef08a" : "#38bdf8";
        ctx.beginPath();
        ctx.arc(0, 0, balon.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#facc15";
        ctx.stroke();
    } else {
        ctx.fillStyle = balon.superTiroActivo === "bala" ? "#fef08a" : "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, balon.radio, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#0f172a";
        ctx.stroke();

        ctx.fillStyle = "#1e293b";
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const ang = (i * 2 * Math.PI) / 5;
            const px = Math.cos(ang) * 7;
            const py = Math.sin(ang) * 7;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }

    ctx.restore();
}

function dibujarVectoresDebug() {
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(jugador1.x, jugador1.y);
    ctx.lineTo(balon.x, balon.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(jugador2.x, jugador2.y);
    ctx.lineTo(balon.x, balon.y);
    ctx.stroke();
    ctx.setLineDash([]);

    const escala = 8;
    const finX = balon.x + balon.vx * escala;
    const finY = balon.y + balon.vy * escala;

    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(balon.x, balon.y);
    ctx.lineTo(finX, finY);
    ctx.stroke();

    ctx.strokeStyle = "#4ade80";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(balon.x, balon.y);
    ctx.lineTo(finX, balon.y);
    ctx.stroke();

    ctx.strokeStyle = "#f87171";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(finX, balon.y);
    ctx.lineTo(finX, finY);
    ctx.stroke();
}

function gameLoop() {
    actualizar();
    dibujar();
    requestAnimationFrame(gameLoop);
}

actualizarVisibilidadMarcador();
requestAnimationFrame(gameLoop);