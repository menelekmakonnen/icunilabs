import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ExternalLink, Github, Target, CheckCircle2, TrendingUp, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ProjectData } from '../../data/portfolioData';
import { portfolioProjects } from '../../data/portfolioData';
import ScrollNavigation from '../layout/ScrollNavigation';

interface ProjectDetailProps {
    project: ProjectData;
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
    const Icon = project.icon;

    const currentIndex = portfolioProjects.findIndex(p => p.id === project.id);
    const prevProject = currentIndex > 0 ? portfolioProjects[currentIndex - 1] : null;
    const nextProject = currentIndex < portfolioProjects.length - 1 ? portfolioProjects[currentIndex + 1] : null;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-neutral-800 selection:text-white relative overflow-hidden">
            {/* Background elements with Hero Image */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.15] scale-105"
                    style={{ backgroundImage: `url('${project.imageUrl}')` }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/90 via-neutral-950/95 to-neutral-950" />
                <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br ${project.color} blur-[120px] rounded-full opacity-40`} />
                <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl ${project.color} blur-[150px] rounded-full opacity-20`} />
            </div>

            {/* Navigation Bar */}
            <header className="fixed top-0 w-full z-40 border-b border-neutral-900/50 bg-neutral-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="#portfolio" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium text-sm tracking-tight">Back to Portfolio</span>
                    </a>

                    <div className="flex items-center gap-4">
                        {/* Prev/Next in header */}
                        <div className="flex items-center gap-1">
                            {prevProject ? (
                                <a href={`#project/${prevProject.id}`} className="p-2 text-neutral-500 hover:text-white transition-colors" title={prevProject.title}>
                                    <ChevronLeft size={18} />
                                </a>
                            ) : (
                                <span className="p-2 text-neutral-800"><ChevronLeft size={18} /></span>
                            )}
                            <span className="text-xs text-neutral-600 font-medium">{currentIndex + 1} / {portfolioProjects.length}</span>
                            {nextProject ? (
                                <a href={`#project/${nextProject.id}`} className="p-2 text-neutral-500 hover:text-white transition-colors" title={nextProject.title}>
                                    <ChevronRight size={18} />
                                </a>
                            ) : (
                                <span className="p-2 text-neutral-800"><ChevronRight size={18} /></span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 opacity-80 cursor-default border-l border-neutral-800 pl-4">
                            <img src="/icuni_logo.png" alt="ICUNI Labs Logo" className="w-5 h-5 rounded object-contain hidden sm:block" />
                            <span className="font-bold text-[10px] tracking-[0.2em] uppercase text-neutral-500">Case Study</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 pt-32 pb-12 px-6 max-w-4xl mx-auto">
                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 border-b border-neutral-800/80 pb-12"
                >
                    <div className="flex items-center gap-5 mb-6">
                        <div className={`p-4 bg-neutral-900 border border-neutral-800 text-white shadow-xl rounded-[20px]`}>
                            <Icon size={36} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-neutral-400 tracking-[0.25em] uppercase mb-1 drop-shadow-sm">
                                {project.subtitle}
                            </p>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-md">
                                {project.title}
                            </h1>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {project.tags.map(tag => (
                            <a
                                key={tag}
                                href={`#portfolio?filter=${encodeURIComponent(tag)}`}
                                className="px-3 py-1.5 text-xs font-bold bg-neutral-900/40 backdrop-blur-md text-neutral-300 rounded border border-neutral-800 shadow-sm hover:border-neutral-600 hover:text-white transition-colors"
                            >
                                {tag}
                            </a>
                        ))}
                    </div>

                    {/* Links */}
                    {project.githubUrl && (
                        <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100/10 backdrop-blur-md border border-neutral-100/20 text-white font-bold rounded-lg hover:bg-neutral-100/20 transition-all shadow-lg"
                        >
                            <Github size={18} />
                            <span>View Source Code</span>
                            <ExternalLink size={16} className="ml-1 opacity-70" />
                        </a>
                    )}
                </motion.div>

                {/* Explicit Cover Image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mb-16 rounded-2xl overflow-hidden border border-neutral-800 shadow-[0_0_40px_rgba(0,0,0,0.5)] relative"
                >
                    <div className="aspect-video w-full relative bg-neutral-900">
                        <img
                            src={project.imageUrl}
                            alt={`${project.title} Cover Interface`}
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-transparent opacity-80" />
                    </div>
                </motion.div>

                {/* Content Sections */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="space-y-12"
                >
                    {/* The Business Problem */}
                    <section className="group">
                        <div className="flex items-center gap-3 mb-4">
                            <Target className="text-red-400 group-hover:scale-110 transition-transform" size={24} />
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100">
                                The Challenge
                            </h2>
                        </div>
                        <p className="text-lg text-neutral-300 leading-relaxed font-light pl-9 border-l-2 border-neutral-800/80 whitespace-pre-line">
                            {project.clientProblem}
                        </p>
                    </section>

                    {/* The Solution */}
                    <section className="group">
                        <div className="flex items-center gap-3 mb-4">
                            <CheckCircle2 className="text-emerald-400 group-hover:scale-110 transition-transform" size={24} />
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100">
                                The Solution
                            </h2>
                        </div>
                        <p className="text-lg text-neutral-300 leading-relaxed font-light pl-9 border-l-2 border-neutral-800/80 whitespace-pre-line">
                            {project.solution}
                        </p>
                    </section>

                    {/* The Business Impact */}
                    <section className="group">
                        <div className="flex items-center gap-3 mb-4">
                            <TrendingUp className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
                            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100">
                                Business Impact
                            </h2>
                        </div>
                        <div className="pl-9">
                            <div className="p-6 rounded-xl bg-blue-900/10 border border-blue-900/30 backdrop-blur-md shadow-2xl relative overflow-hidden group-hover:border-blue-900/50 transition-colors">
                                <p className="text-lg text-blue-100 leading-relaxed font-medium relative z-10 whitespace-pre-line">
                                    "{project.businessImpact}"
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Expert Deep Dive */}
                    <section className="mt-16 pt-8 border-t border-neutral-800/80">
                        <div className="p-8 rounded-2xl bg-neutral-900/30 border border-neutral-800 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity duration-1000">
                                <Cpu size={200} strokeWidth={0.5} />
                            </div>

                            <div className="flex items-center gap-4 mb-6 relative z-10">
                                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-100">
                                    Engineering Architecture
                                </h2>
                                <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-[10px] font-bold uppercase tracking-widest border border-purple-500/20">
                                    Deep Dive
                                </span>
                            </div>
                            <p className="text-[1.05rem] text-neutral-300 leading-loose relative z-10 font-[350]">
                                {project.expertDeepDive}
                            </p>
                        </div>
                    </section>
                </motion.div>

                {/* ====== PREV / NEXT NAVIGATION ====== */}
                <div className="mt-20 border-t border-neutral-800/80 pt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {prevProject ? (
                        <a
                            href={`#project/${prevProject.id}`}
                            className="group flex items-center gap-4 p-6 rounded-xl border border-neutral-800/60 bg-neutral-900/30 hover:bg-neutral-900/60 hover:border-neutral-700 transition-all"
                        >
                            <ChevronLeft size={20} className="text-neutral-500 group-hover:text-white group-hover:-translate-x-1 transition-all shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-neutral-600 font-bold uppercase tracking-widest mb-1">Previous</p>
                                <p className="text-sm font-bold text-neutral-300 group-hover:text-white transition-colors truncate">{prevProject.title}</p>
                            </div>
                        </a>
                    ) : <div />}
                    {nextProject ? (
                        <a
                            href={`#project/${nextProject.id}`}
                            className="group flex items-center justify-end gap-4 p-6 rounded-xl border border-neutral-800/60 bg-neutral-900/30 hover:bg-neutral-900/60 hover:border-neutral-700 transition-all text-right"
                        >
                            <div className="min-w-0">
                                <p className="text-xs text-neutral-600 font-bold uppercase tracking-widest mb-1">Next</p>
                                <p className="text-sm font-bold text-neutral-300 group-hover:text-white transition-colors truncate">{nextProject.title}</p>
                            </div>
                            <ChevronRight size={20} className="text-neutral-500 group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                        </a>
                    ) : <div />}
                </div>

                {/* ====== BOTTOM CTA ====== */}
                <div className="mt-20 text-center">
                    <div className="p-10 rounded-2xl border border-neutral-800/60 bg-neutral-900/20 backdrop-blur-md">
                        <h3 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4">
                            Like what you see? Let's build yours.
                        </h3>
                        <p className="text-neutral-500 mb-8 max-w-lg mx-auto leading-relaxed">
                            Every project here started with a conversation about one bottleneck. Tell us what's slowing you down.
                        </p>
                        <a
                            href="/#contact"
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#00bfff] to-[#0080ff] shadow-[0_0_20px_rgba(0,191,255,0.25)] text-white font-bold rounded hover:shadow-[0_0_30px_rgba(0,191,255,0.4)] transition-all"
                        >
                            Let's Fix the Chaos
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </div>
            </main>

            <ScrollNavigation />
        </div>
    );
}
