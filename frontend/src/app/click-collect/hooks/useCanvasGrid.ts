import { useEffect, useCallback } from 'react';
import {
    interpolate,
    drawRoundedQuadrilateral,
    calculatePerspectiveEllipse,
    calculatePerspectiveScale
} from '../utils/canvas';

export const useCanvasGrid = (
    canvasRef: React.RefObject<HTMLCanvasElement | null>
) => {
    const drawGrid = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const p1 = { x: 70, y: 440 };
        const p2 = { x: 480, y: 440 };
        const p3 = { x: 550, y: 550 };
        const p4 = { x: 0, y: 550 };

        const radii = [15, 15, 15, 15];
        const enabled = [true, true, true, true];

        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 8;

        ctx.fillStyle = "#2A3C40";
        drawRoundedQuadrilateral(ctx, p1, p2, p3, p4, radii, enabled);
        ctx.fill();

        ctx.restore();

        ctx.fillStyle = "#182A2F";

        const dotPositions = [
            { x: 0.12, y: 0.3 },
            { x: 0.28, y: 0.3 },
            { x: 0.44, y: 0.3 },
            { x: 0.6, y: 0.3 },
            { x: 0.76, y: 0.3 },
            { x: 0.92, y: 0.3 },
            { x: 0.12, y: 0.5 },
            { x: 0.28, y: 0.5 },
            { x: 0.44, y: 0.5 },
            { x: 0.6, y: 0.5 },
            { x: 0.76, y: 0.5 },
            { x: 0.92, y: 0.5 },
            { x: 0.12, y: 0.7 },
            { x: 0.28, y: 0.7 },
            { x: 0.44, y: 0.7 },
            { x: 0.6, y: 0.7 },
            { x: 0.76, y: 0.7 },
            { x: 0.92, y: 0.7 },
        ];

        const sortedDots = dotPositions
            .map((dotPos) => {
                const topInterpolated = interpolate(p1, p2, dotPos.x);
                const bottomInterpolated = interpolate(p4, p3, dotPos.x);
                const finalPos = interpolate(
                    topInterpolated,
                    bottomInterpolated,
                    dotPos.y
                );

                return {
                    ...dotPos,
                    worldPos: finalPos,
                    depth: dotPos.y,
                };
            })
            .sort((a, b) => a.depth - b.depth);

        sortedDots.forEach((dot) => {
            const ellipseProps = calculatePerspectiveEllipse(dot, p1, p2, p3, p4);
            const scale = calculatePerspectiveScale(dot, p1, p2, p3, p4);

            const shadowIntensity = 0.6 * scale;

            ctx.save();
            ctx.shadowColor = `rgba(0, 0, 0, ${shadowIntensity})`;
            ctx.shadowBlur = 4 * scale;
            ctx.shadowOffsetY = 1 * scale;

            ctx.translate(dot.worldPos.x, dot.worldPos.y);
            ctx.rotate(ellipseProps.angle);
            ctx.beginPath();
            ctx.ellipse(
                0,
                0,
                ellipseProps.xRadius,
                ellipseProps.yRadius,
                0,
                0,
                Math.PI * 2
            );
            ctx.fill();

            ctx.restore();
        });
    }, [canvasRef]);

    useEffect(() => {
        drawGrid();
    }, [drawGrid]);

    return { drawGrid };
};