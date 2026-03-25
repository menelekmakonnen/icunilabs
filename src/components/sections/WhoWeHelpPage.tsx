import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { personas } from '../../data/personaData';
import MainLayout from '../layout/MainLayout';

export default function WhoWeHelpPage() {
    return (
        <MainLayout>
            {/* Hero */}
            <section className="pt-28 pb-16 md:pt-36 md:pb-24 text-center relative z-10">
                <div className="max-w-3xl mx-auto px-6">
                    <motion.h1
                        className="text-5xl md:text-6xl font-black tracking-tighter text-white mb-6 leading-[1.1]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        Built for Teams Growing{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#ff6600] to-[#00bfff]">Faster Than Their Systems</span>
                    </motion.h1>
                    <motion.p
                        className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.15 }}
                    >
                        ICUNI Labs works best with ambitious companies that already have movement, complexity, and pressure — but not yet the internal systems to match. Find your profile below.
                    </motion.p>
                </div>
            </section>

            {/* Persona Cards */}
            <section className="pb-24 md:pb-32 relative z-10">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="flex flex-col gap-8">
                        {personas.map((persona, index) => (
                            <motion.a
                                key={persona.id}
                                href={`#${persona.slug}`}
                                className="group relative overflow-hidden rounded-2xl border border-neutral-800/60 bg-neutral-900/40 backdrop-blur-xl p-8 md:p-10 flex flex-col md:flex-row gap-8 md:gap-10 items-start transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{
                                    borderColor: persona.accentColor + '50',
                                    boxShadow: `0 12px 40px ${persona.accentColor}15`,
                                }}
                            >
                                {/* Accent glow */}
                                <div
                                    className="absolute -top-20 -right-20 w-60 h-60 rounded-full blur-[100px] opacity-0 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"
                                    style={{ backgroundColor: persona.accentColor }}
                                />

                                {/* Left: Icon + Meta */}
                                <div className="shrink-0 flex flex-col items-center md:items-start gap-4 md:w-48 relative z-10">
                                    <div
                                        className="p-4 rounded-2xl border bg-neutral-950/80 backdrop-blur-md transition-all duration-300 group-hover:scale-110"
                                        style={{ borderColor: persona.accentColor + '30' }}
                                    >
                                        <persona.icon className="w-8 h-8" style={{ color: persona.accentColor }} />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-600 text-center md:text-left leading-snug">
                                        {persona.subtitle}
                                    </span>
                                </div>

                                {/* Right: Content */}
                                <div className="flex-1 relative z-10">
                                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-3 group-hover:text-white transition-colors">
                                        {persona.tileLine}
                                    </h2>
                                    <p className="text-neutral-400 text-base leading-relaxed mb-4">
                                        {persona.tileTeaser}
                                    </p>
                                    <p className="text-neutral-500 text-sm leading-relaxed mb-6">
                                        {persona.heroSub}
                                    </p>
                                    <div className="inline-flex items-center gap-2 text-sm font-bold transition-colors group-hover:text-white text-neutral-400">
                                        Read More
                                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </div>
                            </motion.a>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-20 border-t border-neutral-900 text-center relative z-10">
                <div className="max-w-2xl mx-auto px-6">
                    <motion.h2
                        className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Not sure where you fit?
                    </motion.h2>
                    <motion.p
                        className="text-neutral-500 mb-8 text-lg"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        Tell us what's slowing the team down. We'll figure out where we can help.
                    </motion.p>
                    <a
                        href="#contact"
                        className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#00bfff] to-[#0080ff] shadow-[0_0_20px_rgba(0,191,255,0.3)] text-white font-bold rounded hover:shadow-[0_0_30px_rgba(0,191,255,0.5)] transition-all"
                    >
                        Let's Fix the Chaos
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                </div>
            </section>
        </MainLayout>
    );
}
