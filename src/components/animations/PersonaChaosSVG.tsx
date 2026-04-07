import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface Props {
    accentColor: string;
}

export default function PersonaChaosSVG({ accentColor }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Make elements shift as user scrolls
    const shiftY = useTransform(scrollYProgress, [0, 1], [-20, 20]);
    const shiftX = useTransform(scrollYProgress, [0, 1], [-10, 10]);
    const shiftOppositeY = useTransform(scrollYProgress, [0, 1], [30, -30]);

    return (
        <div ref={containerRef} className="w-full h-full min-h-[300px] bg-neutral-950/40 rounded-2xl border border-neutral-800/80 overflow-hidden relative flex items-center justify-center p-8 transition-colors duration-500 hover:border-neutral-700 group">
             <span className="sr-only">Visual representation of operational chaos turning into structured logic, adapting to the user profile color.</span>
             <svg viewBox="0 0 400 300" className="w-full h-full text-neutral-800" preserveAspectRatio="xMidYMid meet">
                {/* Background glow tied to accent color */}
                <circle cx="200" cy="150" r="100" fill={accentColor} opacity="0.05" className="group-hover:opacity-10 transition-opacity duration-500" />
                
                {/* Central structure representing the persona's focus */}
                <rect x="150" y="100" width="100" height="100" rx="12" fill="none" stroke={accentColor} strokeWidth="3" strokeOpacity="0.3" strokeDasharray="4 4" className="group-hover:stroke-opacity-80 transition-all duration-500 delay-100" />
                
                {/* Scroll reactive elements */}
                <motion.g style={{ x: shiftX, y: shiftY }}>
                    {[...Array(6)].map((_, i) => (
                        <circle 
                            key={i} 
                            cx={100 + ((i * 47) % 200)} 
                            cy={50 + ((i * 61) % 200)} 
                            r={((i * 13) % 8) + 4} 
                            fill={accentColor} 
                            opacity={0.4 + (((i * 7) % 5) * 0.1)} 
                            className="group-hover:scale-110 transition-transform duration-300" 
                        />
                    ))}
                    
                    <path d="M 120 80 Q 200 200 280 120" fill="none" stroke={accentColor} strokeWidth="2" strokeOpacity="0.4" />
                    <path d="M 100 220 Q 200 100 300 250" fill="none" stroke={accentColor} strokeWidth="2" strokeOpacity="0.3" strokeDasharray="6 6" />
                </motion.g>

                {/* Floating warning blocks mimicking 'chaos' */}
                <motion.g style={{ y: shiftOppositeY }}>
                    <rect x="120" y="180" width="60" height="20" rx="4" fill="#ef4444" opacity="0.2" className="group-hover:-translate-x-2 transition-transform duration-500" />
                    <rect x="230" y="90" width="80" height="15" rx="4" fill="#eab308" opacity="0.2" className="group-hover:translate-x-2 transition-transform duration-700" />
                    <rect x="180" y="240" width="50" height="15" rx="4" fill="#3b82f6" opacity="0.2" className="group-hover:-translate-y-2 transition-transform duration-500" />
                </motion.g>

             </svg>
        </div>
    );
}
