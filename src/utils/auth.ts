// src/utils/auth.ts
//
// Manejo de la sesión en el navegador.
// IMPORTANTE: estas comprobaciones solo mejoran la experiencia (redirigir a la
// pantalla correcta). La seguridad real la aplica el backend con el JWT.

export type Role = "admin" | "technician";

export const TOKEN_KEY = "auth_token";
export const ROLE_KEY = "user_role";

interface TokenPayload {
    sub?: string;
    id?: string;
    role?: Role;
    exp?: number;
}

// Pantalla de inicio de cada rol
const HOME_BY_ROLE: Record<Role, string> = {
    admin: "/",
    technician: "/panel",
};

export function getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
}

export function saveSession(token: string, role: string): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(ROLE_KEY, role);
}

export function clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
}

/** Decodifica el payload de un JWT (sin verificar la firma: eso lo hace el backend). */
export function decodeToken(token: string): TokenPayload | null {
    try {
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const json = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                .join(""),
        );
        return JSON.parse(json) as TokenPayload;
    } catch {
        return null;
    }
}

/** Cierra la sesión local y manda al login. */
export function redirectToLogin(): void {
    clearSession();
    window.location.href = "/login";
}

/**
 * Deja pasar solo a usuarios con sesión válida y el rol indicado.
 * - Sin token, token ilegible o vencido  -> /login
 * - Con otro rol                         -> a su propia pantalla de inicio
 */
export function protectRoute(allowedRole: Role): void {
    // Si estamos en el servidor de Astro durante la construcción, no hacemos nada
    if (typeof window === "undefined") return;

    const token = getToken();
    const payload = token ? decodeToken(token) : null;

    const isExpired =
        payload?.exp !== undefined && payload.exp * 1000 <= Date.now();

    if (!token || !payload || !payload.role || isExpired) {
        redirectToLogin();
        return;
    }

    if (payload.role !== allowedRole) {
        window.location.href = HOME_BY_ROLE[payload.role];
    }
}

export function protectAdminRoute(): void {
    protectRoute("admin");
}

export function protectTechnicianRoute(): void {
    protectRoute("technician");
}