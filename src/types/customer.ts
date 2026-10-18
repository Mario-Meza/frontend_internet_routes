export interface Customer {
    id: string;
    name: string;
    phone: string;
    location: string;
    reference: string | null;
    active: boolean;
}


export interface CustomerCreate {
    name: string;
    phone: string;
    location: string;
    reference?: string | null;
}


export interface CustomerUpdate {
    name?: string;
    phone?: string;
    location?: string;
    reference?: string | null;
}