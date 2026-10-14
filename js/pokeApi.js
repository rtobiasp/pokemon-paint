export const TOTAL_POKEMON = 1025;

const URL_BASE_POKEAPI = "https://pokeapi.co/api/v2/pokemon";

export async function obtenerPokemon(numero) {
  const respuesta = await fetch(`${URL_BASE_POKEAPI}/${numero}`);
  if (!respuesta.ok) {
    throw new Error(`No existe el Pokémon número ${numero}`);
  }
  const datos = await respuesta.json();
  return {
    numero: datos.id,
    nombre: datos.name,
    imagen: datos.sprites.front_default
  };
}

export function numeroAleatorio() {
  return Math.floor(Math.random() * TOTAL_POKEMON) + 1;
}

export async function obtenerPokemonAleatorio() {
  return obtenerPokemon(numeroAleatorio());
}
