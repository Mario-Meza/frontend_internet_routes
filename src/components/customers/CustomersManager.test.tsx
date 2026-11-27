import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CustomersManager from "./CustomersManager.tsx";
import * as api from "../../services/api";
import type { Customer } from "../../types/customer";

vi.mock("../../services/api", () => ({
    getCustomers: vi.fn(),
    updateCustomerActive: vi.fn(),
    deleteCustomer: vi.fn(),
}));

const mockCustomers: Customer[] = [
    {
        id: "1",
        name: "Carlos Hernández",
        phone: "7711234567",
        location: "Centro, Calle Hidalgo #12",
        reference: "Frente a la farmacia",
        active: true,
    },
    {
        id: "2",
        name: "Laura Martínez",
        phone: "7719876543",
        location: "Barrio Arriba #45",
        reference: null,
        active: false,
    },
];

describe("CustomersManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(api.getCustomers).mockResolvedValue(mockCustomers);
    });

    it("renderiza clientes y filtra por búsqueda y estado", async () => {
        const user = userEvent.setup();
        render(<CustomersManager />);

        expect(await screen.findByText("Carlos Hernández")).toBeInTheDocument();
        expect(screen.getByText("Laura Martínez")).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Activos" }));
        expect(screen.getByText("Carlos Hernández")).toBeInTheDocument();
        expect(screen.queryByText("Laura Martínez")).not.toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Todos" }));
        await user.type(screen.getByLabelText("Buscar clientes"), "Barrio Arriba");
        expect(screen.getByText("Laura Martínez")).toBeInTheDocument();
        expect(screen.queryByText("Carlos Hernández")).not.toBeInTheDocument();
    });

    it("abre el modal de eliminación accesible y lo cierra con Escape", async () => {
        const user = userEvent.setup();
        render(<CustomersManager />);

        await screen.findByText("Carlos Hernández");
        const deleteButtons = screen.getAllByRole("button", { name: "Eliminar" });
        await user.click(deleteButtons[0]);

        const dialog = screen.getByRole("dialog");
        expect(dialog).toHaveAttribute("aria-modal", "true");
        expect(screen.getByText("¿Eliminar cliente?")).toBeInTheDocument();

        await user.keyboard("{Escape}");
        await waitFor(() => {
            expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        });
    });
});