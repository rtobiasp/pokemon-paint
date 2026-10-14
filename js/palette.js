import { state, totalCeldasPintables, siguienteColorIncompleto } from "./state.js";
import { resaltarSeleccion } from "./board.js";

export function crearPaleta(contenedor, victoria) {
  contenedor.innerHTML = "";
  const numeros = Object.keys(state.paletaInversa).map(Number).sort((a, b) => a - b);
  numeros.forEach((numero) => {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "color-btn";
    boton.dataset.numero = String(numero);
    boton.style.backgroundColor = state.paletaInversa[numero];

    const etiqueta = document.createElement("span");
    etiqueta.className = "num";
    etiqueta.textContent = numero;

    const barra = document.createElement("span");
    barra.className = "mini-bar";
    const relleno = document.createElement("i");
    barra.appendChild(relleno);

    boton.appendChild(etiqueta);
    boton.appendChild(barra);

    boton.addEventListener("click", () => {
      if (state.colorSeleccionado === numero) {
        state.colorSeleccionado = null;
      } else {
        state.colorSeleccionado = numero;
      }
      sincronizarActivos(contenedor);
      resaltarSeleccion();
    });

    contenedor.appendChild(boton);
  });
  sincronizarActivos(contenedor);
  actualizarProgreso(contenedor, victoria);
}

export function sincronizarActivos(contenedor) {
  contenedor.querySelectorAll(".color-btn").forEach((boton) => {
    const numero = Number(boton.dataset.numero);
    boton.classList.toggle("activo", state.colorSeleccionado === numero);
  });
}

export function actualizarProgreso(contenedor, victoria) {
  const total = totalCeldasPintables();

  contenedor.querySelectorAll(".color-btn").forEach((boton) => {
    const numero = Number(boton.dataset.numero);
    const objetivo = state.totales[numero] || 0;
    const hecho = state.pintados[numero] || 0;
    boton.querySelector(".mini-bar i").style.width = objetivo === 0 ? "0%" : `${Math.round((hecho / objetivo) * 100)}%`;
    boton.classList.toggle("completado", objetivo > 0 && hecho >= objetivo);
  });

  victoria.hidden = !(total > 0 && siguienteColorIncompleto() === null);

  if (
    state.colorSeleccionado !== null &&
    (state.pintados[state.colorSeleccionado] || 0) >= (state.totales[state.colorSeleccionado] || 0)
  ) {
    state.colorSeleccionado = siguienteColorIncompleto();
    sincronizarActivos(contenedor);
    resaltarSeleccion();
  }
}
