/**
 * Módulo Matemático - TrigoHeads: Soccer League
 * Implementa: Distancia Euclidiana, Trigonometría Vectorial, Onda Senoidal y Amortiguación.
 */

const MathEngine = {
    // 1. Distancia Euclidiana entre dos puntos (x1, y1) y (x2, y2)
    // Fórmula: d = sqrt((x2 - x1)^2 + (y2 - y1)^2)
    distanciaEuclidiana(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },

    // 2. Cálculo del ángulo de impacto en radianes usando arcotangente de 2 argumentos
    // Fórmula: θ = atan2(y2 - y1, x2 - x1)
    calcularAnguloImpacto(xOrigen, yOrigen, xDestino, yDestino) {
        return Math.atan2(yDestino - yOrigen, xDestino - xOrigen);
    },

    // 3. Descomposición trigonométrica de un vector de velocidad (magnitud v0 y ángulo θ)
    // Fórmulas: vx = v0 * cos(θ)  |  vy = v0 * sin(θ)
    descomponerVector(magnitud, anguloRadianes) {
        return {
            vx: magnitud * Math.cos(anguloRadianes),
            vy: magnitud * Math.sin(anguloRadianes)
        };
    },

    // 4. Función Trigonométrica de Onda Senoidal para el Super Tiro Especial
    // Fórmula: y(x) = y0 + A * sin(ω * desplazamientoX)
    calcularOndaSenoidal(yBase, amplitud, frecuenciaAngular, desplazamientoX) {
        return yBase + amplitud * Math.sin(frecuenciaAngular * desplazamientoX);
    },

    // 5. Conversión de radianes a grados sexagesimales para visualización
    radianesAGrados(radianes) {
        return Math.round((radianes * 180) / Math.PI);
    },

    // 6. Función lineal de fricción / amortiguación
    // Fórmula: v_nueva = v_actual * mu (donde 0 < mu < 1)
    aplicarFriccion(velocidad, factorMu) {
        const nuevaVel = velocidad * factorMu;
        return Math.abs(nuevaVel) < 0.05 ? 0 : nuevaVel;
    }
};