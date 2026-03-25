
import { motion } from 'framer-motion';
import {
    Users, MessageSquare, Clock,
    RotateCcw, UserCheck, TrendingUp,
    Package, BrainCircuit,
} from 'lucide-react';

const signs = [
    { icon: Users, text: "Your team keeps chasing people for updates" },
    { icon: MessageSquare, text: "Approvals happen in random chats" },
    { icon: Clock, text: "Reporting takes too long" },
    { icon: RotateCcw, text: "The same mistakes keep happening" },
    { icon: UserCheck, text: "Too much depends on one person" },
    { icon: TrendingUp, text: "Growth is exposing messy internal processes" },
    { icon: Package, text: "Your delivery or production pipeline feels fragile" },
    { icon: BrainCircuit, text: "AI is being used inconsistently, with no real structure" },
];

export default function Signs() {
    return (
        <section className="py-24 md:py-32 border-t border-neutral-900 relative bg-neutral-950/90 backdrop-blur-md z-10">
            <div className="max-w-5xl mx-auto px-6">

                <motion.h2
                    className="text-3xl md:text-4xl font-black tracking-tight mb-4"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    If This Feels Familiar,{' '}
                    <span className="text-[#ff6600] drop-shadow-[0_0_15px_rgba(255,102,0,0.4)]">Your Business Has Outgrown Hustle</span>
                </motion.h2>

                <motion.p
                    className="text-neutral-400 text-lg leading-relaxed mb-14 max-w-2xl"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                >
                    Most operational problems do not start as disasters. They start as small inefficiencies that quietly become the culture.
                </motion.p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-14">
                    {signs.map((sign, index) => (
                        <motion.div
                            key={index}
                            className="flex items-center gap-4 p-4 md:p-5 rounded-lg border border-neutral-800/50 bg-neutral-950/60 backdrop-blur-xl hover:border-neutral-700 transition-colors group"
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.35, delay: index * 0.05 }}
                        >
                            <sign.icon className="w-5 h-5 text-neutral-600 group-hover:text-[#ff6600] transition-colors shrink-0" />
                            <span className="text-neutral-300 text-sm md:text-base">{sign.text}</span>
                        </motion.div>
                    ))}
                </div>

                <motion.p
                    className="text-2xl md:text-3xl font-bold text-white"
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    We build the systems that{' '}
                    <span className="text-[#00bfff] drop-shadow-[0_0_10px_rgba(0,191,255,0.4)]">fix that.</span>
                </motion.p>

            </div>
        </section>
    );
}
