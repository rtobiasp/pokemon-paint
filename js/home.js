import {
  obtenerCatalogoPokemon,
  obtenerPaginaPokemon,
  TOTAL_POKEMON,
} from "./pokeApi.js";

const grid = document.getElementById("pokemonGrid");
const errorHome = document.getElementById("errorHome");
const cargaInfinita = document.getElementById("cargaInfinita");
const buscador = document.getElementById("pokemonSearch");
const coleccionTitulo = document.getElementById("coleccionTitulo");
const coleccionDescripcion = document.getElementById("coleccionDescripcion");
const coleccionCantidad = document.getElementById("coleccionCantidad");
const progresoCantidad = document.getElementById("progresoCantidad");
const filtrosColeccion = document.getElementById("filtrosColeccion");
const regionesGrid = document.getElementById("coleccionRegiones");
const temasGrid = document.getElementById("coleccionTematicas");
const grupoRegiones = document.getElementById("grupoRegiones");
const grupoTematicas = document.getElementById("grupoTematicas");
const resumenColeccion = document.querySelector(".coleccion-resumen");
const panelDetalleColeccion = document.getElementById("coleccionDetalle");
const botonVolverColecciones = document.getElementById("volverColecciones");
const pestanas = [...document.querySelectorAll(".home-tab")];

const TAMANO_PAGINA = 12;
const RETRASO_BUSQUEDA_MS = 300;
const CLAVE_PROGRESO = "pokemon-paint-progreso";
const UMBRAL_TRANSPARENCIA = 128;
const REGIONES = {
  todas: {
    nombre: "Todas las regiones",
    desde: 1,
    hasta: TOTAL_POKEMON,
    portada: 25,
  },
  kanto: { nombre: "Kanto", desde: 1, hasta: 151, portada: 1 },
  johto: { nombre: "Johto", desde: 152, hasta: 251, portada: 152 },
  hoenn: { nombre: "Hoenn", desde: 252, hasta: 386, portada: 252 },
  sinnoh: { nombre: "Sinnoh", desde: 387, hasta: 493, portada: 387 },
  unova: { nombre: "Teselia", desde: 494, hasta: 649, portada: 495 },
  kalos: { nombre: "Kalos", desde: 650, hasta: 721, portada: 650 },
  alola: { nombre: "Alola", desde: 722, hasta: 809, portada: 722 },
  galar: { nombre: "Galar", desde: 810, hasta: 898, portada: 810 },
  hisui: { nombre: "Hisui", desde: 899, hasta: 905, portada: 899 },
  paldea: { nombre: "Paldea", desde: 906, hasta: 1025, portada: 906 },
};
const TEMAS = {
  todas: { nombre: "Todas las temáticas", numeros: null, portada: 25 },
  iniciales: {
    nombre: "Iniciales",
    portada: 1,
    numeros: new Set([
      1, 4, 7, 152, 155, 158, 252, 255, 258, 387, 390, 393, 495, 498, 501, 650,
      653, 656, 722, 725, 728, 810, 813, 816, 906, 909, 912,
    ]),
  },
  legendarios: {
    nombre: "Legendarios",
    portada: 150,
    numeros: new Set([
      144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382,
      383, 384, 480, 481, 482, 483, 484, 485, 486, 487, 488, 638, 639, 640, 641,
      642, 643, 644, 645, 646, 716, 717, 718, 772, 773, 785, 786, 787, 788, 789,
      790, 791, 792, 800, 888, 889, 890, 891, 892, 894, 895, 896, 897, 898, 905,
      1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024,
    ]),
  },
  miticos: {
    nombre: "Míticos",
    portada: 151,
    numeros: new Set([
      151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720,
      721, 801, 802, 807, 808, 809, 893, 1025,
    ]),
  },
  fossiles: {
    nombre: "Fósiles",
    portada: 142,
    numeros: new Set([
      138, 139, 140, 141, 142, 345, 346, 347, 348, 408, 409, 410, 411, 564, 565,
      566, 567, 696, 697, 698, 699, 880, 881, 882, 883,
    ]),
  },
  eevee: {
    nombre: "Familia Eevee",
    portada: 133,
    numeros: new Set([133, 134, 135, 196, 197, 470, 471, 700]),
  },
  paradoja: {
    nombre: "Paradoja",
    portada: 984,
    numeros: new Set([
      984, 985, 986, 987, 988, 989, 990, 991, 992, 993, 994, 995, 1005, 1006,
      1009, 1010, 1020, 1021, 1022,
    ]),
  },
};
const parametros = new URLSearchParams(window.location.search);
const pokemonSolicitado = Number(parametros.get("pokemon"));
const paginaSolicitada = Number(parametros.get("pagina"));
const pokemonRestaurado =
  Number.isInteger(pokemonSolicitado) &&
  pokemonSolicitado > 0 &&
  pokemonSolicitado <= TOTAL_POKEMON
    ? pokemonSolicitado
    : null;
const paginaInicial = pokemonRestaurado
  ? Math.ceil(pokemonRestaurado / TAMANO_PAGINA)
  : Number.isInteger(paginaSolicitada) && paginaSolicitada > 0
    ? paginaSolicitada
    : 1;
let paginaActual = Math.min(
  Math.max(0, paginaInicial - 1),
  Math.ceil(TOTAL_POKEMON / TAMANO_PAGINA) - 1,
);
let totalPokemons = TOTAL_POKEMON;
let pokemons = [];
let cargando = false;
let cargaFinalizada = false;
let versionListado = 0;
let consultaActual = "";
let temporizadorBusqueda = null;
let detalleActual = null;
let vistaActual =
  pokemonRestaurado || paginaSolicitada ? "pokedex" : "regiones";

function leerProgresos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_PROGRESO) || "{}");
  } catch {
    return {};
  }
}

function contarProgresosEnCurso() {
  return Object.values(leerProgresos()).filter(
    (progreso) =>
      !progreso?.completado &&
      Array.isArray(progreso?.pintadas) &&
      progreso.pintadas.length > 0,
  ).length;
}

function actualizarContadorProgreso() {
  progresoCantidad.textContent = String(contarProgresosEnCurso());
}

function crearTarjetaColeccion(tipo, clave, coleccion, progresos) {
  const numeros =
    tipo === "region"
      ? Array.from(
          { length: coleccion.hasta - coleccion.desde + 1 },
          (_, indice) => coleccion.desde + indice,
        )
      : coleccion.numeros
        ? [...coleccion.numeros]
        : Array.from({ length: TOTAL_POKEMON }, (_, indice) => indice + 1);
  const completados = numeros.filter(
    (numero) => progresos[numero]?.completado,
  ).length;
  const tarjeta = document.createElement("button");
  tarjeta.className = "coleccion-tarjeta";
  tarjeta.type = "button";
  tarjeta.dataset.coleccionTipo = tipo;
  tarjeta.dataset.coleccionValor = clave;
  tarjeta.setAttribute(
    "aria-label",
    `Abrir ${coleccion.nombre}: ${numeros.length} Pokémon, ${completados} completados`,
  );

  const portada = document.createElement("span");
  portada.className = "coleccion-portada";
  const imagen = document.createElement("img");
  imagen.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${coleccion.portada}.png`;
  imagen.alt = "";
  imagen.loading = "lazy";
  portada.appendChild(imagen);

  const datos = document.createElement("span");
  datos.className = "coleccion-datos";
  const nombre = document.createElement("span");
  nombre.className = "coleccion-nombre";
  nombre.textContent = coleccion.nombre;
  const metricas = document.createElement("span");
  metricas.className = "coleccion-metricas";
  const avance = document.createElement("span");
  avance.className = "coleccion-completados";
  avance.textContent = `${completados}/${numeros.length}`;
  const barra = document.createElement("progress");
  barra.className = "coleccion-avance";
  barra.max = numeros.length;
  barra.value = completados;
  barra.setAttribute(
    "aria-label",
    `${completados} de ${numeros.length} Pokémon completados`,
  );
  metricas.append(avance);
  datos.append(nombre, metricas, barra);
  tarjeta.append(portada, datos);
  return tarjeta;
}

function renderizarColecciones() {
  const progresos = leerProgresos();
  regionesGrid.replaceChildren(
    ...Object.entries(REGIONES)
      .filter(([clave]) => clave !== "todas")
      .map(([clave, coleccion]) =>
        crearTarjetaColeccion("region", clave, coleccion, progresos),
      ),
  );
  temasGrid.replaceChildren(
    ...Object.entries(TEMAS)
      .filter(([clave]) => clave !== "todas")
      .map(([clave, coleccion]) =>
        crearTarjetaColeccion("tema", clave, coleccion, progresos),
      ),
  );
}

function nombreLegible(nombre) {
  return nombre
    .split("-")
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(" ");
}

function normalizarBusqueda(valor) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/-/g, " ")
    .toLocaleLowerCase();
}

function filtrarCatalogo(catalogo) {
  const region =
    detalleActual?.tipo === "region"
      ? REGIONES[detalleActual.clave]
      : REGIONES.todas;
  const numerosTema =
    detalleActual?.tipo === "tema" ? TEMAS[detalleActual.clave].numeros : null;
  const consulta = normalizarBusqueda(consultaActual);
  const progresos = vistaActual === "a-medias" ? leerProgresos() : null;
  return catalogo.filter(
    ({ nombre, numero }) =>
      numero >= region.desde &&
      numero <= region.hasta &&
      (!numerosTema || numerosTema.has(numero)) &&
      (!progresos ||
        (!progresos[numero]?.completado &&
          Array.isArray(progresos[numero]?.pintadas) &&
          progresos[numero].pintadas.length > 0)) &&
      (!consulta ||
        normalizarBusqueda(nombre).includes(consulta) ||
        String(numero).includes(consulta)),
  );
}

function actualizarResumenColeccion() {
  coleccionTitulo.textContent = detalleActual
    ? detalleActual.tipo === "region"
      ? REGIONES[detalleActual.clave].nombre
      : TEMAS[detalleActual.clave].nombre
    : vistaActual === "a-medias"
      ? "En curso"
      : vistaActual === "pokedex"
        ? "Pokédex completa"
        : vistaActual === "regiones"
          ? "Regiones"
          : "Colecciones";
  coleccionDescripcion.textContent = consultaActual
    ? `Resultados para «${buscador.value.trim()}»`
    : detalleActual
      ? "Pokémon de esta colección."
      : vistaActual === "a-medias"
        ? "Continúa con los Pokémon que ya empezaste."
        : vistaActual === "pokedex"
          ? "Todos los Pokémon disponibles."
          : "Elige una colección para ver sus Pokémon.";
  coleccionCantidad.textContent = `${new Intl.NumberFormat("es-ES").format(totalPokemons)} Pokémon`;
}

function esPortadaColecciones() {
  return (
    !detalleActual &&
    (vistaActual === "regiones" || vistaActual === "colecciones")
  );
}

function actualizarInterfazColecciones() {
  const mostrarPortadas = esPortadaColecciones();
  filtrosColeccion.hidden = !mostrarPortadas;
  grupoRegiones.hidden = !mostrarPortadas || vistaActual !== "regiones";
  grupoTematicas.hidden = !mostrarPortadas || vistaActual !== "colecciones";
  panelDetalleColeccion.hidden = !detalleActual;
  resumenColeccion.hidden = mostrarPortadas;
  grid.hidden = mostrarPortadas;
  cargaInfinita.hidden = mostrarPortadas;
  if (detalleActual) {
    botonVolverColecciones.querySelector("span:last-child").textContent =
      detalleActual.tipo === "region"
        ? "Volver a regiones"
        : "Volver a colecciones";
  }
  actualizarResumenColeccion();
}

function reiniciarListado() {
  versionListado++;
  paginaActual = 0;
  totalPokemons = TOTAL_POKEMON;
  pokemons = [];
  cargaFinalizada = false;
  grid.replaceChildren();
  errorHome.hidden = true;
  actualizarResumenColeccion();
  document.querySelector(".home-view").scrollTo({ top: 0 });
}

function mostrarProgresoEnMiniatura(imagen, progreso) {
  const pintadas = progreso?.pintadas;
  if (progreso?.completado) return;
  if (!Array.isArray(pintadas) || pintadas.length === 0) {
    imagen.classList.add("sin-colorear");
    return;
  }

  imagen.addEventListener(
    "load",
    () => {
      const lienzo = document.createElement("canvas");
      lienzo.width = imagen.naturalWidth;
      lienzo.height = imagen.naturalHeight;
      const contexto = lienzo.getContext("2d", { willReadFrequently: true });
      if (!contexto) return;
      contexto.drawImage(imagen, 0, 0);

      let datos;
      try {
        datos = contexto.getImageData(0, 0, lienzo.width, lienzo.height);
      } catch {
        imagen.classList.add("sin-colorear");
        return;
      }

      let minimoX = lienzo.width;
      let minimoY = lienzo.height;
      let maximoX = -1;
      let maximoY = -1;
      for (let y = 0; y < lienzo.height; y++) {
        for (let x = 0; x < lienzo.width; x++) {
          const alfa = datos.data[(y * lienzo.width + x) * 4 + 3];
          if (alfa < UMBRAL_TRANSPARENCIA) continue;
          minimoX = Math.min(minimoX, x);
          minimoY = Math.min(minimoY, y);
          maximoX = Math.max(maximoX, x);
          maximoY = Math.max(maximoY, y);
        }
      }

      const ancho = maximoX - minimoX + 1;
      const alto = maximoY - minimoY + 1;
      if (ancho !== progreso.ancho || alto !== progreso.alto) {
        imagen.classList.add("sin-colorear");
        return;
      }

      const indicesPintados = new Set(pintadas);
      for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
          if (indicesPintados.has(y * ancho + x)) continue;
          const indice = ((y + minimoY) * lienzo.width + x + minimoX) * 4;
          const gris = Math.round(
            datos.data[indice] * 0.299 +
              datos.data[indice + 1] * 0.587 +
              datos.data[indice + 2] * 0.114,
          );
          datos.data[indice] = gris;
          datos.data[indice + 1] = gris;
          datos.data[indice + 2] = gris;
        }
      }
      contexto.putImageData(datos, 0, 0);
      lienzo.className = imagen.className;
      lienzo.setAttribute("role", "img");
      lienzo.setAttribute("aria-label", imagen.alt || "");
      imagen.replaceWith(lienzo);
    },
    { once: true },
  );
  if (imagen.complete && imagen.naturalWidth > 0) {
    imagen.dispatchEvent(new Event("load"));
  }
}

function crearTarjeta(pokemon, progresos) {
  const progreso = progresos[pokemon.numero];
  const pintadas = progreso?.pintadas?.length || 0;
  const completado = Boolean(progreso?.completado);
  const enCurso = !completado && pintadas > 0;
  const tarjeta = document.createElement("a");
  tarjeta.className = "pokemon-card";
  tarjeta.dataset.pokemon = String(pokemon.numero);
  tarjeta.href = `pintar.html?pokemon=${pokemon.numero}`;
  tarjeta.setAttribute(
    "aria-label",
    `#${pokemon.numero} ${nombreLegible(pokemon.nombre)}, ${completado ? "completado" : enCurso ? "en curso" : "por empezar"}`,
  );

  const marco = document.createElement("span");
  marco.className = "pokemon-art";
  const imagen = document.createElement("img");
  imagen.alt = "";
  imagen.loading = "lazy";
  imagen.crossOrigin = "anonymous";
  imagen.classList.add("pokemon-thumbnail");
  mostrarProgresoEnMiniatura(imagen, progreso);
  imagen.src = pokemon.imagen;
  marco.appendChild(imagen);
  if (completado) {
    const marcaCompletado = document.createElement("span");
    marcaCompletado.className = "pokemon-completado";
    marcaCompletado.setAttribute("aria-hidden", "true");
    marco.appendChild(marcaCompletado);
  }

  const datos = document.createElement("span");
  datos.className = "pokemon-data";
  const numero = document.createElement("span");
  numero.className = "pokemon-number";
  numero.textContent = `Nº ${String(pokemon.numero).padStart(3, "0")}`;
  const nombre = document.createElement("span");
  nombre.className = "pokemon-name";
  nombre.textContent = nombreLegible(pokemon.nombre);
  datos.append(numero, nombre);

  if (enCurso) {
    const estado = document.createElement("span");
    estado.className = "pokemon-status en-curso";
    estado.textContent = "En progreso";
    datos.appendChild(estado);

    if (progreso.total > 0) {
      const barra = document.createElement("progress");
      barra.max = progreso.total;
      barra.value = pintadas;
      const porcentaje = Math.round((pintadas / progreso.total) * 100);
      barra.setAttribute("aria-label", `${porcentaje}% completado`);
      datos.appendChild(barra);
    }
  }

  tarjeta.append(marco, datos);
  return tarjeta;
}

function mostrarTarjetas() {
  const progresos = leerProgresos();
  grid.replaceChildren(
    ...pokemons.map((pokemon) => crearTarjeta(pokemon, progresos)),
  );
}

async function cargarMasPokemon() {
  if (
    esPortadaColecciones() ||
    cargando ||
    cargaFinalizada ||
    temporizadorBusqueda !== null
  ) {
    return;
  }
  const version = versionListado;
  const pagina = paginaActual + 1;
  const ultimaPagina = Math.ceil(totalPokemons / TAMANO_PAGINA);
  if (pagina > ultimaPagina) {
    cargaFinalizada = true;
    cargaInfinita.textContent = "Has llegado al final.";
    return;
  }

  cargando = true;
  grid.setAttribute("aria-busy", "true");
  cargaInfinita.textContent = pokemons.length
    ? "Cargando más Pokémon..."
    : "Cargando colección...";
  errorHome.hidden = true;
  try {
    let paginaPokemon;
    if (vistaActual === "a-medias" || detalleActual || consultaActual) {
      const catalogo = await obtenerCatalogoPokemon();
      if (version !== versionListado) return;
      const coincidencias = filtrarCatalogo(catalogo);
      totalPokemons = coincidencias.length;
      actualizarResumenColeccion();
      paginaPokemon = coincidencias.slice(
        (pagina - 1) * TAMANO_PAGINA,
        pagina * TAMANO_PAGINA,
      );
    } else {
      const resultado = await obtenerPaginaPokemon(pagina, TAMANO_PAGINA);
      if (version !== versionListado) return;
      totalPokemons = resultado.total;
      actualizarResumenColeccion();
      paginaPokemon = resultado.pokemon;
    }
    if (paginaPokemon.length === 0) {
      cargaFinalizada = true;
      cargaInfinita.textContent = totalPokemons
        ? "Has llegado al final."
        : vistaActual === "a-medias"
          ? "Aún no tienes Pokémon a medias. Empieza a colorear uno y aparecerá aquí."
          : "No se encontraron Pokémon.";
      return;
    }
    paginaActual = pagina;
    pokemons.push(...paginaPokemon);
    grid.append(
      ...paginaPokemon.map((pokemon) => crearTarjeta(pokemon, leerProgresos())),
    );
    if (
      pokemonRestaurado &&
      paginaPokemon.some(({ numero }) => numero === pokemonRestaurado)
    ) {
      requestAnimationFrame(() => {
        grid
          .querySelector(`[data-pokemon="${pokemonRestaurado}"]`)
          ?.scrollIntoView({ block: "center" });
      });
    }
    if (paginaActual >= Math.ceil(totalPokemons / TAMANO_PAGINA)) {
      cargaFinalizada = true;
      cargaInfinita.textContent = "Has llegado al final.";
    } else {
      cargaInfinita.textContent = "";
    }
  } catch {
    if (version === versionListado) {
      errorHome.textContent =
        "No se pudo cargar la Pokédex. Comprueba tu conexión e inténtalo de nuevo.";
      errorHome.hidden = false;
    }
  } finally {
    grid.removeAttribute("aria-busy");
    cargando = false;
    if (version !== versionListado && temporizadorBusqueda === null) {
      cargarMasPokemon();
    }
  }
}

buscador.addEventListener("input", () => {
  consultaActual = buscador.value.trim().toLocaleLowerCase().replace(/^#/, "");
  if (consultaActual && esPortadaColecciones()) {
    actualizarPestanas("pokedex");
    actualizarInterfazColecciones();
  }
  reiniciarListado();
  cargaInfinita.textContent = consultaActual ? "Preparando búsqueda..." : "";
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = setTimeout(() => {
    temporizadorBusqueda = null;
    cargaInfinita.textContent = consultaActual ? "Buscando Pokémon..." : "";
    cargarMasPokemon();
  }, RETRASO_BUSQUEDA_MS);
});

function actualizarPestanas(vista, enfocar = false) {
  vistaActual = vista;
  pestanas.forEach((pestana) => {
    const seleccionada = pestana.dataset.vista === vista;
    pestana.setAttribute("aria-selected", String(seleccionada));
    pestana.tabIndex = seleccionada ? 0 : -1;
    if (seleccionada && enfocar) pestana.focus();
  });
  document
    .getElementById("panel-pokedex")
    .setAttribute(
      "aria-labelledby",
      pestanas.find((pestana) => pestana.dataset.vista === vista).id,
    );
}

function seleccionarVista(vista, enfocar = false) {
  detalleActual = null;
  actualizarPestanas(vista, enfocar);
  actualizarInterfazColecciones();
  buscador.placeholder =
    vista === "a-medias"
      ? "Buscar entre tus Pokémon empezados"
      : "Nombre o número";
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = null;
  actualizarContadorProgreso();
  reiniciarListado();
  if (!esPortadaColecciones()) cargarMasPokemon();
}

function abrirColeccion(tipo, clave) {
  detalleActual = { tipo, clave };
  buscador.value = "";
  consultaActual = "";
  clearTimeout(temporizadorBusqueda);
  temporizadorBusqueda = null;
  actualizarPestanas(tipo === "region" ? "regiones" : "colecciones");
  actualizarInterfazColecciones();
  reiniciarListado();
  cargarMasPokemon();
}

function volverAColecciones() {
  detalleActual = null;
  actualizarInterfazColecciones();
  reiniciarListado();
}

pestanas.forEach((pestana, indice) => {
  pestana.addEventListener("click", () => {
    seleccionarVista(pestana.dataset.vista);
  });
  pestana.addEventListener("keydown", (evento) => {
    let siguienteIndice = indice;
    if (evento.key === "ArrowRight")
      siguienteIndice = (indice + 1) % pestanas.length;
    if (evento.key === "ArrowLeft") {
      siguienteIndice = (indice - 1 + pestanas.length) % pestanas.length;
    }
    if (evento.key === "Home") siguienteIndice = 0;
    if (evento.key === "End") siguienteIndice = pestanas.length - 1;
    if (siguienteIndice === indice) return;
    evento.preventDefault();
    seleccionarVista(pestanas[siguienteIndice].dataset.vista, true);
  });
});

document.querySelector(".colecciones").addEventListener("click", (evento) => {
  const boton = evento.target.closest(".coleccion-tarjeta");
  if (!boton) return;
  const { coleccionTipo, coleccionValor } = boton.dataset;
  abrirColeccion(coleccionTipo, coleccionValor);
});

botonVolverColecciones.addEventListener("click", volverAColecciones);

const homeView = document.querySelector(".home-view");

if ("IntersectionObserver" in window) {
  const observador = new IntersectionObserver(
    (entradas) => {
      if (entradas.some((entrada) => entrada.isIntersecting)) {
        cargarMasPokemon();
      }
    },
    { root: homeView, rootMargin: "500px 0px" },
  );
  observador.observe(cargaInfinita);
}

homeView.addEventListener(
  "scroll",
  () => {
    if (
      cargaInfinita.getBoundingClientRect().top <
      homeView.getBoundingClientRect().bottom + 500
    ) {
      cargarMasPokemon();
    }
  },
  { passive: true },
);

window.addEventListener("pageshow", (evento) => {
  actualizarContadorProgreso();
  renderizarColecciones();
  actualizarInterfazColecciones();
  if (evento.persisted && !esPortadaColecciones()) {
    reiniciarListado();
    cargarMasPokemon();
    return;
  }
  mostrarTarjetas();
});

actualizarContadorProgreso();
renderizarColecciones();
actualizarPestanas(vistaActual);
actualizarInterfazColecciones();
if (!esPortadaColecciones()) cargarMasPokemon();
