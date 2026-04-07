import { useRef } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';
import InventoryStocksSVG from '../animations/InventoryStocksSVG';

export default function Method() {
    const containerRef = useRef<HTMLDivElement>(null);

    return (
        <section id="method" className="py-24 md:py-32 border-t border-neutral-900 relative bg-neutral-950/90 backdrop-blur-md z-10">
            <div className="max-w-6xl mx-auto px-6" ref={containerRef}>

                <div className="mb-16 md:mb-24 flex flex-col items-center text-center max-w-3xl mx-auto">
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        From Bottleneck to Working System
                    </motion.h2>
                    <motion.p
                        className="text-lg text-neutral-500 font-medium"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        We don't start with software for the sake of it. We start with where the business is slowing down, breaking, or depending too much on manual effort.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-7xl mx-auto">
                    <motion.div
                        className="bg-neutral-900/40 border border-neutral-800 p-8 md:p-12 rounded-[2rem] w-full shadow-2xl relative overflow-hidden"
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                    >
                        {/* Glowing background hint */}
                        <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#00bfff]/10 blur-[100px] rounded-full pointer-events-none" />
                        <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#ff6600]/10 blur-[100px] rounded-full pointer-events-none" />

                        <div className="relative z-10">
                            {/* Header of the mock tracking portal */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-neutral-800/80 gap-6">
                                <div>
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-950 text-xs font-bold tracking-widest uppercase text-emerald-400 mb-4 shadow-sm">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                        Client Portal View
                                    </div>
                                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 tracking-tight">Ops Infrastructure Build</h3>
                                    <p className="text-sm font-medium text-neutral-500">Active Phase: <span className="text-white">Sprint 3 (Deployment)</span></p>
                                </div>
                                <div className="sm:text-right flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1">
                                    <span className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#00bfff] to-[#0080ff] drop-shadow-sm">65%</span>
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">Complete</p>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2.5 w-full bg-neutral-950 rounded-full overflow-hidden mb-12 border border-neutral-800/80 shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-[#00bfff] to-[#0080ff] shadow-[0_0_12px_rgba(0,191,255,0.6)] rounded-full"
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '65%' }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                                />
                            </div>

                            {/* Pipeline Timeline */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-6 relative">
                                {/* Desktop Connecting Line */}
                                <div className="hidden md:block absolute top-[11px] left-[10%] right-[10%] h-[2px] bg-neutral-800/80 z-0" />
                                <motion.div 
                                    className="hidden md:block absolute top-[11px] left-[10%] h-[2px] bg-[#00bfff] z-0 shadow-[0_0_8px_rgba(0,191,255,0.8)]" 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: '50%' }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.6 }}
                                />
                                
                                {/* Pipeline items */}
                                {[
                                    { status: 'completed', num: '01', title: 'Diagnose', desc: 'Identify bottlenecks and map friction points.' },
                                    { status: 'completed', num: '02', title: 'Design', desc: 'Define operating logic and shape the system.' },
                                    { status: 'active', num: '03', title: 'Build', desc: 'Develop tools, automations, and AI workflow layers.' },
                                    { status: 'pending', num: '04', title: 'Refine', desc: 'Deploy to the team and adapt to real-world use.' },
                                ].map((step, idx) => (
                                    <motion.div 
                                        key={idx} 
                                        className="relative z-10 flex flex-row md:flex-col items-start gap-5 md:gap-4 md:text-center group"
                                        initial={{ opacity: 0, y: 15 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: 0.8 + (idx * 0.15) }}
                                    >
                                        <div className="relative bg-neutral-900 mx-auto rounded-full z-10 shrink-0 mt-0.5 md:mt-0 shadow-sm">
                                            {step.status === 'completed' && <CheckCircle2 className="w-6 h-6 text-neutral-400 group-hover:text-white transition-colors" />}
                                            {step.status === 'active' && <Circle className="w-6 h-6 text-[#00bfff] drop-shadow-[0_0_10px_rgba(0,191,255,1)] animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]" />}
                                            {step.status === 'pending' && <Circle className="w-6 h-6 text-neutral-800" />}
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-bold tracking-tight mb-1.5 uppercase ${step.status === 'active' ? 'text-white' : step.status === 'completed' ? 'text-neutral-300' : 'text-neutral-600'}`}>
                                                <span className="text-neutral-600 mr-1.5">{step.num}.</span>{step.title}
                                            </h4>
                                            <p className="text-xs text-neutral-500 leading-relaxed mx-auto font-medium">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    <div className="relative w-full">
                        <InventoryStocksSVG />
                    </div>
                </div>

            </div>
        </section>
    );
}
