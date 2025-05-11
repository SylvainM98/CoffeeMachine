export const interpolate = (
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    t: number
) => ({
    x: p1.x + (p2.x - p1.x) * t,
    y: p1.y + (p2.y - p1.y) * t,
});

export const calculateCornerPoint = (
    from: { x: number; y: number },
    to: { x: number; y: number },
    radius: number,
    enabled: boolean
) => {
    if (!enabled || radius === 0) return from;

    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return from;

    const ratio = Math.min(radius / length, 0.3);

    return {
        x: from.x + dx * ratio,
        y: from.y + dy * ratio,
    };
};

export const calculatePerspectiveScale = (
    pos: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    p4: { x: number; y: number }
) => {
    const topWidth = Math.sqrt(
        Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2)
    );
    const bottomWidth = Math.sqrt(
        Math.pow(p3.x - p4.x, 2) + Math.pow(p3.y - p4.y, 2)
    );
    const depthFactor = 1 - pos.y * 0.5;
    const widthRatio = topWidth / bottomWidth;
    const scale = depthFactor * (0.7 + widthRatio * 0.3);

    return Math.max(0.3, Math.min(1.2, scale));
};

export const calculatePerspectiveEllipse = (
    pos: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    p4: { x: number; y: number }
) => {
    const leftSlope = (p4.y - p1.y) / (p4.x - p1.x);
    const rightSlope = (p3.y - p2.y) / (p3.x - p2.x);
    const avgSlope = (leftSlope + rightSlope) / 2;

    const angle = Math.atan(avgSlope);
    const perspectiveDepth = pos.y;
    const xRadius = 6 * calculatePerspectiveScale(pos, p1, p2, p3, p4);
    const yRadius = xRadius * (0.4 + 0.6 * perspectiveDepth);

    return { xRadius, yRadius, angle };
};

export const drawRoundedQuadrilateral = (
    ctx: CanvasRenderingContext2D,
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    p3: { x: number; y: number },
    p4: { x: number; y: number },
    radii: number[],
    enabled: boolean[]
) => {
    const c1_1 = calculateCornerPoint(p1, p2, radii[0], enabled[0]);
    const c1_2 = calculateCornerPoint(p1, p4, radii[0], enabled[0]);
    const c2_1 = calculateCornerPoint(p2, p1, radii[1], enabled[1]);
    const c2_2 = calculateCornerPoint(p2, p3, radii[1], enabled[1]);
    const c3_1 = calculateCornerPoint(p3, p2, radii[2], enabled[2]);
    const c3_2 = calculateCornerPoint(p3, p4, radii[2], enabled[2]);
    const c4_1 = calculateCornerPoint(p4, p3, radii[3], enabled[3]);
    const c4_2 = calculateCornerPoint(p4, p1, radii[3], enabled[3]);

    ctx.beginPath();

    if (enabled[0] && radii[0] > 0) {
        ctx.moveTo(c1_1.x, c1_1.y);
    } else {
        ctx.moveTo(p1.x, p1.y);
    }

    if (enabled[1] && radii[1] > 0) {
        ctx.lineTo(c2_1.x, c2_1.y);
        ctx.quadraticCurveTo(p2.x, p2.y, c2_2.x, c2_2.y);
    } else {
        if (enabled[0] && radii[0] > 0) {
            ctx.quadraticCurveTo(p1.x, p1.y, c1_1.x, c1_1.y);
        }
        ctx.lineTo(p2.x, p2.y);
    }

    if (enabled[2] && radii[2] > 0) {
        ctx.lineTo(c3_1.x, c3_1.y);
        ctx.quadraticCurveTo(p3.x, p3.y, c3_2.x, c3_2.y);
    } else {
        if (enabled[1] && radii[1] > 0) {
            ctx.lineTo(c2_2.x, c2_2.y);
        }
        ctx.lineTo(p3.x, p3.y);
    }

    if (enabled[3] && radii[3] > 0) {
        ctx.lineTo(c4_1.x, c4_1.y);
        ctx.quadraticCurveTo(p4.x, p4.y, c4_2.x, c4_2.y);
    } else {
        if (enabled[2] && radii[2] > 0) {
            ctx.lineTo(c3_2.x, c3_2.y);
        }
        ctx.lineTo(p4.x, p4.y);
    }

    if (enabled[0] && radii[0] > 0) {
        if (enabled[3] && radii[3] > 0) {
            ctx.lineTo(c1_2.x, c1_2.y);
            ctx.quadraticCurveTo(p1.x, p1.y, c1_1.x, c1_1.y);
        } else {
            ctx.lineTo(c1_2.x, c1_2.y);
            ctx.quadraticCurveTo(p1.x, p1.y, c1_1.x, c1_1.y);
        }
    } else {
        if (enabled[3] && radii[3] > 0) {
            ctx.lineTo(c4_2.x, c4_2.y);
        }
        ctx.lineTo(p1.x, p1.y);
    }

    ctx.closePath();
};