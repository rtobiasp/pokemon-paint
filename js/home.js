import {
  obtenerPaginaPokemon,
  obtenerPokemonAleatorio,
  TOTAL_POKEMON,
} from "./pokeApi.js";

const grid = document.getElementById("pokemonGrid");
const resumen = document.getElementById("resumenPagina");
const etiquetaPagina = document.getElementById("paginaEtiqueta");
const textoPagina = document.getElementById("paginaActual");
const btnAnterior = document.getElementById("btnPaginaAnterior");
const btnSiguiente = document.getElementById("btnPaginaSiguiente");
const btnAleatorio = document.getElementById("btnAleatorioHome");
const errorHome = document.getElementById("errorHome");

const TAMANO_PAGINA = 12;
const CLAVE_PROGRESO = "pokemon-paint-progreso";
const parametros = new URLSearchParams(window.location.search);
const paginaSolicitada = Number(parametros.get("pagina"));
let paginaActual =
  Number.isInteger(paginaSolicitada) && paginaSolicitada > 0
    ? paginaSolicitada
    : 1;
let totalPokemons = TOTAL_POKEMON;
let pokemons = [];

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

function crearTarjeta(pokemon, progresos) {
  const progreso = progresos[pokemon.numero];
  const pintadas = progreso?.pintadas?.length || 0;
  const completado = Boolean(progreso?.completado);
  const enCurso = !completado && pintadas > 0;
  const tarjeta = document.createElement("a");
  tarjeta.className = "pokemon-card";
  tarjeta.href = `pintar.html?pokemon=${pokemon.numero}&pagina=${paginaActual}`;
  tarjeta.setAttribute(
    "aria-label",
    `#${pokemon.numero} ${nombreLegible(pokemon.nombre)}, ${completado ? "completado" : enCurso ? "en curso" : "por empezar"}`,
  );

  const marco = document.createElement("span");
  marco.className = "pokemon-art";
  const imagen = document.createElement("img");
  imagen.src = pokemon.imagen;
  imagen.alt = "";
  imagen.loading = "lazy";
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

async function cargarPagina(pagina = paginaActual) {
  const ultimaPagina = Math.ceil(totalPokemons / TAMANO_PAGINA);
  paginaActual = Math.min(Math.max(1, pagina), ultimaPagina);
  grid.setAttribute("aria-busy", "true");
  resumen.textContent = "Cargando colección...";
  errorHome.hidden = true;
  btnAnterior.disabled = true;
  btnSiguiente.disabled = true;
  try {
    const resultado = await obtenerPaginaPokemon(paginaActual, TAMANO_PAGINA);
    totalPokemons = resultado.total;
    pokemons = resultado.pokemon;
    if (pokemons.length === 0 && paginaActual > 1) {
      return cargarPagina(paginaActual - 1);
    }
    const primero = (paginaActual - 1) * TAMANO_PAGINA + 1;
    const ultimo = Math.min(primero + pokemons.length - 1, totalPokemons);
    resumen.textContent = `${primero}–${ultimo} de ${totalPokemons}`;
    etiquetaPagina.textContent = `Página ${paginaActual}`;
    textoPagina.textContent = String(paginaActual);
    btnAnterior.disabled = paginaActual === 1;
    btnSiguiente.disabled = ultimo >= totalPokemons;
    mostrarTarjetas();
  } catch {
    resumen.textContent = "";
    errorHome.textContent =
      "No se pudo cargar la Pokédex. Comprueba tu conexión e inténtalo de nuevo.";
    errorHome.hidden = false;
    grid.replaceChildren();
  } finally {
    grid.removeAttribute("aria-busy");
  }
}

btnAnterior.addEventListener("click", () => cargarPagina(paginaActual - 1));
btnSiguiente.addEventListener("click", () => cargarPagina(paginaActual + 1));
btnAleatorio.addEventListener("click", async () => {
  btnAleatorio.disabled = true;
  try {
    const pokemon = await obtenerPokemonAleatorio();
    window.location.href = `pintar.html?pokemon=${pokemon.numero}&pagina=${paginaActual}`;
  } catch {
    errorHome.textContent =
      "No se pudo elegir un Pokémon. Comprueba tu conexión e inténtalo de nuevo.";
    errorHome.hidden = false;
  } finally {
    btnAleatorio.disabled = false;
  }
});
window.addEventListener("pageshow", mostrarTarjetas);

cargarPagina();
