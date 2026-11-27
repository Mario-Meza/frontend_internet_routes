// src/components/customers/CustomersManager.tsx
import { useMemo, useState } from "react";
import { useCustomers } from "../../hooks/useCustomers";
import type { Customer } from "../../types/customer";
import { getAvatarColor, getInitials } from "../../utils/format";
import { DeleteCustomerModal } from "./DeleteCustomerModal";

type StatusFilter = "all" | "active" | "inactive";
const PAGE_SIZE = 10;

export default function CustomersManager() {
    const {
        customers,
        loading,
        error,
        busyId,
        reload,
        toggleActive,
        removeCustomer,
    } = useCustomers();

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [page, setPage] = useState(1);
    const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
        null,
    );

    const stats = useMemo(() => {
        const active = customers.filter((c) => c.active).length;
        return {
            total: customers.length,
            active,
            inactive: customers.length - active,
        };
    }, [customers]);

    const filteredCustomers = useMemo(() => {
        const term = search.trim().toLowerCase();
        return customers.filter((customer) => {
            if (statusFilter === "active" && !customer.active) return false;
            if (statusFilter === "inactive" && customer.active) return false;

            if (!term) return true;
            return (
                customer.name.toLowerCase().includes(term) ||
                (customer.phone ?? "").toLowerCase().includes(term) ||
                (customer.location ?? "").toLowerCase().includes(term) ||
                (customer.reference ?? "").toLowerCase().includes(term)
            );
        });
    }, [customers, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
    const safePage = Math.min(page, totalPages);

    const paginatedCustomers = useMemo(() => {
        const start = (safePage - 1) * PAGE_SIZE;
        return filteredCustomers.slice(start, start + PAGE_SIZE);
    }, [filteredCustomers, safePage]);

    const handleSearchChange = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    const handleFilterChange = (value: StatusFilter) => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleConfirmDelete = async () => {
        if (!customerToDelete) return;
        const deleted = await removeCustomer(customerToDelete);
        if (deleted) {
            setCustomerToDelete(null);
        }
    };

    return (
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {/* Cabecera */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                        Clientes
                    </h1>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                        Directorio de suscriptores y direcciones de instalación.
                    </p>
                </div>

                <a
                    href="/customers/new"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-orange-500/25 transition hover:bg-orange-700 active:scale-[0.98]"
                >
                    <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    Nuevo cliente
                </a>
            </div>

            {/* Tarjetas resumen */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Total registrados
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-900">{stats.total}</p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                        Activos
                    </p>
                    <p className="mt-2 text-3xl font-black text-emerald-600">
                        {stats.active}
                    </p>
                </div>
                <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Inactivos
                    </p>
                    <p className="mt-2 text-3xl font-black text-slate-600">
                        {stats.inactive}
                    </p>
                </div>
            </div>

            {/* Barra de búsqueda y filtros */}
            <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80 md:flex-row md:items-center md:justify-between">
                <div className="relative flex-1">
                    <label htmlFor="customer-search" className="sr-only">
                        Buscar clientes
                    </label>
                    <input
                        id="customer-search"
                        type="search"
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        placeholder="Buscar por nombre, teléfono, dirección o referencia..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-4 text-sm font-medium text-slate-900 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20"
                    />
                </div>

                <div
                    className="flex rounded-xl bg-slate-100 p-1"
                    role="group"
                    aria-label="Filtrar por estado"
                >
                    {(
                        [
                            { key: "all", label: "Todos" },
                            { key: "active", label: "Activos" },
                            { key: "inactive", label: "Inactivos" },
                        ] as const
                    ).map((option) => (
                        <button
                            key={option.key}
                            type="button"
                            onClick={() => handleFilterChange(option.key)}
                            className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                                statusFilter === option.key
                                    ? "bg-white text-slate-900 shadow-sm"
                                    : "text-slate-600 hover:text-slate-900"
                            }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido principal */}
            {loading ? (
                <div className="space-y-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80">
                    {[1, 2, 3, 4].map((n) => (
                        <div
                            key={n}
                            className="h-14 animate-pulse rounded-xl bg-slate-100"
                        />
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                    <p className="text-sm font-bold text-red-700">{error}</p>
                    <button
                        type="button"
                        onClick={reload}
                        className="mt-4 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                    >
                        Reintentar
                    </button>
                </div>
            ) : paginatedCustomers.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-12 text-center">
                    <p className="text-base font-bold text-slate-700">
                        No se encontraron clientes
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                        Prueba cambiando los filtros o registra un nuevo cliente.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-200 text-left">
                            <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                            <tr>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Teléfono</th>
                                <th className="px-6 py-4">Ubicación</th>
                                <th className="px-6 py-4">Estado</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                            {paginatedCustomers.map((customer) => {
                                const isBusy = busyId === customer.id;
                                return (
                                    <tr
                                        key={customer.id}
                                        className="transition hover:bg-slate-50/70"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black ${getAvatarColor(customer.name)}`}
                                                >
                                                    {getInitials(customer.name)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {customer.name}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 font-semibold text-slate-600">
                                            {customer.phone ? (
                                                <a
                                                    href={`tel:${customer.phone}`}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    {customer.phone}
                                                </a>
                                            ) : (
                                                <span className="text-slate-400">Sin teléfono</span>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-800">
                                                {customer.location}
                                            </p>
                                            {customer.reference && (
                                                <p className="mt-0.5 text-xs text-slate-500">
                                                    Ref: {customer.reference}
                                                </p>
                                            )}
                                        </td>

                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                disabled={isBusy}
                                                onClick={() => toggleActive(customer)}
                                                aria-label={`Cambiar estado de ${customer.name}`}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition disabled:opacity-50 ${
                                                    customer.active
                                                        ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                }`}
                                            >
                          <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                  customer.active ? "bg-emerald-500" : "bg-slate-400"
                              }`}
                          />
                                                {customer.active ? "Activo" : "Inactivo"}
                                            </button>
                                        </td>

                                        <td className="px-6 py-4 text-right">
                                            <div className="inline-flex items-center gap-2">
                                                <a
                                                    href={`/customers/edit?id=${encodeURIComponent(customer.id)}`}
                                                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-200"
                                                >
                                                    Editar
                                                </a>
                                                <button
                                                    type="button"
                                                    disabled={isBusy}
                                                    onClick={() => setCustomerToDelete(customer)}
                                                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 text-xs font-bold text-slate-600">
              <span>
                Mostrando {paginatedCustomers.length} de{" "}
                  {filteredCustomers.length} clientes
              </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={safePage <= 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                    className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40"
                                >
                                    Anterior
                                </button>
                                <span>
                  Página {safePage} de {totalPages}
                </span>
                                <button
                                    type="button"
                                    disabled={safePage >= totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                    className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-200 transition hover:bg-slate-100 disabled:opacity-40"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <DeleteCustomerModal
                customer={customerToDelete}
                isDeleting={busyId !== null && busyId === customerToDelete?.id}
                onCancel={() => setCustomerToDelete(null)}
                onConfirm={handleConfirmDelete}
            />
        </main>
    );
}