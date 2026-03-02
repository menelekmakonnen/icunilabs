import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Github, Target, CheckCircle2, TrendingUp, Cpu } from 'lucide-react';
import type { ProjectData } from '../../data/portfolioData';

interface ProjectDetailProps {
    project: ProjectData;
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
    const Icon = project.icon;

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-neutral-800 selection:text-white relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className={`absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br ${project.color} blur-[120px] rounded-full opacity-60`} />
                <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl ${project.color} blur-[150px] rounded-full opacity-40`} />
            </div>

            {/* Navigation Bar */}
            <header className="fixed top-0 w-full z-50 border-b border-neutral-900/50 bg-neutral-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="#portfolio" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium text-sm tracking-tight">Back to Portfolio</span>
                    </a>

                    <div className="flex items-center gap-3 opacity-80 cursor-default">
                        <img src="/icuni_logo.png" alt="ICUNI Labs Logo" className="w-6 h-6 rounded object-contain" />
                        <span className="font-bold text-sm tracking-widest uppercase text-neutral-500">ICUNI Labs / Case Study</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-4xl mx-auto">
                {/* Hero Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="mb-16 border-b border-neutral-800/50 pb-12"
                >
                    <div className="flex items-center gap-5 mb-6">
                        <div className={`p-4 bg-neutral-900/80 rounded-2xl border border-neutral-800 backdrop-blur-md text-white shadow-xl`}>
                            <Icon size={36} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-neutral-500 tracking-[0.2em] uppercase mb-1">
                                {project.subtitle}
                            </p>
                            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                                {project.title}
                            </h1>
                        </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-8">
                        {project.tags.map(tag => (
                            <span
                                key={tag}
                                className="px-3 py-1.5 text-xs font-semibold bg-neutral-900/80 text-neutral-300 rounded-md border border-neutral-800 shadow-sm"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Links */}
                    {project.githubUrl && (
                        <a
                            href={project.githubUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-50 text-neutral-950 font-bold rounded-lg hover:bg-neutral-200 transition-colors shadow-lg hover:shadow-xl"
                        >
                            <Github size={18} />
                            <span>View Source Code</span>
                            <ExternalLink size={16} className="ml-1 opacity-70" />
                        </a>
                    )}
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
                        <p className="text-lg text-neutral-400 leading-relaxed font-light pl-9 border-l-2 border-neutral-800/30">
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
                        <p className="text-lg text-neutral-400 leading-relaxed font-light pl-9 border-l-2 border-neutral-800/30">
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
                            <div className="p-6 rounded-xl bg-blue-900/10 border border-blue-900/40 backdrop-blur-sm">
                                <p className="text-lg text-blue-100 leading-relaxed font-medium">
                                    "{project.businessImpact}"
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Expert Deep Dive */}
                    <section className="mt-16 pt-8 border-t border-neutral-800/50">
                        <div className="p-8 rounded-2xl bg-neutral-900/40 border border-neutral-800 backdrop-blur-md shadow-2xl relative overflow-hidden group">
                            {/* Decorative CPU grid background */}
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
                            <p className="text-[1.05rem] text-neutral-300 leading-loose relative z-10 font-light">
                                {project.expertDeepDive}
                            </p>
                        </div>
                    </section>
                </motion.div>
            </main>
        </div>
    );
}
