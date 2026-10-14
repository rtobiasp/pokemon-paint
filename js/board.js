import {
  ESCALA,
  COLOR_FONDO_CELDA,
  COLOR_BORDE_CELDA,
  COLOR_NUMERO,
  COLOR_FONDO_RESALTADO
} from "./config.js";
import { state } from "./state.js";

let lienzo = null;
let ctx = null;

export function configurarLienzo(elemento) {
  lienzo = elemento;
  ctx = elemento.getContext("2d");
}

function esResaltada(celda) {
  return (
    state.colorSeleccionado !== null &&
    !celda.pintado &&
    celda.numero === state.colorSeleccionado
  );
}

export function dibujarTablero() {
  lienzo.width = state.ancho * ESCALA;
  lienzo.height = state.alto * ESCALA;
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
  const posX = x * ESCALA;
  const posY = y * ESCALA;

  if (celda.numero === 0) {
    ctx.clearRect(posX, posY, ESCALA, ESCALA);
    return;
  }

  if (celda.pintado) {
    ctx.fillStyle = celda.color;
    ctx.fillRect(posX, posY, ESCALA, ESCALA);
    return;
  }

  if (esResaltada(celda)) {
    ctx.fillStyle = COLOR_FONDO_RESALTADO;
    ctx.fillRect(posX, posY, ESCALA, ESCALA);
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLOR_BORDE_CELDA;
    ctx.strokeRect(posX + 0.5, posY + 0.5, ESCALA - 1, ESCALA - 1);
    ctx.fillStyle = COLOR_NUMERO;
    ctx.font = `${ESCALA * 0.45}px sans-serif`;
    ctx.fillText(celda.numero, posX + ESCALA / 2, posY + ESCALA / 2);
    return;
  }

  ctx.fillStyle = COLOR_FONDO_CELDA;
  ctx.fillRect(posX, posY, ESCALA, ESCALA);
  ctx.lineWidth = 1;
  ctx.strokeStyle = COLOR_BORDE_CELDA;
  ctx.strokeRect(posX + 0.5, posY + 0.5, ESCALA - 1, ESCALA - 1);
  ctx.fillStyle = COLOR_NUMERO;
  ctx.font = `${ESCALA * 0.45}px sans-serif`;
  ctx.fillText(celda.numero, posX + ESCALA / 2, posY + ESCALA / 2);
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
  const punto = evento.touches && evento.touches.length > 0 ? evento.touches[0] : evento;
  const x = Math.floor(((punto.clientX - rect.left) * escalaX) / ESCALA);
  const y = Math.floor(((punto.clientY - rect.top) * escalaY) / ESCALA);
  if (y < 0 || y >= state.alto || x < 0 || x >= state.ancho) {
    return null;
  }
  return { x, y };
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
  dibujarCelda(posicion.x, posicion.y);
  return true;
}
