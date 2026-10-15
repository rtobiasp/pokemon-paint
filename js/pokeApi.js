// Fuente de datos 100% local: ya no se llama a PokéAPI ni a raw.githubusercontent.
// Los datos se congelaron con `node scripts/download-assets.mjs` en data/pokemon.json
// y las imágenes viven en assets/sprites/<numero>.png.
export const TOTAL_POKEMON = 1025;

let catalogoPokemon;

export async function obtenerCatalogoPokemon() {
  if (!catalogoPokemon) {
    catalogoPokemon = fetch("data/pokemon.json")
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudo cargar el catálogo de Pokémon");
        }
        return respuesta.json();
      })
      .then((datos) =>
        Array.isArray(datos) ? datos : datos.pokemon || [],
      )
      .then((lista) =>
        lista
          .filter(
            (p) =>
              Number.isInteger(p.numero) &&
              p.numero > 0 &&
              p.numero <= TOTAL_POKEMON &&
              typeof p.nombre === "string",
          )
          .map((p) => ({
            numero: p.numero,
            nombre: p.nombre,
            imagen: `assets/sprites/${p.numero}.png`,
          })),
      )
      .catch((error) => {
        catalogoPokemon = undefined;
        throw error;
      });
  }
  return catalogoPokemon;
}

export async function obtenerPokemon(numero) {
  const catalogo = await obtenerCatalogoPokemon();
  const pokemon = catalogo.find((p) => p.numero === Number(numero));
  if (!pokemon) {
    throw new Error(`No existe el Pokémon número ${numero}`);
  }
  return pokemon;
}

export async function obtenerPaginaPokemon(pagina, cantidad = 12) {
  const paginaSegura = Math.max(1, Math.floor(pagina));
  const catalogo = await obtenerCatalogoPokemon();
  const inicio = (paginaSegura - 1) * cantidad;
  return {
    total: Math.min(catalogo.length, TOTAL_POKEMON),
    pokemon: catalogo.slice(inicio, inicio + cantidad),
  };
}

export function numeroAleatorio() {
  return Math.floor(Math.random() * TOTAL_POKEMON) + 1;
}

export async function obtenerPokemonAleatorio() {
  return obtenerPokemon(numeroAleatorio());
}
