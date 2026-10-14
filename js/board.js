import {
  ESCALA_BASE,
  ESCALA_MINIMA,
  ESCALA_MAXIMA,
  COLOR_FONDO_CELDA,
  COLOR_BORDE_CELDA,
  COLOR_NUMERO,
  COLOR_FONDO_RESALTADO,
  UMBRAL_NUMERO,
} from "./config.js";
import { state } from "./state.js";

let lienzo = null;
let ctx = null;
const cacheGris = new Map();

export function configurarLienzo(elemento) {
  lienzo = elemento;
  ctx = elemento.getContext("2d");
}

export function grisDe(rgb, factor) {
  const clave = `${rgb}|${factor}`;
  const guardado = cacheGris.get(clave);
  if (guardado) return guardado;
  const valores = rgb.slice(4, -1).split(",").map(Number);
  const luminosidad = Math.round(
    0.299 * valores[0] + 0.587 * valores[1] + 0.114 * valores[2],
  );
  const tono = Math.max(0, Math.min(255, Math.round(luminosidad * factor)));
  const resultado = `rgb(${tono},${tono},${tono})`;
  cacheGris.set(clave, resultado);
  return resultado;
}

function limitarEscala(valor) {
  return Math.min(ESCALA_MAXIMA, Math.max(ESCALA_MINIMA, Math.round(valor)));
}

export function zoomAnclado(factor, clienteX, clienteY) {
  const contenedor = lienzo.closest(".tablero-contenedor");
  const rect = lienzo.getBoundingClientRect();
  const rectContenedor = contenedor.getBoundingClientRect();
  const proporcionX = rect.width ? (clienteX - rect.left) / rect.width : 0.5;
  const proporcionY = rect.height ? (clienteY - rect.top) / rect.height : 0.5;
  const viewportX = clienteX - rectContenedor.left - contenedor.clientLeft;
  const viewportY = clienteY - rectContenedor.top - contenedor.clientTop;
  state.escala = limitarEscala(state.escala * factor);
  dibujarTablero();
  const rectLienzoNuevo = lienzo.getBoundingClientRect();
  const lienzoX =
    rectLienzoNuevo.left -
    rectContenedor.left -
    contenedor.clientLeft +
    contenedor.scrollLeft;
  const lienzoY =
    rectLienzoNuevo.top -
    rectContenedor.top -
    contenedor.clientTop +
    contenedor.scrollTop;
  contenedor.scrollLeft = lienzoX + proporcionX * lienzo.width - viewportX;
  contenedor.scrollTop = lienzoY + proporcionY * lienzo.height - viewportY;
}

export function zoomAescala(escala, clienteX, clienteY) {
  const escalaNueva = limitarEscala(escala);
  if (escalaNueva !== state.escala) {
    zoomAnclado(escalaNueva / state.escala, clienteX, clienteY);
  }
}

export function encajarZoom() {
  const contenedor = lienzo.closest(".tablero-contenedor");
  const anchoDisponible =
    contenedor.clientWidth || contenedor.getBoundingClientRect().width;
  const altoDisponible =
    contenedor.clientHeight || contenedor.getBoundingClientRect().height;
  state.escala = limitarEscala(
    Math.min(
      Math.floor(anchoDisponible / state.ancho),
      Math.floor(altoDisponible / state.alto),
      ESCALA_BASE,
    ),
  );
}

export function porcentajeZoom() {
  return Math.round((state.escala / ESCALA_BASE) * 100);
}

function esResaltada(celda) {
  return (
    state.colorSeleccionado !== null &&
    !celda.pintado &&
    celda.numero === state.colorSeleccionado
  );
}

export function dibujarTablero() {
  lienzo.width = Math.max(1, Math.round(state.ancho * state.escala));
  lienzo.height = Math.max(1, Math.round(state.alto * state.escala));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let y = 0; y < state.alto; y++) {
    for (let x = 0; x < state.ancho; x++) {
      dibujarCelda(x, y);
    }
  }
}

export function dibujarCelda(x, y) {
  const celda = state.matriz[y][x];
  const e = state.escala;
  const posX = x * e;
  const posY = y * e;

  if (celda.numero === 0) {
    ctx.clearRect(posX, posY, e, e);
    return;
  }

  if (celda.pintado) {
    ctx.fillStyle = celda.color;
    ctx.fillRect(posX, posY, e, e);
    return;
  }

  const resaltada = esResaltada(celda);
  const modoGris = e < UMBRAL_NUMERO;

  if (modoGris) {
    ctx.fillStyle = resaltada
      ? grisDe(celda.color, 0.55)
      : grisDe(celda.color, 1);
  } else {
    ctx.fillStyle = resaltada ? COLOR_FONDO_RESALTADO : COLOR_FONDO_CELDA;
  }
  ctx.fillRect(posX, posY, e, e);

  if (e >= 5) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = modoGris && resaltada ? "#555555" : COLOR_BORDE_CELDA;
    ctx.strokeRect(posX + 0.5, posY + 0.5, e - 1, e - 1);
  }

  if (!modoGris) {
    ctx.fillStyle = COLOR_NUMERO;
    ctx.font = `${e * 0.45}px sans-serif`;
    ctx.fillText(celda.numero, posX + e / 2, posY + e / 2);
  }
}

export function resaltarSeleccion() {
  for (let y = 0; y < state.alto; y++) {
    for (let x = 0; x < state.ancho; x++) {
      const celda = state.matriz[y][x];
      if (celda.numero !== 0 && !celda.pintado) {
        dibujarCelda(x, y);
      }
    }
  }
}

export function celdaDesdeEvento(evento) {
  const rect = lienzo.getBoundingClientRect();
  const escalaX = lienzo.width / rect.width;
  const escalaY = lienzo.height / rect.height;
  const punto =
    evento.touches && evento.touches.length > 0 ? evento.touches[0] : evento;
  const x = Math.floor(((punto.clientX - rect.left) * escalaX) / state.escala);
  const y = Math.floor(((punto.clientY - rect.top) * escalaY) / state.escala);
  if (y < 0 || y >= state.alto || x < 0 || x >= state.ancho) {
    return null;
  }
  return { x, y };
}

export function celdaEsPintable(evento) {
  if (state.colorSeleccionado === null || state.matriz.length === 0) {
    return false;
  }
  const posicion = celdaDesdeEvento(evento);
  if (!posicion) return false;
  const celda = state.matriz[posicion.y][posicion.x];
  return !celda.pintado && celda.numero === state.colorSeleccionado;
}

export function intentarPintar(evento) {
  if (state.colorSeleccionado === null || state.matriz.length === 0) {
    return false;
  }
  const posicion = celdaDesdeEvento(evento);
  if (!posicion) {
    return false;
  }
  const celda = state.matriz[posicion.y][posicion.x];
  if (celda.pintado || celda.numero !== state.colorSeleccionado) {
    return false;
  }
  celda.pintado = true;
  state.pintados[celda.numero]++;
  state.historialPintado.push(posicion);
  state.historialRehacer = [];
  dibujarCelda(posicion.x, posicion.y);
  return true;
}

function cambiarPintado(posicion, pintado) {
  const celda = state.matriz[posicion.y]?.[posicion.x];
  if (!celda || celda.numero === 0 || celda.pintado === pintado) {
    return false;
  }
  celda.pintado = pintado;
  state.pintados[celda.numero] += pintado ? 1 : -1;
  dibujarCelda(posicion.x, posicion.y);
  return true;
}

export function deshacerPintado() {
  const posicion = state.historialPintado.pop();
  if (!posicion || !cambiarPintado(posicion, false)) {
    return false;
  }
  state.historialRehacer.push(posicion);
  state.colorSeleccionado = state.matriz[posicion.y][posicion.x].numero;
  return true;
}

export function rehacerPintado() {
  const posicion = state.historialRehacer.pop();
  if (!posicion || !cambiarPintado(posicion, true)) {
    return false;
  }
  state.historialPintado.push(posicion);
  return true;
}
