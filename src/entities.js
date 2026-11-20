/**
 * Módulo de Entidades y Matrices de Estado - TrigoHeads: Soccer League
 * Optimización de memoria mediante objetos persistentes y matrices bidimensionales.
 */

// Matriz bidimensional [fila][columna] que define los límites geométricos de los arcos
// Columnas: [x_inicio, x_fin, y_travesaño, y_suelo]
const MATRIZ_ARCOS = [
    [0, 65, 310, 440],     // Fila 0: Arco Izquierdo (Defiende J1)
    [835, 900, 310, 440]   // Fila 1: Arco Derecho (Defiende J2)
];

// Matriz de estado del partido: [golesJ1, golesJ2, tiempoRestanteSeg, estadoPausa]
const MATRIZ_MARCADOR = [0, 0, 90, 0];

// Constantes físicas del entorno
const FISICA = {
    GRAVEDAD: 0.55,          // Aceleración cuadrática hacia el suelo (g)
    SUELO_Y: 440,            // Altura del césped en píxeles
    FRICCION_SUELO: 0.85,    // Coeficiente lineal de roce en césped
    FRICCION_AIRE: 0.992,    // Resistencia aerodinámica del balón
    REBOTE_BALON: 0.78       // Coeficiente de restitución elástica
};

// Entidad Balón (Objeto persistente)
const balon = {
    x: 450,
    y: 200,
    vx: 0,
    vy: 0,
    radio: 16,
    anguloGiro: 0,
    ultimoAnguloImpacto: 0,

    reiniciar(direccionSaque = 0) {
        this.x = 450;
        this.y = 180;
        this.vx = direccionSaque * 4;
        this.vy = -2;
        this.anguloGiro = 0;
    }
};

// Función constructora de Jugadores (Hitbox circular + botín articulado)
function crearJugador(id, xInicial, colorCamiseta, colorPantalon, direccionMirada) {
    return {
        id: id,
        xInicial: xInicial,
        x: xInicial,
        y: FISICA.SUELO_Y - 32,
        vx: 0,
        vy: 0,
        radioCabeza: 32,
        velocidadMovimiento: 5.2,
        fuerzaSalto: -12.5,
        enSuelo: true,
        colorCamiseta: colorCamiseta,
        colorPantalon: colorPantalon,
        mirada: direccionMirada, // 1 = derecha, -1 = izquierda
        pateando: false,
        tiempoPatada: 0,

        reiniciar() {
            this.x = this.xInicial;
            this.y = FISICA.SUELO_Y - this.radioCabeza;
            this.vx = 0;
            this.vy = 0;
            this.enSuelo = true;
            this.pateando = false;
            this.tiempoPatada = 0;
        }
    };
}

const jugador1 = crearJugador(1, 180, "#2563eb", "#ffffff", 1);
const jugador2 = crearJugador(2, 720, "#dc2626", "#1e293b", -1);