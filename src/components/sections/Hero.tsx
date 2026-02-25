
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs font-medium text-neutral-400 mb-8">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Accepting New Projects
                    </div>
                </motion.div>

                <motion.h1
                    className="text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter text-white mb-6 leading-[1.1]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                >
                    From <span className="text-neutral-500 line-through decoration-2">Chaos</span>
                    <br /> to <span className="bg-clip-text text-transparent bg-gradient-to-r from-neutral-50 to-neutral-500">System.</span>
                </motion.h1>

                <motion.p
                    className="text-xl md:text-2xl text-neutral-400 mb-10 max-w-2xl font-light leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                >
                    We design and build custom business systems, internal tools, and practical automations for growing teams.
                </motion.p>

                <motion.div
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                >
                    <a
                        href="#contact"
                        className="group flex items-center justify-center gap-2 px-8 py-4 bg-neutral-50 text-neutral-950 font-bold rounded hover:bg-neutral-200 transition-all"
                    >
                        Book a Systems Audit
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <a
                        href="#contact"
                        className="flex items-center justify-center px-8 py-4 bg-transparent border border-neutral-800 text-neutral-300 font-medium rounded hover:bg-neutral-900 hover:text-white transition-all"
                    >
                        Start a Build Sprint
                    </a>
                </motion.div>

            </div>
        </section>
    );
}
