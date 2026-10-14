import {
  state,
  hayDibujo,
  siguienteColorIncompleto,
  totalCeldasPintables,
} from "./state.js";
import { cargarImagen, extraerMatriz } from "./imageProcessor.js";
import { obtenerPokemon, obtenerPokemonAleatorio } from "./pokeApi.js";
import {
  configurarLienzo,
  dibujarTablero,
  celdaEsPintable,
  intentarPintar,
  deshacerPintado,
  rehacerPintado,
  zoomAnclado,
  zoomAescala,
  encajarZoom,
  porcentajeZoom,
} from "./board.js";
import {
  crearPaleta,
  actualizarProgreso,
  sincronizarActivos,
} from "./palette.js";
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
const progresoBarra = document.getElementById("progresoBarra");
const progresoTexto = document.getElementById("progresoTexto");
const btnDeshacer = document.getElementById("btnDeshacer");
const btnRehacer = document.getElementById("btnRehacer");
const avisoJuego = document.getElementById("avisoJuego");
const efectoVictoria = document.getElementById("efectoVictoria");
const contenedorTablero = lienzo.closest(".tablero-contenedor");

let paneo = null;
let espacioPulsado = false;
let temporizadorAviso = null;
const punterosTactiles = new Map();
let inicioToque = null;
let gestoMultidedo = null;
let huboMultidedo = false;
let frameGestoMultidedo = null;
let victoriaEnCurso = false;
let animacionEncuadre = null;
let temporizadorConfeti = null;

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
  cancelarCelebracion();
  victoriaEnCurso = false;
  const imagen = await cargarImagen(origen);
  extraerMatriz(imagen);
  state.colorSeleccionado = siguienteColorIncompleto();
  crearPaleta(contenedorPaleta, mensajeVictoria);
  encajarZoom();
  dibujarTablero();
  actualizarZoom();
  actualizarProgresoGlobal();
  actualizarControlesHistorial();
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
  const colorAnterior = state.colorSeleccionado;
  actualizarProgreso(contenedorPaleta, mensajeVictoria);
  actualizarProgresoGlobal();
  actualizarControlesHistorial();
  if (colorAnterior !== null && colorAnterior !== state.colorSeleccionado) {
    mostrarAviso(
      state.colorSeleccionado === null
        ? "¡Imagen completada!"
        : `¡Color ${colorAnterior} completado!`,
    );
  }
  if (!mensajeVictoria.hidden) {
    celebrarVictoria();
  } else {
    victoriaEnCurso = false;
  }
}

function actualizarProgresoGlobal() {
  const total = totalCeldasPintables();
  const pintadas = Object.values(state.pintados).reduce(
    (suma, cantidad) => suma + cantidad,
    0,
  );
  progresoBarra.max = Math.max(1, total);
  progresoBarra.value = pintadas;
  progresoTexto.textContent = `${pintadas} / ${total}`;
}

function actualizarControlesHistorial() {
  btnDeshacer.disabled = state.historialPintado.length === 0;
  btnRehacer.disabled = state.historialRehacer.length === 0;
}

function mostrarAviso(texto) {
  avisoJuego.textContent = texto;
  avisoJuego.hidden = false;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => {
    avisoJuego.hidden = true;
  }, 1800);
}

function aplicarHistorial(accion) {
  if (!accion()) {
    return;
  }
  actualizarProgreso(contenedorPaleta, mensajeVictoria);
  sincronizarActivos(contenedorPaleta);
  actualizarProgresoGlobal();
  actualizarControlesHistorial();
  if (mensajeVictoria.hidden) {
    cancelarCelebracion();
    victoriaEnCurso = false;
  } else {
    celebrarVictoria();
  }
}

function centrarLienzo() {
  const rectTablero = contenedorTablero.getBoundingClientRect();
  const rectLienzo = lienzo.getBoundingClientRect();
  const centroX =
    rectTablero.left +
    contenedorTablero.clientLeft +
    contenedorTablero.clientWidth / 2;
  const centroY =
    rectTablero.top +
    contenedorTablero.clientTop +
    contenedorTablero.clientHeight / 2;
  contenedorTablero.scrollLeft +=
    rectLienzo.left + rectLienzo.width / 2 - centroX;
  contenedorTablero.scrollTop +=
    rectLienzo.top + rectLienzo.height / 2 - centroY;
}

function crearConfeti() {
  clearTimeout(temporizadorConfeti);
  efectoVictoria.replaceChildren();
  const colores = ["#198754", "#f3c84b", "#e86e59", "#4a90c2", "#ec7caa"];
  const reducido = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const cantidad = reducido ? 12 : 54;
  for (let indice = 0; indice < cantidad; indice++) {
    const particula = document.createElement("span");
    particula.className = "particula-confeti";
    particula.style.left = `${Math.random() * 100}%`;
    particula.style.backgroundColor = colores[indice % colores.length];
    particula.style.setProperty(
      "--deriva",
      `${Math.round(Math.random() * 180 - 90)}px`,
    );
    particula.style.setProperty(
      "--giro",
      `${Math.round(Math.random() * 900 - 450)}deg`,
    );
    particula.style.setProperty(
      "--retardo",
      `${Math.round(Math.random() * 300)}ms`,
    );
    efectoVictoria.appendChild(particula);
  }
  temporizadorConfeti = setTimeout(
    () => efectoVictoria.replaceChildren(),
    2600,
  );
}

function cancelarCelebracion() {
  animacionEncuadre?.cancel();
  animacionEncuadre = null;
  clearTimeout(temporizadorConfeti);
  efectoVictoria.replaceChildren();
  lienzo.style.transform = "";
}

function celebrarVictoria() {
  if (victoriaEnCurso) return;
  victoriaEnCurso = true;
  const escalaAnterior = state.escala;
  encajarZoom();
  dibujarTablero();
  actualizarZoom();
  centrarLienzo();

  const escalaInicial = escalaAnterior / state.escala;
  const movimientoReducido = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (
    !movimientoReducido &&
    escalaInicial > 1.01 &&
    typeof lienzo.animate === "function"
  ) {
    animacionEncuadre = lienzo.animate(
      [
        {
          transform: `scale(${escalaInicial})`,
          filter: "brightness(1) saturate(1)",
        },
        { transform: "scale(1)", filter: "brightness(1.08) saturate(1.3)" },
        { transform: "scale(1)", filter: "brightness(1) saturate(1)" },
      ],
      { duration: 1150, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
    );
  }
  crearConfeti();
}

btnDeshacer.addEventListener("click", () => aplicarHistorial(deshacerPintado));
btnRehacer.addEventListener("click", () => aplicarHistorial(rehacerPintado));

window.addEventListener("keydown", (evento) => {
  if (escribiendo(evento) || (!evento.ctrlKey && !evento.metaKey)) {
    return;
  }
  if (evento.code === "KeyZ") {
    evento.preventDefault();
    aplicarHistorial(evento.shiftKey ? rehacerPintado : deshacerPintado);
  } else if (evento.code === "KeyY") {
    evento.preventDefault();
    aplicarHistorial(rehacerPintado);
  }
});

function escribiendo(evento) {
  const destino = evento.target;
  return (
    destino && (destino.tagName === "INPUT" || destino.tagName === "TEXTAREA")
  );
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

window.addEventListener(
  "keydown",
  (evento) => {
    if (evento.code !== "Space" || escribiendo(evento)) {
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
  if (evento.pointerType === "touch") {
    lienzo.setPointerCapture(evento.pointerId);
    punterosTactiles.set(evento.pointerId, {
      x: evento.clientX,
      y: evento.clientY,
    });
    if (punterosTactiles.size === 2) {
      iniciarGestoMultidedo();
      return;
    }
    if (punterosTactiles.size === 1) {
      inicioToque = {
        x: evento.clientX,
        y: evento.clientY,
        modo: celdaEsPintable(evento) ? "pintar" : "pendiente-paneo",
        izquierda: contenedorTablero.scrollLeft,
        arriba: contenedorTablero.scrollTop,
        inicioPintado: false,
      };
      state.pintando = inicioToque.modo === "pintar";
    }
    return;
  }
  if (!evento.isPrimary) return;
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

function obtenerGestoMultidedo() {
  const puntos = [...punterosTactiles.values()].slice(0, 2);
  if (puntos.length < 2) return null;
  return {
    x: (puntos[0].x + puntos[1].x) / 2,
    y: (puntos[0].y + puntos[1].y) / 2,
    distancia: Math.hypot(puntos[1].x - puntos[0].x, puntos[1].y - puntos[0].y),
  };
}

function iniciarGestoMultidedo() {
  const gesto = obtenerGestoMultidedo();
  gestoMultidedo = {
    ...gesto,
    distanciaInicial: gesto.distancia,
    escalaInicial: state.escala,
  };
  inicioToque = null;
  state.pintando = false;
  paneo = null;
  huboMultidedo = true;
}

function actualizarGestoMultidedo() {
  const actual = obtenerGestoMultidedo();
  if (!actual || !gestoMultidedo) return;
  const escalaObjetivo =
    gestoMultidedo.distanciaInicial > 0
      ? (gestoMultidedo.escalaInicial * actual.distancia) /
        gestoMultidedo.distanciaInicial
      : state.escala;
  const escalaAnterior = state.escala;
  zoomAescala(escalaObjetivo, gestoMultidedo.x, gestoMultidedo.y);
  if (state.escala !== escalaAnterior) actualizarZoom();
  contenedorTablero.scrollLeft -= actual.x - gestoMultidedo.x;
  contenedorTablero.scrollTop -= actual.y - gestoMultidedo.y;
  gestoMultidedo = {
    ...actual,
    distanciaInicial: gestoMultidedo.distanciaInicial,
    escalaInicial: gestoMultidedo.escalaInicial,
  };
}

function programarGestoMultidedo() {
  if (frameGestoMultidedo !== null) return;
  frameGestoMultidedo = requestAnimationFrame(() => {
    frameGestoMultidedo = null;
    actualizarGestoMultidedo();
  });
}

function procesarGestoPendiente() {
  if (frameGestoMultidedo === null) return;
  cancelAnimationFrame(frameGestoMultidedo);
  frameGestoMultidedo = null;
  actualizarGestoMultidedo();
}

lienzo.addEventListener("pointermove", (evento) => {
  if (paneo) {
    contenedorTablero.scrollLeft = paneo.izquierda - (evento.clientX - paneo.x);
    contenedorTablero.scrollTop = paneo.arriba - (evento.clientY - paneo.y);
    return;
  }
  if (
    evento.pointerType === "touch" &&
    punterosTactiles.has(evento.pointerId)
  ) {
    punterosTactiles.set(evento.pointerId, {
      x: evento.clientX,
      y: evento.clientY,
    });
    if (punterosTactiles.size >= 2) {
      if (!gestoMultidedo) iniciarGestoMultidedo();
      else programarGestoMultidedo();
      return;
    }
    if (huboMultidedo || !inicioToque) return;
    const movimientoX = evento.clientX - inicioToque.x;
    const movimientoY = evento.clientY - inicioToque.y;
    const distanciaMovimiento = Math.hypot(movimientoX, movimientoY);
    if (inicioToque.modo === "pendiente-paneo" && distanciaMovimiento > 7) {
      inicioToque.modo = "paneo";
      state.pintando = false;
      paneo = {
        x: inicioToque.x,
        y: inicioToque.y,
        izquierda: inicioToque.izquierda,
        arriba: inicioToque.arriba,
      };
    }
    if (inicioToque.modo === "paneo") {
      contenedorTablero.scrollLeft = paneo.izquierda - movimientoX;
      contenedorTablero.scrollTop = paneo.arriba - movimientoY;
      return;
    }
    if (!inicioToque.inicioPintado && distanciaMovimiento > 2) {
      inicioToque.inicioPintado = true;
      if (intentarPintar({ clientX: inicioToque.x, clientY: inicioToque.y })) {
        refrescarTrasPintar();
      }
    }
    if (state.pintando && intentarPintar(evento)) refrescarTrasPintar();
    return;
  }
  if (state.pintando && intentarPintar(evento)) {
    refrescarTrasPintar();
  }
});

function finalizarPuntero(evento) {
  if (evento.pointerType === "touch") {
    if (!punterosTactiles.has(evento.pointerId)) return;
    if (evento.type === "pointerup") {
      punterosTactiles.set(evento.pointerId, {
        x: evento.clientX,
        y: evento.clientY,
      });
    }
    procesarGestoPendiente();
    if (
      evento.type === "pointerup" &&
      punterosTactiles.size === 1 &&
      !huboMultidedo &&
      inicioToque &&
      inicioToque.modo === "pintar" &&
      !inicioToque.inicioPintado &&
      intentarPintar(evento)
    ) {
      refrescarTrasPintar();
    }
    punterosTactiles.delete(evento.pointerId);
    if (punterosTactiles.size === 0) {
      state.pintando = false;
      paneo = null;
      inicioToque = null;
      gestoMultidedo = null;
      huboMultidedo = false;
    } else if (punterosTactiles.size === 1) {
      state.pintando = false;
      paneo = null;
      inicioToque = null;
      gestoMultidedo = null;
      huboMultidedo = true;
    }
    actualizarCursor();
    return;
  }
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
