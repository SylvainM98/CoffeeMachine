import { useState } from 'react';
import { Order } from '../types';

const API_URL = "http://localhost:8000/api/v1";

export const useReservation = () => {
    const [isReserving, setIsReserving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createReservation = async (coffeeId: string, pickupTime: string, customerName?: string): Promise<Order | null> => {
        setIsReserving(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    coffee_id: coffeeId,
                    customer_name: customerName || 'Client',
                    pickup_time: pickupTime,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Erreur lors de la réservation');
                return null;
            }

            return data.data;
        } catch {
            setError('Erreur réseau lors de la réservation');
            return null;
        } finally {
            setIsReserving(false);
        }
    };

    const validateTimeSlot = async (pickupTime: string): Promise<{ is_available: boolean; earliest_available_time?: string }> => {
        try {
            const response = await fetch(`${API_URL}/queue/validate-slot`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pickup_time: pickupTime,
                }),
            });

            const data = await response.json();
            return data;
        } catch {
            return { is_available: false };
        }
    };

    return {
        isReserving,
        error,
        createReservation,
        validateTimeSlot,
    };
};