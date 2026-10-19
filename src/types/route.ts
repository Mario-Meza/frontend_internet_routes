// En tu archivo de tipos (ej. route.ts)
export type ServiceType =
    | "S"
    | "R"
    | "A"
    | "CF";


export type ServiceStatus =
    | "pending"
    | "in_progress"
    | "completed"
    | "not_completed"
    | "cancelled";


export interface RouteService {
    customer_id: string;
    service_type: ServiceType;
    status: ServiceStatus;
    notes: string | null;
    started_at: string | null;
    completed_at: string | null;
}


export interface Route {
    id: string;
    route_date: string;
    technician_id: string;
    services: RouteService[];
    // NUEVOS CAMPOS:
    scheduled_date: string;
    status: string;
    observations?: string | null;
}

export interface RouteService {
    service_id: string;
    customer_id: string;
    service_type: ServiceType;
    status: ServiceStatus;
    notes: string | null;
    started_at: string | null;
    completed_at: string | null;
}

export interface RouteServiceCreate {
    customer_id: string;
    service_type: ServiceType;
}

export interface CustomerSummary {
    id: string;
    name: string;
    phone: string;
    location: string;
    reference: string | null;
}


export interface TechnicianSummary {
    id: string;
    name: string;
    phone: string | null;
    active: boolean;
}


export interface RouteServiceDetail
    extends RouteService {

    customer: CustomerSummary | null;
}


export interface RouteDetail {
    id: string;
    route_date: string;
    technician_id: string;
    technician: TechnicianSummary;
    status: string;
    services: RouteServiceDetail[];
}