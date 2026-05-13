
import { motion } from 'framer-motion';
import { Eye, Wrench, Zap } from 'lucide-react';
import { TOTAL_PROJECT_COUNT } from '../../data/portfolioData';

const pillars = [
    {
        icon: Eye,
        title: "We see the real problem — not the symptom",
    },
    {
        icon: Wrench,
        title: "We build the proof — demo in 1-3 days",
    },
    {
        icon: Zap,
        title: "No software subscriptions — the system is yours forever",
    },
];


export default function Authority() {
    return (
        <section className="py-32 border-t border-neutral-800 text-center px-6 relative">
            <div className="max-w-4xl mx-auto">

                <motion.h2
                    className="text-3xl md:text-5xl font-black tracking-tight mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    {TOTAL_PROJECT_COUNT}+ Systems Built.{' '}
                    <span className="text-[#00bfff] drop-shadow-[0_0_15px_rgba(0,191,255,0.4)]">Zero Unsolvable Problems.</span>
                </motion.h2>

                <motion.p
                    className="text-neutral-400 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-16"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    Print shops, construction sites, swim schools, block factories, warehouses, property portfolios — every industry, every challenge, every time. We don't just promise delivery. We prove it with a working demo before you commit to anything.
                </motion.p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {pillars.map((pillar, i) => (
                        <motion.div
                            key={i}
                            className="p-6 md:p-8 rounded-xl border border-neutral-800/50 bg-neutral-950/60 backdrop-blur-xl flex flex-col items-center gap-4"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
                        >
                            <pillar.icon className="w-8 h-8 text-[#00bfff] drop-shadow-[0_0_8px_rgba(0,191,255,0.4)]" />
                            <p className="text-white font-semibold text-lg leading-snug">{pillar.title}</p>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
