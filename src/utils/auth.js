// src/utils/auth.js

export function protectAdminRoute() {
    // Si estamos en el servidor de Astro durante la construcción, no hacemos nada
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("auth_token");
    const role = localStorage.getItem("user_role");

    // Si no hay token o el rol NO es admin, lo expulsamos al login
    if (!token || role !== "admin") {
        window.location.href = "/login";
    }
}