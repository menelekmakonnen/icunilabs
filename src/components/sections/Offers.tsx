
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, Bot, ArrowRight } from 'lucide-react';

const offers = [
    {
        icon: ShieldCheck,
        title: "ICUNI Ops Audit",
        desc: "A full workflow review with a clear automation roadmap.",
        featured: false,
        delay: 0.1
    },
    {
        icon: Zap,
        title: "ICUNI Build Sprint",
        desc: "1–3 weeks to build a working internal system.",
        featured: true,
        delay: 0.2
    },
    {
        icon: Bot,
        title: "Automation Upgrade",
        desc: "Add AI summaries, reminders, reporting, integrations.",
        featured: false,
        delay: 0.3
    }
];

export default function Offers() {
    return (
        <section id="offers" className="py-24 md:py-32 border-t border-neutral-900 relative">
            <div className="absolute top-0 left-0 w-full h-full from-neutral-900/40 via-transparent to-transparent pointer-events-none" />

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="text-center mb-16 md:mb-24">
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Engagement Models
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
                    {offers.map((offer, index) => (
                        <motion.div
                            key={index}
                            className={`p-8 rounded-xl border flex flex-col backdrop-blur-xl transition-all duration-500 relative overflow-hidden group ${offer.featured
                                ? 'bg-neutral-900/60 border-[#ff6600]/30 shadow-[0_8px_32px_rgba(255,102,0,0.1)] mt-0 md:-mt-4 md:mb-4'
                                : 'bg-neutral-950/60 border-neutral-800 hover:border-[#00bfff]/30 hover:shadow-[0_8px_32px_rgba(0,191,255,0.05)] hover:-translate-y-1'
                                }`}
                            style={{
                                boxShadow: offer.featured ? '0 8px 32px rgba(255,102,0,0.1), inset 0 1px 0 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 0 rgba(255,255,255,0.02)'
                            }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: offer.delay }}
                        >
                            {/* Hover Spotlight pseudo-element via group-hover */}
                            <div className={`absolute -inset-[100%] z-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none ${offer.featured ? 'bg-[radial-gradient(circle_at_50%_0%,rgba(255,102,0,0.15),transparent_50%)]' : 'bg-[radial-gradient(circle_at_50%_0%,rgba(0,191,255,0.1),transparent_50%)]'}`} />

                            <div className="relative z-10 flex flex-col h-full">
                                {offer.featured && (
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-gradient-to-r from-[#ff8533] to-[#ff4500] shadow-[0_0_10px_rgba(255,102,0,0.4)] text-white text-xs font-bold rounded-full">
                                        Most Popular
                                    </div>
                                )}

                                <offer.icon className={`w-10 h-10 mb-6 ${offer.featured ? 'text-[#ff6600] drop-shadow-[0_0_8px_rgba(255,102,0,0.5)]' : 'text-[#00bfff] drop-shadow-[0_0_8px_rgba(0,191,255,0.3)]'}`} />
                                <h3 className="text-xl font-bold text-white mb-4">{offer.title}</h3>
                                <p className="text-neutral-400 mb-8 flex-grow">{offer.desc}</p>

                                <a
                                    href="#contact"
                                    className={`inline-flex items-center gap-2 font-medium transition-colors ${offer.featured ? 'text-[#ff6600] hover:text-[#ff8533]' : 'text-[#00bfff] hover:text-[#33ccff]'
                                        }`}
                                >
                                    Get Started <ArrowRight className="w-4 h-4" />
                                </a>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="max-w-3xl mx-auto p-8 border border-neutral-800 rounded-xl bg-neutral-950/60 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden group hover:border-neutral-700 transition-colors"
                    style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.02)' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div className="absolute -inset-[100%] z-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.03),transparent_50%)]" />

                    <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">ICUNI Ops Partner</h3>
                            <p className="text-neutral-400">Ongoing systems support and continuous iteration for scaling teams.</p>
                        </div>
                        <a href="#contact" className="border border-neutral-700 px-6 py-2 rounded hover:bg-neutral-800 text-white font-medium transition-all whitespace-nowrap">
                            Inquire
                        </a>
                    </div>
                </motion.div>

            </div>
        </section>
    );
}
