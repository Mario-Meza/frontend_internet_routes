import {
    getRoute,
    getCustomers,
    addRouteService,
    startService,
    completeService,
    updateRouteService,
    deleteRouteService,
} from "../services/api";

import type { RouteDetail } from "../types/route";
import type { Customer } from "../types/customer";


/*
 * ==========================================
 * ELEMENTOS DEL DOM
 * ==========================================
 */

const routeTitle =
    document.querySelector<HTMLElement>(
        "#route-title",
    );

const routeTechnician =
    document.querySelector<HTMLElement>(
        "#route-technician",
    );

const routeStatus =
    document.querySelector<HTMLElement>(
        "#route-status",
    );

const totalServices =
    document.querySelector<HTMLElement>(
        "#total-services",
    );

const completedServices =
    document.querySelector<HTMLElement>(
        "#completed-services",
    );

const pendingServices =
    document.querySelector<HTMLElement>(
        "#pending-services",
    );

const servicesContainer =
    document.querySelector<HTMLElement>(
        "#services-container",
    );

const errorMessage =
    document.querySelector<HTMLElement>(
        "#error-message",
    );

const addServiceButton =
    document.querySelector<HTMLButtonElement>(
        "#add-service",
    );

/*
 * ==========================================
 * MODAL EDITAR SERVICIO
 * ==========================================
 */

const editServiceModal =
    document.querySelector<HTMLDivElement>(
        "#edit-service-modal",
    );

const editServiceBackdrop =
    document.querySelector<HTMLDivElement>(
        "#edit-service-backdrop",
    );

const closeEditServiceButton =
    document.querySelector<HTMLButtonElement>(
        "#close-edit-service",
    );

const cancelEditServiceButton =
    document.querySelector<HTMLButtonElement>(
        "#cancel-edit-service",
    );

const saveEditServiceButton =
    document.querySelector<HTMLButtonElement>(
        "#save-edit-service",
    );

const editServiceCustomer =
    document.querySelector<HTMLSelectElement>(
        "#edit-service-customer",
    );

const editServiceCustomerEmpty =
    document.querySelector<HTMLParagraphElement>(
        "#edit-service-customer-empty",
    );

const editServiceType =
    document.querySelector<HTMLSelectElement>(
        "#edit-service-type",
    );

const editServiceError =
    document.querySelector<HTMLDivElement>(
        "#edit-service-error",
    );

const editServiceModalTitle =
    document.querySelector<HTMLElement>(
        "#edit-service-modal-title",
    );

const editServiceModalDescription =
    document.querySelector<HTMLElement>(
        "#edit-service-modal-description",
    );

/*
 * ==========================================
 * SERVICIO EN EDICIÓN
 * ==========================================
 */

let editingServiceId: string | null = null;

let serviceModalMode:
    | "add"
    | "edit" = "edit";


/*
 * ==========================================
 * ESTADO
 * ==========================================
 */

let currentRoute: RouteDetail | null = null;
let customers: Customer[] = [];

/*
 * ==========================================
 * OBTENER ID DE LA RUTA
 * ==========================================
 */

const routeId =
    new URLSearchParams(
        window.location.search,
    ).get("id");

/*
 * ==========================================
 * ESCAPAR HTML
 * ==========================================
 */

function escapeHtml(
    value: string,
): string {

    const div =
        document.createElement("div");

    div.textContent = value;

    return div.innerHTML;
}


/*
 * ==========================================
 * CARGAR DATOS
 * ==========================================
 */

async function loadData() {

    try {

        if (!routeId) {

            throw new Error(
                "No se encontró el ID de la ruta.",
            );
        }


        const [
            route,
            customersResponse,
        ] = await Promise.all([
            getRoute(routeId),
            getCustomers(),
        ]);


        currentRoute =
            route;


        customers =
            customersResponse;


        renderRoute();

    } catch (error) {

        showError(
            error instanceof Error
                ? error.message
                : "No se pudo cargar la ruta.",
        );
    }
}


/*
 * ==========================================
 * RENDERIZAR RUTA
 * ==========================================
 */

function renderRoute() {

    if (!currentRoute) {
        return;
    }


    const completed =
        currentRoute.services.filter(
            (service) =>
                service.status === "completed",
        ).length;

    const routeIsCanceled =
        currentRoute.status === "canceled";

    const pending = routeIsCanceled
        ? 0
        : currentRoute.services.filter(
            (service) => service.status === "pending",
        ).length;


    if (routeTitle) {

        routeTitle.textContent =
            `Ruta — ${formatDate(
                currentRoute.route_date,
            )}`;
    }


    if (routeTechnician) {

        routeTechnician.textContent =
            `👨‍🔧 Técnico: ${
                currentRoute.technician.name
            }`;
    }


    if (totalServices) {

        totalServices.textContent =
            String(
                currentRoute.services.length,
            );
    }


    if (completedServices) {

        completedServices.textContent =
            String(completed);
    }


    if (pendingServices) {

        pendingServices.textContent =
            String(pending);
    }


    renderRouteStatus(
        currentRoute.status,
    );

    if (addServiceButton) {
        if (currentRoute.status === "assigned") {
            // Mostrar el botón
            addServiceButton.classList.remove("hidden");
            addServiceButton.classList.add("inline-flex");
        } else {
            // Ocultar el botón por completo
            addServiceButton.classList.remove("inline-flex");
            addServiceButton.classList.add("hidden");
        }
    }


    renderServices();
}

/*
 * ==========================================
 * ESTADO DE RUTA
 * ==========================================
 */

function renderRouteStatus(
    status: string,
) {

    if (!routeStatus) {
        return;
    }


    const config: Record<
        string,
        {
            label: string;
            classes: string;
        }

    > = {

        assigned: {
            label: "Asignada",
            classes:
                "bg-blue-100 text-blue-700",
        },

        in_progress: {
            label: "En proceso",
            classes:
                "bg-orange-100 text-orange-700",
        },

        completed: {
            label: "Completada",
            classes:
                "bg-green-100 text-green-700",
        },
        canceled: {
            label: "Cancelada",
            classes:
                "bg-red-100 text-red-700",
        },

    };


    const current =
        config[status] ?? {
            label: status,
            classes:
                "bg-slate-100 text-slate-700",
        };


    routeStatus.textContent =
        current.label;


    routeStatus.className =
        `inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${current.classes}`;
}


/*
 * ==========================================
 * RENDERIZAR SERVICIOS
 * ==========================================
 */

function renderServices() {

    if (!servicesContainer || !currentRoute) {
        return;
    }
    const route = currentRoute;


    if (route.services.length === 0) {

        servicesContainer.innerHTML = `
            <div class="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-slate-200">

                <div class="text-4xl">
                    📋
                </div>

                <p class="mt-3 font-semibold text-slate-700">
                    Esta ruta no tiene servicios.
                </p>

            </div>
        `;

        return;
    }


    servicesContainer.innerHTML =
        route.services
            .map(
                (service, index) =>
                    createServiceCard(
                        service,
                        index,
                        route.status,
                    ),
            )
            .join("");


    addServiceEvents();
}



/*
 * ==========================================
 * CREAR TARJETA DEL SERVICIO
 * ==========================================
 */

function createServiceCard(
    service: RouteDetail["services"][number],
    index: number,
    routeStatus: RouteDetail["status"],
): string {

    const customer = service.customer;
    const customerName = customer?.name ?? "Cliente no encontrado";
    const location = customer?.location ?? "Sin localidad";
    const phone = customer?.phone ?? "Sin teléfono";
    const reference = customer?.reference ?? "Sin referencia";

    const routeIsCanceled = routeStatus === "canceled";

    // Compatibilidad visual con rutas antiguas
    const effectiveServiceStatus =
        routeIsCanceled && (service.status === "pending" || service.status === "in_progress")
            ? "canceled"
            : service.status;

    const canEdit = routeStatus === "assigned" && service.status === "pending";
    const canDelete = canEdit;
    const canStart = (routeStatus === "assigned" || routeStatus === "in_progress") && service.status === "pending";
    const canComplete = routeStatus === "in_progress" && service.status === "in_progress";
    const showActionBar = canEdit || canDelete || canStart || canComplete;

    return `
        <article
            class="group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-md"
        >

            <!-- CONTENIDO PRINCIPAL -->
            <div class="p-5 sm:p-6">
                <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">

                    <!-- CLIENTE -->
                    <div class="flex min-w-0 gap-4">

                        <!-- NÚMERO -->
                        <div
                            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white"
                        >
                            ${String(index + 1).padStart(2, "0")}
                        </div>

                        <!-- INFORMACIÓN -->
                        <div class="min-w-0">
                            <div class="flex flex-wrap items-center gap-2">
                                <h3 class="truncate text-base font-bold text-slate-900 sm:text-lg">
                                    ${escapeHtml(customerName)}
                                </h3>
                            </div>

                            <div class="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                                <span class="inline-flex items-center gap-1.5">
                                    <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                                        <circle cx="12" cy="10" r="2.5" />
                                    </svg>
                                    ${escapeHtml(location)}
                                </span>

                                <span class="inline-flex items-center gap-1.5">
                                    <svg class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.33 1.78.62 2.63a2 2 0 0 1-.45 2.11L8 9.73a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.85.29 1.73.5 2.63.62A2 2 0 0 1 22 16.92Z" />
                                    </svg>
                                    ${escapeHtml(phone)}
                                </span>
                            </div>

                            <div class="mt-2 flex items-start gap-1.5 text-sm text-slate-400">
                                <svg class="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M20 11.5a8.38 8.38 0 0 1-9 8.5 8.5 8.5 0 0 1-7.5-4.5L2 20l1.5-3.5A8.5 8.5 0 1 1 20 11.5Z" />
                                </svg>
                                <span>${escapeHtml(reference)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- TIPO + ESTADO -->
                    <div class="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
                        ${renderServiceType(service.service_type)}
                        ${renderServiceStatus(effectiveServiceStatus)}
                    </div>
                </div>

                <!-- OBSERVACIONES -->
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

            <!-- ACCIONES -->
            ${
        showActionBar
            ? `
                    <div class="border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-6">
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                            ${
                canComplete
                    ? `
                                    <textarea
                                        data-notes="${service.service_id}"
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

                            <!-- BOTONES DE ACCIÓN (Estilo Dashboard) -->
                            <div class="flex shrink-0 flex-wrap gap-2 transition-opacity">

                                ${
                canEdit && canDelete
                    ? `
                                        <button
                                            type="button"
                                            data-action="edit-service"
                                            data-service-id="${service.service_id}"
                                            class="inline-flex items-center justify-center rounded-xl bg-white p-2.5 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-slate-50 hover:text-blue-600 active:scale-95"
                                            title="Editar servicio"
                                        >
                                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>

                                        <button
                                            type="button"
                                            data-action="delete-service"
                                            data-service-id="${service.service_id}"
                                            class="inline-flex items-center justify-center rounded-xl bg-white p-2.5 text-slate-400 shadow-sm ring-1 ring-inset ring-slate-200 transition-all hover:bg-red-50 hover:text-red-600 hover:ring-red-200 active:scale-95"
                                            title="Eliminar servicio"
                                        >
                                            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                                            data-service-id="${service.service_id}"
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
                                            data-service-id="${service.service_id}"
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

            <!-- COMPLETADO -->
            ${
        service.status === "completed"
            ? `
                    <div class="flex items-center gap-3 border-t border-emerald-100 bg-emerald-50 px-5 py-3.5 sm:px-6">
                        <span class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                            <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
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
                                        ${formatDateTime(service.completed_at)}
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
/*
 * ==========================================
 * FORMATEAR FECHA Y HORA
 * ==========================================
 */
function formatDateTime(value: string): string {
    const date = new Date(value);

    return date.toLocaleString("es-MX", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).replace('.', ''); // El replace es opcional, solo para quitar el punto del mes abreviado
}


/*
 * ==========================================
 * TIPO DE SERVICIO
 * ==========================================
 */

function renderServiceType(
    type: string,
): string {

    const types: Record<
        string,
        {
            label: string;
            classes: string;
        }
    > = {

        S: {
            label: "Servicio",
            classes:
                "bg-blue-50 text-blue-700 ring-blue-200",
        },

        R: {
            label: "Reconexión",
            classes:
                "bg-purple-50 text-purple-700 ring-purple-200",
        },

        A: {
            label: "Alinear",
            classes:
                "bg-amber-50 text-amber-700 ring-amber-200",
        },

        CF: {
            label: "Cambio a fibra",
            classes:
                "bg-indigo-50 text-indigo-700 ring-indigo-200",
        },

    };


    const current =
        types[type] ?? {
            label: type,
            classes:
                "bg-slate-50 text-slate-700 ring-slate-200",
        };


    return `
        <span
            class="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-bold ring-1 ring-inset ${current.classes}"
        >
            ${current.label}
        </span>
    `;
}


/*
 * ==========================================
 * ESTADO DEL SERVICIO
 * ==========================================
 */

function renderServiceStatus(
    status: string,
): string {

    const statuses: Record<
        string,
        {
            label: string;
            classes: string;
            dot: string;
        }
    > = {

        pending: {
            label: "Pendiente",
            classes:
                "bg-slate-100 text-slate-700 ring-slate-200",
            dot:
                "bg-slate-400",
        },

        in_progress: {
            label: "En proceso",
            classes:
                "bg-orange-100 text-orange-700 ring-orange-200",
            dot:
                "bg-orange-500",
        },

        completed: {
            label: "Completado",
            classes:
                "bg-green-100 text-green-700 ring-green-200",
            dot:
                "bg-green-500",
        },

        not_completed: {
            label: "No realizado",
            classes:
                "bg-red-100 text-red-700 ring-red-200",
            dot:
                "bg-red-500",
        },

        canceled: {
            label: "Cancelado",
            classes:
                "bg-slate-100 text-slate-600 ring-slate-200",
            dot:
                "bg-slate-400",
        },

    };


    const current =
        statuses[status] ?? {
            label: status,
            classes:
                "bg-slate-100 text-slate-700 ring-slate-200",
            dot:
                "bg-slate-400",
        };


    return `
        <span
            class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${current.classes}"
        >
            <span
                class="h-1.5 w-1.5 rounded-full ${current.dot}"
            ></span>

            ${current.label}
        </span>
    `;
}


/*
 * ==========================================
 * EVENTOS
 * ==========================================
 */

function addServiceEvents() {

    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-action='start']",
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () =>
                    handleStart(
                        button.dataset.serviceId,
                    ),
            );
        });


    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-action='complete']",
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () =>
                    handleComplete(
                        button.dataset.serviceId,
                    ),
            );
        });


    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-action='edit-service']",
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () =>
                    handleEditService(
                        button.dataset.serviceId,
                    ),
            );
        });


    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-action='delete-service']",
        )
        .forEach((button) => {

            button.addEventListener(
                "click",
                () =>
                    handleDeleteService(
                        button.dataset.serviceId,
                    ),
            );
        });
}

/*
 * ==========================================
 * INICIAR SERVICIO
 * ==========================================
 */

async function handleStart(
    serviceId?: string,
) {

    if (!routeId || !serviceId || !currentRoute) {
        return;
    }

    const service = currentRoute.services.find(
        (item) => item.service_id === serviceId,
    );

    const routeCanStart =
        currentRoute.status === "assigned" ||
        currentRoute.status === "in_progress";

    if (!routeCanStart || service?.status !== "pending") {
        showError("No se puede iniciar este servicio en el estado actual de la ruta.");
        return;
    }

    try {

        disableServiceButtons();


        await startService(
            routeId,
            serviceId,
        );


        currentRoute =
            await getRoute(routeId);


        renderRoute();

    } catch (error) {

        showError(
            error instanceof Error
                ? error.message
                : "No se pudo iniciar el servicio.",
        );

        enableServiceButtons();
    }
}


/*
 * ==========================================
 * COMPLETAR SERVICIO
 * ==========================================
 */

async function handleComplete(
    serviceId?: string,
) {

    if (!routeId || !serviceId || !currentRoute) {
        return;
    }

    const service = currentRoute.services.find(
        (item) => item.service_id === serviceId,
    );

    if (
        currentRoute.status !== "in_progress" ||
        service?.status !== "in_progress"
    ) {
        showError("Solo puedes completar servicios de una ruta en proceso.");
        return;
    }

    const notesInput =
        document.querySelector<HTMLTextAreaElement>(
            `[data-notes="${serviceId}"]`,
        );


    const notes =
        notesInput?.value.trim();


    try {

        disableServiceButtons();


        await completeService(
            routeId,
            serviceId,
            notes,
        );


        currentRoute =
            await getRoute(routeId);


        renderRoute();

    } catch (error) {

        showError(
            error instanceof Error
                ? error.message
                : "No se pudo completar el servicio.",
        );

        enableServiceButtons();
    }
}

/*
 * ==========================================
 * ABRIR MODAL EDITAR/AGREGAR SERVICIO
 * ==========================================
 */
function populateEditServiceCustomers(
    selectedCustomerId?: string,
) {
    if (!editServiceCustomer) {
        return;
    }

    editServiceCustomer.innerHTML = `
        <option value="">
            Selecciona un cliente
        </option>
    `;

    // 1. Solo tomar clientes activos
    const activeCustomers = customers.filter(
        (customer) => customer.active !== false,
    );

    /*
     * Si no hay ningún cliente activo en la base de datos
     */
    if (activeCustomers.length === 0) {
        editServiceCustomer.disabled = true;
        editServiceCustomerEmpty?.classList.remove("hidden");

        // Cambiar el mensaje para ser más claros
        if (editServiceCustomerEmpty) {
            editServiceCustomerEmpty.innerHTML = `
                 <svg class="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 <span>No hay clientes activos en la base de datos para asignar.</span>
             `;
        }

        if (saveEditServiceButton) {
            saveEditServiceButton.disabled = true;
        }

        return;
    }

    editServiceCustomer.disabled = false;
    editServiceCustomerEmpty?.classList.add("hidden");

    if (saveEditServiceButton) {
        saveEditServiceButton.disabled = false;
    }

    // ==========================================
    // LÓGICA DE EXCLUSIÓN MUTUA
    // ==========================================

    // 2. Extraer los IDs de los clientes que YA están en la ruta actual
    const occupiedCustomerIds = new Set<string>();

    if (currentRoute && currentRoute.services) {
        currentRoute.services.forEach(service => {
            // Solo nos importan los clientes que realmente están en un servicio
            const cId = service.customer?.id ?? service.customer_id;
            if (cId) {
                occupiedCustomerIds.add(cId);
            }
        });
    }

    // 3. Contar cuántos clientes quedan realmente libres
    let availableCount = 0;

    activeCustomers.forEach((customer) => {
        const option = document.createElement("option");
        option.value = customer.id;

        // Comprobar si el cliente está ocupado en esta ruta
        const isOccupied = occupiedCustomerIds.has(customer.id);

        // El cliente está ocupado PERO es el que estamos editando en este momento (modo editar)
        const isCurrentCustomer = customer.id === selectedCustomerId;

        if (isOccupied && !isCurrentCustomer) {
            // BLOQUEADO: El cliente ya está en otra visita de esta ruta
            option.disabled = true;
            option.textContent = `🚫 ${customer.name} — ${customer.location} (Ya asignado a esta ruta)`;
        } else {
            // LIBRE: O bien no está en la ruta, o es el que estamos editando
            option.disabled = false;
            option.textContent = `${customer.name} — ${customer.location}`;
            availableCount++;
        }

        option.selected = isCurrentCustomer;
        editServiceCustomer.appendChild(option);
    });

    // 4. Si después de procesar todos, resulta que TODOS están ocupados y estamos agregando uno nuevo
    if (availableCount === 0 && serviceModalMode === "add") {
        editServiceCustomer.disabled = true;
        editServiceCustomerEmpty?.classList.remove("hidden");

        if (editServiceCustomerEmpty) {
            editServiceCustomerEmpty.innerHTML = `
                 <svg class="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                 <span>Todos los clientes disponibles ya fueron agregados a esta ruta.</span>
             `;
        }

        if (saveEditServiceButton) {
            saveEditServiceButton.disabled = true;
        }
    }
}

/*
 * ==========================================
 * EDITAR SERVICIO
 * ==========================================
 */

function handleEditService(serviceId?: string) {

    if (
        !routeId ||
        !serviceId ||
        !currentRoute
    ) {
        return;
    }


    const service =
        currentRoute.services.find(
            (item) =>
                item.service_id === serviceId,
        );


    if (!service) {

        showError(
            "Servicio no encontrado.",
        );

        return;
    }


    /*
     * Solo se pueden editar
     * servicios pendientes de rutas asignadas
     */

    if (
        currentRoute.status !== "assigned" ||
        service.status !== "pending"
    ) {

        showError(
            "Este servicio ya no puede editarse.",
        );

        return;
    }


    /*
     * Modo edición
     */

    serviceModalMode =
        "edit";

    editingServiceId =
        serviceId;


    /*
     * Configurar título
     */

    if (editServiceModalTitle) {

        editServiceModalTitle.textContent =
            "Editar servicio";
    }


    if (editServiceModalDescription) {

        editServiceModalDescription.textContent =
            "Modifica el cliente o tipo de servicio.";
    }


    if (saveEditServiceButton) {

        saveEditServiceButton.textContent =
            "Guardar cambios";
    }


    /*
     * Cargar clientes
     */

    const currentCustomerId =
        service.customer?.id ??
        service.customer_id;


    populateEditServiceCustomers(
        currentCustomerId,
    );


    /*
     * Cargar tipo de servicio
     */

    if (editServiceType) {

        editServiceType.value =
            service.service_type;
    }


    /*
     * Limpiar errores
     */

    hideEditServiceError();


    /*
     * Mostrar modal
     */

    editServiceModal?.classList.remove(
        "hidden",
    );

    editServiceModal?.setAttribute(
        "aria-hidden",
        "false",
    );
}

/*
 * ==========================================
 * AGREGAR SERVICIO
 * ==========================================
 */

function handleAddService() {

    if (!routeId || !currentRoute) {
        return;
    }


    if (
        currentRoute.status !==
        "assigned"
    ) {

        showError(
            "Solo se pueden agregar servicios a una ruta asignada.",
        );

        return;
    }


    serviceModalMode =
        "add";

    editingServiceId =
        null;


    if (editServiceModalTitle) {

        editServiceModalTitle.textContent =
            "Agregar servicio";
    }


    if (editServiceModalDescription) {

        editServiceModalDescription.textContent =
            "Selecciona el cliente y el tipo de servicio.";
    }


    if (saveEditServiceButton) {

        saveEditServiceButton.textContent =
            "Agregar servicio";
    }


    populateEditServiceCustomers();


    if (editServiceType) {

        editServiceType.value =
            "S";
    }


    hideEditServiceError();


    editServiceModal?.classList.remove(
        "hidden",
    );

    editServiceModal?.setAttribute(
        "aria-hidden",
        "false",
    );
}

/*
 * ==========================================
 * GUARDAR CAMBIOS DEL SERVICIO
 * ==========================================
 */
async function saveEditService() {

    if (
        !routeId ||
        !currentRoute
    ) {
        return;
    }


    hideEditServiceError();


    const customerId =
        editServiceCustomer?.value.trim();


    const serviceTypeValue =
        editServiceType?.value;


    /*
     * Validar cliente
     */

    if (!customerId) {

        showEditServiceError(
            "Debes seleccionar un cliente.",
        );

        return;
    }


    /*
     * Validar tipo
     */

    if (
        serviceTypeValue !== "S" &&
        serviceTypeValue !== "R" &&
        serviceTypeValue !== "A" &&
        serviceTypeValue !== "CF"
    ) {

        showEditServiceError(
            "Debes seleccionar un tipo de servicio válido.",
        );

        return;
    }


    const serviceType = serviceTypeValue as "S" | "R" | "A" | "CF";


    const modeAtStart = serviceModalMode;

    try {

        setEditServiceLoading(true);


        /*
         * AGREGAR
         */

        if (
            serviceModalMode ===
            "add"
        ) {

            await addRouteService(
                routeId,
                {
                    customer_id:
                    customerId,

                    service_type:
                    serviceType,
                },
            );

        }

        /*
         * EDITAR
         */

        else {

            if (
                !editingServiceId
            ) {

                throw new Error(
                    "No se encontró el servicio que deseas editar.",
                );
            }


            await updateRouteService(
                routeId,
                editingServiceId,
                {
                    customer_id:
                    customerId,

                    service_type:
                    serviceType,
                },
            );
        }


        /*
         * Recargar ruta
         */

        currentRoute =
            await getRoute(
                routeId,
            );


        /*
         * Cerrar modal
         */

        closeEditServiceModal();


        /*
         * Actualizar pantalla
         */

        renderRoute();

    } catch (error) {

        showEditServiceError(

            error instanceof Error
                ? error.message
                : modeAtStart === "add"
                    ? "No se pudo agregar el servicio."
                    : "No se pudieron guardar los cambios.",
        );

    } finally {

        setEditServiceLoading(
            false,
        );
    }
}

/*
 * ==========================================
 * CERRAR MODAL
 * ==========================================
 */

function closeEditServiceModal() {

    editingServiceId =
        null;

    serviceModalMode =
        "edit";


    editServiceModal?.classList.add(
        "hidden",
    );

    editServiceModal?.setAttribute(
        "aria-hidden",
        "true",
    );


    if (editServiceCustomer) {

        editServiceCustomer.disabled =
            false;

        editServiceCustomer.innerHTML =
            "";
    }


    editServiceCustomerEmpty?.classList.add(
        "hidden",
    );


    if (saveEditServiceButton) {

        saveEditServiceButton.disabled =
            false;

        saveEditServiceButton.textContent =
            "Guardar cambios";
    }


    if (editServiceModalTitle) {

        editServiceModalTitle.textContent =
            "Editar servicio";
    }


    if (editServiceModalDescription) {

        editServiceModalDescription.textContent =
            "Modifica el cliente o tipo de servicio.";
    }


    hideEditServiceError();
}

/*
 * ==========================================
 * LOADING DEL MODAL
 * ==========================================
 */

function setEditServiceLoading(
    loading: boolean,
) {

    if (!saveEditServiceButton) {
        return;
    }


    saveEditServiceButton.disabled =
        loading;


    saveEditServiceButton.textContent =
        loading
            ? "Guardando..."
            : serviceModalMode === "add"
                ? "Agregar servicio"
                : "Guardar cambios";
}

/*
 * ==========================================
 * ERROR DEL MODAL
 * ==========================================
 */

function showEditServiceError(
    message: string,
) {

    if (!editServiceError) {
        return;
    }


    editServiceError.textContent =
        message;


    editServiceError.classList.remove(
        "hidden",
    );
}


function hideEditServiceError() {

    editServiceError?.classList.add(
        "hidden",
    );

    if (editServiceError) {
        editServiceError.textContent =
            "";
    }
}

/*
 * ==========================================
 * ELIMINAR SERVICIO
 * ==========================================
 */

async function handleDeleteService(
    serviceId?: string,
) {

    if (!routeId || !serviceId || !currentRoute) {
        return;
    }


    const service =
        currentRoute.services.find(
            (item) =>
                item.service_id === serviceId,
        );


    if (!service) {

        showError(
            "Servicio no encontrado.",
        );

        return;
    }


    if (
        currentRoute.status !== "assigned" ||
        service.status !== "pending"
    ) {

        showError(
            "Este servicio ya no puede eliminarse.",
        );

        return;
    }


    const confirmed =
        window.confirm(
            "¿Seguro que deseas eliminar este servicio?",
        );


    if (!confirmed) {
        return;
    }


    try {

        disableServiceButtons();


        await deleteRouteService(
            routeId,
            serviceId,
        );


        currentRoute =
            await getRoute(routeId);


        renderRoute();


    } catch (error) {

        showError(
            error instanceof Error
                ? error.message
                : "No se pudo eliminar el servicio.",
        );

        enableServiceButtons();
    }
}


/*
 * ==========================================
 * DESHABILITAR BOTONES
 * ==========================================
 */

function disableServiceButtons() {

    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-action]",
        )
        .forEach((button) => {

            button.disabled = true;

            button.classList.add(
                "opacity-50",
                "cursor-not-allowed",
            );
        });
}


/*
 * ==========================================
 * HABILITAR BOTONES
 * ==========================================
 */

function enableServiceButtons() {

    document
        .querySelectorAll<HTMLButtonElement>(
            "[data-action]",
        )
        .forEach((button) => {

            button.disabled = false;

            button.classList.remove(
                "opacity-50",
                "cursor-not-allowed",
            );
        });
}


/*
 * ==========================================
 * FORMATEAR FECHA
 * ==========================================
 */

function formatDate(
    value: string,
): string {

    const [year, month, day] =
        value.split("-");


    const date =
        new Date(
            Number(year),
            Number(month) - 1,
            Number(day),
        );


    return date.toLocaleDateString(
        "es-MX",
        {
            day: "2-digit",
            month: "long",
            year: "numeric",
        },
    );
}


/*
 * ==========================================
 * ERROR
 * ==========================================
 */

function showError(
    message: string,
) {

    if (!errorMessage) {
        return;
    }


    errorMessage.textContent =
        message;

    errorMessage.classList.remove(
        "hidden",
    );
}


/*
 * ==========================================
 * INICIO
 * ==========================================
 */

loadData();

closeEditServiceButton?.addEventListener(
    "click",
    closeEditServiceModal,
);


cancelEditServiceButton?.addEventListener(
    "click",
    closeEditServiceModal,
);


editServiceBackdrop?.addEventListener(
    "click",
    closeEditServiceModal,
);


saveEditServiceButton?.addEventListener(
    "click",
    saveEditService,
);

addServiceButton?.addEventListener(
    "click",
    handleAddService,
);


document.addEventListener(
    "keydown",
    (event) => {

        if (
            event.key === "Escape" &&
            !editServiceModal?.classList.contains(
                "hidden",
            )
        ) {

            closeEditServiceModal();
        }
    },
);


