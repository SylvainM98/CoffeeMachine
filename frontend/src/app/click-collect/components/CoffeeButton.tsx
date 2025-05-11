import { Coffee } from '../types';

interface CoffeeButtonProps {
    coffee: Coffee;
    onSelect: (coffee: Coffee) => void;
    disabled?: boolean;
}

export default function CoffeeButton({ coffee, onSelect, disabled = false }: CoffeeButtonProps) {
    return (
        <button
            onClick={() => onSelect(coffee)}
            disabled={disabled}
            className="button-3d relative border-none bg-transparent p-0 cursor-pointer outline-offset-4 transition-all duration-[250ms] select-none disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ filter: "brightness(100%)" }}
        >
            <span
                className="button-shadow absolute top-0 left-0 w-full h-full rounded-[5px] box-border"
                style={{
                    background: "hsl(0deg 0% 0% / 0.3)",
                    willChange: "transform",
                    transform: "translateY(2px)",
                    transition: "transform 600ms cubic-bezier(.3, .7, .4, 1)",
                }}
            ></span>
            <span className="button-edge absolute top-0 left-0 w-full h-full rounded-[5px] bg-[#2E3E42]"></span>
            <span
                className="button-front block relative px-[15px] py-2 rounded-[5px] text-xs text-[#FCF0D9] bg-[#3A4D52]"
                style={{
                    willChange: "transform",
                    transform: "translateY(-4px)",
                    transition: "transform 600ms cubic-bezier(.3, .7, .4, 1)",
                }}
            >
                {coffee.type.charAt(0).toUpperCase() + coffee.type.slice(1)}
            </span>
        </button>
    );
}