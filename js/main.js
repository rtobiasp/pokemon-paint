import { state, hayDibujo } from "./state.js";
import { cargarImagen, extraerMatriz } from "./imageProcessor.js";
import { obtenerPokemon, obtenerPokemonAleatorio } from "./pokeApi.js";
import {
  configurarLienzo,
  dibujarTablero,
  intentarPintar,
  zoomAnclado,
  encajarZoom,
  porcentajeZoom,
} from "./board.js";
import { crearPaleta, actualizarProgreso } from "./palette.js";
import { PASO_ZOOM } from "./config.js";

const lienzo = document.getElementById("lienzoJuego");
const contenedorPaleta = document.getElementById("paleta");
const mensajeVictoria = document.getElementById("mensaje-victoria");
const btnAleatorio = document.getElementById("btnAleatorio");
const btnPorNumero = document.getElementById("btnPorNumero");
const inputNumero = document.getElementById("inputNumero");
const infoPokemon = document.getElementById("infoPokemon");
const errorPokemon = document.getElementById("errorPokemon");
const btnZoomMenos = document.getElementById("btnZoomMenos");
const btnZoomMas = document.getElementById("btnZoomMas");
const btnZoomAjustar = document.getElementById("btnZoomAjustar");
const zoomNivel = document.getElementById("zoomNivel");
const contenedorTablero = lienzo.closest(".tablero-contenedor");

let paneo = null;
let espacioPulsado = false;

configurarLienzo(lienzo);

function pintarInfo(texto) {
  infoPokemon.textContent = texto;
}

function pintarError(texto) {
  errorPokemon.textContent = texto;
  errorPokemon.hidden = texto === "";
}

function fijarCargando(cargando) {
  btnAleatorio.disabled = cargando;
  btnPorNumero.disabled = cargando;
}

function actualizarZoom() {
  zoomNivel.textContent = `${porcentajeZoom()}%`;
}

async function mostrarSprite(origen, etiqueta) {
  const imagen = await cargarImagen(origen);
  extraerMatriz(imagen);
  state.colorSeleccionado = null;
  crearPaleta(contenedorPaleta, mensajeVictoria);
  encajarZoom();
  dibujarTablero();
  actualizarZoom();
  pintarInfo(etiqueta || "");
}

async function mostrarPokemon(promesa) {
  fijarCargando(true);
  pintarError("");
  pintarInfo("Cargando...");
  try {
    const pokemon = await promesa;
    await mostrarSprite(pokemon.imagen, `#${pokemon.numero} ${pokemon.nombre}`);
  } catch (fallo) {
    pintarInfo("");
    pintarError(
      "No se pudo cargar el Pokémon. Revisa tu conexión o el número.",
    );
  } finally {
    fijarCargando(false);
  }
}

function refrescarTrasPintar() {
  actualizarProgreso(contenedorPaleta, mensajeVictoria);
}

btnAleatorio.addEventListener("click", () => {
  mostrarPokemon(obtenerPokemonAleatorio());
});

btnPorNumero.addEventListener("click", () => {
  mostrarPokemon(obtenerPokemon(Number(inputNumero.value)));
});

function centroVisible() {
  const rect = contenedorTablero.getBoundingClientRect();
  return [rect.left + rect.width / 2, rect.top + rect.height / 2];
}

function zoomAncladoEtiqueta(factor, clienteX, clienteY) {
  if (!hayDibujo()) {
    return;
  }
  zoomAnclado(factor, clienteX, clienteY);
  actualizarZoom();
}

btnZoomMas.addEventListener("click", () => {
  const [x, y] = centroVisible();
  zoomAncladoEtiqueta(PASO_ZOOM, x, y);
});
btnZoomMenos.addEventListener("click", () => {
  const [x, y] = centroVisible();
  zoomAncladoEtiqueta(1 / PASO_ZOOM, x, y);
});
btnZoomAjustar.addEventListener("click", () => {
  if (!hayDibujo()) {
    return;
  }
  encajarZoom();
  dibujarTablero();
  actualizarZoom();
});

lienzo.addEventListener(
  "wheel",
  (evento) => {
    if (!evento.ctrlKey || !hayDibujo()) {
      return;
    }
    evento.preventDefault();
    zoomAncladoEtiqueta(
      evento.deltaY < 0 ? PASO_ZOOM : 1 / PASO_ZOOM,
      evento.clientX,
      evento.clientY,
    );
  },
  { passive: false },
);

function esEscribiendo(evento) {
  const destino = evento.target;
  return (
    destino && (destino.tagName === "INPUT" || destino.tagName === "TEXTAREA")
  );
}

window.addEventListener(
  "keydown",
  (evento) => {
    if (evento.code !== "Space" || esEscribiendo(evento)) {
      return;
    }
    evento.preventDefault();
    if (espacioPulsado) {
      return;
    }
    espacioPulsado = true;
    if (!paneo) {
      lienzo.style.cursor = "grab";
    }
  },
  true,
);

window.addEventListener("keyup", (evento) => {
  if (evento.code !== "Space") {
    return;
  }
  espacioPulsado = false;
  if (!paneo) {
    lienzo.style.cursor = "crosshair";
  }
});

function actualizarCursor() {
  lienzo.style.cursor = paneo
    ? "grabbing"
    : espacioPulsado
      ? "grab"
      : "crosshair";
}

lienzo.addEventListener("pointerdown", (evento) => {
  if (!evento.isPrimary) {
    return;
  }
  if (evento.button === 1 || (evento.button === 0 && espacioPulsado)) {
    evento.preventDefault();
    lienzo.setPointerCapture(evento.pointerId);
    paneo = {
      x: evento.clientX,
      y: evento.clientY,
      izquierda: contenedorTablero.scrollLeft,
      arriba: contenedorTablero.scrollTop,
    };
    actualizarCursor();
    return;
  }
  if (evento.button !== 0) {
    return;
  }
  lienzo.setPointerCapture(evento.pointerId);
  state.pintando = true;
  if (intentarPintar(evento)) {
    refrescarTrasPintar();
  }
});

lienzo.addEventListener("pointermove", (evento) => {
  if (paneo) {
    contenedorTablero.scrollLeft = paneo.izquierda - (evento.clientX - paneo.x);
    contenedorTablero.scrollTop = paneo.arriba - (evento.clientY - paneo.y);
    return;
  }
  if (state.pintando && intentarPintar(evento)) {
    refrescarTrasPintar();
  }
});

function finalizarPuntero() {
  state.pintando = false;
  paneo = null;
  actualizarCursor();
}

lienzo.addEventListener("pointerup", finalizarPuntero);
lienzo.addEventListener("pointercancel", finalizarPuntero);
lienzo.addEventListener("lostpointercapture", finalizarPuntero);

if (!hayDibujo()) {
  mostrarPokemon(obtenerPokemonAleatorio());
}
