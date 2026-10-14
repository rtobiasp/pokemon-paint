import { state, hayDibujo } from "./state.js";
import { cargarImagen, extraerMatriz } from "./imageProcessor.js";
import { configurarLienzo, dibujarTablero, intentarPintar } from "./board.js";
import { crearPaleta, actualizarProgreso } from "./palette.js";

const input = document.getElementById("subirImagen");
const lienzo = document.getElementById("lienzoJuego");
const contenedorPaleta = document.getElementById("paleta");
const mensajeVictoria = document.getElementById("mensaje-victoria");
const botonesEjemplo = document.querySelectorAll("[data-sprite]");

configurarLienzo(lienzo);

async function mostrarSprite(origen) {
  const imagen = await cargarImagen(origen);
  extraerMatriz(imagen);
  state.colorSeleccionado = null;
  crearPaleta(contenedorPaleta, mensajeVictoria);
  dibujarTablero();
}

function refrescarTrasPintar() {
  actualizarProgreso(contenedorPaleta, mensajeVictoria);
}

input.addEventListener("change", (evento) => {
  const archivo = evento.target.files[0];
  if (!archivo) {
    return;
  }
  mostrarSprite(URL.createObjectURL(archivo));
});

botonesEjemplo.forEach((boton) => {
  boton.addEventListener("click", () => {
    mostrarSprite(boton.dataset.sprite);
  });
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
  mostrarSprite("assets/sprites/pikachu-16.png");
}
