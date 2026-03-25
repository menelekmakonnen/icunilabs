
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
                        <span className="text-[#00bfff] drop-shadow-[0_0_15px_rgba(0,191,255,0.4)]">Operations Systems</span>
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
                    ICUNI Labs designs the internal systems that help businesses run with more clarity, consistency, and control.
                </motion.p>

                <motion.p
                    className="text-neutral-400 text-lg leading-relaxed max-w-3xl"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    That includes workflow systems, dashboards, automations, reporting infrastructure, production pipelines, approval flows, internal tools, and AI-supported operating layers. If your team is relying on scattered chats, spreadsheets, follow-up, and human memory to keep things moving, the issue usually isn't effort. It's the system.
                </motion.p>

            </div>
        </section>
    );
}
