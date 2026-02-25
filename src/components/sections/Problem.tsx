
import { motion } from 'framer-motion';

export default function Problem() {
    return (
        <section id="problem" className="py-24 md:py-32 border-t border-neutral-900 relative">
            <div className="max-w-4xl mx-auto px-6">

                <div className="mb-16">
                    <motion.h2
                        className="text-4xl md:text-5xl font-black tracking-tight mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Your Business Isn’t Broken.<br />
                        <span className="text-[#ff6600] drop-shadow-[0_0_15px_rgba(255,102,0,0.4)]">Your Operations Are.</span>
                    </motion.h2>

                    <motion.div
                        className="h-1 bg-gradient-to-r from-[#00bfff] to-[#0080ff] shadow-[0_0_10px_rgba(0,191,255,0.5)]"
                        initial={{ width: 0 }}
                        whileInView={{ width: 64 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <p className="text-2xl font-medium text-neutral-200 mb-6 leading-relaxed">
                            Most businesses don’t need more staff. They need better systems.
                        </p>
                        <p className="text-neutral-400 text-lg leading-relaxed">
                            Growth without systems creates friction. Friction kills scale.
                            Manual processes. Spreadsheet overload. WhatsApp approvals.
                            Lost documents. Repeated mistakes. Knowledge stuck in people’s heads.
                        </p>
                    </motion.div>

                    <motion.div
                        className="bg-neutral-950/60 p-8 rounded-lg border border-[#00bfff]/30 relative overflow-hidden backdrop-blur-xl group transition-all duration-500 hover:border-[#00bfff]/50 hover:shadow-[0_8px_32px_rgba(0,191,255,0.05)]"
                        style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05)' }}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Hover Spotlight pseudo-element */}
                        <div className="absolute -inset-[100%] z-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(0,191,255,0.1),transparent_50%)]" />

                        {/* Decorative subtle grid */}
                        <div className="absolute inset-0 z-0 opacity-[0.05] pointer-events-none"
                            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                        <div className="relative z-10 flex flex-col h-full justify-center">
                            <h3 className="text-xl font-bold mb-4 text-[#00bfff] drop-shadow-[0_0_8px_rgba(0,191,255,0.4)]">The ICUNI Solution</h3>
                            <p className="text-neutral-300 leading-relaxed">
                                ICUNI Labs builds the structure behind your business — so it runs consistently, visibly, and efficiently.
                                We replace chaos with deterministic workflows.
                            </p>
                        </div>
                    </motion.div>
                </div>

            </div>
        </section>
    );
}
