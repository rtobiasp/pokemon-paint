import {
  obtenerCatalogoPokemon,
  obtenerPaginaPokemon,
  TOTAL_POKEMON,
} from "./pokeApi.js";

const grid = document.getElementById("pokemonGrid");
const errorHome = document.getElementById("errorHome");
const cargaInfinita = document.getElementById("cargaInfinita");
const buscador = document.getElementById("pokemonSearch");

const TAMANO_PAGINA = 12;
const CLAVE_PROGRESO = "pokemon-paint-progreso";
const UMBRAL_TRANSPARENCIA = 128;
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

function leerProgresos() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_PROGRESO) || "{}");
  } catch {
    return {};
  }
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

  const datos = document.createElement("span");
  datos.className = "pokemon-data";
  const numero = document.createElement("span");
  numero.className = "pokemon-number";
  numero.textContent = `Nº ${String(pokemon.numero).padStart(3, "0")}`;
  const nombre = document.createElement("span");
  nombre.className = "pokemon-name";
  nombre.textContent = nombreLegible(pokemon.nombre);
  const estado = document.createElement("span");
  estado.className = `pokemon-status${completado ? " completado" : enCurso ? " en-curso" : ""}`;
  estado.textContent = completado
    ? "Completado"
    : enCurso
      ? "En curso"
      : "Por empezar";
  datos.append(numero, nombre, estado);

  if (enCurso && progreso.total > 0) {
    const barra = document.createElement("progress");
    barra.max = progreso.total;
    barra.value = pintadas;
    const porcentaje = Math.max(
      1,
      Math.round((pintadas / progreso.total) * 100),
    );
    barra.setAttribute("aria-label", `${porcentaje}% completado`);
    datos.appendChild(barra);
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
  if (cargando || cargaFinalizada) return;
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
    if (consultaActual) {
      const catalogo = await obtenerCatalogoPokemon();
      if (version !== versionListado) return;
      const consulta = normalizarBusqueda(consultaActual);
      const coincidencias = catalogo.filter(({ nombre, numero }) =>
        normalizarBusqueda(nombre).includes(consulta) ||
        String(numero).includes(consulta),
      );
      totalPokemons = coincidencias.length;
      paginaPokemon = coincidencias.slice(
        (pagina - 1) * TAMANO_PAGINA,
        pagina * TAMANO_PAGINA,
      );
    } else {
      const resultado = await obtenerPaginaPokemon(pagina, TAMANO_PAGINA);
      if (version !== versionListado) return;
      totalPokemons = resultado.total;
      paginaPokemon = resultado.pokemon;
    }
    if (paginaPokemon.length === 0) {
      cargaFinalizada = true;
      cargaInfinita.textContent = totalPokemons
        ? "Has llegado al final."
        : "No se encontraron Pokémon.";
      return;
    }
    paginaActual = pagina;
    pokemons.push(...paginaPokemon);
    grid.append(
      ...paginaPokemon.map((pokemon) =>
        crearTarjeta(pokemon, leerProgresos()),
      ),
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
    if (version !== versionListado) cargarMasPokemon();
  }
}

buscador.addEventListener("input", () => {
  versionListado++;
  consultaActual = buscador.value.trim().toLocaleLowerCase().replace(/^#/, "");
  paginaActual = 0;
  totalPokemons = TOTAL_POKEMON;
  pokemons = [];
  cargaFinalizada = false;
  grid.replaceChildren();
  errorHome.hidden = true;
  cargaInfinita.textContent = consultaActual ? "Buscando Pokémon..." : "";
  document.querySelector(".home-view").scrollTo({ top: 0 });
  cargarMasPokemon();
});

if ("IntersectionObserver" in window) {
  const observador = new IntersectionObserver(
    (entradas) => {
      if (entradas.some((entrada) => entrada.isIntersecting)) {
        cargarMasPokemon();
      }
    },
    { root: document.querySelector(".home-view"), rootMargin: "500px 0px" },
  );
  observador.observe(cargaInfinita);
} else {
  document.querySelector(".home-view").addEventListener("scroll", () => {
    if (cargaInfinita.getBoundingClientRect().top < window.innerHeight + 500) {
      cargarMasPokemon();
    }
  });
}

window.addEventListener("pageshow", mostrarTarjetas);

cargarMasPokemon();
