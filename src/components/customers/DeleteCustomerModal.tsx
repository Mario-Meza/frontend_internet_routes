// src/components/customers/DeleteCustomerModal.tsx
import { useEffect } from "react";
import type { Customer } from "../../types/customer";

interface Props {
    customer: Customer | null;
    isDeleting: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}

export function DeleteCustomerModal({
                                        customer,
                                        isDeleting,
                                        onCancel,
                                        onConfirm,
                                    }: Props) {
    useEffect(() => {
        if (!customer) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !isDeleting) {
                onCancel();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [customer, isDeleting, onCancel]);

    if (!customer) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-customer-title"
            onClick={(e) => {
                if (e.target === e.currentTarget && !isDeleting) onCancel();
            }}
        >
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200 sm:p-8">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 ring-8 ring-red-50/50">
                    <svg
                        className="h-7 w-7"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                    </svg>
                </div>

                <h3
                    id="delete-customer-title"
                    className="text-center text-xl font-black tracking-tight text-slate-900"
                >
                    ¿Eliminar cliente?
                </h3>
                <p className="mt-2 text-center text-sm font-medium text-slate-500 leading-relaxed">
                    Vas a eliminar a{" "}
                    <span className="font-bold text-slate-800">{customer.name}</span>. Si
                    ya está asociado a una ruta, el sistema impedirá borrarlo y podrás
                    desactivarlo en su lugar.
                </p>

                <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isDeleting}
                        className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="flex-1 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-red-500/20 transition hover:bg-red-700 disabled:opacity-60"
                    >
                        {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
}