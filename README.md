# PintaDex

Pokédex para explorar colecciones y colorear sprites Pokémon píxel a píxel. Es un sitio estático hecho con HTML, CSS y JavaScript nativo; consulta los datos de PokéAPI y guarda el progreso localmente en el navegador.

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

Proyecto de fans sin afiliación oficial con Pokémon o Nintendo. Los datos proceden de [PokéAPI](https://pokeapi.co/) y las imágenes son sprites de Pokémon disponibles en [PokeAPI/sprites](https://github.com/PokeAPI/sprites).
