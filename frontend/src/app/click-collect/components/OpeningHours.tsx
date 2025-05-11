import { useState, useEffect } from 'react';

interface OpeningHours {
    [key: string]: { start: string; end: string } | null;
}

interface OpeningHoursData {
    opening_hours: OpeningHours;
    timezone: string;
    current_time: string;
}

const API_URL = "http://localhost:8000/api/v1";

export default function OpeningHours() {
    const [hoursData, setHoursData] = useState<OpeningHoursData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOpeningHours = async () => {
            try {
                const response = await fetch(`${API_URL}/machine/opening-hours`);
                const data = await response.json();
                setHoursData(data);
            } catch (error) {
                console.error('Erreur lors du chargement des horaires:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOpeningHours();
    }, []);

    if (loading) {
        return <div className="animate-pulse">Chargement des horaires...</div>;
    }

    if (!hoursData) return null;

    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    return (
        <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-amber-900 mb-4">Horaires d&apos;ouverture</h2>

            <div className="space-y-2">
                {days.map((day, index) => {
                    const hours = hoursData.opening_hours[day];
                    return (
                        <div key={day} className="flex justify-between items-center py-2 border-b border-gray-100">
                            <span className="font-medium">{dayNames[index]}</span>
                            <span className={hours ? 'text-gray-600' : 'text-red-600'}>
                                {hours ? `${hours.start} - ${hours.end}` : 'Fermé'}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 text-sm text-gray-500">
                Fuseau horaire: {hoursData.timezone}
            </div>
        </div>
    );
}