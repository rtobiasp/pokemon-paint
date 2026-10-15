const ICONO_ENTRAR = "⤢";
const ICONO_SALIR = "⤡";
const TEXTO_ENTRAR = "Ver en pantalla completa";
const TEXTO_SALIR = "Salir de pantalla completa";

export function pantallaCompletaDisponible() {
  const elemento = document.documentElement;
  return Boolean(
    elemento.requestFullscreen ||
      elemento.webkitRequestFullscreen ||
      document.exitFullscreen ||
      document.webkitExitFullscreen,
  );
}

export function estaEnPantallaCompleta() {
  return Boolean(
    document.fullscreenElement || document.webkitFullscreenElement,
  );
}

export async function entrarEnPantallaCompleta() {
  const elemento = document.documentElement;
  if (elemento.requestFullscreen) {
    await elemento.requestFullscreen();
  } else if (elemento.webkitRequestFullscreen) {
    elemento.webkitRequestFullscreen();
  } else {
    throw new Error("Pantalla completa no disponible.");
  }
}

export async function salirDePantallaCompleta() {
  if (document.exitFullscreen && document.fullscreenElement) {
    await document.exitFullscreen();
  } else if (document.webkitExitFullscreen && document.webkitFullscreenElement) {
    document.webkitExitFullscreen();
  }
}

export async function alternarPantallaCompleta() {
  if (estaEnPantallaCompleta()) {
    await salirDePantallaCompleta();
  } else {
    await entrarEnPantallaCompleta();
  }
}

function sincronizarBoton(boton) {
  const activa = estaEnPantallaCompleta();
  boton.setAttribute("aria-pressed", String(activa));
  boton.classList.toggle("activo", activa);
  document.body.classList.toggle("pantalla-completa", activa);
  const icono = activa ? ICONO_SALIR : ICONO_ENTRAR;
  const texto = activa ? TEXTO_SALIR : TEXTO_ENTRAR;
  const visible = boton.querySelector("[aria-hidden]");
  if (visible) visible.textContent = icono;
  else boton.textContent = icono;
  boton.setAttribute("aria-label", texto);
  boton.title = texto;
}

export function initBotonPantallaCompleta(boton, { alFallar } = {}) {
  if (!boton) return false;
  if (!pantallaCompletaDisponible()) {
    boton.hidden = true;
    return false;
  }
  sincronizarBoton(boton);
  boton.addEventListener("click", async () => {
    try {
      await alternarPantallaCompleta();
    } catch {
      alFallar?.("No se pudo cambiar a pantalla completa en este dispositivo.");
    }
  });
  document.addEventListener("fullscreenchange", () => sincronizarBoton(boton));
  document.addEventListener("webkitfullscreenchange", () =>
    sincronizarBoton(boton),
  );
  return true;
}
