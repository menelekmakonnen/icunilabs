
import { motion } from 'framer-motion';
import { Rocket, Settings, Clapperboard, BrainCircuit } from 'lucide-react';

const audiences = [
    {
        icon: Rocket,
        title: "Founders and Operators",
        desc: "You've built momentum, but too much still depends on manual coordination and your own oversight.",
        color: "#ff6600",
        link: "#founders",
    },
    {
        icon: Settings,
        title: "Operations Leaders",
        desc: "You're tired of repeated breakdowns, weak handoffs, and systems that technically work but badly.",
        color: "#00bfff",
        link: "#operations",
    },
    {
        icon: Clapperboard,
        title: "Creative and Production Teams",
        desc: "Your work is slowed down by revision chaos, scattered files, unclear approvals, and fragile delivery pipelines.",
        color: "#f43f5e",
        link: "#creative-ops",
    },
    {
        icon: BrainCircuit,
        title: "Digitally Ambitious Teams",
        desc: "You want AI and automation to support real work, not become another layer of noise.",
        color: "#10b981",
        link: "#ai-adoption",
    },
];

export default function WhoWeHelp() {
    return (
        <section id="who-we-help" className="py-24 md:py-32 border-t border-neutral-900 relative bg-neutral-950/90 backdrop-blur-md z-10">
            <div className="max-w-5xl mx-auto px-6">

                <div className="mb-16 md:mb-20">
                    <motion.h2
                        className="text-3xl md:text-4xl font-black tracking-tight mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Best Fit for Teams Growing{' '}
                        <span className="text-[#ff6600] drop-shadow-[0_0_15px_rgba(255,102,0,0.4)]">Faster Than Their Operations</span>
                    </motion.h2>
                    <motion.p
                        className="text-neutral-400 text-lg max-w-3xl"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        ICUNI Labs works best with ambitious companies that already have movement, complexity, and pressure — but not yet the internal systems to match.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {audiences.map((a, index) => (
                        <motion.a
                            key={index}
                            href={a.link}
                            className="group p-6 md:p-8 rounded-xl border border-neutral-800/60 bg-neutral-950/60 backdrop-blur-xl overflow-hidden transition-all duration-500 hover:-translate-y-1 flex items-start gap-5 cursor-pointer relative"
                            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.02)' }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.08 }}
                            whileHover={{
                                borderColor: a.color + '40',
                                boxShadow: `0 8px 32px ${a.color}12, inset 0 1px 0 0 rgba(255,255,255,0.05)`,
                            }}
                        >
                            <div
                                className="absolute -inset-[100%] z-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                                style={{ background: `radial-gradient(circle at 50% 0%, ${a.color}10, transparent 50%)` }}
                            />
                            <a.icon
                                className="w-7 h-7 shrink-0 mt-1 text-neutral-600 transition-all duration-300 relative z-10 group-hover:drop-shadow-[0_0_8px_currentColor]"
                                style={{ color: undefined }}
                            />
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold text-neutral-100 mb-2 group-hover:text-white transition-colors">{a.title}</h3>
                                <p className="text-neutral-500 text-sm leading-relaxed">{a.desc}</p>
                            </div>
                        </motion.a>
                    ))}
                </div>

            </div>
        </section>
    );
}
