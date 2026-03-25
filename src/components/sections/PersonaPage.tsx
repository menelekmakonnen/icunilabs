
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { personas, type PersonaData } from '../../data/personaData';
import MainLayout from '../layout/MainLayout';
import Contact from './Contact';

interface PersonaPageProps {
    persona: PersonaData;
}

export default function PersonaPage({ persona }: PersonaPageProps) {
    return (
        <MainLayout>
            {/* Hero */}
            <section className="relative min-h-[70vh] flex items-center justify-center overflow-hidden pt-20">
                {/* Ambient glow */}
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] blur-[120px] rounded-full pointer-events-none z-0 opacity-20"
                    style={{ backgroundColor: persona.accentColor }}
                />

                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-semibold mb-8 backdrop-blur-md"
                            style={{
                                borderColor: persona.accentColor + '40',
                                backgroundColor: persona.accentColor + '10',
                                color: persona.accentColor,
                            }}
                        >
                            <persona.icon className="w-4 h-4" />
                            {persona.title}
                        </div>
                    </motion.div>

                    <motion.h1
                        className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter text-white mb-6 leading-[1.1]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                    >
                        {persona.heroHeadline}
                    </motion.h1>

                    <motion.p
                        className="text-lg md:text-xl text-neutral-400 mb-6 max-w-2xl font-light leading-relaxed"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {persona.heroSub}
                    </motion.p>

                    <motion.p
                        className="text-sm text-neutral-500 mb-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        {persona.subtitle}
                    </motion.p>
                </div>
            </section>

            {/* Pain Signals */}
            <section className="py-20 md:py-28 border-t border-neutral-900 relative bg-neutral-950/90 backdrop-blur-md z-10">
                <div className="max-w-3xl mx-auto px-6">
                    <motion.h2
                        className="text-3xl md:text-4xl font-bold tracking-tight mb-12"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        {persona.painIntro}
                    </motion.h2>

                    <div className="space-y-4">
                        {persona.painSignals.map((signal, i) => (
                            <motion.div
                                key={i}
                                className="flex items-start gap-4 p-5 rounded-lg border border-neutral-800/50 bg-neutral-950/60 backdrop-blur-xl hover:border-neutral-700 transition-colors"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                            >
                                <span
                                    className="mt-1 w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: persona.accentColor, boxShadow: `0 0 8px ${persona.accentColor}80` }}
                                />
                                <p className="text-neutral-300 text-lg italic">"{signal}"</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Solution */}
            <section className="py-20 md:py-28 border-t border-neutral-900 relative z-10">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6">
                                <span style={{ color: persona.accentColor }}>{persona.solutionHeadline}</span>
                            </h2>
                            <p className="text-neutral-400 text-lg leading-relaxed">
                                {persona.solutionBody}
                            </p>
                        </motion.div>

                        <motion.div
                            className="space-y-6"
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                        >
                            {persona.proofPoints.map((pt, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <CheckCircle2
                                        className="w-6 h-6 shrink-0 mt-0.5"
                                        style={{ color: persona.accentColor }}
                                    />
                                    <div>
                                        <h4 className="text-white font-semibold mb-1">{pt.label}</h4>
                                        <p className="text-neutral-500 text-sm">{pt.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* About / Authority block */}
            <section className="py-20 md:py-28 border-t border-neutral-900 relative bg-neutral-950/90 backdrop-blur-md z-10">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <motion.p
                        className="text-2xl md:text-3xl font-bold text-white mb-6 leading-snug"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        ICUNI Labs was built for ambitious teams that need sharper systems, cleaner execution, and practical AI integration —{' '}
                        <span style={{ color: persona.accentColor }}>without bloated consultancy overhead.</span>
                    </motion.p>
                    <motion.p
                        className="text-neutral-500 text-lg leading-relaxed"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        We understand operations, production, delivery, internal tooling, and process design from the inside. We build lean, useful systems that people can actually adopt.
                    </motion.p>
                </div>
            </section>

            {/* Embedded Contact Form */}
            <Contact />
            {/* Cross Navigation Bar */}
            <div className="fixed bottom-0 left-0 w-full z-40 bg-neutral-950/80 backdrop-blur-xl border-t border-neutral-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4 overflow-x-auto scrollbar-none">
                    <span className="text-xs font-bold uppercase tracking-widest text-neutral-500 shrink-0 mr-2">Also explore:</span>
                    {personas.map(p => {
                        const isActive = p.id === persona.id;
                        return (
                            <a
                                key={p.id}
                                href={`#${p.slug}`}
                                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 shrink-0 border ${
                                    isActive
                                        ? 'bg-neutral-900 border-neutral-700 shadow-sm'
                                        : 'bg-transparent border-transparent hover:bg-neutral-900/50 hover:border-neutral-800'
                                }`}
                                style={isActive ? { borderColor: p.accentColor + '50', boxShadow: `0 0 15px ${p.accentColor}15` } : undefined}
                            >
                                <p.icon 
                                    className={`w-4 h-4 transition-transform ${isActive ? 'scale-110' : ''}`} 
                                    style={{ color: p.accentColor }} 
                                />
                                <span className={`text-sm font-semibold tracking-tight ${isActive ? 'text-white' : 'text-neutral-400'}`}>
                                    {p.title}
                                </span>
                            </a>
                        );
                    })}
                </div>
            </div>

        </MainLayout>
    );
}
