import { state, hayDibujo } from "./state.js";
import { cargarImagen, extraerMatriz } from "./imageProcessor.js";
import { obtenerPokemon, obtenerPokemonAleatorio } from "./pokeApi.js";
import { configurarLienzo, dibujarTablero, intentarPintar } from "./board.js";
import { crearPaleta, actualizarProgreso } from "./palette.js";

const lienzo = document.getElementById("lienzoJuego");
const contenedorPaleta = document.getElementById("paleta");
const mensajeVictoria = document.getElementById("mensaje-victoria");
const btnAleatorio = document.getElementById("btnAleatorio");
const btnPorNumero = document.getElementById("btnPorNumero");
const inputNumero = document.getElementById("inputNumero");
const infoPokemon = document.getElementById("infoPokemon");
const errorPokemon = document.getElementById("errorPokemon");

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

async function mostrarSprite(origen, etiqueta) {
  const imagen = await cargarImagen(origen);
  extraerMatriz(imagen);
  state.colorSeleccionado = null;
  crearPaleta(contenedorPaleta, mensajeVictoria);
  dibujarTablero();
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
    pintarError("No se pudo cargar el Pokémon. Revisa tu conexión o el número.");
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

lienzo.addEventListener("mousedown", (evento) => {
  state.pintando = true;
  if (intentarPintar(evento)) {
    refrescarTrasPintar();
  }
});

lienzo.addEventListener("mousemove", (evento) => {
  if (state.pintando && intentarPintar(evento)) {
    refrescarTrasPintar();
  }
});

window.addEventListener("mouseup", () => {
  state.pintando = false;
});

lienzo.addEventListener("touchstart", (evento) => {
  evento.preventDefault();
  state.pintando = true;
  if (intentarPintar(evento)) {
    refrescarTrasPintar();
  }
}, { passive: false });

lienzo.addEventListener("touchmove", (evento) => {
  evento.preventDefault();
  if (state.pintando && intentarPintar(evento)) {
    refrescarTrasPintar();
  }
}, { passive: false });

lienzo.addEventListener("touchend", () => {
  state.pintando = false;
});

if (!hayDibujo()) {
  mostrarPokemon(obtenerPokemonAleatorio());
}
