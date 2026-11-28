// src/scripts/route-detail.ts
import { completeService, getCustomers, getRoute, startService } from "../services/api";
import type { Customer } from "../types/customer";
import type { RouteDetail } from "../types/route";
import { createDeleteServiceModalController } from "./route-detail/delete-modal";
import {
    createServiceCard,
    formatLongDate,
    getRouteStatusMeta,
    renderEmptyServicesState,
} from "./route-detail/renderers";
import { createServiceModalController } from "./route-detail/service-modal";

const routeTitle = document.querySelector<HTMLElement>("#route-title");
const routeTechnician = document.querySelector<HTMLElement>("#route-technician");
const routeStatus = document.querySelector<HTMLElement>("#route-status");
const totalServices = document.querySelector<HTMLElement>("#total-services");
const completedServices = document.querySelector<HTMLElement>("#completed-services");
const pendingServices = document.querySelector<HTMLElement>("#pending-services");
const servicesContainer = document.querySelector<HTMLElement>("#services-container");
const errorMessage = document.querySelector<HTMLElement>("#error-message");
const addServiceButton = document.querySelector<HTMLButtonElement>("#add-service");

const routeId = new URLSearchParams(window.location.search).get("id");

let currentRoute: RouteDetail | null = null;
let customers: Customer[] = [];

function showError(message: string) {
    if (!errorMessage) return;
    errorMessage.textContent = message;
    errorMessage.classList.remove("hidden");
}

function hideError() {
    if (!errorMessage) return;
    errorMessage.textContent = "";
    errorMessage.classList.add("hidden");
}

function setServiceButtonsDisabled(disabled: boolean) {
    document.querySelectorAll<HTMLButtonElement>("[data-action]").forEach((button) => {
        button.disabled = disabled;
        button.classList.toggle("opacity-50", disabled);
        button.classList.toggle("cursor-not-allowed", disabled);
    });
}

function renderRouteStatus(status: string) {
    if (!routeStatus) return;
    const current = getRouteStatusMeta(status);
    routeStatus.textContent = current.label;
    routeStatus.className = `inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${current.classes}`;
}

function renderAddServiceButton(route: RouteDetail) {
    if (!addServiceButton) return;

    if (route.status !== "assigned") {
        addServiceButton.classList.remove("inline-flex");
        addServiceButton.classList.add("hidden");
        return;
    }

    const occupiedCustomerIds = new Set(
        route.services.map((s) => s.customer?.id ?? s.customer_id).filter(Boolean),
    );
    const availableCount = customers.filter(
        (c) => c.active !== false && !occupiedCustomerIds.has(c.id),
    ).length;

    addServiceButton.classList.remove("hidden");
    addServiceButton.classList.add("inline-flex");
    addServiceButton.disabled = availableCount === 0;
    addServiceButton.textContent =
        availableCount === 0 ? "Sin clientes disponibles" : "Añadir Visita";
}

function renderServices(route: RouteDetail) {
    if (!servicesContainer) return;

    if (route.services.length === 0) {
        servicesContainer.innerHTML = renderEmptyServicesState();
        return;
    }

    servicesContainer.innerHTML = route.services
        .map((service, index) => createServiceCard(service, index, route.status))
        .join("");
}

function renderRoute() {
    if (!currentRoute) return;

    const completed = currentRoute.services.filter((s) => s.status === "completed").length;
    const pending =
        currentRoute.status === "canceled"
            ? 0
            : currentRoute.services.filter((s) => s.status === "pending").length;

    if (routeTitle) {
        routeTitle.textContent = `Ruta — ${formatLongDate(currentRoute.route_date)}`;
    }
    if (routeTechnician) {
        routeTechnician.textContent = `👨‍🔧 Técnico: ${currentRoute.technician.name}`;
    }
    if (totalServices) totalServices.textContent = String(currentRoute.services.length);
    if (completedServices) completedServices.textContent = String(completed);
    if (pendingServices) pendingServices.textContent = String(pending);

    renderRouteStatus(currentRoute.status);
    renderAddServiceButton(currentRoute);
    renderServices(currentRoute);
}

function handleRouteUpdated(updated: RouteDetail) {
    hideError();
    currentRoute = updated;
    renderRoute();
}

const serviceModal = createServiceModalController({
    getRouteId: () => routeId,
    getCurrentRoute: () => currentRoute,
    getCustomers: () => customers,
    onRouteUpdated: handleRouteUpdated,
    onError: showError,
});

const deleteModal = createDeleteServiceModalController({
    getRouteId: () => routeId,
    getCurrentRoute: () => currentRoute,
    onBeforeAction: () => setServiceButtonsDisabled(true),
    onAfterAction: () => setServiceButtonsDisabled(false),
    onRouteUpdated: handleRouteUpdated,
    onError: showError,
});

async function handleStart(serviceId?: string) {
    if (!routeId || !serviceId || !currentRoute) return;

    const service = currentRoute.services.find((item) => item.service_id === serviceId);
    const routeCanStart =
        currentRoute.status === "assigned" || currentRoute.status === "in_progress";

    if (!routeCanStart || service?.status !== "pending") {
        showError("No se puede iniciar este servicio en el estado actual de la ruta.");
        return;
    }

    try {
        setServiceButtonsDisabled(true);
        await startService(routeId, serviceId);
        handleRouteUpdated(await getRoute(routeId));
    } catch (error) {
        showError(error instanceof Error ? error.message : "No se pudo iniciar el servicio.");
        setServiceButtonsDisabled(false);
    }
}

async function handleComplete(serviceId?: string) {
    if (!routeId || !serviceId || !currentRoute) return;

    const service = currentRoute.services.find((item) => item.service_id === serviceId);
    if (currentRoute.status !== "in_progress" || service?.status !== "in_progress") {
        showError("Solo puedes completar servicios de una ruta en proceso.");
        return;
    }

    const notesInput = Array.from(
        document.querySelectorAll<HTMLTextAreaElement>("[data-notes]"),
    ).find((el) => el.dataset.notes === serviceId);

    const notes = notesInput?.value.trim();

    try {
        setServiceButtonsDisabled(true);
        await completeService(routeId, serviceId, notes);
        handleRouteUpdated(await getRoute(routeId));
    } catch (error) {
        showError(error instanceof Error ? error.message : "No se pudo completar el servicio.");
        setServiceButtonsDisabled(false);
    }
}

// Delegación única de eventos para todas las tarjetas de servicio
servicesContainer?.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest<HTMLButtonElement>("[data-action]");
    if (!button) return;

    const { action, serviceId } = button.dataset;
    switch (action) {
        case "start":
            void handleStart(serviceId);
            break;
        case "complete":
            void handleComplete(serviceId);
            break;
        case "edit-service":
            serviceModal.openEdit(serviceId);
            break;
        case "delete-service":
            deleteModal.open(serviceId);
            break;
    }
});

addServiceButton?.addEventListener("click", () => {
    serviceModal.openAdd();
});

async function loadData() {
    try {
        if (!routeId) {
            throw new Error("No se encontró el ID de la ruta.");
        }

        const [route, customersResponse] = await Promise.all([
            getRoute(routeId),
            getCustomers(),
        ]);

        currentRoute = route;
        customers = customersResponse;
        renderRoute();
    } catch (error) {
        showError(error instanceof Error ? error.message : "No se pudo cargar la ruta.");
    }
}

void loadData();