/**
 * Motor de Audio Procedural - TrigoHeads: Soccer League
 * Síntesis en tiempo real con Web Audio API + SpeechSynthesis.
 */

const AudioEngine = {
    ctx: null,
    habilitado: true,

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    },

   sonarGolpe(esRemateFuerte = false) {
        if (!this.habilitado || !this.ctx) return;

        const ahora = this.ctx.currentTime;
        const duracion = esRemateFuerte ? 0.14 : 0.08;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        // "triangle" suena mucho más limpio y redondo que "sawtooth" (evita efecto crash/vibración)
        osc.type = "triangle";
        const freqInicial = esRemateFuerte ? 155 : 125;
        const freqFinal = esRemateFuerte ? 48 : 52;

        osc.frequency.setValueAtTime(freqInicial, ahora);
        osc.frequency.exponentialRampToValueAtTime(freqFinal, ahora + duracion);

        const volumen = esRemateFuerte ? 0.28 : 0.16;
        gain.gain.setValueAtTime(0.001, ahora);
        gain.gain.linearRampToValueAtTime(volumen, ahora + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0008, ahora + duracion);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(ahora);
        osc.stop(ahora + duracion + 0.02);
    },

    sonarPoste() {
        if (!this.habilitado || !this.ctx) return;

        const ahora = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(520, ahora);
        osc.frequency.exponentialRampToValueAtTime(240, ahora + 0.18);

        gain.gain.setValueAtTime(0.28, ahora);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(ahora);
        osc.stop(ahora + 0.19);
    },

    sonarSuperTiro() {
        if (!this.habilitado || !this.ctx) return;

        const ahora = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ahora);
        osc.frequency.exponentialRampToValueAtTime(880, ahora + 0.28);

        gain.gain.setValueAtTime(0.26, ahora);
        gain.gain.exponentialRampToValueAtTime(0.001, ahora + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(ahora);
        osc.stop(ahora + 0.31);
    },

    sonarSilbato(esFinal = false) {
        if (!this.habilitado || !this.ctx) return;

        const ahora = this.ctx.currentTime;
        const notas = esFinal ? [2600, 2200, 1800] : [2750];

        notas.forEach((freq, idx) => {
            const inicio = ahora + idx * 0.16;
            const duracion = esFinal ? 0.14 : 0.28;

            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, inicio);

            gain.gain.setValueAtTime(0.18, inicio);
            gain.gain.exponentialRampToValueAtTime(0.001, inicio + duracion);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(inicio);
            osc.stop(inicio + duracion + 0.02);
        });
    },

    sonarOvacionHinchada() {
        if (!this.habilitado || !this.ctx) return;

        const ahora = this.ctx.currentTime;
        const duracion = 1.4;
        const bufferSize = Math.floor(this.ctx.sampleRate * duracion);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        let ultimo = 0;
        for (let i = 0; i < bufferSize; i++) {
            const blanco = Math.random() * 2 - 1;
            ultimo = (ultimo + 0.06 * blanco) / 1.06;
            data[i] = ultimo * 2.4;
        }

        const ruido = this.ctx.createBufferSource();
        ruido.buffer = buffer;

        const filtro = this.ctx.createBiquadFilter();
        filtro.type = "bandpass";
        filtro.frequency.setValueAtTime(620, ahora);
        filtro.frequency.linearRampToValueAtTime(1050, ahora + 0.4);
        filtro.frequency.exponentialRampToValueAtTime(500, ahora + duracion);
        filtro.Q.value = 0.85;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.01, ahora);
        gain.gain.linearRampToValueAtTime(0.32, ahora + 0.16);
        gain.gain.exponentialRampToValueAtTime(0.002, ahora + duracion);

        ruido.connect(filtro);
        filtro.connect(gain);
        gain.connect(this.ctx.destination);

        ruido.start(ahora);
        ruido.stop(ahora + duracion + 0.03);
    },

    celebrarGol(nombreEquipo) {
        if (!this.habilitado || !this.ctx) return;

        this.sonarOvacionHinchada();

        const ahora = this.ctx.currentTime;
        const acordes = [523.25, 659.25, 783.99, 1046.5];

        acordes.forEach((freq, i) => {
            const t = ahora + i * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, t);

            gain.gain.setValueAtTime(0.15, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(t);
            osc.stop(t + 0.23);
        });

        if ("speechSynthesis" in window) {
            window.speechSynthesis.cancel();
            const locucion = new SpeechSynthesisUtterance(`¡Gol de ${nombreEquipo}!`);
            locucion.lang = "es-ES";
            locucion.pitch = 1.1;
            locucion.rate = 1.0;
            window.speechSynthesis.speak(locucion);
        }
    }
};