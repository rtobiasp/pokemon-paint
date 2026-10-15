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
let temporizadorRedibujado = null;
let trazoActual = null;
let posicionTeclado = null;

export function configurarLienzo(elemento) {
  lienzo = elemento;
  ctx = elemento.getContext("2d");
}

export function iniciarTrazo() {
  if (trazoActual === null) trazoActual = [];
}

export function terminarTrazo() {
  if (trazoActual?.length) state.historialPintado.push(trazoActual);
  trazoActual = null;
}

export function reiniciarCursorTeclado() {
  posicionTeclado = null;
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
  const lienzoX = rect.left + lienzo.clientLeft;
  const lienzoY = rect.top + lienzo.clientTop;
  const proporcionX = lienzo.clientWidth
    ? (clienteX - lienzoX) / lienzo.clientWidth
    : 0.5;
  const proporcionY = lienzo.clientHeight
    ? (clienteY - lienzoY) / lienzo.clientHeight
    : 0.5;
  const viewportX = clienteX - rectContenedor.left - contenedor.clientLeft;
  const viewportY = clienteY - rectContenedor.top - contenedor.clientTop;
  const escalaNueva = limitarEscala(state.escala * factor);
  if (escalaNueva === state.escala) return;
  state.escala = escalaNueva;
  lienzo.style.boxSizing = "content-box";
  lienzo.style.width = `${state.ancho * state.escala}px`;
  lienzo.style.height = `${state.alto * state.escala}px`;
  clearTimeout(temporizadorRedibujado);
  temporizadorRedibujado = setTimeout(dibujarTablero, 100);
  const rectLienzoNuevo = lienzo.getBoundingClientRect();
  const nuevoLienzoX =
    rectLienzoNuevo.left -
    rectContenedor.left -
    contenedor.clientLeft +
    contenedor.scrollLeft +
    lienzo.clientLeft;
  const nuevoLienzoY =
    rectLienzoNuevo.top -
    rectContenedor.top -
    contenedor.clientTop +
    contenedor.scrollTop +
    lienzo.clientTop;
  contenedor.scrollLeft =
    nuevoLienzoX + proporcionX * lienzo.clientWidth - viewportX;
  contenedor.scrollTop =
    nuevoLienzoY + proporcionY * lienzo.clientHeight - viewportY;
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
  clearTimeout(temporizadorRedibujado);
  temporizadorRedibujado = null;
  lienzo.style.boxSizing = "";
  lienzo.style.width = "";
  lienzo.style.height = "";
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

function dibujarCursorEnCelda(x, y) {
  if (posicionTeclado?.x !== x || posicionTeclado?.y !== y) return;
  const e = state.escala;
  ctx.save();
  ctx.strokeStyle = "#d13f36";
  ctx.lineWidth = Math.max(1, Math.min(3, e * 0.12));
  ctx.strokeRect(
    x * e + ctx.lineWidth / 2,
    y * e + ctx.lineWidth / 2,
    e - ctx.lineWidth,
    e - ctx.lineWidth,
  );
  ctx.restore();
}

export function moverCursorTeclado(dx, dy) {
  if (!state.matriz.length) return null;
  const anterior = posicionTeclado;
  if (!posicionTeclado) {
    posicionTeclado = {
      x: Math.floor(state.ancho / 2),
      y: Math.floor(state.alto / 2),
    };
  }
  posicionTeclado = {
    x: Math.max(0, Math.min(state.ancho - 1, posicionTeclado.x + dx)),
    y: Math.max(0, Math.min(state.alto - 1, posicionTeclado.y + dy)),
  };
  if (anterior) dibujarCelda(anterior.x, anterior.y);
  dibujarCelda(posicionTeclado.x, posicionTeclado.y);
  return { ...posicionTeclado };
}

export function posicionTecladoActual() {
  return posicionTeclado ? { ...posicionTeclado } : null;
}

export function dibujarCelda(x, y) {
  const celda = state.matriz[y][x];
  const e = state.escala;
  const posX = x * e;
  const posY = y * e;

  if (celda.numero === 0) {
    ctx.clearRect(posX, posY, e, e);
    dibujarCursorEnCelda(x, y);
    return;
  }

  if (celda.pintado) {
    ctx.fillStyle = celda.color;
    ctx.fillRect(posX, posY, e, e);
    dibujarCursorEnCelda(x, y);
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

  if (!modoGris && e >= 5) {
    ctx.lineWidth = 1;
    ctx.strokeStyle = modoGris && resaltada ? "#555555" : COLOR_BORDE_CELDA;
    ctx.strokeRect(posX + 0.5, posY + 0.5, e - 1, e - 1);
  }

  if (!modoGris) {
    ctx.fillStyle = COLOR_NUMERO;
    ctx.font = `${e * 0.45}px sans-serif`;
    ctx.fillText(celda.numero, posX + e / 2, posY + e / 2);
  }
  dibujarCursorEnCelda(x, y);
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
  const punto =
    evento.touches && evento.touches.length > 0 ? evento.touches[0] : evento;
  const x = Math.floor(
    ((punto.clientX - rect.left - lienzo.clientLeft) / lienzo.clientWidth) *
      state.ancho,
  );
  const y = Math.floor(
    ((punto.clientY - rect.top - lienzo.clientTop) / lienzo.clientHeight) *
      state.alto,
  );
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
  return posicion ? intentarPintarPosicion(posicion) : false;
}

export function intentarPintarTeclado() {
  return posicionTeclado ? intentarPintarPosicion(posicionTeclado) : false;
}

function intentarPintarPosicion(posicion) {
  if (state.colorSeleccionado === null || state.matriz.length === 0) {
    return false;
  }
  const celda = state.matriz[posicion.y][posicion.x];
  if (celda.pintado || celda.numero !== state.colorSeleccionado) {
    return false;
  }
  celda.pintado = true;
  state.pintados[celda.numero]++;
  if (trazoActual) trazoActual.push(posicion);
  else state.historialPintado.push([posicion]);
  state.historialRehacer = [];
  dibujarCelda(posicion.x, posicion.y);
  return true;
}

export function completarColorSeleccionado() {
  if (state.colorSeleccionado === null) return 0;
  const posiciones = [];
  for (let y = 0; y < state.alto; y++) {
    for (let x = 0; x < state.ancho; x++) {
      const celda = state.matriz[y][x];
      if (celda.numero !== state.colorSeleccionado || celda.pintado) continue;
      celda.pintado = true;
      state.pintados[celda.numero]++;
      posiciones.push({ x, y });
      dibujarCelda(x, y);
    }
  }
  if (posiciones.length) {
    state.historialPintado.push(posiciones);
    state.historialRehacer = [];
  }
  return posiciones.length;
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
  terminarTrazo();
  const posiciones = state.historialPintado.pop();
  if (!posiciones?.length) return false;
  let modificadas = false;
  for (const posicion of posiciones) {
    modificadas = cambiarPintado(posicion, false) || modificadas;
  }
  if (!modificadas) return false;
  state.historialRehacer.push(posiciones);
  const ultima = posiciones.at(-1);
  state.colorSeleccionado = state.matriz[ultima.y][ultima.x].numero;
  return true;
}

export function rehacerPintado() {
  const posiciones = state.historialRehacer.pop();
  if (!posiciones?.length) return false;
  let modificadas = false;
  for (const posicion of posiciones) {
    modificadas = cambiarPintado(posicion, true) || modificadas;
  }
  if (!modificadas) return false;
  state.historialPintado.push(posiciones);
  return true;
}
