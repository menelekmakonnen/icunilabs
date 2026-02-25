
import { motion } from 'framer-motion';
import { Activity, Users, Clock, CheckCircle2, LayoutDashboard, GanttChartSquare } from 'lucide-react';

export default function LabDemos() {
    return (
        <section id="demo" className="py-24 md:py-32 bg-[#050505] border-t border-neutral-900 overflow-hidden relative">
            {/* Background Machinery Pattern */}
            <div className="absolute inset-0 z-0 opacity-[0.02]"
                style={{ backgroundImage: 'linear-gradient(45deg, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            <div className="max-w-7xl mx-auto px-6 relative z-10">

                <div className="text-center mb-16 md:mb-24">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-semibold mb-6 border border-blue-500/20"
                    >
                        <Activity className="w-4 h-4" />
                        Live Infrastructure
                    </motion.div>
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        The Systems Lab
                    </motion.h2>
                    <motion.p
                        className="text-neutral-400 text-lg md:text-xl max-w-2xl mx-auto"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        A look under the hood. We don't just build systems for clients; we run our entire operation on them.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                    {/* Internal Analytics Dashboard Mock */}
                    <motion.div
                        className="bg-neutral-950 rounded-2xl border border-neutral-800 p-6 shadow-2xl relative overflow-hidden"
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800">
                            <div className="flex items-center gap-2">
                                <LayoutDashboard className="text-neutral-500 w-5 h-5" />
                                <h3 className="font-semibold text-neutral-300">Live Analytics</h3>
                            </div>
                            <span className="text-xs font-mono text-emerald-400 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                SYNCING
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800/50">
                                <p className="text-neutral-500 text-sm mb-1">Active Projects</p>
                                <p className="text-3xl font-bold text-white">4</p>
                            </div>
                            <div className="bg-neutral-900 rounded-lg p-4 border border-neutral-800/50">
                                <p className="text-neutral-500 text-sm mb-1">Avg. Sprint Time</p>
                                <p className="text-3xl font-bold text-white">12.5 <span className="text-sm text-neutral-500 font-normal">days</span></p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm text-neutral-500 font-medium">Conversion by Region</p>
                            <div className="space-y-3">
                                {['UK / EU', 'North America', 'Ghana'].map((region, i) => (
                                    <div key={region}>
                                        <div className="flex justify-between text-xs text-neutral-400 mb-1">
                                            <span>{region}</span>
                                            <span>{Math.floor(Math.random() * (45 - 15) + 15)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-blue-500"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${Math.floor(Math.random() * (80 - 30) + 30)}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 1, delay: 0.5 + (i * 0.2) }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Client Project Tracker Mock */}
                    <motion.div
                        className="bg-neutral-950 rounded-2xl border border-neutral-800 p-6 shadow-2xl relative overflow-hidden"
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-neutral-800">
                            <div className="flex items-center gap-2">
                                <GanttChartSquare className="text-neutral-500 w-5 h-5" />
                                <h3 className="font-semibold text-neutral-300">Client Portal View</h3>
                            </div>
                            <span className="text-xs bg-neutral-800 text-neutral-300 px-2 py-1 rounded">Project ID: SYS-942</span>
                        </div>

                        <div className="relative border-l-2 border-neutral-800 ml-3 pl-6 space-y-8">

                            <div className="relative">
                                <div className="absolute -left-[31px] bg-neutral-950 rounded-full p-1 border-2 border-emerald-500 text-emerald-500">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <h4 className="text-white font-medium mb-1">Initial Audit & Discovery</h4>
                                <p className="text-sm text-neutral-500 mb-2">Automated mapping of current bottlenecks completed.</p>
                                <div className="text-xs font-mono text-neutral-600">Apr 12 • Processed</div>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-[31px] bg-neutral-950 rounded-full p-1 border-2 border-emerald-500 text-emerald-500">
                                    <CheckCircle2 className="w-4 h-4" />
                                </div>
                                <h4 className="text-white font-medium mb-1">Architecture Design</h4>
                                <p className="text-sm text-neutral-500 mb-2">Database schema and Zapier logic mapped.</p>
                                <div className="text-xs font-mono text-neutral-600">Apr 15 • Approved</div>
                            </div>

                            <div className="relative">
                                <div className="absolute -left-[31px] bg-neutral-950 rounded-full p-1 border-2 border-blue-500 text-blue-500">
                                    <Clock className="w-4 h-4 animate-spin-slow" />
                                </div>
                                <h4 className="text-white font-medium mb-1">Build Sprint (Active)</h4>
                                <p className="text-sm text-neutral-400 mb-2">Constructing core CRM integrations and intake forms.</p>

                                {/* Simulated Progress Bar */}
                                <div className="h-1.5 w-full max-w-[200px] bg-neutral-900 rounded-full overflow-hidden mt-3">
                                    <motion.div
                                        className="h-full bg-blue-500"
                                        initial={{ width: 0 }}
                                        whileInView={{ width: '65%' }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1.5, delay: 0.8 }}
                                    />
                                </div>
                            </div>

                            <div className="relative opacity-50">
                                <div className="absolute -left-[31px] bg-neutral-950 rounded-full p-1 border-2 border-neutral-800 text-neutral-600">
                                    <Users className="w-4 h-4" />
                                </div>
                                <h4 className="text-white font-medium mb-1">Handover & Training</h4>
                                <p className="text-sm text-neutral-500">Pending core build completion.</p>
                            </div>

                        </div>
                    </motion.div>

                </div>

            </div>
        </section>
    );
}
