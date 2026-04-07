import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function InventoryStocksSVG() {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    const rowsY = useTransform(scrollYProgress, [0.3, 0.7], [100, 0]);
    const opacities = [
        useTransform(scrollYProgress, [0.3, 0.4], [0, 1]),
        useTransform(scrollYProgress, [0.4, 0.5], [0, 1]),
        useTransform(scrollYProgress, [0.5, 0.6], [0, 1]),
        useTransform(scrollYProgress, [0.6, 0.7], [0, 1]),
        useTransform(scrollYProgress, [0.7, 0.8], [0, 1]),
    ];

    return (
        <div ref={ref} className="w-full relative aspect-square sm:aspect-[4/3] rounded-2xl border border-neutral-800/60 bg-neutral-950/80 shadow-2xl overflow-hidden backdrop-blur-xl flex items-center justify-center p-4">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#ff6600]/5 blur-[80px] rounded-full pointer-events-none" />
            
            <div className="sr-only">Interactive Inventory and Stocks system datatable View</div>

            <svg viewBox="0 0 800 600" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMid meet">
                <rect x="0" y="0" width="800" height="600" rx="16" fill="#0a0a0a" stroke="#262626" strokeWidth="2" />
                
                {/* Panel Header */}
                <rect x="40" y="40" width="200" height="24" rx="6" fill="#fff" />
                <rect x="40" y="80" width="300" height="12" rx="4" fill="#555" />
                
                {/* Data Table Base */}
                <rect x="40" y="140" width="720" height="40" rx="8" fill="#1a1a1a" />
                <rect x="60" y="155" width="80" height="10" rx="4" fill="#666" />
                <rect x="250" y="155" width="60" height="10" rx="4" fill="#666" />
                <rect x="450" y="155" width="60" height="10" rx="4" fill="#666" />
                <rect x="650" y="155" width="60" height="10" rx="4" fill="#666" />

                {/* Data Rows */}
                <motion.g style={{ y: rowsY }}>
                    {[...Array(6)].map((_, i) => (
                        <motion.g key={i} transform={`translate(40, ${200 + i * 60})`} style={{ opacity: i < 5 ? opacities[i] : 0 }}>
                            <rect width="720" height="50" rx="8" fill="#141414" stroke="#222" strokeWidth="1" />
                            <circle cx="20" cy="25" r="8" fill={i % 3 === 0 ? "#ff6600" : "#00bfff"} fillOpacity="0.8" />
                            <rect x="40" y="20" width="120" height="10" rx="4" fill="#ddd" />
                            
                            <rect x="210" y="20" width="80" height="10" rx="4" fill="#888" />
                            
                            {/* Stock Bar */}
                            <rect x="410" y="20" width="150" height="10" rx="5" fill="#333" />
                            <rect x="410" y="20" width={40 + ((i * 37) % 80)} height="10" rx="5" fill={i % 3 === 0 ? "#ff6600" : "#00bfff"} />
                            
                            {/* Status Pill */}
                            <rect x="610" y="15" width="80" height="20" rx="10" fill={i % 3 === 0 ? "#ff660022" : "#00bfff22"} stroke={i % 3 === 0 ? "#ff6600" : "#00bfff"} strokeWidth="1" />
                        </motion.g>
                    ))}
                </motion.g>

            </svg>
        </div>
    );
}
