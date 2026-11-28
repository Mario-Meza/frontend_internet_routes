// src/scripts/route-detail/renderers.ts
import type { RouteDetail, RouteService, RouteStatus } from "../../types/route";
import { escapeHtml } from "../../utils/format";

export function formatLongDate(value: string): string {
    const [year, month, day] = value.split("-");
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    return date.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export function formatDateTime(value: string): string {
    const date = new Date(value);

    return date
        .toLocaleString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        .replace(".", "");
}

export function getRouteStatusMeta(status: string): {
    label: string;
    classes: string;
} {
    const config: Record<string, { label: string; classes: string }> = {
        assigned: {
            label: "Asignada",
            classes: "bg-blue-100 text-blue-700",
        },
        in_progress: {
            label: "En proceso",
            classes: "bg-orange-100 text-orange-700",
        },
        completed: {
            label: "Completada",
            classes: "bg-green-100 text-green-700",
        },
        canceled: {
            label: "Cancelada",
            classes: "bg-red-100 text-red-700",
        },
    };

    return (
        config[status] ?? {
            label: status,
            classes: "bg-slate-100 text-slate-700",
        }
    );
}

export function renderServiceTypeBadge(type: string): string {
    const types: Record<string, { label: string; classes: string }> = {
        S: {
            label: "Servicio",
            classes: "bg-blue-50 text-blue-700 ring-blue-200",
        },
        R: {
            label: "Reconexión",
            classes: "bg-purple-50 text-purple-700 ring-purple-200",
        },
        A: {
            label: "Alinear",
            classes: "bg-amber-50 text-amber-700 ring-amber-200",
        },
        CF: {
            label: "Cambio a fibra",
            classes: "bg-indigo-50 text-indigo-700 ring-indigo-200",
        },
    };

    const current = types[type] ?? {
        label: type,
        classes: "bg-slate-50 text-slate-700 ring-slate-200",
    };

    return `
        <span class="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${current.classes}">
            ${escapeHtml(current.label)}
        </span>
    `;
}

export function renderServiceStatusBadge(status: string): string {
    const statuses: Record<string, { label: string; classes: string; dot: string }> = {
        pending: {
            label: "Pendiente",
            classes: "bg-slate-100 text-slate-700 ring-slate-200",
            dot: "bg-slate-400",
        },
        in_progress: {
            label: "En proceso",
            classes: "bg-orange-100 text-orange-700 ring-orange-200",
            dot: "bg-orange-500",
        },
        completed: {
            label: "Completado",
            classes: "bg-green-100 text-green-700 ring-green-200",
            dot: "bg-green-500",
        },
        not_completed: {
            label: "No realizado",
            classes: "bg-red-100 text-red-700 ring-red-200",
            dot: "bg-red-500",
        },
        canceled: {
            label: "Cancelado",
            classes: "bg-slate-100 text-slate-600 ring-slate-200",
            dot: "bg-slate-400",
        },
    };

    const current = statuses[status] ?? {
        label: status,
        classes: "bg-slate-100 text-slate-700 ring-slate-200",
        dot: "bg-slate-400",
    };

    return `
        <span class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${current.classes}">
            <span class="h-1.5 w-1.5 rounded-full ${current.dot}"></span>
            ${escapeHtml(current.label)}
        </span>
    `;
}

export function renderEmptyServicesState(): string {
    return `
        <div class="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">
            <div class="text-4xl" aria-hidden="true">📋</div>
            <p class="mt-3 font-semibold text-slate-700">
                Esta ruta no tiene servicios.
            </p>
        </div>
    `;
}

export function createServiceCard(
    service: RouteService,
    index: number,
    routeStatus: RouteStatus | RouteDetail["status"],
): string {
    const customer = service.customer;
    const customerName = customer?.name ?? "Cliente no encontrado";
    const location = customer?.location ?? "Sin localidad";
    const phone = customer?.phone ?? "Sin teléfono";
    const reference = customer?.reference ?? "Sin referencia";
    const safeServiceId = escapeHtml(service.service_id);

    const routeIsCanceled = routeStatus === "canceled";
    const effectiveServiceStatus =
        routeIsCanceled && (service.status === "pending" || service.status === "in_progress")
            ? "canceled"
            : service.status;

    const canEdit = routeStatus === "assigned" && service.status === "pending";
    const canDelete = canEdit;
    const canStart =
        (routeStatus === "assigned" || routeStatus === "in_progress") &&
        service.status === "pending";
    const canComplete = routeStatus === "in_progress" && service.status === "in_progress";
    const showActionBar = canEdit || canDelete || canStart || canComplete;

    return `
        <article class="group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md">
            <div class="p-5 sm:p-6">
                <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div class="flex min-w-0 gap-4">
                        <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
                            ${String(index + 1).padStart(2, "0")}
                        </div>

                        <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                                <h3 class="truncate text-base font-bold text-slate-900 sm:text-lg">
                                    ${escapeHtml(customerName)}
                                </h3>
                            </div>

                            <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                                <span class="inline-flex items-center gap-1.5">
                                    <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                                        <circle cx="12" cy="10" r="2.5" />
                                    </svg>
                                    ${escapeHtml(location)}
                                </span>

                                <span class="inline-flex items-center gap-1.5">
                                    <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
                                    </svg>
                                    ${escapeHtml(phone)}
                                </span>
                            </div>

                            <div class="mt-2 flex items-start gap-1.5 text-sm text-slate-400">
                                <svg class="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                                    <path d="M20 11.5a8.38 8.38 0 0 1-9 8.5 8.5 8.5 0 0 1-7.5-4.5L2 20l1.5-3.5A8.5 8.5 0 1 1 20 11.5Z" />
                                </svg>
                                <span>${escapeHtml(reference)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                        ${renderServiceTypeBadge(service.service_type)}
                        ${renderServiceStatusBadge(effectiveServiceStatus)}
                    </div>
                </div>

                ${
        service.notes
            ? `
                    <div class="mt-5 rounded-xl bg-slate-50 px-4 py-3">
                        <p class="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Observaciones
                        </p>
                        <p class="mt-1 text-sm leading-6 text-slate-700">
                            ${escapeHtml(service.notes)}
                        </p>
                    </div>
                `
            : ""
    }
            </div>

            ${
        showActionBar
            ? `
                <div class="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        ${
                canComplete
                    ? `
                            <textarea
                                data-notes="${safeServiceId}"
                                rows="2"
                                placeholder="Escribe las observaciones de la visita..."
                                class="min-h-20 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                            >${escapeHtml(service.notes ?? "")}</textarea>
                        `
                    : `
                            <p class="text-sm text-slate-500">
                                Servicio pendiente de visita.
                            </p>
                        `
            }

                        <div class="flex shrink-0 flex-wrap gap-2 transition-opacity">
                            ${
                canEdit && canDelete
                    ? `
                                <button
                                    type="button"
                                    data-action="edit-service"
                                    data-service-id="${safeServiceId}"
                                    class="inline-flex items-center justify-center rounded-xl bg-white p-2.5 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-blue-600 active:scale-95"
                                    title="Editar servicio"
                                    aria-label="Editar servicio"
                                >
                                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </button>

                                <button
                                    type="button"
                                    data-action="delete-service"
                                    data-service-id="${safeServiceId}"
                                    class="inline-flex items-center justify-center rounded-xl bg-white p-2.5 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-red-50 hover:text-red-600 hover:ring-red-200 active:scale-95"
                                    title="Eliminar servicio"
                                    aria-label="Eliminar servicio"
                                >
                                    <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            `
                    : ""
            }

                            ${
                canStart
                    ? `
                                <button
                                    type="button"
                                    data-action="start"
                                    data-service-id="${safeServiceId}"
                                    class="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 active:scale-95"
                                >
                                    ▶ Iniciar visita
                                </button>
                            `
                    : ""
            }

                            ${
                canComplete
                    ? `
                                <button
                                    type="button"
                                    data-action="complete"
                                    data-service-id="${safeServiceId}"
                                    class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                                >
                                    ✓ Completar visita
                                </button>
                            `
                    : ""
            }
                        </div>
                    </div>
                </div>
            `
            : ""
    }

            ${
        service.status === "completed"
            ? `
                <div class="flex items-center gap-3 border-t border-emerald-100 bg-emerald-50 px-5 py-3.5 sm:px-6">
                    <span class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                        <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" d="m5 12 4 4L19 6" />
                        </svg>
                    </span>
                    <div>
                        <p class="text-sm font-semibold text-emerald-800">
                            Visita completada
                        </p>
                        ${
                service.completed_at
                    ? `
                            <p class="text-xs text-emerald-700/70">
                                ${escapeHtml(formatDateTime(service.completed_at))}
                            </p>
                        `
                    : ""
            }
                    </div>
                </div>
            `
            : ""
    }
        </article>
    `;
}