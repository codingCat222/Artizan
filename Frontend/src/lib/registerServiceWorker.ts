export function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    window.addEventListener("load", () => {
        navigator.serviceWorker
            .register("/sw.js")
            .then((registration) => {
                console.log("Service worker registered:", registration.scope);
            })
            .catch((err) => {
                console.error("Service worker registration failed:", err);
            });
    });
}