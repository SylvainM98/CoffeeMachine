import { useEffect, useState, useRef } from 'react';

interface ProgressDisplayProps {
    displayText: string | React.ReactElement;
    progress: number;
    isPouring: boolean;
}

export default function ProgressDisplay({ displayText, progress, isPouring }: ProgressDisplayProps) {
    const [activeSteps, setActiveSteps] = useState([false, false, false, false, false]);
    const [needsScroll, setNeedsScroll] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const defaultText = "Choisissez votre café";

    // Vérifier si le texte est le texte par défaut
    const isDefaultText = typeof displayText === 'string' && displayText === defaultText;

    useEffect(() => {
        if (!isPouring) {
            setActiveSteps([false, false, false, false, false]);
            return;
        }

        const activeCount = Math.floor((progress / 100) * 5);
        const newSteps = [false, false, false, false, false].map((_, index) => index < activeCount);
        setActiveSteps(newSteps);
    }, [progress, isPouring]);

    useEffect(() => {
        if (textRef.current && containerRef.current && !isDefaultText) {
            const textWidth = textRef.current.scrollWidth / 2;
            const containerWidth = containerRef.current.clientWidth;
            setNeedsScroll(textWidth > containerWidth);

            if (textWidth > containerWidth) {
                const totalDistance = textWidth;
                const duration = totalDistance / 60;
                textRef.current.style.animationDuration = `${duration}s`;
            }
        } else {
            // Si c'est le texte par défaut, pas d'animation
            setNeedsScroll(false);
        }
    }, [displayText, isDefaultText]);

    // Réinitialiser l'état d'animation quand on revient au texte par défaut
    useEffect(() => {
        if (isDefaultText) {
            setNeedsScroll(false);
        }
    }, [isDefaultText]);

    const renderLed = (isActive: boolean, index: number) => {
        if (isActive) {
            return (
                <div key={index} className="relative">
                    <div
                        className="w-8 h-2 rounded-full transition-all duration-300 transform relative overflow-hidden mx-1 shadow-lg"
                        style={{
                            background: '#CD5941',
                            boxShadow: '0 4px 6px -1px rgba(205, 89, 65, 0.5), 0 0 0 1px rgba(205, 89, 65, 0.3)'
                        }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-full">
                            <div className="absolute top-0 left-1 w-1.5 h-0.5 bg-white/70 rounded-full blur-[1px]"></div>
                            <div className="absolute top-0.5 right-1 w-1 h-0.5 bg-[#CD5941] rounded-full opacity-70"></div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div key={index} className="relative">
                <div className="w-8 h-2 rounded-full transition-all duration-300 transform relative overflow-hidden mx-1 bg-gray-600 shadow-inner shadow-black/50">
                </div>
            </div>
        );
    };

    return (
        <div className="w-4/5 h-[100px] rounded-[5px] box-border p-0 block relative overflow-hidden">
            <div
                className="absolute top-0 left-0 w-full h-full rounded-[5px] box-border bg-black/40"
                style={{ transform: "translateY(4px)" }}
            ></div>
            <div className="absolute top-0 left-0 w-full h-full rounded-[5px] bg-[#3A4D52] box-border"></div>
            <div
                ref={containerRef}
                className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-[#1C2E3E] p-2.5 text-center box-border rounded-[5px] text-lg transition-all duration-300"
                style={{ transform: "translateY(-4px)", color: "inherit" }}
            >
                <div className="relative w-full overflow-hidden flex items-center justify-center">
                    <div
                        ref={textRef}
                        className={`whitespace-nowrap ${needsScroll && !isDefaultText ? 'continuous-scroll' : ''}`}
                    >
                        {needsScroll && !isDefaultText ? (
                            <>
                                <span className="inline-block px-4">{displayText}</span>
                                <span className="inline-block px-4">{displayText}</span>
                                <span className="inline-block px-4">{displayText}</span>
                            </>
                        ) : (
                            displayText
                        )}
                    </div>
                </div>

                {isPouring && (
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex items-center justify-center space-x-0 transition-all duration-300 ease-out opacity-100">
                        {activeSteps.map((isActive, index) => renderLed(isActive, index))}
                    </div>
                )}
            </div>

            <style jsx>{`
                @keyframes continuous-scroll {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-33.33%);
                    }
                }
                
                .continuous-scroll {
                    display: inline-flex;
                    animation: continuous-scroll linear infinite;
                }
            `}</style>
        </div>
    );
}