import { UMBRAL_TRANSPARENCIA } from "./config.js";
import { state, reiniciarEstado } from "./state.js";

export function cargarImagen(origen) {
  return new Promise((resolver, rechazar) => {
    const imagen = new Image();
    imagen.crossOrigin = "anonymous";
    imagen.onload = () => resolver(imagen);
    imagen.onerror = rechazar;
    imagen.src = origen;
  });
}

export function extraerMatriz(imagen) {
  const temporal = document.createElement("canvas");
  const contextoTemporal = temporal.getContext("2d", { willReadFrequently: true });
  temporal.width = imagen.naturalWidth || imagen.width;
  temporal.height = imagen.naturalHeight || imagen.height;
  contextoTemporal.imageSmoothingEnabled = false;
  contextoTemporal.drawImage(imagen, 0, 0);
  const datos = contextoTemporal.getImageData(0, 0, temporal.width, temporal.height).data;

  reiniciarEstado();

  let contador = 1;
  for (let y = 0; y < temporal.height; y++) {
    const fila = [];
    for (let x = 0; x < temporal.width; x++) {
      const i = (y * temporal.width + x) * 4;
      const r = datos[i];
      const g = datos[i + 1];
      const b = datos[i + 2];
      const a = datos[i + 3];
      if (a < UMBRAL_TRANSPARENCIA) {
        fila.push({ numero: 0, pintado: true, color: "transparent" });
      } else {
        const rgb = `rgb(${r},${g},${b})`;
        if (!state.paletaColores[rgb]) {
          state.paletaColores[rgb] = contador;
          state.paletaInversa[contador] = rgb;
          state.totales[contador] = 0;
          state.pintados[contador] = 0;
          contador++;
        }
        const numero = state.paletaColores[rgb];
        state.totales[numero]++;
        fila.push({ numero, pintado: false, color: rgb });
      }
    }
    state.matriz.push(fila);
  }

  state.ancho = temporal.width;
  state.alto = temporal.height;
  return { ancho: state.ancho, alto: state.alto };
}
