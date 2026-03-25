
import { motion } from 'framer-motion';
import {
    Workflow, LayoutDashboard, BrainCircuit,
    Clapperboard, Wrench,
} from 'lucide-react';

const services = [
    {
        icon: Workflow,
        title: "Workflow Systems",
        desc: "For approvals, handoffs, task routing, recurring processes, internal requests, and operational clarity.",
        example: "e.g. Approval chain for client delivery",
    },
    {
        icon: LayoutDashboard,
        title: "Reporting Systems",
        desc: "For dashboards, trackers, performance visibility, operational oversight, and decision support.",
        example: "e.g. Operational dashboard for multi-team visibility",
    },
    {
        icon: BrainCircuit,
        title: "AI-Enabled Operations Systems",
        desc: "For structured productivity, internal support, workflow acceleration, and practical AI integration.",
        example: "e.g. Internal AI assistant for repeated admin tasks",
    },
    {
        icon: Clapperboard,
        title: "Production Operations Systems",
        desc: "For studios, agencies, and content-heavy teams managing revisions, assets, approvals, and delivery.",
        example: "e.g. Content pipeline with review and status tracking",
    },
    {
        icon: Wrench,
        title: "Custom Internal Tools",
        desc: "For businesses whose operations are too specific for off-the-shelf software.",
        example: "e.g. Internal portal tailored to how the team actually works",
    },
];

export default function WhatWeDo() {
    return (
        <section id="services" className="py-24 md:py-32 border-t border-neutral-900 overflow-hidden relative z-10">
            <div className="max-w-6xl mx-auto px-6">

                <div className="mb-16 md:mb-20">
                    <motion.h2
                        className="text-4xl md:text-5xl font-black tracking-tight mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Operations Systems for{' '}
                        <span className="text-[#00bfff] drop-shadow-[0_0_15px_rgba(0,191,255,0.4)]">Real Execution</span>
                    </motion.h2>
                    <motion.p
                        className="text-neutral-400 text-lg max-w-2xl"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Different businesses break in different places. The common issue is usually the same: the work is moving, but the operations underneath it are weak.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            className="p-6 md:p-8 bg-neutral-950/90 backdrop-blur-md border border-neutral-800/50 rounded-xl hover:border-[#00bfff]/30 transition-all duration-500 group hover:shadow-[0_8px_32px_rgba(0,191,255,0.05)] relative overflow-hidden flex flex-col"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.08 }}
                        >
                            <div className="absolute -inset-[100%] z-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(0,191,255,0.06),transparent_50%)]" />

                            <div className="relative z-10 flex flex-col h-full">
                                <service.icon className="w-7 h-7 text-neutral-600 mb-5 group-hover:text-[#00bfff] group-hover:drop-shadow-[0_0_8px_rgba(0,191,255,0.5)] transition-all" />
                                <h3 className="text-lg font-bold text-neutral-100 mb-3 group-hover:text-white transition-colors">{service.title}</h3>
                                <p className="text-neutral-500 text-sm leading-relaxed mb-4 flex-grow">{service.desc}</p>
                                <p className="text-xs text-neutral-600 italic">{service.example}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
