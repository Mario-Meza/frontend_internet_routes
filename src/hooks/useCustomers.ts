// src/hooks/useCustomers.ts
import { useCallback, useEffect, useState } from "react";
import {
    deleteCustomer,
    getCustomers,
    updateCustomerActive,
} from "../services/api";
import type { Customer } from "../types/customer";
import { showToast } from "../utils/format";

export function useCustomers() {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        getCustomers()
            .then((data) => {
                if (!cancelled) {
                    setCustomers(data);
                    setError(null);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "No se pudieron cargar los clientes.",
                    );
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const reload = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getCustomers();
            setCustomers(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "No se pudieron cargar los clientes.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    const toggleActive = async (customer: Customer) => {
        setBusyId(customer.id);
        try {
            const updated = await updateCustomerActive(customer.id, !customer.active);
            setCustomers((prev) =>
                prev.map((item) => (item.id === customer.id ? updated : item)),
            );
            showToast(
                updated.active
                    ? `Cliente "${updated.name}" reactivado.`
                    : `Cliente "${updated.name}" desactivado.`,
                "success",
            );
        } catch (err) {
            showToast(
                err instanceof Error ? err.message : "Error al actualizar el estado.",
                "error",
            );
        } finally {
            setBusyId(null);
        }
    };

    const removeCustomer = async (customer: Customer): Promise<boolean> => {
        setBusyId(customer.id);
        try {
            await deleteCustomer(customer.id);
            setCustomers((prev) => prev.filter((item) => item.id !== customer.id));
            showToast(`Cliente "${customer.name}" eliminado.`, "success");
            return true;
        } catch (err) {
            showToast(
                err instanceof Error ? err.message : "No se pudo eliminar el cliente.",
                "error",
            );
            return false;
        } finally {
            setBusyId(null);
        }
    };

    return {
        customers,
        loading,
        error,
        busyId,
        reload,
        toggleActive,
        removeCustomer,
    };
}