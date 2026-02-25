
import { motion } from 'framer-motion';
import {
    Users, LineChart, LayoutDashboard,
    FileText, Calendar, Zap,
    Settings, Workflow
} from 'lucide-react';

const services = [
    { icon: Users, title: "Client onboarding systems" },
    { icon: LineChart, title: "Sales and lead tracking pipelines" },
    { icon: LayoutDashboard, title: "Internal dashboards and reporting" },
    { icon: FileText, title: "Approval and document workflows" },
    { icon: Calendar, title: "Booking and scheduling systems" },
    { icon: Zap, title: "AI-assisted admin automations" },
    { icon: Settings, title: "Custom internal tools" },
    { icon: Workflow, title: "Workflow redesign and process architecture" }
];

export default function WhatWeDo() {
    return (
        <section id="services" className="py-24 md:py-32 bg-neutral-950 border-t border-neutral-900 overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">

                <div className="text-center mb-16 md:mb-24">
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        We Build the Machinery<br />
                        <span className="text-neutral-500">Behind the Business.</span>
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {services.map((service, index) => (
                        <motion.div
                            key={index}
                            className="p-6 bg-neutral-900/30 border border-neutral-800/50 rounded-lg hover:border-neutral-700 transition-colors group"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                        >
                            <service.icon className="w-8 h-8 text-neutral-500 mb-4 group-hover:text-neutral-300 transition-colors" />
                            <h3 className="text-lg font-medium text-neutral-200">{service.title}</h3>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    className="text-center"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.8 }}
                >
                    <p className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-900/50 border border-neutral-800 text-neutral-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-blue-500/50"></span>
                        Start simple with tools you already use. Scale when ready.
                    </p>
                </motion.div>

            </div>
        </section>
    );
}
