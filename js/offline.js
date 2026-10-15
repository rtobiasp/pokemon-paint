if (
  "serviceWorker" in navigator &&
  (location.protocol === "http:" || location.protocol === "https:")
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
