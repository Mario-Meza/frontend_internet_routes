// src/scripts/route-detail/renderers.test.ts
import { describe, expect, it } from "vitest";
import type { RouteService } from "../../types/route";
import {
    createServiceCard,
    formatLongDate,
    getRouteStatusMeta,
    renderServiceStatusBadge,
    renderServiceTypeBadge,
} from "./renderers";

function buildService(overrides: Partial<RouteService> = {}): RouteService {
    return {
        service_id: "srv-01",
        customer_id: "cust-01",
        customer: {
            id: "cust-01",
            name: "María López",
            phone: "+527711234567",
            location: "Colonia Centro",
            reference: "Portón azul",
            active: true,
        },
        service_type: "CF",
        status: "pending",
        notes: null,
        started_at: null,
        completed_at: null,
        ...overrides,
    };
}

describe("route-detail renderers", () => {
    it("formatea la fecha larga en español", () => {
        const result = formatLongDate("2026-11-28");
        expect(result).toContain("28");
        expect(result.toLowerCase()).toContain("noviembre");
        expect(result).toContain("2026");
    });

    it("devuelve metadata de estado de ruta con fallback seguro", () => {
        expect(getRouteStatusMeta("in_progress").label).toBe("En proceso");
        expect(getRouteStatusMeta("custom_status").label).toBe("custom_status");
    });

    it("renderiza badges de tipo y estado escapando valores desconocidos", () => {
        expect(renderServiceTypeBadge("CF")).toContain("Cambio a fibra");
        expect(renderServiceTypeBadge("<img src=x>")).toContain("&lt;img src=x&gt;");
        expect(renderServiceStatusBadge("not_completed")).toContain("No realizado");
    });

    it("escapa HTML malicioso en cliente y observaciones dentro de la tarjeta", () => {
        const service = buildService({
            customer: {
                id: "cust-xss",
                name: '<script>alert("xss")</script>',
                phone: "+527711234567",
                location: '<b>Centro</b>',
                reference: '"><svg onload=alert(1)>',
                active: true,
            },
            notes: "<img src=x onerror=alert(1)>",
        });

        const html = createServiceCard(service, 0, "assigned");

        expect(html).not.toContain("<script>");
        expect(html).not.toContain("<svg onload=");
        expect(html).not.toContain("<img src=x");
        expect(html).toContain("&lt;script&gt;alert(\"xss\")&lt;/script&gt;");
        expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    });

    it("muestra acciones de editar, eliminar e iniciar cuando la ruta está asignada y el servicio pendiente", () => {
        const html = createServiceCard(buildService({ status: "pending" }), 0, "assigned");

        expect(html).toContain('data-action="edit-service"');
        expect(html).toContain('data-action="delete-service"');
        expect(html).toContain('data-action="start"');
        expect(html).not.toContain('data-action="complete"');
    });

    it("muestra textarea de notas y botón completar cuando ruta y servicio están en proceso", () => {
        const html = createServiceCard(buildService({ status: "in_progress" }), 1, "in_progress");

        expect(html).toContain('data-notes="srv-01"');
        expect(html).toContain('data-action="complete"');
        expect(html).not.toContain('data-action="edit-service"');
        expect(html).not.toContain('data-action="delete-service"');
    });

    it("muestra el servicio pendiente como cancelado y sin botones cuando la ruta está cancelada", () => {
        const html = createServiceCard(buildService({ status: "pending" }), 0, "canceled");

        expect(html).toContain("Cancelado");
        expect(html).not.toContain("data-action=");
    });

    it("muestra el bloque de visita completada sin barra de acciones al finalizar", () => {
        const html = createServiceCard(
            buildService({
                status: "completed",
                completed_at: "2026-11-28T16:30:00Z",
            }),
            2,
            "completed",
        );

        expect(html).toContain("Visita completada");
        expect(html).not.toContain("data-action=");
    });
});