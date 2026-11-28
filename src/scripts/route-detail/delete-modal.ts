// src/scripts/route-detail/delete-modal.ts
import { deleteRouteService, getRoute } from "../../services/api";
import type { RouteDetail } from "../../types/route";

interface DeleteModalDeps {
    getRouteId: () => string | null;
    getCurrentRoute: () => RouteDetail | null;
    onBeforeAction: () => void;
    onAfterAction: () => void;
    onRouteUpdated: (route: RouteDetail) => void;
    onError: (message: string) => void;
}

export function createDeleteServiceModalController(deps: DeleteModalDeps) {
    const deleteModal = document.querySelector<HTMLDialogElement>("#deleteModal");
    const confirmDeleteBtn = document.querySelector<HTMLButtonElement>("#confirmDeleteBtn");
    const cancelDeleteBtn = document.querySelector<HTMLButtonElement>("#cancelDeleteBtn");

    let serviceIdToDelete: string | null = null;

    function open(serviceId?: string) {
        const routeId = deps.getRouteId();
        const currentRoute = deps.getCurrentRoute();
        if (!routeId || !serviceId || !currentRoute) return;

        const service = currentRoute.services.find((item) => item.service_id === serviceId);
        if (!service) {
            deps.onError("Servicio no encontrado.");
            return;
        }

        if (currentRoute.status !== "assigned" || service.status !== "pending") {
            deps.onError("Este servicio ya no puede eliminarse.");
            return;
        }

        serviceIdToDelete = serviceId;
        deleteModal?.showModal();
    }

    cancelDeleteBtn?.addEventListener("click", () => {
        deleteModal?.close();
        serviceIdToDelete = null;
    });

    confirmDeleteBtn?.addEventListener("click", async () => {
        const routeId = deps.getRouteId();
        if (!routeId || !serviceIdToDelete) return;

        const targetServiceId = serviceIdToDelete;
        const originalText = confirmDeleteBtn.textContent || "Sí, eliminar";
        confirmDeleteBtn.textContent = "Eliminando...";
        confirmDeleteBtn.disabled = true;
        deps.onBeforeAction();

        try {
            await deleteRouteService(routeId, targetServiceId);
            const updatedRoute = await getRoute(routeId);
            deps.onRouteUpdated(updatedRoute);
        } catch (error) {
            deps.onError(
                error instanceof Error ? error.message : "No se pudo eliminar el servicio.",
            );
        } finally {
            deleteModal?.close();
            serviceIdToDelete = null;
            confirmDeleteBtn.textContent = originalText;
            confirmDeleteBtn.disabled = false;
            deps.onAfterAction();
        }
    });

    return {
        open,
    };
}