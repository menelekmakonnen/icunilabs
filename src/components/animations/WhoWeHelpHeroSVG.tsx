import { motion } from 'framer-motion';

export default function WhoWeHelpHeroSVG() {
    return (
        <div className="w-full aspect-video md:aspect-[2/1] bg-neutral-950/40 rounded-2xl border border-neutral-800/80 overflow-hidden relative flex items-center justify-center p-8">
            <span className="sr-only">Visual metaphor showing chaotic abstract shapes transforming into a highly structured, organized grid</span>
            <svg viewBox="0 0 1000 400" className="w-full h-full text-neutral-800" preserveAspectRatio="xMidYMid meet">
                
                <defs>
                    <linearGradient id="chaosGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ff6600" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.8" />
                    </linearGradient>
                    <linearGradient id="orderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00bfff" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                    </linearGradient>
                </defs>

                {/* Left Side: Chaos */}
                <g transform="translate(100, 200)">
                    <text x="0" y="-120" fill="#666" fontSize="14" fontWeight="bold" textAnchor="middle" letterSpacing="2">CHAOTIC GROWTH</text>
                    {[...Array(12)].map((_, i) => (
                        <motion.circle
                            key={`chaos-${i}`}
                            r={((i * 17) % 15) + 5}
                            cx={((i * 43) % 200) - 100}
                            cy={((i * 71) % 150) - 75}
                            fill="url(#chaosGradient)"
                            animate={{
                                cx: ((i * 53) % 250) - 125,
                                cy: ((i * 89) % 200) - 100,
                            }}
                            transition={{
                                duration: ((i * 13) % 3) + 2,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut"
                            }}
                        />
                    ))}
                    {[...Array(8)].map((_, i) => (
                        <motion.path
                            key={`line-${i}`}
                            d={`M ${((i * 11) % 200) - 100} ${((i * 19) % 150) - 75} Q ${((i * 23) % 300) - 150} ${((i * 29) % 200) - 100} ${((i * 31) % 200) - 100} ${((i * 37) % 150) - 75}`}
                            fill="none"
                            stroke="#ff6600"
                            strokeWidth="2"
                            strokeOpacity="0.4"
                            animate={{
                                opacity: [0.2, 0.8, 0.2]
                            }}
                            transition={{
                                duration: ((i * 7) % 2) + 1,
                                repeat: Infinity,
                                ease: "linear"
                            }}
                        />
                    ))}
                </g>

                {/* Arrow / Transition */}
                <g transform="translate(500, 200)">
                    <motion.path 
                        d="M -50 0 L 50 0 M 30 -20 L 50 0 L 30 20" 
                        fill="none" 
                        stroke="#fff" 
                        strokeWidth="3" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeOpacity="0.3" 
                        animate={{
                            x: [-10, 10, -10],
                            opacity: [0.3, 1, 0.3]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    />
                </g>

                {/* Right Side: Order */}
                <g transform="translate(700, 200)">
                    <text x="0" y="-120" fill="#666" fontSize="14" fontWeight="bold" textAnchor="middle" letterSpacing="2">BUSINESS OPS SYSTEMS</text>
                    
                    {/* Structure grids */}
                    <rect x="-110" y="-80" width="220" height="160" rx="8" fill="#111" stroke="#333" strokeWidth="2" />
                    
                    <g transform="translate(-90, -60)">
                        {[0, 1, 2].map((row) => (
                            <g key={`row-${row}`} transform={`translate(0, ${row * 45})`}>
                                {[0, 1, 2].map((col) => (
                                    <motion.rect
                                        key={`col-${col}`}
                                        x={col * 65}
                                        y={0}
                                        width="50"
                                        height="30"
                                        rx="4"
                                        fill="url(#orderGradient)"
                                        opacity={0.8}
                                        animate={{
                                            opacity: [0.5, 0.9, 0.5]
                                        }}
                                        transition={{
                                            duration: 3,
                                            delay: (row * 3 + col) * 0.2,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                            </g>
                        ))}
                    </g>
                </g>

            </svg>
        </div>
    );
}
