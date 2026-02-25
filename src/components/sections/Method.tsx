
import { motion } from 'framer-motion';

const steps = [
    {
        num: "01",
        title: "Diagnose",
        desc: "We map your workflow and identify bottlenecks."
    },
    {
        num: "02",
        title: "Design",
        desc: "We architect a clean, logical system."
    },
    {
        num: "03",
        title: "Build",
        desc: "We develop a practical MVP quickly."
    },
    {
        num: "04",
        title: "Automate",
        desc: "Notifications, approvals, integrations, AI layers."
    },
    {
        num: "05",
        title: "Optimize",
        desc: "Continuous refinement as you grow."
    }
];

export default function Method() {
    return (
        <section id="method" className="py-24 md:py-32 bg-neutral-950 border-t border-neutral-900">
            <div className="max-w-7xl mx-auto px-6">

                <div className="mb-16 md:mb-24 flex flex-col items-center text-center">
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        The ICUNI Systems Method
                    </motion.h2>
                    <motion.p
                        className="text-xl text-neutral-500 font-medium"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        No jargon. No hype. Implementation.
                    </motion.p>
                </div>

                <div className="relative">
                    {/* Connecting line for desktop */}
                    <div className="hidden lg:block absolute top-1/2 left-0 w-full h-[1px] bg-neutral-800 -translate-y-1/2 z-0" />

                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10">
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                className="flex flex-col items-center text-center bg-neutral-950 lg:bg-transparent"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.15 }}
                            >
                                <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-xl font-bold text-neutral-400 mb-6 relative shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                                    {step.num}
                                    {/* Subtle glow dot */}
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-neutral-800 rounded-full border border-neutral-700"></div>
                                </div>
                                <h3 className="text-xl font-semibold text-neutral-200 mb-3">{step.title}</h3>
                                <p className="text-neutral-500 text-sm leading-relaxed px-4">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>
        </section>
    );
}
