import {
  mkdirSync,
  writeFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SPRITES_DIR = resolve(root, "assets", "sprites");
const DATA_DIR = resolve(root, "data");
const FONTS_DIR = resolve(root, "fonts");
const TOTAL_POKEMON = 1025;

const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");

// Modo --check: verificación 100% local, sin red.
if (checkOnly) {
  const errores = [];
  try {
    const datos = JSON.parse(
      readFileSync(resolve(DATA_DIR, "pokemon.json"), "utf8"),
    );
    const lista = Array.isArray(datos) ? datos : datos.pokemon || [];
    if (lista.length !== TOTAL_POKEMON) {
      errores.push(`data/pokemon.json tiene ${lista.length}/${TOTAL_POKEMON}`);
    }
  } catch {
    errores.push("data/pokemon.json ausente o inválido");
  }
  try {
    const n = readdirSync(SPRITES_DIR).filter((f) => f.endsWith(".png")).length;
    if (n !== TOTAL_POKEMON) errores.push(`sprites: ${n}/${TOTAL_POKEMON} PNG`);
  } catch {
    errores.push("assets/sprites/ ausente");
  }
  for (const f of ["fonts.css", "nunito-sans-latin.woff2", "press-start-2p-400-latin.woff2"]) {
    if (!existsSync(resolve(FONTS_DIR, f))) errores.push(`fonts/${f} ausente`);
  }
  if (errores.length > 0) {
    console.error("Assets incompletos:\n- " + errores.join("\n- "));
    console.error("Ejecuta: npm run assets");
    process.exit(1);
  }
  console.log(`✓ assets locales completos (${TOTAL_POKEMON} sprites + datos + fuentes)`);
  process.exit(0);
}

mkdirSync(SPRITES_DIR, { recursive: true });
mkdirSync(DATA_DIR, { recursive: true });
mkdirSync(FONTS_DIR, { recursive: true });

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

async function downloadFile(url, dest, { binary = true } = {}) {
  const res = await fetch(url, {
    headers: { "User-Agent": "PintaDex-asset-downloader/1.0" },
  });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (!binary && buffer.length === 0) throw new Error(`Empty ${url}`);
  writeFileSync(dest, buffer);
  return buffer;
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  let failed = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = await fn(items[i], i);
      } catch (error) {
        failed++;
        console.error(`  ✗ ${items[i]}: ${error.message}`);
      }
      if ((i + 1) % 100 === 0) console.log(`  ... ${i + 1}/${items.length}`);
    }
  }
  await Promise.all(Array.from({ length: limit }, worker));
  if (failed > 0) throw new Error(`${failed} descargas fallaron`);
  return results;
}

// 1. Catálogo PokéAPI (solo se usa en tiempo de build para congelar datos)
console.log(`Descargando catálogo (${TOTAL_POKEMON}) desde PokéAPI...`);
const catalogo = await fetchJson(
  `https://pokeapi.co/api/v2/pokemon?limit=${TOTAL_POKEMON}`,
);

const pokemon = catalogo.results
  .map((r) => {
    const numero = Number(r.url.match(/\/(\d+)\/$/)?.[1]);
    if (!numero || numero > TOTAL_POKEMON) return null;
    return {
      numero,
      nombre: r.name,
      imagen: `assets/sprites/${numero}.png`,
    };
  })
  .filter(Boolean)
  .sort((a, b) => a.numero - b.numero);

if (pokemon.length !== TOTAL_POKEMON) {
  throw new Error(
    `Catálogo incompleto: ${pokemon.length}/${TOTAL_POKEMON}. Abortado.`,
  );
}

writeFileSync(
  resolve(DATA_DIR, "pokemon.json"),
  JSON.stringify(pokemon, null, 2) + "\n",
);
console.log(`✓ data/pokemon.json (${pokemon.length} entradas)`);

// 2. Sprites front_default (solo descarga los que falten para ser re-ejecutable)
const faltantes = pokemon.filter(
  (p) => !existsSync(resolve(SPRITES_DIR, `${p.numero}.png`)),
);
console.log(`Descargando ${faltantes.length} sprites...`);
await mapLimit(faltantes, 10, async (p) => {
  await downloadFile(
    `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.numero}.png`,
    resolve(SPRITES_DIR, `${p.numero}.png`),
  );
});
console.log(`✓ sprites en assets/sprites/`);

// 3. Fuentes (subset latin, woff2) para no depender de Google Fonts en runtime
console.log("Descargando fuentes (latin)...");
const cssUrl =
  "https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&family=Press+Start+2P&display=swap";
const cssRes = await fetch(cssUrl, {
  headers: {
    // UA moderno para obtener woff2
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
  },
});
if (!cssRes.ok) throw new Error(`Fonts CSS -> ${cssRes.status}`);
const css = await cssRes.text();

// Nos quedamos solo con los bloques /* latin */ (último de cada familia/peso)
const bloques = css.split("/*").slice(1);
const latinBlocks = bloques
  .map((b) => "/*" + b)
  .filter((b) => b.startsWith("/* latin */"));

// Google puede servir la misma URL variable para varios pesos: agrupar por URL.
// Si una URL cubre varios pesos, se guarda una sola vez como <slug>-latin.woff2.
const entradas = [];
for (const b of latinBlocks) {
  const family = b.match(/font-family:\s*'([^']+)'/)?.[1];
  const weight = b.match(/font-weight:\s*(\d+)/)?.[1] ?? "400";
  const url = b.match(/url\((https:[^)]+\.woff2)\)/)?.[1];
  if (!family || !url) continue;
  entradas.push({ family, weight, url });
}
const porUrl = new Map();
for (const e of entradas) {
  if (!porUrl.has(e.url)) porUrl.set(e.url, []);
  porUrl.get(e.url).push(e);
}
// Limpia woff2 previos para no dejar restos de esquemas anteriores.
for (const f of readdirSync(FONTS_DIR)) {
  if (f.endsWith(".woff2")) rmSync(resolve(FONTS_DIR, f), { force: true });
}
const fontCssLines = [];
for (const [url, grupo] of porUrl) {
  const { family } = grupo[0];
  const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const file =
    grupo.length > 1
      ? `${slug}-latin.woff2`
      : `${slug}-${grupo[0].weight}-latin.woff2`;
  await downloadFile(url, resolve(FONTS_DIR, file));
  for (const e of grupo) {
    fontCssLines.push(
      `@font-face {\n  font-family: '${e.family}';\n  font-style: normal;\n  font-weight: ${e.weight};\n  font-display: swap;\n  src: url('../fonts/${file}') format('woff2');\n}`,
    );
  }
}

if (fontCssLines.length === 0) throw new Error("No se pudo extraer ninguna fuente latin");
writeFileSync(resolve(FONTS_DIR, "fonts.css"), fontCssLines.join("\n\n") + "\n");
console.log(`✓ ${porUrl.size} ficheros woff2 latin en fonts/ + fonts/fonts.css`);

console.log("\nHecho. La app ya puede funcionar sin red.");
