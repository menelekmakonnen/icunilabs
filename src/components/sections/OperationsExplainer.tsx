
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import WorkflowSVG from '../animations/WorkflowSVG';

const withoutSystem = [
    "Manual follow-up",
    "Scattered approvals",
    "Reporting delays",
    "Repeated mistakes",
    "Version confusion",
    "Staff dependency",
];

const withSystem = [
    "Clear workflow logic",
    "Structured approvals",
    "Operational visibility",
    "Fewer repeat errors",
    "Better handoffs",
    "Cleaner scale",
];

export default function OperationsExplainer() {
    return (
        <section id="operations-explainer" className="py-24 md:py-32 border-t border-neutral-900 overflow-hidden relative z-10">
            <div className="max-w-5xl mx-auto px-6">

                <motion.h2
                    className="text-3xl md:text-4xl font-black tracking-tight mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    What are{' '}
                    <span className="text-[#ff6600] drop-shadow-[0_0_15px_rgba(255,102,0,0.4)]">Business Operations Systems.</span>
                </motion.h2>

                <motion.p
                    className="text-neutral-400 text-lg leading-relaxed max-w-3xl mb-16"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    An operations system is any internal setup that helps a business run better. It can be a workflow, dashboard, approval process, request portal, production tracker, reporting layer, knowledge system, or AI-enabled internal tool. The point is simple: work should not depend on guesswork, constant chasing, or one person remembering everything.
                </motion.p>

                {/* Layout with SVGs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div className="grid grid-cols-1 gap-6">

                        {/* Without a system */}
                        <motion.div
                            className="p-6 md:p-8 rounded-xl border border-neutral-800/60 bg-neutral-950/60 backdrop-blur-xl"
                            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.02)' }}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <h3 className="text-lg font-bold text-neutral-500 mb-6 uppercase tracking-wider text-sm">Without a System</h3>
                            <div className="space-y-4">
                                {withoutSystem.map((item, i) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <X className="w-4 h-4 text-red-500/70 shrink-0" />
                                        <span className="text-neutral-500">{item}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* With a system */}
                        <motion.div
                            className="p-6 md:p-8 rounded-xl border border-[#00bfff]/20 bg-neutral-950/60 backdrop-blur-xl relative overflow-hidden group"
                            style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,191,255,0.05)' }}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                        >
                            <div className="absolute -inset-[100%] z-0 rounded-xl opacity-30 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(0,191,255,0.08),transparent_50%)]" />
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold text-[#00bfff] mb-6 uppercase tracking-wider text-sm drop-shadow-[0_0_8px_rgba(0,191,255,0.4)]">With a System</h3>
                                <div className="space-y-4">
                                    {withSystem.map((item, i) => (
                                        <div key={i} className="flex items-center gap-3">
                                            <Check className="w-4 h-4 text-[#00bfff] shrink-0" />
                                            <span className="text-neutral-200">{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                    </div>
                    
                    <div className="relative lg:sticky lg:top-24 mt-12 lg:mt-0">
                        <WorkflowSVG />
                    </div>
                </div>

            </div>
        </section>
    );
}
