import { ESCALA_BASE } from "./config.js";

export const state = {
  matriz: [],
  paletaColores: {},
  paletaInversa: {},
  totales: {},
  pintados: {},
  colorSeleccionado: null,
  pintando: false,
  ancho: 0,
  alto: 0,
  escala: ESCALA_BASE
};

export function reiniciarEstado() {
  state.matriz = [];
  state.paletaColores = {};
  state.paletaInversa = {};
  state.totales = {};
  state.pintados = {};
  state.colorSeleccionado = null;
  state.pintando = false;
  state.ancho = 0;
  state.alto = 0;
  state.escala = ESCALA_BASE;
}

export function hayDibujo() {
  return state.matriz.length > 0;
}

export function totalCeldasPintables() {
  return Object.values(state.totales).reduce((acumulado, valor) => acumulado + valor, 0);
}

export function siguienteColorIncompleto() {
  const numeros = Object.keys(state.totales).map(Number).sort((a, b) => a - b);
  return numeros.find((numero) => (state.pintados[numero] || 0) < state.totales[numero]) ?? null;
}
