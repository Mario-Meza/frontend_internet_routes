export interface Technician {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    active: boolean;
    specialty?: string;
    photo_url?: string | null;
}

export interface TechnicianCreate {
    name: string;
    email: string;
    password: string;
    phone?: string | null;
    specialty?: string;
    photo_url?: string | null;
}

export interface TechnicianUpdate {
    name?: string;
    email?: string;
    phone?: string | null;
    specialty?: string;
    photo_url?: string | null;
}