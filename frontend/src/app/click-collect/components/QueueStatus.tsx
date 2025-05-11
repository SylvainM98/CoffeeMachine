import { useState, useEffect } from 'react';
import { Order } from '../types';

interface QueueStatusData {
    current_order: Order | null;
    queue: Order[];
    queue_length: number;
    estimated_wait_time: number;
    machine_status: 'idle' | 'busy';
}

const API_URL = "http://localhost:8000/api/v1";

export default function QueueStatus() {
    const [queueData, setQueueData] = useState<QueueStatusData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQueueStatus = async () => {
            try {
                const response = await fetch(`${API_URL}/queue/status`);
                const data = await response.json();
                setQueueData(data);
            } catch (error) {
                console.error('Erreur lors du chargement de la file:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQueueStatus();
        const interval = setInterval(fetchQueueStatus, 2000);

        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="text-center py-4">
                <div className="animate-pulse">Chargement...</div>
            </div>
        );
    }

    if (!queueData) return null;

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-amber-900 mb-4">État de la machine</h2>

            <div className="flex items-center mb-4">
                <div className={`w-3 h-3 rounded-full mr-2 ${queueData.machine_status === 'busy' ? 'bg-amber-500' : 'bg-green-500'
                    }`} />
                <span className="font-medium">
                    {queueData.machine_status === 'busy' ? 'En préparation' : 'Disponible'}
                </span>
            </div>

            {queueData.current_order && (
                <div className="mb-4 p-3 bg-amber-50 rounded">
                    <h3 className="font-semibold text-amber-800">Commande en cours</h3>
                    <p>
                        {queueData.current_order.coffee.type} pour {queueData.current_order.customer_name}
                    </p>
                    <div className="mt-2 bg-amber-200 rounded-full h-2">
                        <div
                            className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${queueData.current_order.progress}%` }}
                        />
                    </div>
                    <p className="text-sm text-amber-700 mt-1">
                        {queueData.current_order.progress}% terminé
                    </p>
                </div>
            )}

            {queueData.queue_length > 0 && (
                <div className="mb-4">
                    <h3 className="font-semibold text-amber-800">En attente ({queueData.queue_length})</h3>
                    <div className="mt-2 space-y-2">
                        {queueData.queue.slice(0, 3).map((order, index) => (
                            <div key={order.id} className="text-sm text-gray-600">
                                {index + 1}. {order.coffee.type} pour {order.customer_name}
                            </div>
                        ))}
                        {queueData.queue_length > 3 && (
                            <div className="text-sm text-gray-500">
                                ... et {queueData.queue_length - 3} autres
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="mt-4 p-3 bg-green-50 rounded">
                <h3 className="font-semibold text-green-800">Temps d&apos;attente estimé</h3>
                <p className="text-green-700">
                    {Math.round(queueData.estimated_wait_time / 60)} minutes
                </p>
            </div>
        </div>
    );
}