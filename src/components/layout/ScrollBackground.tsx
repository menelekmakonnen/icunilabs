
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { useRef, useMemo } from 'react';

/**
 * ScrollBackground Component - "Chaos to System" (Holographic HUD Edition)
 * 
 * Narrative:
 * 1. Top: Floating papers, WhatsApp chats, chaos elements drift around.
 * 2. Transition: They digitize/morph as user scrolls.
 * 3. Bottom: Full Holographic System Interface (HUD style).
 */
export default function ScrollBackground() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll();

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 150,
        damping: 30,
        restDelta: 0.001
    });

    // Generate Layout Data (The "System" Dashboard)
    const systemLayouts = [
        { l: 15, t: 20, w: 70, h: 10, type: 'header' },
        { l: 15, t: 35, w: 15, h: 35, type: 'sidebar' },
        { l: 35, t: 35, w: 30, h: 35, type: 'module' },
        { l: 70, t: 35, w: 15, h: 35, type: 'module' },
        { l: 15, t: 75, w: 70, h: 10, type: 'footer' },
    ];

    const papers = useMemo(() => {
        return systemLayouts.map((layout, i) => ({
            id: i,
            isSystem: true,
            initialLeft: (Math.sin(i * 123.45) * 0.5 + 0.5) * 50 + 25,
            initialTop: (Math.cos(i * 321.12) * 0.5 + 0.5) * 70 + 5,
            initialRotate: Math.sin(i * 456.78) * 45,
            finalLeft: layout.l,
            finalTop: layout.t,
            finalWidth: layout.w,
            finalHeight: layout.h,
            type: layout.type,
            // Unique float params for idle animation
            floatDuration: 6 + (i % 3) * 2,
            floatX: 8 + (i % 4) * 4,
            floatY: 6 + (i % 3) * 3,
            floatDelay: i * 0.8,
        }));
    }, []);

    // Chaos elements (WhatsApp chats, notifications, sticky notes) — pushed to edges
    const chaosItems = useMemo(() => [
        { id: 'wa1', type: 'whatsapp', x: 3, y: 8, dur: 7, dx: 5, dy: 4, rot: -12 },
        { id: 'wa2', type: 'whatsapp', x: 80, y: 18, dur: 8, dx: -4, dy: 6, rot: 8 },
        { id: 'wa3', type: 'whatsapp', x: 5, y: 72, dur: 9, dx: 6, dy: -3, rot: -5 },
        { id: 'n1', type: 'sticky', x: 88, y: 60, dur: 7.5, dx: -3, dy: 5, rot: 15 },
        { id: 'n2', type: 'sticky', x: 2, y: 45, dur: 6.5, dx: 4, dy: -4, rot: -20 },
        { id: 'e1', type: 'email', x: 82, y: 5, dur: 8.5, dx: -5, dy: 3, rot: 6 },
        { id: 'e2', type: 'email', x: 85, y: 78, dur: 7, dx: 3, dy: -5, rot: -8 },
    ], []);

    const systemProgress = useTransform(smoothProgress, [0, 0.85], [0, 1]);
    const gridOpacity = useTransform(systemProgress, [0.5, 1], [0, 1]);
    const chaosOpacity = useTransform(systemProgress, [0, 0.3], [1, 0]);

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

            {/* CENTER VIGNETTE — protects hero text from chaos clutter */}
            <div className="absolute inset-0 z-[1]" style={{
                background: 'radial-gradient(ellipse 50% 60% at 50% 45%, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 40%, transparent 70%)'
            }} />

            {/* FLOATING CHAOS ELEMENTS (WhatsApp chats, emails, sticky notes) */}
            {chaosItems.map((c) => (
                <motion.div key={c.id}
                    className="absolute"
                    style={{
                        left: `${c.x}%`, top: `${c.y}%`,
                        opacity: chaosOpacity,
                    }}
                    animate={{
                        x: [0, c.dx, -c.dx * 0.5, c.dx * 0.3, 0],
                        y: [0, c.dy, -c.dy * 0.5, c.dy * 0.7, 0],
                        rotate: [c.rot, c.rot + 3, c.rot - 2, c.rot],
                        scale: [0.65, 0.7, 0.65],
                    }}
                    transition={{ duration: c.dur, repeat: Infinity, ease: 'easeInOut' }}
                >
                    {c.type === 'whatsapp' && <WhatsAppBubble />}
                    {c.type === 'sticky' && <StickyNote />}
                    {c.type === 'email' && <EmailIcon />}
                </motion.div>
            ))}

            {/* CONNECTING LINES (The "Network") */}
            <svg className="absolute inset-0 w-full h-full">
                <motion.g style={{ opacity: useTransform(systemProgress, [0.6, 1], [0, 1]) }}>
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

            {/* THE PARTICLES (Floating Papers -> HUD Modules) */}
            {papers.map((p) => (
                <SystemNode key={p.id} data={p} progress={systemProgress} />
            ))}
        </div>
    );
}

/* WhatsApp chat bubble - floating chaos element */
function WhatsAppBubble() {
    return (
        <div className="w-[100px] sm:w-[140px] backdrop-blur-sm">
            <div className="bg-[#075E54]/30 rounded-t-lg px-2 py-1 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#25D366]/60" />
                <span className="text-[8px] text-[#25D366]/80 font-medium">WhatsApp</span>
            </div>
            <div className="bg-[#DCF8C6]/10 rounded-b-lg px-2 py-1.5 border border-[#25D366]/15">
                <div className="w-full h-1 bg-white/15 rounded mb-1" />
                <div className="w-3/4 h-1 bg-white/10 rounded mb-1" />
                <div className="w-1/2 h-1 bg-white/10 rounded" />
            </div>
        </div>
    );
}

/* Sticky note - floating chaos element */
function StickyNote() {
    return (
        <div className="w-[60px] sm:w-[80px] h-[60px] sm:h-[80px] bg-[#ffd54f]/12 border border-[#ffd54f]/20 rounded-sm p-2 backdrop-blur-sm">
            <div className="w-full h-1 bg-[#ffd54f]/20 rounded mb-1.5" />
            <div className="w-3/4 h-1 bg-[#ffd54f]/15 rounded mb-1.5" />
            <div className="w-5/6 h-1 bg-[#ffd54f]/15 rounded" />
        </div>
    );
}

/* Email notification - floating chaos element */
function EmailIcon() {
    return (
        <div className="w-[90px] sm:w-[120px] bg-white/5 border border-white/10 rounded-lg p-2 backdrop-blur-sm">
            <div className="flex items-center gap-1 mb-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/40" />
                <div className="w-12 h-1 bg-white/20 rounded" />
            </div>
            <div className="w-full h-1 bg-white/10 rounded mb-1" />
            <div className="w-2/3 h-1 bg-white/10 rounded" />
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
    const bg = useTransform(progress, [0, 0.4, 0.6, 1], ["rgba(255, 255, 255, 0.06)", "rgba(255, 255, 255, 0)", "rgba(0, 191, 255, 0.3)", "rgba(0, 191, 255, 0.05)"]);
    const border = useTransform(progress, [0, 0.4, 0.6, 1], ["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0)", "rgba(0, 191, 255, 1)", "rgba(0, 191, 255, 0.5)"]);
    const borderRadius = useTransform(progress, [0, 1], ["2px", "4px"]);
    const scale = useTransform(progress, [0, 0.5, 0.8, 1], [1, 0.8, 1.05, 1]);

    const paperShadow = useTransform(progress, [0, 0.4], ["0 4px 10px rgba(0,0,0,0.3)", "0 0 0 rgba(0,0,0,0)"]);
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
                boxShadow: useTransform(progress, (p: number) => p < 0.3 ? paperShadow.get() : systemShadow.get())
            }}
            // Floating idle animation when at chaos state
            animate={{
                x: [0, data.floatX, -data.floatX * 0.6, data.floatX * 0.3, 0],
                y: [0, -data.floatY, data.floatY * 0.5, -data.floatY * 0.3, 0],
            }}
            transition={{
                duration: data.floatDuration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: data.floatDelay,
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
                <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#00bfff]" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#00bfff]" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#00bfff]" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#00bfff]" />

                <motion.div
                    className="w-full h-full bg-[#00bfff]/10"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                />
            </motion.div>
        </motion.div>
    );
}
