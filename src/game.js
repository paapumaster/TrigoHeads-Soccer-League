/**
 * Motor Principal y Game Loop a 60 FPS - TrigoHeads: Soccer League
 * Física calibrada: Conducción suave, transferencia de momento realista y tope de velocidad.
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
let cooldownSonidoGolpe = 0;

const VEL_MAXIMA_BALON = 17.5;

// Listeners de teclado (Input Handling)
window.addEventListener("keydown", (e) => {
    teclas[e.code] = true;
    AudioEngine.init();

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
        p.vy += 0.25;
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
    if (cooldownSonidoGolpe > 0) cooldownSonidoGolpe--;

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

    // Actualizar posiciones por gravedad y velocidad
    actualizarJugador(jugador1);
    actualizarJugador(jugador2);
    actualizarBalon();

    // Resolver colisiones sólidas de forma natural
    resolverColisionEntreJugadores(jugador1, jugador2);
    resolverColisionJugadorBalon(jugador1);
    resolverColisionJugadorBalon(jugador2);

    // Asegurar límites estrictos en la cancha y tope de velocidad
    limitarEntidadesEnCancha();

    // Verificar goles y postes
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
}

function actualizarBalon() {
    balon.vy += FISICA.GRAVEDAD * 0.82;
    balon.vx = MathEngine.aplicarFriccion(balon.vx, FISICA.FRICCION_AIRE);

    balon.x += balon.vx;
    balon.y += balon.vy;
    balon.anguloGiro += balon.vx * 0.04;
}

// Colisión física sólida entre Jugador 1 y Jugador 2
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

// Colisión calibrada Jugador - Balón (sin efecto resorte loco)
function resolverColisionJugadorBalon(j) {
    // 1. Contacto con el cuerpo / cabeza (Conducción y cabezazo proporcional)
    const distCabeza = MathEngine.distanciaEuclidiana(j.x, j.y, balon.x, balon.y);
    const sumaRadios = j.radioCabeza + balon.radio;

    if (distCabeza <= sumaRadios) {
        const angulo = MathEngine.calcularAnguloImpacto(j.x, j.y, balon.x, balon.y);
        balon.ultimoAnguloImpacto = angulo;

        // Separar exactamente hasta el borde sin empujón artificial
        const solapamiento = sumaRadios - distCabeza + 0.5;
        balon.x += Math.cos(angulo) * solapamiento;
        balon.y += Math.sin(angulo) * solapamiento;

        // Calcular velocidad relativa del choque
        const relVx = balon.vx - j.vx;
        const relVy = balon.vy - j.vy;
        const normalX = Math.cos(angulo);
        const normalY = Math.sin(angulo);

        // Producto punto para saber con qué fuerza se acercaban
        const velocidadImpacto = relVx * normalX + relVy * normalY;

        // Solo aplicar rebote si realmente iban chocando entre sí
        if (velocidadImpacto < 0) {
            // Si el jugador está saltando (en el aire), el cabezazo tiene más fuerza
            const elasticidad = j.enSuelo ? 0.55 : 0.85;
            const impulso = -(1 + elasticidad) * velocidadImpacto;

            balon.vx += impulso * normalX + j.vx * 0.45;
            balon.vy += impulso * normalY + j.vy * 0.35;

            // Si el balón estaba rodando en el suelo y el jugador lo empuja caminando
            if (j.enSuelo && balon.y + balon.radio >= FISICA.SUELO_Y - 4) {
                balon.vx = j.vx * 1.25;
                balon.vy = Math.min(balon.vy, -1.8); // Pequeño bote controlable para driblar
            }

            if (Math.abs(velocidadImpacto) > 2.5 && cooldownSonidoGolpe === 0) {
                AudioEngine.sonarGolpe(false);
                cooldownSonidoGolpe = 8;
            }
        }
    }

    // 2. Remate intencional con el botín (Tecla Espacio o Enter)
    if (j.pateando) {
        const pieX = j.x + j.mirada * 28;
        const pieY = j.y + 20;
        const distPie = MathEngine.distanciaEuclidiana(pieX, pieY, balon.x, balon.y);

        if (distPie <= 25 + balon.radio) {
            // Ángulo controlado de 28 grados hacia el arco rival
            const anguloRemate = j.mirada === 1 ? -0.48 : Math.PI + 0.48;
            balon.ultimoAnguloImpacto = anguloRemate;

            const vectorRemate = MathEngine.descomponerVector(15.5, anguloRemate);
            balon.vx = vectorRemate.vx;
            balon.vy = vectorRemate.vy;
            j.pateando = false;
            AudioEngine.sonarGolpe(true);
        }
    }
}

// Límites estrictos y tope de velocidad
function limitarEntidadesEnCancha() {
    // Tope de velocidad máxima para que el balón nunca se descontrole
    const rapidezActual = Math.hypot(balon.vx, balon.vy);
    if (rapidezActual > VEL_MAXIMA_BALON) {
        const factor = VEL_MAXIMA_BALON / rapidezActual;
        balon.vx *= factor;
        balon.vy *= factor;
    }

    // Jugadores dentro de la cancha
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

    // Suelo estricto para el balón
    if (balon.y + balon.radio >= FISICA.SUELO_Y) {
        balon.y = FISICA.SUELO_Y - balon.radio;
        if (balon.vy > 0) {
            balon.vy = -balon.vy * 0.72; // Rebote realista en césped
            if (Math.abs(balon.vy) < 1.1) balon.vy = 0;
        }
        balon.vx = MathEngine.aplicarFriccion(balon.vx, 0.94);
    }

    // Techo para el balón
    if (balon.y - balon.radio <= 0) {
        balon.y = balon.radio;
        if (balon.vy < 0) balon.vy = -balon.vy * 0.65;
    }
}

function verificarEventosCancha() {
    const yTravesano = MATRIZ_ARCOS[0][2];
    const xArcoIzq = MATRIZ_ARCOS[0][1];
    const xArcoDer = MATRIZ_ARCOS[1][0];

    // Travesaño izquierdo
    if (balon.x - balon.radio < xArcoIzq && Math.abs(balon.y - yTravesano) < balon.radio + 6) {
        balon.vy = -Math.abs(balon.vy) * 0.75;
        balon.vx = Math.abs(balon.vx) * 0.75 + 1.5;
        AudioEngine.sonarPoste();
    }
    // Travesaño derecho
    if (balon.x + balon.radio > xArcoDer && Math.abs(balon.y - yTravesano) < balon.radio + 6) {
        balon.vy = -Math.abs(balon.vy) * 0.75;
        balon.vx = -Math.abs(balon.vx) * 0.75 - 1.5;
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
        balon.vx = -balon.vx * 0.75;
    }
    if (balon.x + balon.radio >= canvas.width && balon.y <= yTravesano) {
        balon.x = canvas.width - balon.radio;
        balon.vx = -balon.vx * 0.75;
    }
}

function anotarGol(jugadorQueAnoto, xGol, yGol) {
    ultimoGoleador = jugadorQueAnoto;
    cameraShake = 20;

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
    mensajeGolTimer = 95;
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

    // 8. Cartel de ¡GOL!
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