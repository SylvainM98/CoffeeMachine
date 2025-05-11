interface CommandButtonProps {
    isProcessing: boolean;
    disabled: boolean;
    onClick: () => void;
}

export default function CommandButton({ isProcessing, disabled, onClick }: CommandButtonProps) {
    return (
        <button
            onClick={onClick}
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
            <span className="button-edge absolute top-0 left-0 w-full h-full rounded-[5px] bg-[#B04C36]"></span>
            <span
                className="button-front block relative px-[15px] py-2 rounded-[5px] text-xs text-[#FCF0D9] bg-[#CD5941]"
                style={{
                    willChange: "transform",
                    transform: "translateY(-4px)",
                    transition: "transform 600ms cubic-bezier(.3, .7, .4, 1)",
                }}
            >
                {isProcessing ? "En cours..." : "Commander"}
            </span>
        </button>
    );
}