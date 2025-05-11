interface LiquidAnimationProps {
    isPouring: boolean;
    liquidOpacity: number;
    splashAnimation: boolean;
    progress: number;
}

export default function LiquidAnimation({
    isPouring,
    liquidOpacity,
    splashAnimation,
    progress
}: LiquidAnimationProps) {
    return (
        <div
            className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 scale-[0.3] z-10 origin-center ${isPouring ? "block" : "hidden"
                }`}
            style={{ top: "calc(50% + 50px)" }}
        >
            <div
                id="liquidStream"
                className="absolute left-1/2 transform -translate-x-1/2 w-3 rounded-[3px] transition-opacity duration-300 overflow-hidden"
                style={{
                    top: "-380px",
                    height: "380px",
                    background:
                        "linear-gradient(to bottom, transparent 0%, #8B4513 15%, #6B3E07 100%)",
                    opacity: liquidOpacity,
                }}
            >
                <div
                    className="absolute top-0 left-0 w-full h-5 rounded-[3px]"
                    style={{
                        background: "linear-gradient(to bottom, #8B4513, #6B3E07)",
                        animation: "liquidFlow 0.3s linear infinite",
                    }}
                ></div>
            </div>
            <div
                className={`absolute -top-2.5 left-1/2 transform -translate-x-1/2 w-10 h-5 pointer-events-none rounded-[50%] ${splashAnimation ? "animate-pulse" : ""
                    }`}
                style={{
                    background:
                        "radial-gradient(ellipse, #8B4513 30%, transparent 70%)",
                    opacity: splashAnimation ? 0.7 : 0,
                }}
            ></div>

            <div
                className="tea-cup relative w-[300px] h-[300px] rounded-b-[50%]"
                style={{
                    background: "linear-gradient(to right, #080808, #5b5656)",
                }}
            >
                <div
                    className="top-shape absolute -top-[30px] left-0 h-[60px] w-full rounded-[50%]"
                    style={{
                        background: "linear-gradient(to right, #fdfdfd, #ede5e5)",
                    }}
                >
                    <div
                        className={`tea-smoke relative z-10 px-[30px] flex ${progress < 20 ? "opacity-0" : "opacity-100"
                            }`}
                    >
                        {Array.from({ length: 10 }).map((_, i) => (
                            <span
                                key={i + 1}
                                className="smoke-span"
                                style={{
                                    animationDelay: `${(i + 1) * -0.5}s`,
                                }}
                            ></span>
                        ))}
                    </div>
                    <div
                        className="circle absolute top-[5px] left-[10px] h-[50px] w-[calc(100%-20px)] rounded-[50%] overflow-hidden"
                        style={{
                            background: "linear-gradient(to left, #fdfdfd, #ededed)",
                        }}
                    >
                        <div
                            className="tea absolute bottom-0 left-0 w-full rounded-[50%] overflow-hidden transition-all duration-500"
                            style={{
                                background: "linear-gradient(to left, #8B4513, #6B3E07)",
                                height: `${progress}%`,
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}