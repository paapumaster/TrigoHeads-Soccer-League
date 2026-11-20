/**
 * Módulo de Audio Procedural y Relator - TrigoHeads: Soccer League
 * Utiliza Web Audio API para efectos de sonido y SpeechSynthesis para gritos de gol.
 */

const AudioEngine = {
    ctx: null,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    },

    // Sonido seco de golpeo (cabezazo o patada)
    sonarGolpe(esPatadaFuerte = false) {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(esPatadaFuerte ? 180 : 130, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    },

    // Sonido metálico al pegar en el travesaño
    sonarPoste() {
        this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(620, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(310, this.ctx.currentTime + 0.25);

        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    },

    // Silbato inicial / final del árbitro
    sonarSilbato(largo = false) {
        this.init();
        const duracion = largo ? 0.65 : 0.28;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(2800, this.ctx.currentTime);
        // Efecto trino del silbato
        osc.frequency.setValueAtTime(2950, this.ctx.currentTime + 0.05);
        osc.frequency.setValueAtTime(2800, this.ctx.currentTime + 0.1);

        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duracion);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duracion);
    },

    // Fanfarria de estadio + Grito de relato "¡GOOOOL!"
    celebrarGol(equipo) {
        this.init();

        // 1. Acorde de fanfarria (Do - Mi - Sol - Do alto)
        const notas = [523.25, 659.25, 783.99, 1046.50];
        notas.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sawtooth";
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);

            gain.gain.setValueAtTime(0.15, this.ctx.currentTime + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + i * 0.08 + 0.45);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + i * 0.08);
            osc.stop(this.ctx.currentTime + i * 0.08 + 0.45);
        });

        // 2. Grito de relator con síntesis de voz en español
        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const relato = new SpeechSynthesisUtterance(
                equipo === 1 ? "¡Goooool de Chile!" : "¡Goooool del rival!"
            );
            relato.lang = "es-ES";
            relato.rate = 1.15;
            relato.pitch = 1.35;
            window.speechSynthesis.speak(relato);
        }
    }
};