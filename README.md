# PintaDex

Pokédex para explorar colecciones y colorear sprites Pokémon píxel a píxel. Es un sitio estático hecho con HTML, CSS y JavaScript nativo; funciona **sin conexión**: los datos, sprites y fuentes están vendorizados en el repo y el progreso se guarda localmente en el navegador.

## Assets locales

`data/pokemon.json`, `assets/sprites/*.png` (1025) y `fonts/*.woff2` se generan una sola vez desde la red y luego la app no hace ninguna petición externa:

```sh
npm run assets        # descarga catálogo + sprites + fuentes (requiere red una vez)
npm run assets:check  # verifica en local, sin red
```

La app Android empaqueta estos ficheros vía `npm run build` (los copia a `www/`).

## Publicación

El workflow de GitHub Actions publica el contenido de la rama `main` en GitHub Pages. En el repositorio, abre **Settings > Pages** y selecciona **GitHub Actions** como fuente de publicación. Después de subir los cambios a `main`, cada ejecución correcta del workflow actualiza el sitio.

La URL prevista para este repositorio es <https://rtobiasp.github.io/pokemon-paint/>.

## Aplicación Android

La app Android usa Capacitor y empaqueta el sitio estático en una WebView. La
web publicada en GitHub Pages conserva sus archivos en la raíz; `npm run build`
los copia a `www/`, que es la carpeta que Capacitor incluye en la app.

Requisitos: Node.js 22 o posterior, Android Studio y Android SDK Platform 36.
El proyecto nativo ya está incluido en `android/`.

```sh
npm install
npm run android
npm run android:open
```

`npm run cap:add:android` solo hace falta si creas la plataforma Android desde
cero y la carpeta `android/` no existe.

En Android Studio, compila desde **Build > Build Bundle(s) / APK(s) > Build
APK(s)**. Para sincronizar cambios posteriores de la web con Android, ejecuta
`npm run android` antes de abrir o compilar el proyecto.

## Créditos

Proyecto de fans sin afiliación oficial con Pokémon o Nintendo. Los datos y sprites están congelados de PokéAPI / PokeAPI/sprites (ver `scripts/download-assets.mjs`) para funcionar sin conexión.
