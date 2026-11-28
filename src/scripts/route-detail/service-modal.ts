// src/scripts/route-detail/service-modal.ts
import { addRouteService, getRoute, updateRouteService } from "../../services/api";
import type { Customer } from "../../types/customer";
import type { RouteDetail, ServiceType } from "../../types/route";

const VALID_SERVICE_TYPES = new Set<ServiceType>(["S", "R", "A", "CF"]);

interface ServiceModalDeps {
    getRouteId: () => string | null;
    getCurrentRoute: () => RouteDetail | null;
    getCustomers: () => Customer[];
    onRouteUpdated: (route: RouteDetail) => void;
    onError: (message: string) => void;
}

export function createServiceModalController(deps: ServiceModalDeps) {
    const modal = document.querySelector<HTMLDivElement>("#edit-service-modal");
    const backdrop = document.querySelector<HTMLDivElement>("#edit-service-backdrop");
    const closeButton = document.querySelector<HTMLButtonElement>("#close-edit-service");
    const cancelButton = document.querySelector<HTMLButtonElement>("#cancel-edit-service");
    const saveButton = document.querySelector<HTMLButtonElement>("#save-edit-service");
    const customerSelect = document.querySelector<HTMLSelectElement>("#edit-service-customer");
    const customerEmptyNotice = document.querySelector<HTMLParagraphElement>(
        "#edit-service-customer-empty",
    );
    const serviceTypeSelect = document.querySelector<HTMLSelectElement>("#edit-service-type");
    const errorBox = document.querySelector<HTMLDivElement>("#edit-service-error");
    const modalTitle = document.querySelector<HTMLElement>("#edit-service-modal-title");
    const modalDescription = document.querySelector<HTMLElement>("#edit-service-modal-description");

    let editingServiceId: string | null = null;
    let mode: "add" | "edit" = "edit";

    function showModalError(message: string) {
        if (!errorBox) return;
        errorBox.textContent = message;
        errorBox.classList.remove("hidden");
    }

    function hideModalError() {
        errorBox?.classList.add("hidden");
        if (errorBox) errorBox.textContent = "";
    }

    function setLoading(loading: boolean) {
        if (!saveButton) return;
        saveButton.disabled = loading;
        saveButton.textContent = loading
            ? "Guardando..."
            : mode === "add"
                ? "Agregar servicio"
                : "Guardar cambios";
    }

    function showEmptyCustomersWarning(text: string) {
        if (customerSelect) customerSelect.disabled = true;
        if (customerEmptyNotice) {
            customerEmptyNotice.classList.remove("hidden");
            customerEmptyNotice.innerHTML = `
                <svg class="h-5 w-5 shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>${text}</span>
            `;
        }
        if (saveButton) saveButton.disabled = true;
    }

    function populateCustomers(selectedCustomerId?: string) {
        if (!customerSelect) return;

        customerSelect.innerHTML = `<option value="">Selecciona un cliente</option>`;

        const activeCustomers = deps.getCustomers().filter((c) => c.active !== false);
        if (activeCustomers.length === 0) {
            showEmptyCustomersWarning("No hay clientes activos en la base de datos para asignar.");
            return;
        }

        customerSelect.disabled = false;
        customerEmptyNotice?.classList.add("hidden");
        if (saveButton) saveButton.disabled = false;

        const currentRoute = deps.getCurrentRoute();
        const occupiedIds = new Set<string>();
        currentRoute?.services.forEach((service) => {
            const id = service.customer?.id ?? service.customer_id;
            if (id) occupiedIds.add(id);
        });

        let availableCount = 0;

        activeCustomers.forEach((customer) => {
            const option = document.createElement("option");
            option.value = customer.id;

            const isOccupied = occupiedIds.has(customer.id);
            const isCurrent = customer.id === selectedCustomerId;

            if (isOccupied && !isCurrent) {
                option.disabled = true;
                option.textContent = `🚫 ${customer.name} — ${customer.location} (Ya en la ruta)`;
            } else {
                option.disabled = false;
                option.textContent = `${customer.name} — ${customer.location}`;
                availableCount++;
            }

            option.selected = isCurrent;
            customerSelect.appendChild(option);
        });

        if (availableCount === 0 && mode === "add") {
            showEmptyCustomersWarning(
                "Todos los clientes disponibles ya fueron agregados a esta ruta.",
            );
        }
    }

    function showModal() {
        modal?.classList.remove("hidden");
        modal?.setAttribute("aria-hidden", "false");
    }

    function close() {
        editingServiceId = null;
        mode = "edit";

        modal?.classList.add("hidden");
        modal?.setAttribute("aria-hidden", "true");

        if (customerSelect) {
            customerSelect.disabled = false;
            customerSelect.innerHTML = "";
        }

        customerEmptyNotice?.classList.add("hidden");

        if (saveButton) {
            saveButton.disabled = false;
            saveButton.textContent = "Guardar cambios";
        }

        if (modalTitle) modalTitle.textContent = "Editar servicio";
        if (modalDescription) {
            modalDescription.textContent = "Modifica el cliente o tipo de servicio.";
        }

        hideModalError();
    }

    function openAdd() {
        const routeId = deps.getRouteId();
        const currentRoute = deps.getCurrentRoute();
        if (!routeId || !currentRoute) return;

        if (currentRoute.status !== "assigned") {
            deps.onError("Solo se pueden agregar servicios a una ruta asignada.");
            return;
        }

        mode = "add";
        editingServiceId = null;

        if (modalTitle) modalTitle.textContent = "Agregar servicio";
        if (modalDescription) {
            modalDescription.textContent = "Selecciona el cliente y el tipo de servicio.";
        }
        if (saveButton) saveButton.textContent = "Agregar servicio";

        populateCustomers();
        if (serviceTypeSelect) serviceTypeSelect.value = "S";

        hideModalError();
        showModal();
    }

    function openEdit(serviceId?: string) {
        const routeId = deps.getRouteId();
        const currentRoute = deps.getCurrentRoute();
        if (!routeId || !serviceId || !currentRoute) return;

        const service = currentRoute.services.find((item) => item.service_id === serviceId);
        if (!service) {
            deps.onError("Servicio no encontrado.");
            return;
        }

        if (currentRoute.status !== "assigned" || service.status !== "pending") {
            deps.onError("Este servicio ya no puede editarse.");
            return;
        }

        mode = "edit";
        editingServiceId = serviceId;

        if (modalTitle) modalTitle.textContent = "Editar servicio";
        if (modalDescription) {
            modalDescription.textContent = "Modifica el cliente o tipo de servicio.";
        }
        if (saveButton) saveButton.textContent = "Guardar cambios";

        populateCustomers(service.customer?.id ?? service.customer_id);
        if (serviceTypeSelect) serviceTypeSelect.value = service.service_type;

        hideModalError();
        showModal();
    }

    async function handleSave() {
        const routeId = deps.getRouteId();
        const currentRoute = deps.getCurrentRoute();
        if (!routeId || !currentRoute) return;

        hideModalError();

        const customerId = customerSelect?.value.trim();
        const rawServiceType = serviceTypeSelect?.value as ServiceType | undefined;

        if (!customerId) {
            showModalError("Debes seleccionar un cliente.");
            return;
        }

        if (!rawServiceType || !VALID_SERVICE_TYPES.has(rawServiceType)) {
            showModalError("Debes seleccionar un tipo de servicio válido.");
            return;
        }

        const modeAtStart = mode;

        try {
            setLoading(true);

            if (modeAtStart === "add") {
                await addRouteService(routeId, {
                    customer_id: customerId,
                    service_type: rawServiceType,
                });
            } else {
                if (!editingServiceId) {
                    throw new Error("No se encontró el servicio que deseas editar.");
                }
                await updateRouteService(routeId, editingServiceId, {
                    customer_id: customerId,
                    service_type: rawServiceType,
                });
            }

            const updatedRoute = await getRoute(routeId);
            close();
            deps.onRouteUpdated(updatedRoute);
        } catch (error) {
            showModalError(
                error instanceof Error
                    ? error.message
                    : modeAtStart === "add"
                        ? "No se pudo agregar el servicio."
                        : "No se pudieron guardar los cambios.",
            );
        } finally {
            setLoading(false);
        }
    }

    closeButton?.addEventListener("click", close);
    cancelButton?.addEventListener("click", close);
    backdrop?.addEventListener("click", close);
    saveButton?.addEventListener("click", handleSave);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !modal?.classList.contains("hidden")) {
            close();
        }
    });

    return {
        openAdd,
        openEdit,
        close,
    };
}