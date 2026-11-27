// src/scripts/dashboard.ts
import {
    API_URL,
    deleteRoute,
    getRoutes,
    getTechnicians,
    updateRouteStatus,
} from "../services/api";
import type { Route } from "../types/route";
import type { Technician } from "../types/technician";
import { getToken } from "../utils/auth";
import {
    escapeHtml,
    formatDate,
    getAvatarColor,
    getInitials,
} from "../utils/format";

type TechnicianWithLegacyPhoto = Technician & {
    photo_url?: string | null;
    photo?: string | null;
};

export function initDashboard() {
    const currentToken = getToken();
    if (!currentToken) {
        window.location.href = "/login";
        return;
    }

    const headerActions = document.getElementById("header-actions");
    const routesBody = document.querySelector<HTMLTableSectionElement>("#routes-body");
    const searchInput = document.querySelector<HTMLInputElement>("#search");
    const statusFilter = document.querySelector<HTMLSelectElement>("#status-filter");
    const emptyMessage = document.querySelector<HTMLDivElement>("#empty");
    const clearFiltersBtn = document.getElementById("clear-filters-btn");
    const message = document.querySelector<HTMLDivElement>("#message");

    const statTotal = document.getElementById("stat-total");
    const statAssigned = document.getElementById("stat-assigned");
    const statProgress = document.getElementById("stat-progress");
    const statCompleted = document.getElementById("stat-completed");

    const cancelModal = document.getElementById("cancel-modal");
    const confirmCancelBtn = document.getElementById("confirm-cancel-btn");
    const closeCancelBtn = document.getElementById("close-cancel-btn");

    const deleteModal = document.getElementById("delete-modal");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    const closeDeleteBtn = document.getElementById("close-delete-btn");

    let routes: Route[] = [];
    let technicians: TechnicianWithLegacyPhoto[] = [];
    let routeIdToActOn: string | null = null;

    function renderHeaderButtons() {
        if (!headerActions) return;
        headerActions.innerHTML = `
            <a href="/routes/new" class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/30 transition-all hover:bg-orange-700 hover:shadow-lg hover:shadow-orange-500/40 active:scale-95 sm:w-auto sm:py-2.5">
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Asignación
            </a>
        `;
    }

    function updateStats() {
        if (statTotal) statTotal.textContent = String(routes.length);
        if (statAssigned) statAssigned.textContent = String(routes.filter((r) => r.status === "assigned").length);
        if (statProgress) statProgress.textContent = String(routes.filter((r) => r.status === "in_progress").length);
        if (statCompleted) statCompleted.textContent = String(routes.filter((r) => r.status === "completed").length);
    }

    function showMessage(text: string, isError: boolean) {
        if (!message) return;
        message.innerHTML = `
            <div class="flex items-center gap-3">
                ${
            isError
                ? `<svg class="h-5 w-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
                : `<svg class="h-5 w-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`
        }
                <p>${escapeHtml(text)}</p>
            </div>
        `;
        message.className = isError
            ? "mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 shadow-sm"
            : "mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 shadow-sm";
        message.classList.remove("hidden");

        setTimeout(() => {
            message.classList.add("hidden");
        }, 4000);
    }

    function renderStatus(status: string): string {
        const config: Record<string, { label: string; bg: string; dot: string; text: string; border: string }> = {
            assigned: { label: "Asignada", bg: "bg-blue-50", dot: "bg-blue-500", text: "text-blue-700", border: "ring-blue-600/20" },
            in_progress: { label: "En proceso", bg: "bg-orange-50", dot: "bg-orange-500 animate-pulse", text: "text-orange-700", border: "ring-orange-600/20" },
            completed: { label: "Completada", bg: "bg-green-50", dot: "bg-green-500", text: "text-green-700", border: "ring-green-600/20" },
            canceled: { label: "Cancelada", bg: "bg-red-50", dot: "bg-red-500", text: "text-red-700", border: "ring-red-600/20" },
        };
        const current = config[status] ?? {
            label: status,
            bg: "bg-slate-100",
            dot: "bg-slate-400",
            text: "text-slate-600",
            border: "ring-slate-500/20",
        };

        return `
            <span class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-bold md:text-xs ${current.bg} ${current.text} ring-1 ring-inset ${current.border}">
                <span class="h-1.5 w-1.5 rounded-full ${current.dot}"></span>
                ${escapeHtml(current.label)}
            </span>
        `;
    }

    function routeRow(route: Route): string {
        const technician = technicians.find((item) => item.id === route.technician_id);
        const technicianName = technician?.name ?? "Técnico no encontrado";
        const servicesCount = route.services.length;
        const avatarColor = getAvatarColor(technicianName);
        const safeInitials = escapeHtml(getInitials(technicianName));
        const encodedRouteId = encodeURIComponent(route.id);
        const safeRouteId = escapeHtml(route.id);

        const avatarHtml = technician
            ? `
        <img
            src="${escapeHtml(technician.photo_url || technician.photo || `${API_URL}/technicians/${technician.id}/photo`)}"
            alt="${escapeHtml(technicianName)}"
            class="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white shadow-sm"
            onerror="this.onerror=null; this.replaceWith(Object.assign(document.createElement('span'), {className: 'flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${avatarColor} text-sm font-black shadow-sm ring-2 ring-white', textContent: '${safeInitials}'}));"
        />
    `
            : `
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${avatarColor} text-sm font-black shadow-sm ring-2 ring-white">
            ${safeInitials}
        </span>
    `;

        const specialtiesArray =
            technician?.specialties && technician.specialties.length > 0
                ? technician.specialties
                : ["General"];

        const badgesHtml = specialtiesArray
            .map(
                (spec) => `
                <div class="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[10px] font-bold tracking-wider text-orange-600 ring-1 ring-inset ring-orange-600/20">
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    ${escapeHtml(spec)}
                </div>
            `,
            )
            .join("");

        return `
            <tr class="group block border-b border-slate-100 p-4 transition-colors hover:bg-slate-50 md:table-row md:border-b-0 md:p-0">
                <td data-label="Fecha" class="flex items-center justify-between py-2 before:text-xs before:font-bold before:text-slate-400 before:content-[attr(data-label)] md:table-cell md:px-6 md:py-5 md:before:content-none">
                    <div class="flex items-center gap-3">
                        <div class="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 md:flex">
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span class="text-sm font-semibold text-slate-700 tabular-nums">
                            ${escapeHtml(formatDate(route.route_date, false))}
                        </span>
                    </div>
                </td>

                <td data-label="Técnico" class="flex items-center justify-between py-2 before:text-xs before:font-bold before:text-slate-400 before:content-[attr(data-label)] md:table-cell md:px-6 md:py-5 md:before:content-none">
                    <div class="flex items-center gap-4">
                        ${avatarHtml}
                        <div>
                            <div class="text-sm font-bold text-slate-800">
                                ${escapeHtml(technicianName)}
                            </div>
                            <div class="mt-1.5 flex flex-wrap gap-1.5">
                                ${badgesHtml}
                            </div>
                        </div>
                    </div>
                </td>

                <td data-label="Servicios" class="flex items-center justify-between py-2 before:text-xs before:font-bold before:text-slate-400 before:content-[attr(data-label)] md:table-cell md:px-6 md:py-5 md:before:content-none">
                    <span class="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 ring-1 ring-inset ring-slate-200">
                        <span class="text-slate-900">${servicesCount}</span>
                        <span>${servicesCount === 1 ? "Visita" : "Visitas"}</span>
                    </span>
                </td>

                <td data-label="Estado" class="flex items-center justify-between py-2 before:text-xs before:font-bold before:text-slate-400 before:content-[attr(data-label)] md:table-cell md:px-6 md:py-5 md:before:content-none">
                    ${renderStatus(route.status)}
                </td>

                <td class="mt-4 flex justify-end border-t border-slate-100 pt-4 md:mt-0 md:table-cell md:border-0 md:px-6 md:py-5 md:pt-5">
                    <div class="flex items-center gap-2 transition-opacity md:opacity-80 md:group-hover:opacity-100">
                        <a
                            href="/routes/detail?id=${encodedRouteId}"
                            class="inline-flex items-center justify-center rounded-xl bg-white p-2.5 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-indigo-600 active:scale-95 md:p-2"
                            title="Ver detalles completos"
                            aria-label="Ver detalles de la ruta"
                        >
                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </a>

                        ${
            route.status === "assigned"
                ? `
                            <a
                                href="/routes/edit?id=${encodedRouteId}"
                                class="inline-flex items-center justify-center rounded-xl bg-white p-2.5 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-blue-600 active:scale-95 md:p-2"
                                title="Editar asignación"
                                aria-label="Editar asignación"
                            >
                                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </a>
                        `
                : ""
        }

                        ${
            route.status === "assigned" || route.status === "in_progress"
                ? `
                            <button
                                type="button"
                                data-action="cancel"
                                data-id="${safeRouteId}"
                                class="inline-flex items-center justify-center rounded-xl bg-white p-2.5 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-amber-600 active:scale-95 md:p-2"
                                title="Suspender/Cancelar ruta"
                                aria-label="Suspender o cancelar ruta"
                            >
                                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                            </button>
                        `
                : ""
        }

                        ${
            route.status === "assigned"
                ? `
                            <button
                                type="button"
                                data-action="delete"
                                data-id="${safeRouteId}"
                                class="inline-flex items-center justify-center rounded-xl bg-white p-2.5 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-red-50 hover:text-red-600 hover:ring-red-200 active:scale-95 md:p-2"
                                title="Eliminar permanentemente"
                                aria-label="Eliminar ruta permanentemente"
                            >
                                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        `
                : ""
        }
                    </div>
                </td>
            </tr>
        `;
    }

    function addTableEvents() {
        document.querySelectorAll<HTMLButtonElement>("[data-action='cancel']").forEach((button) => {
            button.addEventListener("click", () => {
                routeIdToActOn = button.dataset.id || null;
                cancelModal?.classList.remove("hidden");
            });
        });

        document.querySelectorAll<HTMLButtonElement>("[data-action='delete']").forEach((button) => {
            button.addEventListener("click", () => {
                routeIdToActOn = button.dataset.id || null;
                deleteModal?.classList.remove("hidden");
            });
        });
    }

    function renderRoutes() {
        if (!routesBody || !emptyMessage) return;

        const query = searchInput?.value.trim().toLowerCase() ?? "";
        const selectedStatus = statusFilter?.value ?? "";

        const filtered = routes.filter((route) => {
            const technician = technicians.find((item) => item.id === route.technician_id);
            const technicianName = technician?.name.toLowerCase() ?? "";
            const formattedDate = formatDate(route.route_date, false).toLowerCase();
            const technicalDate = route.route_date.toLowerCase();

            const matchesSearch =
                !query ||
                technicianName.includes(query) ||
                formattedDate.includes(query) ||
                technicalDate.includes(query);

            const matchesStatus = !selectedStatus || route.status === selectedStatus;

            return matchesSearch && matchesStatus;
        });

        routesBody.innerHTML = "";

        if (filtered.length === 0) {
            emptyMessage.classList.remove("hidden");
            return;
        }

        emptyMessage.classList.add("hidden");
        routesBody.innerHTML = filtered.map((route) => routeRow(route)).join("");
        addTableEvents();
    }

    async function loadData() {
        try {
            const [routesResponse, techniciansResponse] = await Promise.all([
                getRoutes(),
                getTechnicians(),
            ]);
            routes = routesResponse;
            technicians = techniciansResponse;
            updateStats();
            renderRoutes();
        } catch (error) {
            showMessage(
                error instanceof Error ? error.message : "No se pudieron cargar las rutas.",
                true,
            );
        }
    }

    function closeModals() {
        cancelModal?.classList.add("hidden");
        deleteModal?.classList.add("hidden");
        routeIdToActOn = null;
    }

    closeCancelBtn?.addEventListener("click", closeModals);
    closeDeleteBtn?.addEventListener("click", closeModals);

    cancelModal?.addEventListener("click", (e) => {
        if (e.target === cancelModal) closeModals();
    });
    deleteModal?.addEventListener("click", (e) => {
        if (e.target === deleteModal) closeModals();
    });

    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModals();
    });

    confirmCancelBtn?.addEventListener("click", async () => {
        if (!routeIdToActOn) return;
        const targetId = routeIdToActOn;
        closeModals();

        try {
            await updateRouteStatus(targetId, "canceled");
            routes = routes.map((route) =>
                route.id === targetId ? { ...route, status: "canceled" } : route,
            );
            updateStats();
            renderRoutes();
            showMessage("Ruta suspendida correctamente.", false);
        } catch (error) {
            showMessage(
                error instanceof Error ? error.message : "No se pudo cancelar la ruta.",
                true,
            );
        }
    });

    confirmDeleteBtn?.addEventListener("click", async () => {
        if (!routeIdToActOn) return;
        const targetId = routeIdToActOn;
        closeModals();

        try {
            await deleteRoute(targetId);
            routes = routes.filter((route) => route.id !== targetId);
            updateStats();
            renderRoutes();
            showMessage("Asignación eliminada permanentemente.", false);
        } catch (error) {
            showMessage(
                error instanceof Error ? error.message : "Error al intentar eliminar.",
                true,
            );
        }
    });

    searchInput?.addEventListener("input", renderRoutes);
    statusFilter?.addEventListener("change", renderRoutes);
    clearFiltersBtn?.addEventListener("click", () => {
        if (searchInput) searchInput.value = "";
        if (statusFilter) statusFilter.value = "";
        renderRoutes();
    });

    renderHeaderButtons();
    loadData();
}