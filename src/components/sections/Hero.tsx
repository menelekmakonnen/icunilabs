
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
    return (
        <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">

            {/* Abstract Background Grid/Machinery Hint */}
            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            <div className="max-w-4xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs font-medium text-neutral-400 mb-8 shadow-[0_0_10px_rgba(0,229,255,0.1)]">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(0,229,255,0.8)]"></span>
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
                    <span className="bg-clip-text text-transparent bg-gradient-to-br from-orange-400 to-orange-600 drop-shadow-[0_0_15px_rgba(255,107,0,0.4)]">CHAOS</span>
                    <br /> TO <span className="bg-clip-text text-transparent bg-gradient-to-br from-cyan-300 to-cyan-600 drop-shadow-[0_0_20px_rgba(0,229,255,0.4)]">SYSTEM</span>
                </motion.h1>

                <motion.p
                    className="text-xl md:text-2xl text-neutral-300 mb-10 max-w-2xl font-light leading-relaxed drop-shadow-md"
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
                        href="#contact"
                        className="group flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(0,229,255,0.3)] text-white font-bold rounded hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all"
                    >
                        Book a Systems Audit
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <a
                        href="#contact"
                        className="flex items-center justify-center px-8 py-4 bg-transparent border border-orange-500/50 text-orange-400 font-bold rounded hover:bg-orange-500/10 hover:border-orange-500 transition-all shadow-[inset_0_0_10px_rgba(255,107,0,0.05)]"
                    >
                        Start a Build Sprint
                    </a>
                </motion.div>

            </div>
        </section>
    );
}
