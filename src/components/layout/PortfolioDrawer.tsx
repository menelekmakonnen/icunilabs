
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderOpen, ArrowRight, ExternalLink } from 'lucide-react';
import { portfolioProjects } from '../../data/portfolioData';

export default function PortfolioDrawer() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Toggle Tab — fixed right edge */}
            <button
                onClick={() => setOpen(true)}
                className="fixed right-0 top-1/2 -translate-y-[calc(100%+4px)] z-40 flex items-center gap-2 bg-neutral-900/90 backdrop-blur-md border border-neutral-800 border-r-0 rounded-l-lg px-3 py-4 text-neutral-400 hover:text-white hover:bg-neutral-800/90 transition-all shadow-lg cursor-pointer group"
                aria-label="Open Portfolio"
            >
                <FolderOpen className="w-5 h-5 group-hover:text-[#00bfff] transition-colors" />
                <span className="text-xs font-bold uppercase tracking-wider [writing-mode:vertical-lr] rotate-180">
                    Portfolio
                </span>
            </button>

            {/* Overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Drawer Panel */}
            <AnimatePresence>
                {open && (
                    <motion.aside
                        className="fixed top-0 right-0 z-50 h-full w-[380px] max-w-[90vw] bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', stiffness: 320, damping: 30 }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-neutral-800 shrink-0">
                            <div>
                                <h2 className="text-lg font-bold text-white">Portfolio</h2>
                                <p className="text-xs text-neutral-500">{portfolioProjects.length} projects</p>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                className="p-2 rounded-lg text-neutral-500 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* View Full Portfolio link */}
                        <a
                            href="#portfolio"
                            onClick={() => setOpen(false)}
                            className="mx-6 mt-4 mb-2 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#00bfff]/10 to-[#0080ff]/10 border border-[#00bfff]/20 rounded-lg text-[#00bfff] text-sm font-semibold hover:bg-[#00bfff]/15 hover:border-[#00bfff]/40 transition-all"
                        >
                            View Full Portfolio
                            <ArrowRight className="w-3.5 h-3.5" />
                        </a>

                        {/* Project List */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin">
                            {portfolioProjects.map((project, index) => (
                                <motion.a
                                    key={project.id}
                                    href={`#project/${project.id}`}
                                    onClick={() => setOpen(false)}
                                    className="group flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-neutral-800 hover:bg-neutral-900/60 transition-all cursor-pointer"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.25, delay: index * 0.03 }}
                                >
                                    {/* Project cover thumbnail */}
                                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-neutral-800 bg-neutral-900">
                                        <img
                                            src={project.imageUrl}
                                            alt={project.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <project.icon className="w-3.5 h-3.5 text-neutral-600 group-hover:text-[#00bfff] transition-colors shrink-0" />
                                            <h3 className="text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors truncate">
                                                {project.title}
                                            </h3>
                                        </div>
                                        <p className="text-xs text-neutral-500 mt-0.5 truncate">{project.subtitle}</p>
                                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                            {project.tags.slice(0, 2).map((tag) => (
                                                <span key={tag} className="px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 bg-neutral-900 rounded border border-neutral-800">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <ExternalLink className="w-3.5 h-3.5 text-neutral-700 group-hover:text-neutral-400 transition-colors shrink-0 mt-1" />
                                </motion.a>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-neutral-800 shrink-0">
                            <p className="text-[11px] text-neutral-600 text-center">
                                Click any project to view the full case study
                            </p>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>
        </>
    );
}
