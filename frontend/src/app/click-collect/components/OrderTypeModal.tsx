import { useState, useEffect } from 'react';

interface TimeSlot {
    time: string;
    formatted_time: string;
    display_time: string;
    is_next_available: boolean;
}

interface OrderTypeModalProps {
    onImmediateOrder: (customerName: string) => void;
    onReservation: (customerName: string, slot: TimeSlot) => void;
    onClose: () => void;
    machineStatus: 'idle' | 'busy';
}

const API_URL = "http://localhost:8000/api/v1";

export default function OrderTypeModal({ onImmediateOrder, onReservation, onClose, machineStatus }: OrderTypeModalProps) {
    const [customerName, setCustomerName] = useState<string>('');
    const [nameError, setNameError] = useState<string>('');
    const [showTimeSlots, setShowTimeSlots] = useState(false);
    const [slots, setSlots] = useState<TimeSlot[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
    const [loading, setLoading] = useState(false);
    const [hasAvailableSlots, setHasAvailableSlots] = useState<boolean | null>(null);

    // Vérifier la disponibilité des créneaux à l'ouverture du modal
    useEffect(() => {
        const checkSlots = async () => {
            try {
                const response = await fetch(`${API_URL}/queue/available-slots`);
                const data = await response.json();
                setHasAvailableSlots(data.available_slots.length > 0);
            } catch (error) {
                console.error('Erreur lors de la vérification des créneaux:', error);
                setHasAvailableSlots(false);
            }
        };

        checkSlots();
    }, []);

    const fetchSlots = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/queue/available-slots`);
            const data = await response.json();
            setSlots(data.available_slots);
        } catch (error) {
            console.error('Erreur lors du chargement des créneaux:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (type: 'immediate' | 'reservation') => {
        if (!customerName.trim()) {
            setNameError('Le nom est obligatoire');
            return;
        }

        if (type === 'immediate') {
            onImmediateOrder(customerName.trim());
        } else {
            fetchSlots();
            setShowTimeSlots(true);
        }
    };

    const handleBackToMain = () => {
        setShowTimeSlots(false);
        setSelectedSlot(null);
    };

    const handleConfirmReservation = () => {
        if (selectedSlot) {
            onReservation(customerName.trim(), selectedSlot);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
                <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                    <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600"></div>
                        <span className="ml-3 text-gray-600">Chargement des créneaux...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl transform transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-amber-900">
                            {showTimeSlots ? 'Choisir un créneau' : 'Commander'}
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">
                            {showTimeSlots
                                ? 'Sélectionnez le moment où vous souhaitez récupérer votre café'
                                : 'Entrez votre nom et choisissez votre mode de commande'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Fermer"
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {!showTimeSlots ? (
                    <>
                        {/* Champ nom unique */}
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Votre nom <span className="text-amber-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={customerName}
                                onChange={(e) => {
                                    setCustomerName(e.target.value);
                                    if (e.target.value.trim()) {
                                        setNameError('');
                                    }
                                }}
                                placeholder="Jean Dupont"
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all text-gray-900 placeholder:text-gray-400 placeholder:opacity-100 ${nameError ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                                    }`}
                            />
                            {nameError && (
                                <p className="text-xs text-red-500 mt-2 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {nameError}
                                </p>
                            )}
                        </div>

                        {/* Options section */}
                        <div className="space-y-4">
                            <button
                                type="button"
                                onClick={() => handleSubmit('immediate')}
                                disabled={machineStatus === 'busy'}
                                className={`w-full p-4 rounded-xl text-left transition-all duration-200 transform ${machineStatus === 'idle'
                                    ? 'bg-green-50 border-2 border-green-500 hover:bg-green-100 hover:scale-102'
                                    : 'bg-gray-100 border-2 border-gray-300 opacity-60 cursor-not-allowed'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center">
                                            <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                            </svg>
                                            <span className="font-semibold text-gray-900">Commander maintenant</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mt-1 ml-7">
                                            {machineStatus === 'idle'
                                                ? 'Votre café sera prêt immédiatement'
                                                : 'Machine occupée - non disponible'}
                                        </p>
                                    </div>
                                    {machineStatus === 'idle' && (
                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </div>
                            </button>

                            {hasAvailableSlots && (
                                <button
                                    type="button"
                                    onClick={() => handleSubmit('reservation')}
                                    className="w-full p-4 rounded-xl text-left bg-amber-50 border-2 border-amber-500 hover:bg-amber-100 transition-all duration-200 transform hover:scale-102"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="font-semibold text-gray-900">Réserver pour plus tard</span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1 ml-7">
                                                Choisir un créneau horaire spécifique
                                            </p>
                                        </div>
                                        <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Time Slots Section */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-700 mb-3">Créneaux disponibles</h3>
                            <div className="grid gap-3 max-h-[300px] overflow-y-auto pr-2">
                                {slots.map((slot, index) => (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => setSelectedSlot(slot)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all duration-200 transform ${selectedSlot?.time === slot.time
                                            ? 'border-amber-600 bg-amber-50 scale-102'
                                            : 'border-gray-300 hover:bg-gray-50 hover:scale-101'
                                            } ${slot.is_next_available ? 'ring-2 ring-green-500' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-medium text-gray-900">{slot.display_time}</div>
                                                {slot.is_next_available && (
                                                    <div className="text-sm text-green-600 mt-1">Prochain disponible</div>
                                                )}
                                            </div>
                                            {selectedSlot?.time === slot.time && (
                                                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={handleConfirmReservation}
                                disabled={!selectedSlot}
                                className="w-full py-3 px-4 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
                            >
                                Confirmer la réservation
                            </button>
                            <button
                                type="button"
                                onClick={handleBackToMain}
                                className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                            >
                                ← Revenir aux options
                            </button>
                        </div>
                    </>
                )}

                {!showTimeSlots && (
                    <div className="mt-8 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-all duration-200 font-medium"
                        >
                            Annuler
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}