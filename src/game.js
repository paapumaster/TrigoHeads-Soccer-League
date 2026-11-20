/**
 * Motor Principal y Game Loop a 60 FPS - TrigoHeads: Soccer League
 */

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Referencias al DOM para telemetría en tiempo real
const uiScore1 = document.getElementById("score1");
const uiScore2 = document.getElementById("score2");
const uiTimer = document.getElementById("timer");
const uiStatus = document.getElementById("gameStatus");
const uiBallPos = document.getElementById("ballPos");
const uiBallVel = document.getElementById("ballVel");
const uiImpactAngle = document.getElementById("impactAngle");
const uiEuclideanDist = document.getElementById("euclideanDist");
const btnDebug = document.getElementById("toggleDebugBtn");

// Estado de controles, modo debug y efectos visuales
const teclas = {};
let mostrarVectores = false;
let mensajeGolTimer = 0;
let ultimoGoleador = 1;
let cameraShake = 0;
let particulasConfeti = [];
let ultimoSegundo = performance.now();

// Listeners de teclado (Input Handling)
window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;
    AudioEngine.init(); // Activa el audio con la primera tecla

    if (e.code === "KeyM") {
        toggleModoDebug();
    }
    if (e.code === "KeyR") {
        reiniciarPartidoCompleto();
    }
});

window.addEventListener("keyup", (e) => {
    teclas[e.code] = false;
});

btnDebug.addEventListener("click", toggleModoDebug);

function toggleModoDebug() {
    mostrarVectores = !mostrarVectores;
    btnDebug.textContent = `Vectores en Cancha (Tecla M): ${mostrarVectores ? "ON" : "OFF"}`;
    btnDebug.classList.toggle("active", mostrarVectores);
}

function reiniciarPartidoCompleto() {
    MATRIZ_MARCADOR[0] = 0;
    MATRIZ_MARCADOR[1] = 0;
    MATRIZ_MARCADOR[2] = 90;
    MATRIZ_MARCADOR[3] = 0;
    uiScore1.textContent = "0";
    uiScore2.textContent = "0";
    uiStatus.textContent = "EN JUEGO";
    uiStatus.style.color = "#4ade80";
    particulasConfeti = [];
    jugador1.reiniciar();
    jugador2.reiniciar();
    balon.reiniciar(0);
    AudioEngine.sonarSilbato(false);
}

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
        p.vy += 0.25; // Gravedad parabólica
        p.vx *= 0.98;
        p.x += p.vx;
        p.y += p.vy;
        p.vida--;
        if (p.vida <= 0) {
            particulasConfeti.splice(i, 1);
        }
    }
}

// Fase 1 del Game Loop: Procesar entradas y actualizar físicas
function actualizar() {
    actualizarConfeti();
    if (cameraShake > 0) cameraShake--;

    // Control del reloj del partido
    const ahora = performance.now();
    if (ahora - ultimoSegundo >= 1000 && MATRIZ_MARCADOR[2] > 0 && mensajeGolTimer === 0) {
        MATRIZ_MARCADOR[2]--;
        ultimoSegundo = ahora;
        actualizarRelojUI();

        if (MATRIZ_MARCADOR[2] === 0) {
            MATRIZ_MARCADOR[3] = 1;
            uiStatus.textContent = "FINALIZADO (Pulsa R)";
            uiStatus.style.color = "#facc15";
            AudioEngine.sonarSilbato(true);
        }
    }

    if (MATRIZ_MARCADOR[3] === 1) return;

    // Pausa celebrando el gol
    if (mensajeGolTimer > 0) {
        mensajeGolTimer--;
        if (mensajeGolTimer === 0) {
            jugador1.reiniciar();
            jugador2.reiniciar();
            AudioEngine.sonarSilbato(false);
        }
        return;
    }

    // --- MOVIMIENTO JUGADOR 1 ---
    if (teclas["KeyA"]) {
        jugador1.vx = -jugador1.velocidadMovimiento;
    } else if (teclas["KeyD"]) {
        jugador1.vx = jugador1.velocidadMovimiento;
    } else {
        jugador1.vx = MathEngine.aplicarFriccion(jugador1.vx, FISICA.FRICCION_SUELO);
    }

    if (teclas["KeyW"] && jugador1.enSuelo) {
        jugador1.vy = jugador1.fuerzaSalto;
        jugador1.enSuelo = false;
    }

    if (teclas["Space"] && !jugador1.pateando) {
        jugador1.pateando = true;
        jugador1.tiempoPatada = 12;
    }

    // --- MOVIMIENTO JUGADOR 2 ---
    if (teclas["ArrowLeft"]) {
        jugador2.vx = -jugador2.velocidadMovimiento;
    } else if (teclas["ArrowRight"]) {
        jugador2.vx = jugador2.velocidadMovimiento;
    } else {
        jugador2.vx = MathEngine.aplicarFriccion(jugador2.vx, FISICA.FRICCION_SUELO);
    }

    if (teclas["ArrowUp"] && jugador2.enSuelo) {
        jugador2.vy = jugador2.fuerzaSalto;
        jugador2.enSuelo = false;
    }

    if ((teclas["Enter"] || teclas["NumpadEnter"]) && !jugador2.pateando) {
        jugador2.pateando = true;
        jugador2.tiempoPatada = 12;
    }

    actualizarJugador(jugador1);
    actualizarJugador(jugador2);
    actualizarBalon();

    resolverColisionJugadorBalon(jugador1);
    resolverColisionJugadorBalon(jugador2);

    actualizarTelemetriaUI();
}

function actualizarJugador(j) {
    j.vy += FISICA.GRAVEDAD;
    j.x += j.vx;
    j.y += j.vy;

    if (j.y + j.radioCabeza >= FISICA.SUELO_Y) {
        j.y = FISICA.SUELO_Y - j.radioCabeza;
        j.vy = 0;
        j.enSuelo = true;
    }

    if (j.x - j.radioCabeza < 20) j.x = 20 + j.radioCabeza;
    if (j.x + j.radioCabeza > canvas.width - 20) j.x = canvas.width - 20 - j.radioCabeza;

    if (j.pateando) {
        j.tiempoPatada--;
        if (j.tiempoPatada <= 0) j.pateando = false;
    }
}

function actualizarBalon() {
    balon.vy += FISICA.GRAVEDAD * 0.85;
    balon.vx = MathEngine.aplicarFriccion(balon.vx, FISICA.FRICCION_AIRE);

    balon.x += balon.vx;
    balon.y += balon.vy;
    balon.anguloGiro += balon.vx * 0.04;

    // Rebote en el césped
    if (balon.y + balon.radio >= FISICA.SUELO_Y) {
        balon.y = FISICA.SUELO_Y - balon.radio;
        balon.vy = -balon.vy * FISICA.REBOTE_BALON;
        balon.vx = MathEngine.aplicarFriccion(balon.vx, 0.92);
    }

    // Rebote en el techo
    if (balon.y - balon.radio <= 0) {
        balon.y = balon.radio;
        balon.vy = -balon.vy * 0.7;
    }

    const yTravesano = MATRIZ_ARCOS[0][2];
    const xArcoIzq = MATRIZ_ARCOS[0][1];
    const xArcoDer = MATRIZ_ARCOS[1][0];

    // Travesaño izquierdo
    if (balon.x - balon.radio < xArcoIzq && Math.abs(balon.y - yTravesano) < balon.radio + 6) {
        balon.vy = -Math.abs(balon.vy) * 0.8;
        balon.vx = Math.abs(balon.vx) * 0.8 + 2;
        AudioEngine.sonarPoste();
    }
    // Travesaño derecho
    if (balon.x + balon.radio > xArcoDer && Math.abs(balon.y - yTravesano) < balon.radio + 6) {
        balon.vy = -Math.abs(balon.vy) * 0.8;
        balon.vx = -Math.abs(balon.vx) * 0.8 - 2;
        AudioEngine.sonarPoste();
    }

    // Detección de GOL en Arco Izquierdo (Punto para J2)
    if (balon.x - balon.radio <= xArcoIzq - 15 && balon.y > yTravesano) {
        anotarGol(2, balon.x, balon.y);
        return;
    }

    // Detección de GOL en Arco Derecho (Punto para J1)
    if (balon.x + balon.radio >= xArcoDer + 15 && balon.y > yTravesano) {
        anotarGol(1, balon.x, balon.y);
        return;
    }

    // Paredes laterales sobre los arcos
    if (balon.x - balon.radio <= 0 && balon.y <= yTravesano) {
        balon.x = balon.radio;
        balon.vx = -balon.vx * 0.8;
    }
    if (balon.x + balon.radio >= canvas.width && balon.y <= yTravesano) {
        balon.x = canvas.width - balon.radio;
        balon.vx = -balon.vx * 0.8;
    }
}

function resolverColisionJugadorBalon(j) {
    // 1. Cabezazo
    const distCabeza = MathEngine.distanciaEuclidiana(j.x, j.y, balon.x, balon.y);
    const sumaRadios = j.radioCabeza + balon.radio;

    if (distCabeza <= sumaRadios) {
        const angulo = MathEngine.calcularAnguloImpacto(j.x, j.y, balon.x, balon.y);
        balon.ultimoAnguloImpacto = angulo;

        const solapamiento = sumaRadios - distCabeza + 1;
        balon.x += Math.cos(angulo) * solapamiento;
        balon.y += Math.sin(angulo) * solapamiento;

        const fuerzaCabezazo = 10.5 + Math.abs(j.vx) * 0.6;
        const vector = MathEngine.descomponerVector(fuerzaCabezazo, angulo);
        balon.vx = vector.vx;
        balon.vy = vector.vy - 2.5;
        AudioEngine.sonarGolpe(false);
    }

    // 2. Patada
    if (j.pateando) {
        const pieX = j.x + j.mirada * 28;
        const pieY = j.y + 22;
        const distPie = MathEngine.distanciaEuclidiana(pieX, pieY, balon.x, balon.y);

        if (distPie <= 24 + balon.radio) {
            const anguloRemate = j.mirada === 1 ? -0.55 : Math.PI + 0.55;
            balon.ultimoAnguloImpacto = anguloRemate;

            const vectorRemate = MathEngine.descomponerVector(16.5, anguloRemate);
            balon.vx = vectorRemate.vx;
            balon.vy = vectorRemate.vy;
            j.pateando = false;
            AudioEngine.sonarGolpe(true);
        }
    }
}

function anotarGol(jugadorQueAnoto, xGol, yGol) {
    ultimoGoleador = jugadorQueAnoto;
    cameraShake = 20; // Temblor de cámara durante 20 fotogramas

    if (jugadorQueAnoto === 1) {
        MATRIZ_MARCADOR[0]++;
        uiScore1.textContent = MATRIZ_MARCADOR[0];
        generarExplosionConfeti(xGol, yGol, "#2563eb");
        balon.reiniciar(1);
    } else {
        MATRIZ_MARCADOR[1]++;
        uiScore2.textContent = MATRIZ_MARCADOR[1];
        generarExplosionConfeti(xGol, yGol, "#dc2626");
        balon.reiniciar(-1);
    }

    AudioEngine.celebrarGol(jugadorQueAnoto);
    mensajeGolTimer = 95; // Pausa de ~1.5 segundos celebrando el gol
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

// Fase 2 del Game Loop: Renderizado en HTML5 Canvas
function dibujar() {
    ctx.save();

    // Aplicar temblor de cámara (Screen Shake) al hacer gol
    if (cameraShake > 0) {
        const dx = (Math.random() - 0.5) * 14;
        const dy = (Math.random() - 0.5) * 14;
        ctx.translate(dx, dy);
    }

    // 1. Cielo / Fondo de estadio
    const gradCielo = ctx.createLinearGradient(0, 0, 0, FISICA.SUELO_Y);
    gradCielo.addColorStop(0, "#0c4a6e");
    gradCielo.addColorStop(1, "#0369a1");
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

    // 2. Césped
    ctx.fillStyle = "#15803d";
    ctx.fillRect(0, FISICA.SUELO_Y, canvas.width, canvas.height - FISICA.SUELO_Y);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, FISICA.SUELO_Y, canvas.width, 4);

    // 3. Arcos
    dibujarArco(MATRIZ_ARCOS[0], true);
    dibujarArco(MATRIZ_ARCOS[1], false);

    // 4. Jugadores
    dibujarJugador(jugador1);
    dibujarJugador(jugador2);

    // 5. Balón
    dibujarBalon();

    // 6. Confeti de celebración
    for (const p of particulasConfeti) {
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.tamano, p.tamano);
    }

    // 7. Vectores Matemáticos (Tecla M)
    if (mostrarVectores) {
        dibujarVectoresDebug();
    }

    // 8. Animación de cartel de ¡GOL! con efecto rebote
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
        ctx.strokeText("¡GOOOOOL!", 0, 0);

        ctx.fillStyle = ultimoGoleador === 1 ? "#38bdf8" : "#f87171";
        ctx.fillText("¡GOOOOOL!", 0, 0);

        ctx.font = "bold 24px 'Segoe UI', sans-serif";
        ctx.fillStyle = "#facc15";
        ctx.fillText(
            ultimoGoleador === 1 ? "ANOTA J1 (CHILE)" : "ANOTA J2 (RIVAL)",
            0,
            42
        );
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

    const ojoX = j.x + j.mirada * 14;
    const ojoY = j.y - 6;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ojoX, ojoY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(ojoX + j.mirada * 2.5, ojoY, 3.5, 0, Math.PI * 2);
    ctx.fill();
}

function dibujarBalon() {
    ctx.save();
    ctx.translate(balon.x, balon.y);
    ctx.rotate(balon.anguloGiro);

    ctx.fillStyle = "#ffffff";
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

requestAnimationFrame(gameLoop);