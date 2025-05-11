import { useState, useRef } from 'react';

export const useLiquidAnimation = () => {
    const [isPouring, setIsPouring] = useState(false);
    const [liquidOpacity, setLiquidOpacity] = useState(0);
    const [splashAnimation, setSplashAnimation] = useState(false);

    const liquidStartTime = useRef<number | null>(null);
    const splashIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const startLiquidAnimation = () => {
        liquidStartTime.current = Date.now();
        setIsPouring(true);
        setLiquidOpacity(1);

        splashIntervalRef.current = setInterval(() => {
            setSplashAnimation(true);
            setTimeout(() => {
                setSplashAnimation(false);
            }, 500);
        }, 1000);
    };

    const stopLiquidAnimation = () => {
        setLiquidOpacity(0);
        if (splashIntervalRef.current) {
            clearInterval(splashIntervalRef.current);
        }
    };

    const resetLiquidAnimation = () => {
        setIsPouring(false);
        setLiquidOpacity(0);
        liquidStartTime.current = null;

        if (splashIntervalRef.current) {
            clearInterval(splashIntervalRef.current);
        }
    };

    return {
        isPouring,
        liquidOpacity,
        splashAnimation,
        startLiquidAnimation,
        stopLiquidAnimation,
        resetLiquidAnimation,
        splashIntervalRef
    };
};