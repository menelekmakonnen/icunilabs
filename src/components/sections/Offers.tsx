
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
        <section id="offers" className="py-24 md:py-32 bg-neutral-950 border-t border-neutral-900 relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950 pointer-events-none" />

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
                            className={`p-8 rounded-xl border flex flex-col ${offer.featured
                                    ? 'bg-neutral-900 border-neutral-700 shadow-2xl relative mt-0 md:-mt-4 md:mb-4'
                                    : 'bg-neutral-950 border-neutral-800'
                                }`}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: offer.delay }}
                        >
                            {offer.featured && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 py-1 bg-neutral-100 text-neutral-900 text-xs font-bold rounded-full">
                                    Most Popular
                                </div>
                            )}

                            <offer.icon className={`w-10 h-10 mb-6 ${offer.featured ? 'text-neutral-100' : 'text-neutral-400'}`} />
                            <h3 className="text-xl font-bold text-white mb-4">{offer.title}</h3>
                            <p className="text-neutral-400 mb-8 flex-grow">{offer.desc}</p>

                            <a
                                href="#contact"
                                className={`inline-flex items-center gap-2 font-medium transition-colors ${offer.featured ? 'text-white hover:text-neutral-300' : 'text-neutral-400 hover:text-white'
                                    }`}
                            >
                                Get Started <ArrowRight className="w-4 h-4" />
                            </a>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="max-w-3xl mx-auto p-8 border border-neutral-800 rounded-xl bg-neutral-900/30 flex flex-col md:flex-row items-center justify-between gap-6"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <div>
                        <h3 className="text-xl font-bold text-white mb-2">ICUNI Ops Partner</h3>
                        <p className="text-neutral-400">Ongoing systems support and continuous iteration for scaling teams.</p>
                    </div>
                    <a href="#contact" className="hidden border border-neutral-700 px-6 py-2 rounded hover:bg-neutral-800 text-white font-medium transition-all whitespace-nowrap">
                        Inquire
                    </a>
                </motion.div>

            </div>
        </section>
    );
}
