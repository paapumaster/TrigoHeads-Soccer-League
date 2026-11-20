/**
 * Módulo de Entidades, Selecciones y Matrices de Estado - TrigoHeads: Soccer League
 */

// Matriz bidimensional [fila][columna] que define los límites geométricos de los arcos
const MATRIZ_ARCOS = [
    [0, 65, 310, 440],     // Fila 0: Arco Izquierdo (Defiende J1)
    [835, 900, 310, 440]   // Fila 1: Arco Derecho (Defiende J2)
];

// Matriz de estado del partido: [golesJ1, golesJ2, tiempoRestanteSeg, estadoPartido, golDeOro]
// estadoPartido: 0 = en juego, 1 = finalizado, 2 = en menú selección
const MATRIZ_MARCADOR = [0, 0, 90, 2, 0];

// Catálogo de Selecciones Nacionales con su Poder Matemático asignado
const CATALOGO_EQUIPOS = {
    chile: {
        nombre: "CHILE",
        bandera: "🇨🇱",
        colorPrimario: "#dc2626",
        colorSecundario: "#2563eb",
        colorTextoBadge: "#ffffff",
        tipoPoder: "senoidal",
        nombrePoder: "Onda Senoidal: y = y₀ + 55·sin(0.035x)"
    },
    argentina: {
        nombre: "ARGENTINA",
        bandera: "🇦🇷",
        colorPrimario: "#38bdf8",
        colorSecundario: "#ffffff",
        colorTextoBadge: "#0f172a",
        tipoPoder: "senoidal",
        nombrePoder: "Onda Senoidal: y = y₀ + 55·sin(0.035x)"
    },
    brasil: {
        nombre: "BRASIL",
        bandera: "🇧🇷",
        colorPrimario: "#facc15",
        colorSecundario: "#16a34a",
        colorTextoBadge: "#0f172a",
        tipoPoder: "senoidal",
        nombrePoder: "Onda Senoidal: y = y₀ + 55·sin(0.035x)"
    },
    alemania: {
        nombre: "ALEMANIA",
        bandera: "🇩🇪",
        colorPrimario: "#f8fafc",
        colorSecundario: "#1e293b",
        colorTextoBadge: "#0f172a",
        tipoPoder: "bala",
        nombrePoder: "Tiro Bala Rectilíneo (g = 0, v = 22)"
    },
    japon: {
        nombre: "JAPÓN",
        bandera: "🇯🇵",
        colorPrimario: "#1d4ed8",
        colorSecundario: "#ef4444",
        colorTextoBadge: "#ffffff",
        tipoPoder: "bala",
        nombrePoder: "Tiro Bala Rectilíneo (g = 0, v = 22)"
    }
};

// Constantes físicas del entorno
const FISICA = {
    GRAVEDAD: 0.55,
    SUELO_Y: 440,
    FRICCION_SUELO: 0.85,
    FRICCION_AIRE: 0.992,
    REBOTE_BALON: 0.72
};

// Entidad Balón con soporte para Super Tiros y Estela (Trail)
const balon = {
    x: 450,
    y: 200,
    vx: 0,
    vy: 0,
    radio: 16,
    anguloGiro: 0,
    ultimoAnguloImpacto: 0,
    historialPosiciones: [], // Matriz/cola de últimas 10 posiciones [x, y] para la estela
    superTiroActivo: null,   // null | "senoidal" | "bala"
    superTiroOrigenX: 0,
    superTiroBaseY: 0,
    superTiroDueno: 0,

    reiniciar(direccionSaque = 0) {
        this.x = 450;
        this.y = 180;
        this.vx = direccionSaque * 4;
        this.vy = -2;
        this.anguloGiro = 0;
        this.historialPosiciones = [];
        this.superTiroActivo = null;
    }
};

// Función constructora de Jugadores
function crearJugador(id, xInicial, equipoKey, direccionMirada) {
    const equipo = CATALOGO_EQUIPOS[equipoKey];
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
        equipoKey: equipoKey,
        nombreEquipo: equipo.nombre,
        colorCamiseta: equipo.colorPrimario,
        colorDetalle: equipo.colorSecundario,
        tipoPoder: equipo.tipoPoder,
        nombrePoder: equipo.nombrePoder,
        energia: 0, // 0 a 100%
        mirada: direccionMirada,
        pateando: false,
        tiempoPatada: 0,
        expresion: "normal", // "normal" | "enojado" | "sorpresa"
        timerExpresion: 0,

        aplicarEquipo(nuevaKey) {
            const eq = CATALOGO_EQUIPOS[nuevaKey];
            this.equipoKey = nuevaKey;
            this.nombreEquipo = eq.nombre;
            this.colorCamiseta = eq.colorPrimario;
            this.colorDetalle = eq.colorSecundario;
            this.tipoPoder = eq.tipoPoder;
            this.nombrePoder = eq.nombrePoder;
        },

        cargarEnergia(cantidad) {
            this.energia = Math.min(100, this.energia + cantidad);
        },

        reiniciar() {
            this.x = this.xInicial;
            this.y = FISICA.SUELO_Y - this.radioCabeza;
            this.vx = 0;
            this.vy = 0;
            this.enSuelo = true;
            this.pateando = false;
            this.tiempoPatada = 0;
            this.expresion = "normal";
            this.timerExpresion = 0;
        }
    };
}

const jugador1 = crearJugador(1, 180, "chile", 1);
const jugador2 = crearJugador(2, 720, "argentina", -1);