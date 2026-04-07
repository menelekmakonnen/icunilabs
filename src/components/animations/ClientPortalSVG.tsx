import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function ClientPortalSVG() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const loginScreenY = useTransform(scrollYProgress, [0.2, 0.5], [0, -600]);
    const portalOpacity = useTransform(scrollYProgress, [0.4, 0.6], [0, 1]);
    const portalContentY = useTransform(scrollYProgress, [0.4, 0.7], [40, 0]);

    return (
        <div ref={ref} className="w-full relative aspect-square sm:aspect-[4/3] rounded-2xl border border-neutral-800/60 bg-neutral-950/80 shadow-2xl overflow-hidden backdrop-blur-xl flex items-center justify-center p-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#00bfff]/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="sr-only">Interactive Portal showing login transitioning to authenticated view</div>

            <svg viewBox="0 0 800 600" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMid meet">
                {/* Browser Frame */}
                <rect x="0" y="0" width="800" height="600" rx="16" fill="#0a0a0a" stroke="#262626" strokeWidth="2" />
                <rect x="0" y="0" width="800" height="40" rx="16" fill="#141414" />
                <rect x="0" y="30" width="800" height="10" fill="#141414" />
                
                <circle cx="30" cy="20" r="6" fill="#ff5f56" />
                <circle cx="50" cy="20" r="6" fill="#ffbd2e" />
                <circle cx="70" cy="20" r="6" fill="#27c93f" />
                <rect x="150" y="10" width="500" height="20" rx="10" fill="#222" />

                <g clipPath="url(#viewportClip)">
                    <defs>
                        <clipPath id="viewportClip">
                            <rect x="0" y="40" width="800" height="560" />
                        </clipPath>
                    </defs>

                    {/* Authenticated Portal (Underneath) */}
                    <motion.g style={{ opacity: portalOpacity, y: portalContentY }}>
                        {/* Sidebar */}
                        <rect x="0" y="40" width="200" height="560" fill="#111" />
                        <circle cx="100" cy="120" r="40" fill="#222" stroke="#00bfff" strokeWidth="2" />
                        <rect x="60" y="180" width="80" height="10" rx="4" fill="#555" />
                        
                        {/* List items */}
                        {[...Array(5)].map((_, i) => (
                            <rect key={i} x="30" y={240 + i * 45} width="140" height="24" rx="6" fill="#333" fillOpacity={i === 0 ? "1" : "0.3"} />
                        ))}

                        {/* Content Header */}
                        <rect x="240" y="80" width="500" height="80" rx="12" fill="#222" />
                        <rect x="270" y="100" width="150" height="15" rx="6" fill="#fff" />
                        <rect x="270" y="130" width="250" height="10" rx="4" fill="#555" />
                        
                        {/* Content Cards */}
                        {[...Array(4)].map((_, i) => (
                            <g key={i} transform={`translate(${240 + (i % 2) * 260}, ${190 + Math.floor(i / 2) * 160})`}>
                                <rect width="240" height="140" rx="12" fill="#1a1a1a" stroke="#333" strokeWidth="1" />
                                <rect x="20" y="20" width="60" height="60" rx="8" fill="#00bfff" fillOpacity="0.2" />
                                <rect x="100" y="30" width="100" height="10" rx="4" fill="#666" />
                                <rect x="100" y="50" width="70" height="8" rx="4" fill="#444" />
                                <rect x="20" y="100" width="200" height="8" rx="4" fill="#333" />
                                <rect x="20" y="100" width="120" height="8" rx="4" fill="#00bfff" />
                            </g>
                        ))}
                    </motion.g>

                    {/* Login Screen (Slides up and disappears) */}
                    <motion.g style={{ y: loginScreenY }}>
                        <rect x="0" y="40" width="800" height="560" fill="#0a0a0a" />
                        <g transform="translate(250, 150)">
                            <rect width="300" height="340" rx="16" fill="#141414" stroke="#333" strokeWidth="1" />
                            <circle cx="150" cy="60" r="24" fill="#00bfff" />
                            <rect x="100" y="110" width="100" height="15" rx="6" fill="#fff" />
                            <rect x="50" y="150" width="200" height="40" rx="8" fill="#222" />
                            <rect x="50" y="210" width="200" height="40" rx="8" fill="#222" />
                            <rect x="50" y="270" width="200" height="40" rx="8" fill="#00bfff" />
                            <rect x="110" y="285" width="80" height="10" rx="4" fill="#fff" />
                        </g>
                    </motion.g>
                </g>
            </svg>
        </div>
    );
}
