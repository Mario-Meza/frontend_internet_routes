// src/utils/format.ts
export function escapeHtml(value: unknown): string {
    const div = document.createElement("div");
    div.textContent = String(value ?? "");
    return div.innerHTML;
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0].toUpperCase())
        .join("");
}

export function getAvatarColor(name: string): string {
    const colors = [
        "bg-blue-100 text-blue-700",
        "bg-indigo-100 text-indigo-700",
        "bg-violet-100 text-violet-700",
        "bg-fuchsia-100 text-fuchsia-700",
        "bg-emerald-100 text-emerald-700",
        "bg-cyan-100 text-cyan-700",
    ];
    const charCode = name.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
}

export function formatDate(value: string, includeYear = true): string {
    if (!value) return "Fecha sin definir";
    const [year, month, day] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date
        .toLocaleDateString("es-MX", {
            day: "2-digit",
            month: "short",
            ...(includeYear ? { year: "numeric" } : {}),
        })
        .replace(".", "");
}

export function showToast(message: string, type: "info" | "success" | "warning" | "error" = "info") {
    let container = document.getElementById("global-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "global-toast-container";
        container.className = "fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4 pointer-events-none";
        document.body.appendChild(container);
    }

    const styles = {
        info: "bg-slate-900 text-white ring-slate-700",
        success: "bg-emerald-600 text-white ring-emerald-500",
        warning: "bg-amber-500 text-white ring-amber-400",
        error: "bg-red-600 text-white ring-red-500",
    };

    const toast = document.createElement("div");
    toast.className = `pointer-events-auto flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-sm font-bold shadow-xl ring-1 transition-all duration-300 ${styles[type]}`;
    toast.textContent = message;

    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add("opacity-0", "translate-x-4");
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}