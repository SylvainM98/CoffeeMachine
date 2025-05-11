"use client";

import { useState, useEffect, useRef } from "react";
import { Coffee, Order } from '../types';
import { useCoffeeSelection } from '../hooks/useCoffeeSelection';
import { useOrderProcess } from '../hooks/useOrderProcess';
import { useLiquidAnimation } from '../hooks/useLiquidAnimation';
import { useReservation } from '../hooks/useReservation';
import CoffeeButton from './CoffeeButton';
import ProgressDisplay from './ProgressDisplay';
import CommandButton from './CommandButton';
import CoffeeMachine from './CoffeeMachine';
import OrderTypeModal from './OrderTypeModal';
import '../styles/animations.css';

const API_URL = "http://localhost:8000/api/v1";

interface TimeSlot {
    time: string;
    formatted_time: string;
    display_time: string;
    is_next_available: boolean;
}

interface MachineStatus {
    machine_status: 'idle' | 'busy';
    queue_length: number;
    estimated_wait_time: number;
    current_order: Order | null;
    queue: Order[];
}

export default function ClickAndCollect() {
    const [coffees, setCoffees] = useState<Coffee[]>([]);
    const [showOrderTypeModal, setShowOrderTypeModal] = useState(false);
    const [machineStatus, setMachineStatus] = useState<MachineStatus | null>(null);
    const [progressInterval, setProgressInterval] = useState<NodeJS.Timeout | null>(null);
    const [isWatchingOrder, setIsWatchingOrder] = useState(false);
    const [isSelectingCoffee, setIsSelectingCoffee] = useState(false);
    const [messageTimeout, setMessageTimeout] = useState<NodeJS.Timeout | null>(null);
    const currentOrderCustomer = useRef<string>('');

    const { selectedCoffee, displayText, setDisplayText, selectCoffee, clearSelection, selectionTimerRef } = useCoffeeSelection();
    const {
        isProcessing,
        progress,
        setIsProcessing,
        createOrder,
        updateProgress,
        resetOrder
    } = useOrderProcess();
    const {
        isPouring,
        liquidOpacity,
        splashAnimation,
        startLiquidAnimation,
        stopLiquidAnimation,
        resetLiquidAnimation
    } = useLiquidAnimation();
    const { createReservation, isReserving } = useReservation();

    useEffect(() => {
        if (!selectedCoffee) {
            setIsSelectingCoffee(false);
            if (selectionTimerRef.current) {
                clearTimeout(selectionTimerRef.current);
            }
        }
    }, [selectedCoffee, selectionTimerRef]);

    useEffect(() => {
        const loadCoffees = async () => {
            try {
                const response = await fetch(`${API_URL}/coffees`);
                const data = await response.json();
                setCoffees(data.data);
            } catch (error) {
                console.error("Erreur lors du chargement des cafés:", error);
                if (!isWatchingOrder && !isSelectingCoffee) setDisplayText("Erreur de chargement");
            }
        };

        const fetchMachineStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/queue/status`);
                const data = await response.json();
                setMachineStatus({
                    machine_status: data.machine_status,
                    queue_length: data.queue_length,
                    estimated_wait_time: data.estimated_wait_time,
                    current_order: data.current_order,
                    queue: data.queue
                });

                if (!isSelectingCoffee && !isProcessing && !isReserving && !isWatchingOrder && !messageTimeout) {
                    if (data.current_order && data.current_order.status === 'brewing') {
                        const customer = data.current_order.customer_name;
                        const coffeeType = data.current_order.coffee.type.charAt(0).toUpperCase() +
                            data.current_order.coffee.type.slice(1);
                        setDisplayText(
                            <>
                                {coffeeType} pour {customer}
                                <br />
                                En préparation...
                            </>
                        );
                    } else {
                        setDisplayText("Choisissez votre café");
                    }
                }

            } catch (error) {
                console.error("Erreur lors du chargement du statut:", error);
            }
        };

        loadCoffees();
        fetchMachineStatus();
        const statusInterval = setInterval(fetchMachineStatus, 3000);

        return () => {
            clearInterval(statusInterval);
            if (progressInterval) {
                clearInterval(progressInterval);
            }
            if (messageTimeout) {
                clearTimeout(messageTimeout);
            }
        };
    }, [setDisplayText, progressInterval, isProcessing, isReserving, isWatchingOrder, isSelectingCoffee, messageTimeout]);

    const handleCoffeeSelect = (coffee: Coffee) => {
        selectCoffee(coffee);

        // Immédiatement activer l'état de sélection
        setIsSelectingCoffee(true);

        // Clear any existing timer
        if (selectionTimerRef.current) {
            clearTimeout(selectionTimerRef.current);
        }

        // Set new timer
        selectionTimerRef.current = setTimeout(() => {
            setIsSelectingCoffee(false);
        }, 10000);
    };

    const handleCreateOrder = () => {
        if (!selectedCoffee) return;

        if (selectionTimerRef.current) {
            clearTimeout(selectionTimerRef.current);
        }
        setIsSelectingCoffee(false);

        setShowOrderTypeModal(true);
    };

    const handleCloseModal = () => {
        clearSelection();
        setShowOrderTypeModal(false);
    };

    const getNextAvailableSlot = async () => {
        try {
            const response = await fetch(`${API_URL}/queue/next-slot`);
            const data = await response.json();
            return data.next_available_slot;
        } catch (error) {
            console.error("Erreur lors de la récupération du prochain créneau:", error);
            return null;
        }
    };

    const handleImmediateOrder = async (customerName: string) => {
        if (!selectedCoffee) return;

        setShowOrderTypeModal(false);
        setIsWatchingOrder(true);
        currentOrderCustomer.current = customerName;

        if (machineStatus?.machine_status === 'idle') {
            setIsProcessing(true);

            try {
                const order = await createOrder(selectedCoffee.id, customerName);
                clearSelection();

                if (!order) {
                    setIsProcessing(false);
                    setIsWatchingOrder(false);
                    return;
                }

                const coffeeType = selectedCoffee.type.charAt(0).toUpperCase() + selectedCoffee.type.slice(1);
                setDisplayText(
                    <>
                        {coffeeType} pour {customerName}
                    </>
                );

                startLiquidAnimation();

                const interval = setInterval(async () => {
                    try {
                        const response = await fetch(`${API_URL}/process/${order.id}/progress`);
                        const data = await response.json();

                        if (data.progress !== undefined) {
                            updateProgress(data.progress);
                        }

                        if (data.status === 'completed') {
                            clearInterval(interval);
                            setProgressInterval(null);
                            setIsProcessing(false);
                            stopLiquidAnimation();
                            const coffeeName = selectedCoffee.type.charAt(0).toUpperCase() + selectedCoffee.type.slice(1);
                            setDisplayText(`Le ${coffeeName.toLowerCase()} de ${currentOrderCustomer.current} est prêt`);

                            const timeout = setTimeout(() => {
                                resetOrder();
                                resetLiquidAnimation();
                                setDisplayText("Choisissez votre café");
                                setIsWatchingOrder(false);
                                currentOrderCustomer.current = '';
                                setMessageTimeout(null);
                            }, 5000);

                            setMessageTimeout(timeout);
                        }
                    } catch (error) {
                        console.error("Erreur lors du suivi de la progression:", error);
                    }
                }, 1000);

                setProgressInterval(interval);

            } catch (error) {
                console.error("Erreur lors de la création de la commande:", error);
                setIsProcessing(false);
                resetLiquidAnimation();
                setDisplayText("Machine occupée - créneaux requis");

                const timeout = setTimeout(() => {
                    setShowOrderTypeModal(true);
                    setDisplayText("Choisissez votre café");
                    setIsWatchingOrder(false);
                    currentOrderCustomer.current = '';
                    setMessageTimeout(null);
                }, 2000);

                setMessageTimeout(timeout);
            }
        } else {
            const nextSlot = await getNextAvailableSlot();

            if (nextSlot) {
                try {
                    const order = await createReservation(selectedCoffee.id, nextSlot, customerName);
                    clearSelection();

                    if (order) {
                        const time = new Date(nextSlot).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        const coffeeType = selectedCoffee.type.charAt(0).toUpperCase() + selectedCoffee.type.slice(1);

                        setDisplayText(
                            <>
                                {coffeeType} pour {customerName}
                                <br />
                                Créneau automatique: {time}
                            </>
                        );

                        const timeout = setTimeout(() => {
                            setDisplayText("Choisissez votre café");
                            setIsWatchingOrder(false);
                            currentOrderCustomer.current = '';
                            setMessageTimeout(null);
                        }, 5000);

                        setMessageTimeout(timeout);
                    }
                } catch (error) {
                    console.error("Erreur lors de la création de la réservation automatique:", error);
                    setDisplayText("Erreur - Réessayez");

                    const timeout = setTimeout(() => {
                        setDisplayText("Choisissez votre café");
                        setIsWatchingOrder(false);
                        currentOrderCustomer.current = '';
                        setMessageTimeout(null);
                    }, 3000);

                    setMessageTimeout(timeout);
                }
            } else {
                setShowOrderTypeModal(true);
                setIsWatchingOrder(false);
                currentOrderCustomer.current = '';
            }
        }
    };

    const handleReservation = async (customerName: string, slot: TimeSlot) => {
        if (!selectedCoffee) return;

        setShowOrderTypeModal(false);
        setIsWatchingOrder(true);

        try {
            const order = await createReservation(selectedCoffee.id, slot.formatted_time, customerName);
            clearSelection();

            if (order) {
                setDisplayText(
                    <>
                        Réservé pour
                        <br />
                        {slot.display_time}
                    </>
                );

                const timeout = setTimeout(() => {
                    setDisplayText("Choisissez votre café");
                    setIsWatchingOrder(false);
                    setMessageTimeout(null);
                }, 5000);

                setMessageTimeout(timeout);
            }
        } catch (error) {
            console.error("Erreur lors de la réservation:", error);
            setDisplayText("Erreur de réservation");

            const timeout = setTimeout(() => {
                setDisplayText("Choisissez votre café");
                setIsWatchingOrder(false);
                setMessageTimeout(null);
            }, 3000);

            setMessageTimeout(timeout);
        }
    };

    const canSelectCoffee = !isProcessing && !isReserving;
    const canOrder = selectedCoffee && !isProcessing && !(isWatchingOrder && machineStatus?.machine_status === 'idle');

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-100 font-sans text-[#FCF0D9]">
            <div className="w-[300px] h-[540px] bg-[#5EAA9E] rounded-[20px] flex flex-col items-center p-2.5 box-border shadow-lg gap-2.5">
                <div className="text-[#FCF0D9] bg-[#CD5941] text-2xl font-bold px-2.5 py-1.5 rounded-[5px] inline-block relative z-10">
                    CLICK & COLLECT
                </div>

                {machineStatus && (
                    <div className="w-full text-xs text-center text-white">
                        <div className="flex items-center justify-center gap-2 px-2">
                            <div className={`w-2 h-2 rounded-full ${machineStatus.machine_status === 'busy' ? 'bg-amber-400' : 'bg-green-400'
                                }`} />
                            <span>
                                {machineStatus.machine_status === 'busy'
                                    ? (() => {
                                        const immediate = machineStatus.queue?.filter((o: Order) => !o.pickup_time).length || 0;
                                        const reservations = machineStatus.queue?.filter((o: Order) => o.pickup_time).length || 0;

                                        let message = 'En cours d\'utilisation';

                                        if (immediate > 0) {
                                            message += ` • File: ${immediate}`;
                                        }

                                        if (reservations > 0) {
                                            message += ` • Résa: ${reservations}`;
                                        }

                                        const realWaitTime = Math.max(1, immediate + 1);
                                        message += ` • ${realWaitTime} min`;

                                        return message;
                                    })()
                                    : 'Disponible maintenant'
                                }
                            </span>
                        </div>
                    </div>
                )}

                <div className="w-full flex flex-col items-center gap-2.5">
                    <ProgressDisplay
                        displayText={displayText}
                        progress={progress}
                        isPouring={isPouring}
                    />

                    <div className="w-full flex justify-around items-center py-1.5 flex-shrink-0">
                        {coffees.map((coffee) => (
                            <CoffeeButton
                                key={coffee.id}
                                coffee={coffee}
                                onSelect={handleCoffeeSelect}
                                disabled={!canSelectCoffee}
                            />
                        ))}
                    </div>
                </div>

                <CoffeeMachine
                    progress={progress}
                    isPouring={isPouring}
                    liquidOpacity={liquidOpacity}
                    splashAnimation={splashAnimation}
                />

                <CommandButton
                    isProcessing={false}
                    disabled={!canOrder}
                    onClick={handleCreateOrder}
                />
            </div>

            {showOrderTypeModal && machineStatus && (
                <OrderTypeModal
                    onImmediateOrder={handleImmediateOrder}
                    onReservation={handleReservation}
                    onClose={handleCloseModal}
                    machineStatus={machineStatus.machine_status}
                />
            )}
        </div>
    );
}