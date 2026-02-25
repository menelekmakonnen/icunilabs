
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef, useMemo } from 'react';

/**
 * ScrollBackground Component - "Chaos to System" (Holographic HUD Edition)
 * 
 * Narrative:
 * 1. Top: Visible white papers (Chaos).
 * 2. Transition: They digitize/morph.
 * 3. Bottom: Full Holographic System Interface (HUD style).
 */
export default function ScrollBackground() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 50,
        damping: 20,
        restDelta: 0.001
    });

    // Generate Layout Data (The "System" Dashboard)
    const systemLayouts = [
        { l: 15, t: 20, w: 70, h: 10, type: 'header' },  // Top Bar (Span full width of grid)
        { l: 15, t: 35, w: 15, h: 35, type: 'sidebar' }, // Left Sidebar
        { l: 35, t: 35, w: 30, h: 35, type: 'module' },  // Center Main
        { l: 70, t: 35, w: 15, h: 35, type: 'module' },  // Right Sidebar
        { l: 15, t: 75, w: 70, h: 10, type: 'footer' },  // Bottom Bar
    ];

    const papers = useMemo(() => {
        return systemLayouts.map((layout, i) => ({
            id: i,
            isSystem: true,
            // CHAOS: Scattered white papers, centered more, pseudo-random to avoid hydration mismatch
            initialLeft: (Math.sin(i * 123.45) * 0.5 + 0.5) * 50 + 25, // Centered between 25% and 75%
            initialTop: (Math.cos(i * 321.12) * 0.5 + 0.5) * 70 + 5,
            initialRotate: Math.sin(i * 456.78) * 45,

            // SYSTEM: Targeted layout
            finalLeft: layout.l,
            finalTop: layout.t,
            finalWidth: layout.w,
            finalHeight: layout.h,
            type: layout.type
        }));
    }, []);

    // Delay the transform slightly so we see papers first
    const systemProgress = useTransform(smoothProgress, [0.1, 1], [0, 1]);

    // Global Opacity Control
    const gridOpacity = useTransform(systemProgress, [0.5, 1], [0, 1]);

    return (
        <div
            ref={containerRef}
            className="fixed inset-0 z-0 pointer-events-none overflow-hidden"
            aria-hidden="true"
        >
            {/* BACKGROUND GRID (Only appears in System Mode) */}
            <div className="absolute inset-0 w-full h-full">
                <svg className="w-full h-full">
                    <defs>
                        <pattern id="small-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0, 191, 255, 0.1)" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <motion.rect width="100%" height="100%" fill="url(#small-grid)" style={{ opacity: gridOpacity }} />
                </svg>
            </div>

            {/* CONNECTING LINES (The "Network") */}
            <svg className="absolute inset-0 w-full h-full">
                <motion.g style={{ opacity: useTransform(systemProgress, [0.6, 1], [0, 1]) }}>
                    {/* Circuit lines connecting the modules */}
                    <line x1="30%" y1="52%" x2="35%" y2="52%" stroke="rgba(0, 191, 255, 0.6)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="65%" y1="52%" x2="70%" y2="52%" stroke="rgba(0, 191, 255, 0.6)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="50%" y1="30%" x2="50%" y2="35%" stroke="rgba(0, 191, 255, 0.6)" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1="50%" y1="70%" x2="50%" y2="75%" stroke="rgba(0, 191, 255, 0.6)" strokeWidth="1" strokeDasharray="2 2" />
                    <circle cx="50%" cy="32.5%" r="3" fill="#00bfff" />
                    <circle cx="50%" cy="72.5%" r="3" fill="#00bfff" />
                    <circle cx="32.5%" cy="52%" r="3" fill="#00bfff" />
                    <circle cx="67.5%" cy="52%" r="3" fill="#00bfff" />
                </motion.g>
            </svg>

            {/* THE PARTICLES (Papers -> HUD Modules) */}
            {papers.map((p) => (
                <SystemNode key={p.id} data={p} progress={systemProgress} />
            ))}
        </div>
    );
}

function SystemNode({ data, progress }: { data: any, progress: any }) {
    const left = useTransform(progress, [0, 1], [`${data.initialLeft}%`, `${data.finalLeft}%`]);
    const top = useTransform(progress, [0, 1], [`${data.initialTop}%`, `${data.finalTop}%`]);
    const width = useTransform(progress, [0, 1], ["10vw", `${data.finalWidth}vw`]);
    const height = useTransform(progress, [0, 1], ["14vh", `${data.finalHeight}vh`]);
    const rotate = useTransform(progress, [0, 1], [data.initialRotate, 0]);

    // VISUAL TRANSFORMATION
    // 1. Color: Paper White -> Flash -> Cyber Cyan
    const bg = useTransform(progress, [0, 0.4, 0.6, 1], ["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0)", "rgba(0, 191, 255, 0.3)", "rgba(0, 191, 255, 0.05)"]);
    const border = useTransform(progress, [0, 0.4, 0.6, 1], ["rgba(255, 255, 255, 0.3)", "rgba(255, 255, 255, 0)", "rgba(0, 191, 255, 1)", "rgba(0, 191, 255, 0.5)"]);
    const borderRadius = useTransform(progress, [0, 1], ["2px", "4px"]);
    const scale = useTransform(progress, [0, 0.5, 0.8, 1], [1, 0.8, 1.05, 1]); // shrink, then bounce slightly

    // The "Paper" look
    const paperShadow = useTransform(progress, [0, 0.4], ["0 4px 10px rgba(0,0,0,0.3)", "0 0 0 rgba(0,0,0,0)"]);

    // The "System" look (Glow)
    const systemShadow = useTransform(progress, [0.4, 0.6, 1], ["0 0 0 rgba(0,191,255,0)", "0 0 30px rgba(0,191,255,0.8)", "0 0 15px rgba(0, 191, 255, 0.2)"]);

    return (
        <motion.div
            className="absolute backdrop-blur-sm"
            style={{
                left, top, width, height, rotate, scale,
                backgroundColor: bg,
                borderWidth: "1px",
                borderColor: border,
                borderRadius,
                boxShadow: useTransform(progress, (p) => p < 0.3 ? paperShadow.get() : systemShadow.get())
            }}
        >
            {/* PAPER DECORATION (Lines of text) - Fades out */}
            <motion.div
                className="w-full h-full p-2 flex flex-col gap-2"
                style={{ opacity: useTransform(progress, [0, 0.3], [1, 0]) }}
            >
                <div className="w-3/4 h-1 bg-white/40 rounded" />
                <div className="w-full h-1 bg-white/20 rounded" />
                <div className="w-5/6 h-1 bg-white/20 rounded" />
                <div className="w-full h-1 bg-white/20 rounded" />
            </motion.div>

            {/* SYSTEM HUD DECORATION (Brackets & Data) - Fades in */}
            <motion.div
                className="absolute inset-0 p-1"
                style={{ opacity: useTransform(progress, [0.7, 1], [0, 1]) }}
            >
                {/* HUD Brackets */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00bfff]" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00bfff]" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00bfff]" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00bfff]" />

                {/* Data Scanning Effect */}
                <motion.div
                    className="w-full h-full bg-[#00bfff]/10"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>
        </motion.div>
    );
}
