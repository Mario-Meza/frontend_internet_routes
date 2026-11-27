import type { Customer } from "./customer";

export type RouteStatus = "assigned" | "in_progress" | "completed" | "canceled";
export type ServiceStatus = "pending" | "in_progress" | "completed" | "not_completed" | "canceled";
export type ServiceType = "S" | "R" | "A" | "CF"

export interface RouteService {
    service_id: string;
    customer_id: string;
    customer?: Customer | null;
    service_type: ServiceType;
    status: ServiceStatus;
    notes?: string | null;
    evidence_url?: string | null;
    started_at?: string | null;
    completed_at?: string | null;
}

export interface RouteServiceCreate {
    customer_id: string;
    service_type: ServiceType;
}

export interface RouteCreate {
    route_date: string;
    technician_id: string;
    services: RouteServiceCreate[];
}

export interface RouteUpdate {
    route_date?: string;
    technician_id?: string;
    status?: RouteStatus;
}

export interface Route {
    id: string;
    route_date: string;
    technician_id: string;
    status: RouteStatus;
    notes?: string | null;
    services: RouteService[];
}