import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Github, Target, CheckCircle2, TrendingUp, Cpu, Filter } from 'lucide-react';
import type { ProjectData } from '../../data/portfolioData';
import { portfolioProjects } from '../../data/portfolioData';
import { useState, useMemo } from 'react';
import FilterDrawer from '../layout/FilterDrawer';

interface ProjectDetailProps {
    project: ProjectData;
}

export default function ProjectDetail({ project }: ProjectDetailProps) {
    const Icon = project.icon;
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Extract unique tags for the drawer
    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        portfolioProjects.forEach(p => p.tags.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, []);

    // Handle filter selection directly to the portfolio grid
    const handleSelectTag = (tag: string | null) => {
        if (tag) {
            window.location.hash = `#portfolio?filter=${encodeURIComponent(tag)}`;
        } else {
            window.location.hash = `#portfolio`;
        }
    };

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

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group"
                        >
                            <Filter size={16} className="group-hover:text-blue-400 transition-colors" />
                            <span className="font-bold text-[10px] uppercase tracking-widest hidden sm:inline-block">Filter Projects</span>
                        </button>
                        <div className="flex items-center gap-3 opacity-80 cursor-default border-l border-neutral-800 pl-6">
                            <img src="/icuni_logo.png" alt="ICUNI Labs Logo" className="w-5 h-5 rounded object-contain hidden sm:block" />
                            <span className="font-bold text-[10px] tracking-[0.2em] uppercase text-neutral-500">ICUNI Labs / Case Study</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-4xl mx-auto">
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
                            <span
                                key={tag}
                                className="px-3 py-1.5 text-xs font-bold bg-neutral-900/40 backdrop-blur-md text-neutral-300 rounded border border-neutral-800 shadow-sm"
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
                            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-100/10 backdrop-blur-md border border-neutral-100/20 text-white font-bold rounded-lg hover:bg-neutral-100/20 transition-all shadow-lg"
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
                        <p className="text-lg text-neutral-300 leading-relaxed font-light pl-9 border-l-2 border-neutral-800/80">
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
                        <p className="text-lg text-neutral-300 leading-relaxed font-light pl-9 border-l-2 border-neutral-800/80">
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
                                <p className="text-lg text-blue-100 leading-relaxed font-medium relative z-10">
                                    "{project.businessImpact}"
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Expert Deep Dive */}
                    <section className="mt-16 pt-8 border-t border-neutral-800/80">
                        <div className="p-8 rounded-2xl bg-neutral-900/30 border border-neutral-800 backdrop-blur-md shadow-2xl relative overflow-hidden group">
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
                            <p className="text-[1.05rem] text-neutral-300 leading-loose relative z-10 font-[350]">
                                {project.expertDeepDive}
                            </p>
                        </div>
                    </section>
                </motion.div>
            </main>

            {/* Reusable Filter Drawer */}
            <FilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                availableTags={availableTags}
                selectedTag={null}
                onSelectTag={handleSelectTag}
            />
        </div>
    );
}
