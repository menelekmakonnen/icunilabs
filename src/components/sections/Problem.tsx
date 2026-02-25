
import { motion } from 'framer-motion';

export default function Problem() {
    return (
        <section id="problem" className="py-24 md:py-32 bg-neutral-950 border-t border-neutral-900">
            <div className="max-w-4xl mx-auto px-6">

                <div className="mb-16">
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Your Business Isn’t Broken.<br />
                        <span className="text-neutral-500">Your Operations Are.</span>
                    </motion.h2>

                    <motion.div
                        className="h-1 w-12 bg-neutral-800"
                        initial={{ width: 0 }}
                        whileInView={{ width: 48 }}
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
                        <p className="text-2xl font-medium text-neutral-300 mb-6 leading-relaxed">
                            Most businesses don’t need more staff. They need better systems.
                        </p>
                        <p className="text-neutral-400 text-lg leading-relaxed">
                            Growth without systems creates friction. Friction kills scale.
                            Manual processes. Spreadsheet overload. WhatsApp approvals.
                            Lost documents. Repeated mistakes. Knowledge stuck in people’s heads.
                        </p>
                    </motion.div>

                    <motion.div
                        className="bg-neutral-900/50 p-8 rounded-lg border border-neutral-800/50 relative overflow-hidden"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Decorative subtle grid */}
                        <div className="absolute inset-0 z-0 opacity-[0.05]"
                            style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                        <div className="relative z-10 flex flex-col h-full justify-center">
                            <h3 className="text-xl font-semibold mb-4 text-emerald-400">The ICUNI Solution</h3>
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
