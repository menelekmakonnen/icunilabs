
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">

            {/* Abstract Background Grid/Machinery Hint */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Ambient Center Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#00bfff]/10 to-[#ff6600]/5 blur-[120px] rounded-full pointer-events-none z-0" />

            <div className="max-w-4xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs font-medium text-neutral-400 mb-8 shadow-[0_0_10px_rgba(0,191,255,0.05)] backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-[#00bfff] animate-pulse shadow-[0_0_8px_rgba(0,191,255,0.8)]"></span>
                        Accepting New Projects
                    </div>
                </motion.div>

                <motion.h1
                    className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-6 leading-[1.1]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                >
                    FROM <br className="md:hidden" />
                    <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#ff8533] to-[#ff5500] drop-shadow-[0_0_15px_rgba(255,102,0,0.4)]">CHAOS</span>
                    <br /> TO <span className="bg-clip-text text-transparent bg-gradient-to-br from-[#33ccff] to-[#0099cc] drop-shadow-[0_0_20px_rgba(0,191,255,0.4)]">SYSTEM</span>
                </motion.h1>

                <motion.p
                    className="text-lg md:text-xl text-neutral-400 mb-10 max-w-2xl font-light leading-relaxed drop-shadow-md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                >
                    Turning messy operations into efficient workflows. We design and build custom business systems, internal tools, and practical automations.
                </motion.p>

                <motion.div
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                >
                    <a
                        href="#portfolio"
                        className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#00bfff] to-[#0080ff] shadow-[0_0_20px_rgba(0,191,255,0.3)] text-white font-bold rounded hover:shadow-[0_0_30px_rgba(0,191,255,0.5)] transition-all"
                    >
                        View Enterprise Solutions
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <a
                        href="#offers"
                        className="flex items-center justify-center px-8 py-4 bg-transparent border border-[#ff6600]/50 text-[#ff6600] font-bold rounded hover:bg-[#ff6600]/10 hover:border-[#ff6600] transition-all shadow-[inset_0_0_10px_rgba(255,102,0,0.05)]"
                    >
                        Start a Build Sprint
                    </a>
                </motion.div>

            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1, duration: 1 }}
            >
                <span className="text-[10px] tracking-widest uppercase text-neutral-500 font-bold">Scroll</span>
                <motion.div
                    className="w-[1px] h-12 bg-gradient-to-b from-[#00bfff] to-transparent"
                    animate={{ scaleY: [0, 1, 0], transformOrigin: ["top", "top", "bottom"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </motion.div>
        </section>
    );
}
