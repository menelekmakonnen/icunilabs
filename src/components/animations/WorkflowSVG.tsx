import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

export default function WorkflowSVG() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"]
    });

    // Animate the progress line across the workflow
    const progressWidth = useTransform(scrollYProgress, [0.2, 0.7], ["0%", "100%"]);
    
    // Simple pulse opacities for different blocks
    const block1Opacity = useTransform(scrollYProgress, [0.1, 0.3, 0.5], [0.3, 1, 0.5]);
    const block2Opacity = useTransform(scrollYProgress, [0.3, 0.5, 0.7], [0.3, 1, 0.5]);
    const block3Opacity = useTransform(scrollYProgress, [0.5, 0.7, 0.9], [0.3, 1, 1]);

    // Data packet traveling along the line
    const packetX = useTransform(scrollYProgress, [0.2, 0.7], [50, 650]);

    return (
        <div ref={containerRef} className="w-full aspect-video md:aspect-square lg:aspect-[4/3] bg-neutral-950/40 rounded-2xl border border-neutral-800/80 overflow-hidden relative flex items-center justify-center shadow-inner">
            <span className="sr-only">Visual chart showing an intake packet traveling through a structured logical workflow pipeline of Intake, Processing, and Execution</span>
            
            <svg viewBox="0 0 800 600" className="w-full h-full text-neutral-800" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00bfff" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#0080ff" stopOpacity="0.8" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* Grid Background */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <rect width="40" height="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.1" />
                </pattern>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Base connection lines */}
                <line x1="50" y1="300" x2="700" y2="300" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeOpacity="0.4" strokeDasharray="8 8" />

                {/* Active connection line moving based on scroll */}
                <motion.line 
                    x1="50" y1="300" 
                    x2="700" y2="300" 
                    stroke="url(#flow-gradient)" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    filter="url(#glow)"
                    style={{ strokeDasharray: 650, strokeDashoffset: useTransform(progressWidth, (w) => 650 - (parseFloat(w as string) / 100) * 650) }}
                />

                {/* Animated Data Packet */}
                <motion.circle
                    r="8"
                    cx={packetX}
                    cy="300"
                    fill="#fff"
                    filter="url(#glow)"
                    custom="0_0_15px_#00bfff"
                    stroke="#00bfff"
                    strokeWidth="2"
                    style={{
                        scale: useTransform(scrollYProgress, [0, 0.4, 0.5, 0.8, 1], [0, 1, 1.5, 1, 0])
                    }}
                />

                {/* BLOCK 1: INTAKE */}
                <motion.g style={{ opacity: block1Opacity }}>
                    <rect x="50" y="240" width="160" height="120" rx="8" fill="#111" stroke="#333" strokeWidth="2" />
                    <rect x="50" y="240" width="160" height="30" rx="8" fill="#1a1a1a" />
                    <text x="130" y="260" fill="#888" fontSize="12" fontWeight="bold" textAnchor="middle" letterSpacing="1">1. INTAKE</text>
                    
                    {/* Mock tickets */}
                    <rect x="70" y="290" width="120" height="15" rx="2" fill="#00bfff" opacity="0.2" stroke="#00bfff" strokeWidth="1"/>
                    <rect x="70" y="315" width="100" height="15" rx="2" fill="#fff" opacity="0.05" />
                    <rect x="70" y="340" width="110" height="15" rx="2" fill="#fff" opacity="0.05" />
                </motion.g>

                {/* BLOCK 2: PROCESSING (AI / LOGIC) */}
                <motion.g style={{ opacity: block2Opacity }}>
                    <rect x="320" y="200" width="180" height="200" rx="8" fill="#111" stroke="#4a5568" strokeWidth="2" />
                    <rect x="320" y="200" width="180" height="30" rx="8" fill="#1a1a1a" />
                    <text x="410" y="220" fill="#a0aec0" fontSize="12" fontWeight="bold" textAnchor="middle" letterSpacing="1">2. LOGIC ROUTING</text>
                    
                    {/* Logic nodes inside */}
                    <circle cx="410" cy="270" r="15" fill="#00bfff" opacity="0.2" stroke="#00bfff" strokeWidth="2" />
                    <path d="M 390 320 L 410 300 L 430 320" fill="none" stroke="#666" strokeWidth="2" />
                    <rect x="360" y="330" width="40" height="40" rx="4" fill="#2d3748" />
                    <rect x="420" y="330" width="40" height="40" rx="4" fill="#00bfff" opacity="0.5" />
                    <text x="380" y="355" fill="#aaa" fontSize="10" textAnchor="middle">REJ</text>
                    <text x="440" y="355" fill="#fff" fontSize="10" textAnchor="middle">APP</text>
                </motion.g>

                {/* BLOCK 3: EXECUTION */}
                <motion.g style={{ opacity: block3Opacity }}>
                    <rect x="610" y="240" width="140" height="120" rx="8" fill="#111" stroke="#00bfff" strokeWidth="2" />
                    <rect x="610" y="240" width="140" height="30" rx="8" fill="#00bfff" opacity="0.1" />
                    <text x="680" y="260" fill="#00bfff" fontSize="12" fontWeight="bold" textAnchor="middle" letterSpacing="1">3. EXECUTE</text>
                    
                    {/* Success states */}
                    <circle cx="680" cy="300" r="18" fill="#00bfff" opacity="0.2" />
                    <path d="M 672 300 L 678 306 L 688 294" fill="none" stroke="#00bfff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    
                    <rect x="630" y="340" width="100" height="8" rx="4" fill="#fff" opacity="0.2" />
                </motion.g>

            </svg>
        </div>
    );
}
