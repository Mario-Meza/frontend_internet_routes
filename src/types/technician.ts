export interface Technician {
    id: string;
    name: string;
    phone: string | null;
    active: boolean;
    photo_url?: string | null;
}


export interface TechnicianCreate {
    name: string;
    phone?: string | null;
    photo_url?: string | null;
}


export interface TechnicianUpdate {
    name?: string;
    phone?: string | null;
    photo_url?: string | null;
}