import { useState, useRef } from 'react';
import { Order } from '../types';

const API_URL = "http://localhost:8000/api/v1";

export const useOrderProcess = () => {
    const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const currentOrderRef = useRef<Order | null>(null);
    const progressRef = useRef<number>(0);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const createOrder = async (coffee_id: string, customer_name?: string): Promise<Order | null> => {
        try {
            const response = await fetch(`${API_URL}/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    coffee_id,
                    customer_name: customer_name || "Client",
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    throw new Error("Machine occupée - veuillez réserver un créneau");
                }
                throw new Error(data.message || "Erreur lors de la création de la commande");
            }

            setCurrentOrder(data.data);
            return data.data;
        } catch (error) {
            console.error("Erreur lors de la création de la commande:", error);
            throw error;
        }
    };

    const updateProgress = (value: number) => {
        setProgress(value);
        progressRef.current = value;
    };

    const resetOrder = () => {
        setCurrentOrder(null);
        setProgress(0);
        setIsProcessing(false);

        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }
    };

    return {
        currentOrder,
        isProcessing,
        progress,
        setIsProcessing,
        updateProgress,
        createOrder,
        resetOrder,
        currentOrderRef,
        progressRef,
        progressIntervalRef
    };
};