
import { motion } from 'framer-motion';

export default function Problem() {
    return (
        <section id="what-we-do" className="py-24 md:py-32 border-t border-neutral-900 relative bg-neutral-950/90 backdrop-blur-md z-10">
            <div className="max-w-4xl mx-auto px-6">

                <div className="mb-16">
                    <motion.h2
                        className="text-4xl md:text-5xl font-black tracking-tight mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        We Build{' '}
                        <span className="text-[#00bfff] drop-shadow-[0_0_15px_rgba(0,191,255,0.4)]">Any Digital System</span>{' '}Your Business Needs
                    </motion.h2>

                    <motion.div
                        className="h-1 bg-gradient-to-r from-[#00bfff] to-[#0080ff] shadow-[0_0_10px_rgba(0,191,255,0.5)]"
                        initial={{ width: 0 }}
                        whileInView={{ width: 64 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    />
                </div>

                <motion.p
                    className="text-xl md:text-2xl font-medium text-neutral-200 mb-8 leading-relaxed max-w-3xl"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    We build any digital system your business needs. Literally anything. And we build it faster than anyone you've spoken to.
                </motion.p>

                <motion.p
                    className="text-neutral-400 text-lg leading-relaxed max-w-3xl"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    Dashboards, workflow engines, AI assistants, inventory trackers, financial systems, production pipelines, client portals, mobile apps — if it processes data and your business depends on it, we've either built it before or we'll build it for you in days. Not weeks. Not months. Days.
                </motion.p>

                <motion.p
                    className="text-[#ff7a00] text-lg font-bold leading-relaxed max-w-3xl mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    And after you've paid us? No software subscriptions from us. The system is yours.
                </motion.p>

            </div>
        </section>
    );
}
