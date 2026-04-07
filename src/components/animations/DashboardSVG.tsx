import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function DashboardSVG() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Parallax and scroll-based transforms
    const chartY = useTransform(scrollYProgress, [0, 1], [30, -30]);
    const chartOpacity = useTransform(scrollYProgress, [0.1, 0.4], [0, 1]);
    const dataGrowth1 = useTransform(scrollYProgress, [0.2, 0.8], [0, 100]);
    const dataGrowth2 = useTransform(scrollYProgress, [0.2, 0.8], [0, 75]);
    const dataGrowth3 = useTransform(scrollYProgress, [0.2, 0.8], [0, 140]);
    
    const sidebarX = useTransform(scrollYProgress, [0, 0.3], [-50, 0]);
    const cardsY = useTransform(scrollYProgress, [0.2, 0.9], [40, -20]);

    return (
        <div 
            ref={containerRef} 
            className="w-full relative aspect-square sm:aspect-[4/3] lg:aspect-square xl:aspect-[4/3] rounded-2xl border border-neutral-800/60 bg-neutral-950/80 shadow-2xl overflow-hidden backdrop-blur-xl flex items-center justify-center p-4"
        >
            {/* Ambient background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#00bfff]/5 blur-[80px] rounded-full pointer-events-none" />

            <div className="sr-only">Interactive Dashboard showing active metrics and operational growth</div>

            <svg viewBox="0 0 800 600" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00bfff" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#00bfff" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="cardGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.05" />
                        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.01" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Main App Frame */}
                <rect x="0" y="0" width="800" height="600" rx="16" fill="#0a0a0a" stroke="#262626" strokeWidth="2" />
                
                {/* Header Navbar */}
                <rect x="0" y="0" width="800" height="60" rx="16" fill="#141414" />
                <rect x="0" y="50" width="800" height="10" fill="#141414" /> {/* Square bottom */}
                <circle cx="40" cy="30" r="14" fill="#00bfff" fillOpacity="0.2" stroke="#00bfff" strokeWidth="2" filter="url(#glow)" />
                <rect x="70" y="24" width="120" height="12" rx="6" fill="#333" />
                <rect x="680" y="20" width="80" height="20" rx="10" fill="#222" />

                {/* Sidebar Component */}
                <motion.g style={{ x: sidebarX }}>
                    <rect x="0" y="60" width="180" height="540" fill="#111" />
                    <line x1="180" y1="60" x2="180" y2="600" stroke="#262626" strokeWidth="2" />
                    {[...Array(6)].map((_, i) => (
                        <rect key={i} x="24" y={100 + i * 50} width={i === 0 ? "132" : "100"} height="16" rx="8" fill={i === 0 ? "#00bfff" : "#333"} fillOpacity={i === 0 ? 0.2 : 1} stroke={i === 0 ? "#00bfff" : "none"} strokeWidth="1" />
                    ))}
                </motion.g>

                {/* Content Area */}
                <g transform="translate(200, 80)">
                    {/* Top Stat Cards */}
                    <motion.g style={{ y: cardsY }}>
                        <rect x="0" y="0" width="180" height="100" rx="12" fill="url(#cardGrad)" stroke="#262626" strokeWidth="1.5" />
                        <rect x="20" y="20" width="40" height="10" rx="4" fill="#555" />
                        <rect x="20" y="50" width="90" height="24" rx="4" fill="#fff" />
                        
                        <rect x="200" y="0" width="180" height="100" rx="12" fill="url(#cardGrad)" stroke="#262626" strokeWidth="1.5" />
                        <rect x="220" y="20" width="60" height="10" rx="4" fill="#555" />
                        <rect x="220" y="50" width="70" height="24" rx="4" fill="#00bfff" filter="url(#glow)"/>

                        <rect x="400" y="0" width="180" height="100" rx="12" fill="url(#cardGrad)" stroke="#262626" strokeWidth="1.5" />
                        <rect x="420" y="20" width="50" height="10" rx="4" fill="#555" />
                        <rect x="420" y="50" width="80" height="24" rx="4" fill="#fff" />
                    </motion.g>

                    {/* Main Chart Area */}
                    <motion.g style={{ y: chartY, opacity: chartOpacity }}>
                        <rect x="0" y="140" width="580" height="340" rx="12" fill="url(#cardGrad)" stroke="#262626" strokeWidth="1.5" />
                        
                        {/* Grid Lines */}
                        {[...Array(5)].map((_, i) => (
                            <line key={i} x1="40" y1={180 + i * 50} x2="540" y2={180 + i * 50} stroke="#333" strokeDasharray="4 4" strokeWidth="1.5" />
                        ))}
                        
                        {/* Animated Chart Data Columns */}
                        <g transform="translate(80, 390) scale(1, -1)">
                            <motion.rect x="0" y="0" width="40" height={dataGrowth1} rx="4" fill="#fff" />
                            <motion.rect x="80" y="0" width="40" height={dataGrowth2} rx="4" fill="#555" />
                            <motion.rect x="160" y="0" width="40" height={dataGrowth3} rx="4" fill="#00bfff" filter="url(#glow)" />
                            <motion.rect x="240" y="0" width="40" height={dataGrowth1} rx="4" fill="#fff" />
                            <motion.rect x="320" y="0" width="40" height={dataGrowth3} rx="4" fill="#555" />
                            <motion.rect x="400" y="0" width="40" height={dataGrowth2} rx="4" fill="#fff" />
                        </g>

                        {/* Line chart overlay */}
                        <path d="M 40 330 Q 160 210 240 250 T 400 190 T 540 280" fill="none" stroke="#00bfff" strokeWidth="4" filter="url(#glow)" />
                        
                        {/* Shaded area underneath */}
                        <path d="M 40 330 Q 160 210 240 250 T 400 190 T 540 280 L 540 430 L 40 430 Z" fill="url(#chartGrad)" />
                    </motion.g>
                </g>
            </svg>
        </div>
    );
}
