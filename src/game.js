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

// Estado de controles y modo debug
const teclas = {};
let mostrarVectores = false;
let mensajeGolTimer = 0;
let ultimoSegundo = performance.now();

// Listeners de teclado (Input Handling)
window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;

    // Activar/Desactivar vectores matemáticos con tecla M
    if (e.code === "KeyM") {
        toggleModoDebug();
    }
    // Reiniciar partido con tecla R
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
    jugador1.reiniciar();
    jugador2.reiniciar();
    balon.reiniciar(0);
}

// Fase 1 del Game Loop: Procesar entradas y actualizar físicas
function actualizar() {
    // Control del reloj del partido (1 segundo real)
    const ahora = performance.now();
    if (ahora - ultimoSegundo >= 1000 && MATRIZ_MARCADOR[2] > 0 && mensajeGolTimer === 0) {
        MATRIZ_MARCADOR[2]--;
        ultimoSegundo = ahora;
        actualizarRelojUI();

        if (MATRIZ_MARCADOR[2] === 0) {
            MATRIZ_MARCADOR[3] = 1; // Partido terminado
            uiStatus.textContent = "FINALIZADO (Pulsa R)";
            uiStatus.style.color = "#facc15";
        }
    }

    if (MATRIZ_MARCADOR[3] === 1) return;

    // Pausa breve tras anotar un gol
    if (mensajeGolTimer > 0) {
        mensajeGolTimer--;
        if (mensajeGolTimer === 0) {
            jugador1.reiniciar();
            jugador2.reiniciar();
        }
        return;
    }

    // --- MOVIMIENTO JUGADOR 1 (W, A, D, Espacio) ---
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

    // --- MOVIMIENTO JUGADOR 2 (Flechas, Enter) ---
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

    // Actualizar física de ambos jugadores
    actualizarJugador(jugador1);
    actualizarJugador(jugador2);

    // Actualizar física del balón
    actualizarBalon();

    // Detectar colisiones (Cabezas y Botines)
    resolverColisionJugadorBalon(jugador1);
    resolverColisionJugadorBalon(jugador2);

    // Actualizar telemetría en pantalla
    actualizarTelemetriaUI();
}

function actualizarJugador(j) {
    // Gravedad cuadrática
    j.vy += FISICA.GRAVEDAD;
    j.x += j.vx;
    j.y += j.vy;

    // Colisión con el suelo
    if (j.y + j.radioCabeza >= FISICA.SUELO_Y) {
        j.y = FISICA.SUELO_Y - j.radioCabeza;
        j.vy = 0;
        j.enSuelo = true;
    }

    // Límites laterales de la cancha
    if (j.x - j.radioCabeza < 20) j.x = 20 + j.radioCabeza;
    if (j.x + j.radioCabeza > canvas.width - 20) j.x = canvas.width - 20 - j.radioCabeza;

    // Temporizador de animación de patada
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

    // Rebote en travesaños de los arcos (usando MATRIZ_ARCOS)
    const yTravesano = MATRIZ_ARCOS[0][2];
    const xArcoIzq = MATRIZ_ARCOS[0][1];
    const xArcoDer = MATRIZ_ARCOS[1][0];

    // Travesaño izquierdo
    if (balon.x - balon.radio < xArcoIzq && Math.abs(balon.y - yTravesano) < balon.radio + 6) {
        balon.vy = -Math.abs(balon.vy) * 0.8;
        balon.vx = Math.abs(balon.vx) * 0.8 + 2;
    }
    // Travesaño derecho
    if (balon.x + balon.radio > xArcoDer && Math.abs(balon.y - yTravesano) < balon.radio + 6) {
        balon.vy = -Math.abs(balon.vy) * 0.8;
        balon.vx = -Math.abs(balon.vx) * 0.8 - 2;
    }

    // Detección de GOL en Arco Izquierdo (Punto para J2)
    if (balon.x - balon.radio <= xArcoIzq - 15 && balon.y > yTravesano) {
        anotarGol(2);
        return;
    }

    // Detección de GOL en Arco Derecho (Punto para J1)
    if (balon.x + balon.radio >= xArcoDer + 15 && balon.y > yTravesano) {
        anotarGol(1);
        return;
    }

    // Rebote en paredes laterales sobre los arcos
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
    // 1. Colisión con la cabeza (Cabezazo)
    const distCabeza = MathEngine.distanciaEuclidiana(j.x, j.y, balon.x, balon.y);
    const sumaRadios = j.radioCabeza + balon.radio;

    if (distCabeza <= sumaRadios) {
        const angulo = MathEngine.calcularAnguloImpacto(j.x, j.y, balon.x, balon.y);
        balon.ultimoAnguloImpacto = angulo;

        // Separar entidades para evitar superposición
        const solapamiento = sumaRadios - distCabeza + 1;
        balon.x += Math.cos(angulo) * solapamiento;
        balon.y += Math.sin(angulo) * solapamiento;

        // Aplicar impulso trigonométrico
        const fuerzaCabezazo = 10.5 + Math.abs(j.vx) * 0.6;
        const vector = MathEngine.descomponerVector(fuerzaCabezazo, angulo);
        balon.vx = vector.vx;
        balon.vy = vector.vy - 2.5; // Ligera elevación natural
    }

    // 2. Colisión con el botín al patear (Remate potente)
    if (j.pateando) {
        const pieX = j.x + j.mirada * 28;
        const pieY = j.y + 22;
        const distPie = MathEngine.distanciaEuclidiana(pieX, pieY, balon.x, balon.y);

        if (distPie <= 24 + balon.radio) {
            // Ángulo de remate elevado (32 grados hacia el arco rival)
            const anguloRemate = j.mirada === 1 ? -0.55 : Math.PI + 0.55;
            balon.ultimoAnguloImpacto = anguloRemate;

            const vectorRemate = MathEngine.descomponerVector(16.5, anguloRemate);
            balon.vx = vectorRemate.vx;
            balon.vy = vectorRemate.vy;
            j.pateando = false;
        }
    }
}

function anotarGol(jugadorQueAnoto) {
    if (jugadorQueAnoto === 1) {
        MATRIZ_MARCADOR[0]++;
        uiScore1.textContent = MATRIZ_MARCADOR[0];
        balon.reiniciar(1);
    } else {
        MATRIZ_MARCADOR[1]++;
        uiScore2.textContent = MATRIZ_MARCADOR[1];
        balon.reiniciar(-1);
    }
    mensajeGolTimer = 75; // Pausa de 1.25 segundos celebrando el gol
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
    // 1. Cielo / Fondo de estadio
    const gradCielo = ctx.createLinearGradient(0, 0, 0, FISICA.SUELO_Y);
    gradCielo.addColorStop(0, "#0c4a6e");
    gradCielo.addColorStop(1, "#0369a1");
    ctx.fillStyle = gradCielo;
    ctx.fillRect(0, 0, canvas.width, FISICA.SUELO_Y);

    // Líneas decorativas de estadio y círculo central
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

    // Línea blanca del suelo
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, FISICA.SUELO_Y, canvas.width, 4);

    // 3. Dibujar Arcos (usando MATRIZ_ARCOS)
    dibujarArco(MATRIZ_ARCOS[0], true);
    dibujarArco(MATRIZ_ARCOS[1], false);

    // 4. Dibujar Jugadores
    dibujarJugador(jugador1);
    dibujarJugador(jugador2);

    // 5. Dibujar Balón
    dibujarBalon();

    // 6. Dibujar Vectores Matemáticos si Modo Debug (Tecla M) está activo
    if (mostrarVectores) {
        dibujarVectoresDebug();
    }

    // 7. Cartel de ¡GOL!
    if (mensajeGolTimer > 0) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#facc15";
        ctx.font = "bold 72px 'Segoe UI', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("¡GOOOOL!", canvas.width / 2, canvas.height / 2);
    }
}

function dibujarArco(datosArco, esIzquierdo) {
    const [xIni, xFin, yTrav, ySuelo] = datosArco;
    const ancho = xFin - xIni;
    const alto = ySuelo - yTrav;

    // Red semitransparente
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.fillRect(xIni, yTrav, ancho, alto);

    // Malla de la red
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

    // Postes blancos gruesos
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
    // Botín / Pie
    ctx.save();
    const pieX = j.pateando ? j.x + j.mirada * 32 : j.x + j.mirada * 10;
    const pieY = j.pateando ? j.y + 18 : j.y + 28;
    ctx.fillStyle = "#111827";
    ctx.beginPath();
    ctx.ellipse(pieX, pieY, 16, 9, j.pateando ? -0.4 * j.mirada : 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Cabeza grande (estilo Head Soccer)
    ctx.fillStyle = "#fed7aa";
    ctx.beginPath();
    ctx.arc(j.x, j.y, j.radioCabeza, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#1e293b";
    ctx.stroke();

    // Cinta / Camiseta inferior
    ctx.fillStyle = j.colorCamiseta;
    ctx.beginPath();
    ctx.arc(j.x, j.y, j.radioCabeza, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.fill();

    // Ojo mirando hacia el rival
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

    // Esfera blanca
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 0, balon.radio, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0f172a";
    ctx.stroke();

    // Pentágono central para apreciar la rotación
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
    // 1. Líneas de Distancia Euclidiana hacia el balón
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

    // 2. Vector resultante de velocidad del balón (vx, vy)
    const escala = 8;
    const finX = balon.x + balon.vx * escala;
    const finY = balon.y + balon.vy * escala;

    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(balon.x, balon.y);
    ctx.lineTo(finX, finY);
    ctx.stroke();

    // 3. Componentes rectangulares vx (verde) y vy (rojo)
    ctx.strokeStyle = "#4ade80"; // vx
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(balon.x, balon.y);
    ctx.lineTo(finX, balon.y);
    ctx.stroke();

    ctx.strokeStyle = "#f87171"; // vy
    ctx.beginPath();
    ctx.moveTo(finX, balon.y);
    ctx.lineTo(finX, finY);
    ctx.stroke();
}

// Bucle principal sincronizado a 60 FPS con requestAnimationFrame
function gameLoop() {
    actualizar();
    dibujar();
    requestAnimationFrame(gameLoop);
}

// Iniciar el juego
requestAnimationFrame(gameLoop);