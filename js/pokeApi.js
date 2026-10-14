export const TOTAL_POKEMON = 1025;

const URL_BASE_POKEAPI = "https://pokeapi.co/api/v2/pokemon";
let catalogoPokemon;

export async function obtenerPokemon(numero) {
  const respuesta = await fetch(`${URL_BASE_POKEAPI}/${numero}`);
  if (!respuesta.ok) {
    throw new Error(`No existe el Pokémon número ${numero}`);
  }
  const datos = await respuesta.json();
  return {
    numero: datos.id,
    nombre: datos.name,
    imagen: datos.sprites.front_default,
  };
}

export async function obtenerPaginaPokemon(pagina, cantidad = 12) {
  const paginaSegura = Math.max(1, Math.floor(pagina));
  const respuesta = await fetch(
    `${URL_BASE_POKEAPI}?offset=${(paginaSegura - 1) * cantidad}&limit=${cantidad}`,
  );
  if (!respuesta.ok) {
    throw new Error("No se pudo cargar la Pokédex");
  }
  const datos = await respuesta.json();
  return {
    total: Math.min(datos.count, TOTAL_POKEMON),
    pokemon: datos.results
      .map((resultado) => {
        const numero = Number(resultado.url.match(/\/(\d+)\/$/)?.[1]);
        if (!numero || numero > TOTAL_POKEMON) return null;
        return {
          numero,
          nombre: resultado.name,
          imagen: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numero}.png`,
        };
      })
      .filter(Boolean),
  };
}

export async function obtenerCatalogoPokemon() {
  if (!catalogoPokemon) {
    catalogoPokemon = fetch(`${URL_BASE_POKEAPI}?limit=${TOTAL_POKEMON}`)
      .then((respuesta) => {
        if (!respuesta.ok) {
          throw new Error("No se pudo cargar el catálogo de Pokémon");
        }
        return respuesta.json();
      })
      .then((datos) =>
        datos.results
          .map((resultado) => {
            const numero = Number(resultado.url.match(/\/(\d+)\/$/)?.[1]);
            if (!numero || numero > TOTAL_POKEMON) return null;
            return {
              numero,
              nombre: resultado.name,
              imagen: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${numero}.png`,
            };
          })
          .filter(Boolean),
      )
      .catch((error) => {
        catalogoPokemon = undefined;
        throw error;
      });
  }
  return catalogoPokemon;
}

export function numeroAleatorio() {
  return Math.floor(Math.random() * TOTAL_POKEMON) + 1;
}

export async function obtenerPokemonAleatorio() {
  return obtenerPokemon(numeroAleatorio());
}
