import { useState, useRef } from 'react';
import { Coffee } from '../types';

export const useCoffeeSelection = () => {
    const [selectedCoffee, setSelectedCoffee] = useState<Coffee | null>(null);
    const [displayText, setDisplayText] = useState<string | React.ReactElement>("Choisissez votre café");
    const selectionTimerRef = useRef<NodeJS.Timeout | null>(null);

    const selectCoffee = (coffee: Coffee) => {
        setSelectedCoffee(coffee);
        const price = typeof coffee.price === "string" ? parseFloat(coffee.price) : coffee.price;
        setDisplayText(
            <>
                {coffee.type.charAt(0).toUpperCase() + coffee.type.slice(1)}
                <br />
                {price.toFixed(2)} €
            </>
        );

        if (selectionTimerRef.current) {
            clearTimeout(selectionTimerRef.current);
        }

        selectionTimerRef.current = setTimeout(() => {
            setSelectedCoffee(null);
            setDisplayText("Choisissez votre café");
        }, 10000);
    };

    const clearSelection = () => {
        // Si un timer est en cours, on l'annule
        if (selectionTimerRef.current) {
            clearTimeout(selectionTimerRef.current);
        }
        // On réinitialise la sélection et le texte
        setSelectedCoffee(null);
        setDisplayText("Choisissez votre café");
    };


    return {
        selectedCoffee,
        displayText,
        setDisplayText,
        selectCoffee,
        clearSelection,
        selectionTimerRef
    };
};