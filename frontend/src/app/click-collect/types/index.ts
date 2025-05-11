export interface Coffee {
    id: string;
    type: string;
    price: number | string;
    preparation_time: number;
}

export interface Order {
    id: string;
    coffee: Coffee;
    status: string;
    progress: number;
    customer_name: string;
    pickup_time?: string | null;
    estimated_completion_time?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface AnimationState {
    isPouring: boolean;
    liquidOpacity: number;
    splashAnimation: boolean;
    progress: number;
}