
import { motion } from 'framer-motion';
import { Eye, Wrench, Zap } from 'lucide-react';
import { TOTAL_PROJECT_COUNT } from '../../data/portfolioData';

const pillars = [
    {
        icon: Eye,
        title: "Strategic enough to see the real bottleneck",
    },
    {
        icon: Wrench,
        title: "Practical enough to build what actually works",
    },
    {
        icon: Zap,
        title: "Lean enough to move without enterprise drag",
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
                    {TOTAL_PROJECT_COUNT}+ Projects.{' '}
                    <span className="text-[#00bfff] drop-shadow-[0_0_15px_rgba(0,191,255,0.4)]">One Developer.</span>
                </motion.h2>

                <motion.p
                    className="text-neutral-400 text-lg md:text-xl leading-relaxed max-w-3xl mx-auto mb-16"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    A lot of firms can explain your problem back to you in expensive language. ICUNI Labs is for teams that need the system designed and built around the way the work really happens. From Google Apps Script ERPs to Adobe Premiere extensions to .NET WPF media managers — the goal is not to make the business sound sophisticated. The goal is to make it run better.
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
