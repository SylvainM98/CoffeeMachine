import { useRef } from 'react';
import { useCanvasGrid } from '../hooks/useCanvasGrid';
import LiquidAnimation from './LiquidAnimation';

interface CoffeeMachineProps {
    progress: number;
    isPouring: boolean;
    liquidOpacity: number;
    splashAnimation: boolean;
}

export default function CoffeeMachine({ progress, isPouring, liquidOpacity, splashAnimation }: CoffeeMachineProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useCanvasGrid(canvasRef);

    return (
        <div className="w-[90%] h-[225px] bg-[#1F4F4D] rounded-[5px] mt-auto flex-shrink-0 flex justify-center items-center text-[#FCF0D9] text-sm overflow-hidden relative">
            <div className="nozzle absolute top-0 left-1/2 transform -translate-x-1/2 z-20">
                <div className="relative">
                    <div className="w-20 h-8 bg-[#828B8E] rounded-b-lg shadow-lg"></div>
                    <div className="w-10 h-5 bg-[#212F36] mx-auto rounded-b-lg"></div>
                </div>
            </div>
            <div className="w-full h-full rounded-[5px] relative overflow-hidden shadow-none">
                <canvas
                    ref={canvasRef}
                    width="550"
                    height="550"
                    className="absolute top-0 left-0 w-full h-full block"
                ></canvas>
            </div>

            <LiquidAnimation
                isPouring={isPouring}
                liquidOpacity={liquidOpacity}
                splashAnimation={splashAnimation}
                progress={progress}
            />
        </div>
    );
}