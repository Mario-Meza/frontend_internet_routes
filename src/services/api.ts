import type {Customer, CustomerCreate, CustomerUpdate} from "../types/customer";
import type {
    Technician,
    TechnicianCreate,
    TechnicianUpdate
} from "../types/technician";

import type {
    Route,
    RouteDetail,
    RouteServiceCreate,
    ServiceType,
} from "../types/route";


const API_URL =
    import.meta.env.PUBLIC_API_URL ??
    "http://127.0.0.1:8000/api/v1";


async function apiRequest<T>(
    endpoint: string,
    options?: RequestInit,
): Promise<T> {

    // Verificamos si el cuerpo enviado es un FormData
    const isFormData = options?.body instanceof FormData;

    const response = await fetch(
        `${API_URL}${endpoint}`,
        {
            ...options,
            headers: isFormData
                ? { ...options?.headers } // Si es FormData, dejamos que fetch asigne el boundary automáticamente
                : {
                    "Content-Type": "application/json",
                    ...options?.headers,
                },
        },
    );

    // Resto del código de manejo de errores y respuestas...


    /*
     * ==========================================
     * MANEJO DE ERRORES
     * ==========================================
     */

    if (!response.ok) {

        const contentType =
            response.headers.get(
                "content-type",
            );


        let message =
            "Error en la petición";


        if (
            contentType?.includes(
                "application/json",
            )
        ) {

            const errorData =
                await response.json();


            if (
                typeof errorData.detail ===
                "string"
            ) {

                message =
                    errorData.detail;

            } else if (
                errorData.detail
            ) {

                message =
                    JSON.stringify(
                        errorData.detail,
                    );
            }

        } else {

            const errorText =
                await response.text();


            if (errorText) {
                message = errorText;
            }
        }


        throw new Error(message);
    }


    /*
     * ==========================================
     * 204 NO CONTENT
     * ==========================================
     */

    if (response.status === 204) {

        return undefined as T;
    }


    /*
     * ==========================================
     * JSON
     * ==========================================
     */

    return response.json();
}

export async function getRoutes(): Promise<Route[]> {

    return apiRequest<Route[]>(
        "/routes/",
    );
}


export async function getRoute(
    routeId: string,
): Promise<RouteDetail> {

    return apiRequest<RouteDetail>(
        `/routes/${routeId}`,
    );
}


/* ==========================================
   CREAR RUTA
========================================== */

export async function createRoute(
    routeDate: string,
    technicianId: string,
    services: RouteServiceCreate[],
): Promise<Route> {

    return apiRequest<Route>(
        "/routes/",
        {
            method: "POST",
            body: JSON.stringify({
                route_date: routeDate,
                technician_id: technicianId,
                services,
            }),
        },
    );
}

/* ==========================================
   INICIAR SERVICIO
========================================== */
export async function startService(
    routeId: string,
    serviceId: string,
): Promise<Route> {

    return apiRequest<Route>(
        `/routes/${routeId}/services/${serviceId}/start`,
        {
            method: "PATCH",
        },
    );
}


export async function completeService(
    routeId: string,
    serviceId: string,
    notes?: string,
): Promise<Route> {

    return apiRequest<Route>(
        `/routes/${routeId}/services/${serviceId}/complete`,
        {
            method: "PATCH",
            body: JSON.stringify({
                notes: notes || null,
            }),
        },
    );
}

// ==========================================
// ACTUALIZAR SERVICIO DE UNA RUTA
// ==========================================

export async function updateRouteService(
    routeId: string,
    serviceId: string,
    data: {
        customer_id?: string;
        service_type?: ServiceType;
    },
): Promise<Route> {
    return apiRequest<Route>(
        `/routes/${routeId}/services/${serviceId}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        },
    );
}
// ============================================
// AGREGAR SERVICIO A UNA RUTA
// ============================================
export async function addRouteService(
    routeId: string,
    data: RouteServiceCreate,
): Promise<Route> {
    return apiRequest<Route>(
        `/routes/${routeId}/services`,
        {
            method: "POST",
            body: JSON.stringify(data),
        },
    );
}


// ==========================================
// ELIMINAR SERVICIO DE UNA RUTA
// ==========================================

export async function deleteRouteService(
    routeId: string,
    serviceId: string,
): Promise<void> {

    await apiRequest<void>(
        `/routes/${routeId}/services/${serviceId}`,
        {
            method: "DELETE",
        },
    );
}



// ==========================================
// CLIENTES
// ==========================================

export async function getCustomers(): Promise<Customer[]> {

    return apiRequest<Customer[]>(
        "/customers/",
    );
}


export async function getCustomer(
    customerId: string,
): Promise<Customer> {

    return apiRequest<Customer>(
        `/customers/${customerId}`,
    );
}


export async function createCustomer(
    customer: CustomerCreate,
): Promise<Customer> {

    return apiRequest<Customer>(
        "/customers/",
        {
            method: "POST",
            body: JSON.stringify(customer),
        },
    );
}


export async function updateCustomer(
    customerId: string,
    customer: CustomerUpdate,
): Promise<Customer> {

    return apiRequest<Customer>(
        `/customers/${customerId}`,
        {
            method: "PUT",
            body: JSON.stringify(customer),
        },
    );
}


export async function updateCustomerActive(
    customerId: string,
    active: boolean,
): Promise<Customer> {

    return apiRequest<Customer>(
        `/customers/${customerId}/active`,
        {
            method: "PATCH",
            body: JSON.stringify({
                active,
            }),
        },
    );
}


export async function deleteCustomer(
    customerId: string,
): Promise<void> {

    await apiRequest<void>(
        `/customers/${customerId}`,
        {
            method: "DELETE",
        },
    );
}

// ==========================================
// TÉCNICOS
// ==========================================

export async function getTechnicians(): Promise<Technician[]> {

    return apiRequest<Technician[]>(
        "/technicians/",
    );
}


export async function getTechnician(
    technicianId: string,
): Promise<Technician> {

    return apiRequest<Technician>(
        `/technicians/${technicianId}`,
    );
}


export async function createTechnician(
    technician: TechnicianCreate,
): Promise<Technician> {

    return apiRequest<Technician>(
        "/technicians/",
        {
            method: "POST",
            body: JSON.stringify(technician),
        },
    );
}


export async function updateTechnician(
    technicianId: string,
    technician: TechnicianUpdate,
): Promise<Technician> {

    return apiRequest<Technician>(
        `/technicians/${technicianId}`,
        {
            method: "PUT",
            body: JSON.stringify(technician),
        },
    );
}


export async function updateTechnicianActive(
    technicianId: string,
    active: boolean,
): Promise<Technician> {

    return apiRequest<Technician>(
        `/technicians/${technicianId}/active`,
        {
            method: "PATCH",
            body: JSON.stringify({
                active,
            }),
        },
    );
}


export async function deleteTechnician(
    technicianId: string,
): Promise<void> {

    await apiRequest<void>(
        `/technicians/${technicianId}`,
        {
            method: "DELETE",
        },
    );
}

// ==========================================
// ACTUALIZAR RUTA
// ==========================================

export async function updateRoute(
    routeId: string,
    data: {
        route_date?: string;
        technician_id?: string;
    },
): Promise<Route> {

    return apiRequest<Route>(
        `/routes/${routeId}`,
        {
            method: "PUT",
            body: JSON.stringify(data),
        },
    );
}


// ==========================================
// CAMBIAR ESTADO DE RUTA
// ==========================================

export async function updateRouteStatus(
    routeId: string,
    status:
        | "assigned"
        | "in_progress"
        | "completed"
        | "canceled",
): Promise<Route> {

    return apiRequest<Route>(
        `/routes/${routeId}/status`,
        {
            method: "PATCH",
            body: JSON.stringify({
                status,
            }),
        },
    );
}


// ==========================================
// ELIMINAR RUTA
// ==========================================

export async function deleteRoute(
    routeId: string,
): Promise<void> {

    await apiRequest<void>(
        `/routes/${routeId}`,
        {
            method: "DELETE",
        },
    );
}


export async function uploadTechnicianPhoto(
    technicianId: string,
    file: File,
) {
    const formData = new FormData();
    formData.append("file", file);

    return apiRequest<Technician>(
        `/technicians/${technicianId}/photo`,
        {
            method: "POST",
            body: formData,
        },
    );
}

// ==========================================
// ELIMINAR FOTO DE TÉCNICO
// ==========================================
export async function deleteTechnicianPhoto(
    technicianId: string,
): Promise<void> {
    await apiRequest<void>(
        `/technicians/${technicianId}/photo`,
        {
            method: "DELETE",
        },
    );
}
