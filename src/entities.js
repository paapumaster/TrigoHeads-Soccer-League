/**
 * Entidades del Juego y Catálogo de Equipos (4 jugadores por equipo)
 * TrigoHeads: Soccer League
 */

const FISICA = {
    GRAVEDAD: 0.58,
    FRICCION_SUELO: 0.84,
    FRICCION_AIRE: 0.992,
    SUELO_Y: 430
};

const MATRIZ_ARCOS = [
    [20, 95, 290, FISICA.SUELO_Y],
    [805, 880, 290, FISICA.SUELO_Y]
];

const MATRIZ_MARCADOR = [0, 0, 90, 2, 0];

const CATALOGO_EQUIPOS = {
    CHILE: {
        nombre: "CHILE",
        bandera: "🇨🇱",
        colorPrimario: "#ef4444",
        colorSecundario: "#1d4ed8",
        colorDetalle: "#f8fafc",
        colorTextoBadge: "#ffffff",
        tipoPoder: "bala",
        plantilla: [
            { nombre: "Alexis", dorsal: 7, estiloVisual: "cinta", bonoVelocidad: 0.3, bonoSalto: 0.2 },
            { nombre: "Vargas", dorsal: 11, estiloVisual: "cresta", bonoVelocidad: 0.2, bonoSalto: 0.3 },
            { nombre: "Vidal", dorsal: 8, estiloVisual: "cresta", bonoVelocidad: 0.1, bonoSalto: 0.35 },
            { nombre: "Suazo", dorsal: 9, estiloVisual: "clasico", bonoVelocidad: 0.15, bonoSalto: 0.25 }
        ]
    },
    ARGENTINA: {
        nombre: "ARGENTINA",
        bandera: "🇦🇷",
        colorPrimario: "#38bdf8",
        colorSecundario: "#f8fafc",
        colorDetalle: "#0284c7",
        colorTextoBadge: "#0f172a",
        tipoPoder: "bala",
        plantilla: [
            { nombre: "Messi", dorsal: 10, estiloVisual: "clasico", bonoVelocidad: 0.3, bonoSalto: 0.1 },
            { nombre: "Julián", dorsal: 9, estiloVisual: "cinta", bonoVelocidad: 0.25, bonoSalto: 0.25 },
            { nombre: "Dibu", dorsal: 23, estiloVisual: "visera", bonoVelocidad: -0.1, bonoSalto: 0.6 },
            { nombre: "Di María", dorsal: 11, estiloVisual: "cresta", bonoVelocidad: 0.2, bonoSalto: 0.2 }
        ]
    },
    ALEMANIA: {
        nombre: "ALEMANIA",
        bandera: "🇩🇪",
        colorPrimario: "#f8fafc",
        colorSecundario: "#0f172a",
        colorDetalle: "#ef4444",
        colorTextoBadge: "#0f172a",
        tipoPoder: "bala",
        plantilla: [
            { nombre: "Müller", dorsal: 13, estiloVisual: "clasico", bonoVelocidad: 0.15, bonoSalto: 0.35 },
            { nombre: "Musiala", dorsal: 10, estiloVisual: "cinta", bonoVelocidad: 0.35, bonoSalto: 0.2 },
            { nombre: "Neuer", dorsal: 1, estiloVisual: "visera", bonoVelocidad: -0.05, bonoSalto: 0.55 },
            { nombre: "Kimmich", dorsal: 6, estiloVisual: "cresta", bonoVelocidad: 0.2, bonoSalto: 0.25 }
        ]
    },
    BRASIL: {
        nombre: "BRASIL",
        bandera: "🇧🇷",
        colorPrimario: "#eab308",
        colorSecundario: "#16a34a",
        colorDetalle: "#15803d",
        colorTextoBadge: "#0f172a",
        tipoPoder: "senoidal",
        plantilla: [
            { nombre: "Vini Jr", dorsal: 7, estiloVisual: "cinta", bonoVelocidad: 0.25, bonoSalto: 0 },
            { nombre: "Rodrygo", dorsal: 11, estiloVisual: "clasico", bonoVelocidad: 0.2, bonoSalto: 0.2 },
            { nombre: "Richarlison", dorsal: 9, estiloVisual: "cresta", bonoVelocidad: 0, bonoSalto: 0.5 },
            { nombre: "Neymar", dorsal: 10, estiloVisual: "visera", bonoVelocidad: 0.35, bonoSalto: 0.1 }
        ]
    },
    JAPON: {
        nombre: "JAPÓN",
        bandera: "🇯🇵",
        colorPrimario: "#1d4ed8",
        colorSecundario: "#f8fafc",
        colorDetalle: "#ef4444",
        colorTextoBadge: "#ffffff",
        tipoPoder: "senoidal",
        plantilla: [
            { nombre: "Kubo", dorsal: 20, estiloVisual: "cinta", bonoVelocidad: 0.3, bonoSalto: 0.2 },
            { nombre: "Mitoma", dorsal: 7, estiloVisual: "cresta", bonoVelocidad: 0.35, bonoSalto: 0.15 },
            { nombre: "Endo", dorsal: 6, estiloVisual: "clasico", bonoVelocidad: 0.15, bonoSalto: 0.35 },
            { nombre: "Doan", dorsal: 10, estiloVisual: "visera", bonoVelocidad: 0.25, bonoSalto: 0.25 }
        ]
    },
    FRANCIA: {
        nombre: "FRANCIA",
        bandera: "🇫🇷",
        colorPrimario: "#2563eb",
        colorSecundario: "#f8fafc",
        colorDetalle: "#dc2626",
        colorTextoBadge: "#ffffff",
        tipoPoder: "senoidal",
        plantilla: [
            { nombre: "Mbappé", dorsal: 10, estiloVisual: "cinta", bonoVelocidad: 0.4, bonoSalto: 0.15 },
            { nombre: "Griezmann", dorsal: 7, estiloVisual: "cresta", bonoVelocidad: 0.15, bonoSalto: 0.25 },
            { nombre: "Giroud", dorsal: 9, estiloVisual: "clasico", bonoVelocidad: -0.05, bonoSalto: 0.5 },
            { nombre: "Camavinga", dorsal: 6, estiloVisual: "visera", bonoVelocidad: 0.25, bonoSalto: 0.3 }
        ]
    }
};

class Jugador {
    constructor(id, xInicial, miradaInicial, equipoKey = "CHILE", idxJugador = 0) {
        this.id = id;
        this.xInicial = xInicial;
        this.yInicial = FISICA.SUELO_Y - 34;
        this.miradaInicial = miradaInicial;

        this.radioCabeza = 34;
        this.fuerzaSaltoBase = -12.8;
        this.velocidadBase = 5.2;

        this.energia = 0;
        this.expresion = "normal";
        this.timerExpresion = 0;

        this.aplicarEquipo(equipoKey, idxJugador);
        this.reiniciar();
    }

    aplicarEquipo(equipoKey, idxJugador = 0) {
        this.equipoKey = equipoKey;
        const eq = CATALOGO_EQUIPOS[equipoKey] || CATALOGO_EQUIPOS.CHILE;
        this.nombreEquipo = eq.nombre;
        this.colorCamiseta = eq.colorPrimario;
        this.colorDetalle = eq.colorDetalle;
        this.tipoPoder = eq.tipoPoder;
        this.plantilla = eq.plantilla;
        this.aplicarJugadorDePlantilla(idxJugador);
    }

    aplicarJugadorDePlantilla(idxJugador) {
        const total = this.plantilla.length;
        this.idxJugadorActual = ((idxJugador % total) + total) % total;
        const miembro = this.plantilla[this.idxJugadorActual];

        this.nombreJugador = miembro.nombre;
        this.dorsal = miembro.dorsal;
        this.estiloVisual = miembro.estiloVisual;
        this.bonoVelocidad = miembro.bonoVelocidad || 0;
        this.bonoSalto = miembro.bonoSalto || 0;
        this.fuerzaSalto = this.fuerzaSaltoBase - this.bonoSalto;
    }

    cargarEnergia(cantidad) {
        this.energia = Math.min(100, Math.max(0, this.energia + cantidad));
    }

    reiniciar() {
        this.x = this.xInicial;
        this.y = this.yInicial;
        this.vx = 0;
        this.vy = 0;
        this.mirada = this.miradaInicial;
        this.enSuelo = true;
        this.pateando = false;
        this.tiempoPatada = 0;
        this.expresion = "normal";
        this.timerExpresion = 0;
    }
}

class Balon {
    constructor(xInicial, yInicial) {
        this.xInicial = xInicial;
        this.yInicial = yInicial;
        this.radio = 16;
        this.reiniciar(0);
    }

    reiniciar(direccionSaque = 0) {
        this.x = this.xInicial;
        this.y = this.yInicial;
        this.vx = direccionSaque * 2.5;
        this.vy = -3.2;
        this.anguloGiro = 0;
        this.ultimoAnguloImpacto = 0;
        this.superTiroActivo = null;
        this.superTiroOrigenX = this.xInicial;
        this.superTiroBaseY = this.yInicial;
        this.superTiroDueno = null;
        this.historialPosiciones = [];
    }
}

const jugador1 = new Jugador(1, 230, 1, "CHILE", 0);
const jugador2 = new Jugador(2, 670, -1, "ARGENTINA", 0);
const balon = new Balon(450, 220);