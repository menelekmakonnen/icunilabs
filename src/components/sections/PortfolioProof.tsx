import { motion } from 'framer-motion';
import { ArrowRight, ExternalLink, Layers, Rocket, Globe2, Cpu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { portfolioProjects, TOTAL_PROJECT_COUNT, PRODUCTION_PROJECT_COUNT, ACTIVE_REVENUE_COUNT } from '../../data/portfolioData';

const stats = [
    { value: `${TOTAL_PROJECT_COUNT}+`, label: 'Projects Built', icon: Layers },
    { value: `${PRODUCTION_PROJECT_COUNT}`, label: 'In Production', icon: Rocket },
    { value: `${ACTIVE_REVENUE_COUNT}`, label: 'Active Revenue', icon: Globe2 },
    { value: '7+', label: 'Platforms', icon: Cpu },
];

export default function PortfolioProof() {
    const [randomProjects, setRandomProjects] = useState<typeof portfolioProjects>([]);

    useEffect(() => {
        // Prioritize flagship projects for the preview
        const flagships = portfolioProjects.filter(p => p.tier === 'flagship');
        const others = portfolioProjects.filter(p => p.tier !== 'flagship');
        const shuffledOthers = [...others].sort(() => 0.5 - Math.random());
        const shuffledFlagships = [...flagships].sort(() => 0.5 - Math.random());
        // Pick 2 flagships + 1 other for variety
        setRandomProjects([...shuffledFlagships.slice(0, 2), ...shuffledOthers.slice(0, 1)]);
    }, []);

    return (
        <section id="portfolio-proof" className="py-24 md:py-32 border-t border-neutral-900 overflow-hidden relative z-10">
            <div className="max-w-6xl mx-auto px-6">

                <div className="mb-12 md:mb-16 max-w-5xl">
                    <motion.h2
                        className="text-4xl md:text-5xl font-black tracking-tight mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Don't Take Our Word for It.{' '}
                        <span className="text-[#00bfff] drop-shadow-[0_0_15px_rgba(0,191,255,0.4)]">See the Work.</span>
                    </motion.h2>
                    <motion.p
                        className="text-neutral-400 text-lg max-w-3xl"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {TOTAL_PROJECT_COUNT}+ projects across Electron desktop apps, VS Code extensions, Chrome extensions, Adobe Premiere Pro plugins, Google Apps Script ERPs, .NET WPF applications, and Python AI pipelines — real systems built for real companies. Browse the portfolio and judge us by what we ship.
                    </motion.p>
                </div>

                {/* Stats Bar */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                >
                    {stats.map((stat, i) => (
                        <div key={i} className="p-5 rounded-xl border border-neutral-800/50 bg-neutral-950/60 backdrop-blur-xl text-center">
                            <stat.icon className="w-5 h-5 text-[#00bfff]/60 mx-auto mb-2" />
                            <p className="text-2xl md:text-3xl font-black text-white tracking-tight">{stat.value}</p>
                            <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.15em] mt-1">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>

                <motion.div
                    className="p-8 md:p-12 rounded-xl border border-neutral-800/60 bg-neutral-950/60 backdrop-blur-xl relative overflow-hidden mb-12"
                    style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.02)' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="absolute -inset-[100%] z-0 rounded-xl opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_0%,rgba(0,191,255,0.08),transparent_50%)]" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 md:gap-10">
                        <div className="flex-1">
                            <p className="text-neutral-300 text-lg md:text-xl leading-relaxed">
                                From construction inventory ERPs and embassy operations centers to AI video generation suites and Premiere Pro editing engines — every project in the portfolio was designed to solve a real problem, not pad a slide deck.
                            </p>
                        </div>

                        <a
                            href="#portfolio"
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#00bfff] to-[#0080ff] shadow-[0_0_20px_rgba(0,191,255,0.3)] text-white font-bold rounded hover:shadow-[0_0_30px_rgba(0,191,255,0.5)] transition-all shrink-0"
                        >
                            Explore the Portfolio
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </motion.div>

                {/* Random Displayed Projects */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {randomProjects.map((project, index) => {
                        const Icon = project.icon;
                        return (
                            <motion.a
                                href={`#project/${project.id}`}
                                key={project.id}
                                className="group relative overflow-hidden rounded-xl border border-neutral-800/60 bg-neutral-900 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl h-[320px] flex flex-col"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                            >
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105" style={{ backgroundImage: `url('${project.imageUrl}')` }} />
                                <div className="absolute inset-0 bg-neutral-950/80 group-hover:bg-neutral-950/60 transition-colors duration-500" />
                                <div className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-10 group-hover:opacity-30 transition-opacity duration-500`} />
                                
                                <div className="relative z-10 p-6 h-full flex flex-col pointer-events-none">
                                    <div className="mb-4 flex justify-between items-start">
                                        <div className="p-2.5 bg-neutral-950/70 rounded-lg border border-neutral-800/80 text-white backdrop-blur-md">
                                            <Icon size={20} strokeWidth={1.5} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {project.status && (
                                                <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 uppercase tracking-wider">
                                                    {project.tier === 'flagship' ? '★ Flagship' : project.status}
                                                </span>
                                            )}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <ExternalLink size={18} className="text-white drop-shadow-md" />
                                            </div>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1 drop-shadow-md">{project.title}</h3>
                                    <p className="text-xs font-bold text-neutral-400 mb-3 tracking-[0.15em] uppercase drop-shadow-sm">{project.subtitle}</p>
                                    <p className="text-neutral-300 text-sm leading-relaxed mb-4 flex-grow font-medium line-clamp-2">{project.description}</p>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {project.tags.slice(0, 2).map((tag: string) => (
                                            <span key={tag} className="px-2 py-1 text-[10px] font-bold bg-neutral-950/60 text-neutral-200 rounded border border-neutral-700/50 backdrop-blur-md">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </motion.a>
                        );
                    })}
                </div>

                {/* Proof framing cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { label: "Built across", text: "Electron, Chrome Extensions, Adobe Premiere, VS Code, .NET WPF, Python, and Google Apps Script." },
                        { label: "Built to deliver", text: "embassy operations centers, construction ERPs, and streaming platform backends." },
                        { label: "Built to ship", text: "with NSIS installers, VS Code Marketplace releases, and clasp deployments." },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            className="p-5 rounded-lg border border-neutral-800/40 bg-neutral-950/40"
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                        >
                            <span className="text-[#00bfff] font-bold text-sm">{item.label} </span>
                            <span className="text-neutral-500 text-sm leading-relaxed">{item.text}</span>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}
