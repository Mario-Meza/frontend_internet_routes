export interface Technician {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    specialties: string[];
    active: boolean;
    photo_url?: string | null;
}

export interface TechnicianCreate {
    name: string;
    email: string;
    password: string;
    phone?: string | null;
    specialties: string[];
    active?: boolean;
}

export interface TechnicianUpdate {
    name?: string;
    email?: string;
    password?: string;
    phone?: string | null;
    specialties?: string[]; // <-- Corregido (antes era specialty?: string)
    active?: boolean;
}