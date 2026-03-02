import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Monitor, Database, Film, Users, Server } from 'lucide-react';
import { useState } from 'react';

const projects = [
    {
        id: 'mmmedia-pro',
        title: 'MMM Media Manager Pro',
        subtitle: 'Professional Media Management',
        description: 'A robust desktop application built for professional media organization. Features advanced file indexing, offline metadata management, and a high-performance UI handling thousands of media files seamlessly.',
        tags: ['React', 'Electron', 'Vite', 'Tailwind CSS'],
        icon: Film,
        color: 'from-blue-500/20 to-purple-500/20',
        border: 'group-hover:border-blue-500/50',
    },
    {
        id: 'darkroom',
        title: 'MMMedia Darkroom',
        subtitle: 'Desktop Media Processing',
        description: 'Specialized video transcoding and processing pipeline utility. Leverages local FFMPEG implementations to provide lightning-fast, secure offline media conversions and proxies.',
        tags: ['React', 'Electron', 'FFMPEG', 'TypeScript'],
        icon: Monitor,
        color: 'from-neutral-700/30 to-neutral-900/50',
        border: 'group-hover:border-neutral-500/50',
    },
    {
        id: 'reconcile-pro',
        title: 'Reconcile Pro',
        subtitle: 'Payroll Data Reconciliation',
        description: 'A specialized enterprise system capable of parsing, diffing, and merging complex payroll datasets. Employs advanced fuzzy matching algorithms to output truth-merged payroll files in minutes.',
        tags: ['React', 'Electron', 'Fuse.js', 'SheetJS'],
        icon: Database,
        color: 'from-emerald-500/20 to-teal-500/20',
        border: 'group-hover:border-emerald-500/50',
    },
    {
        id: 'connect',
        title: 'ICUNI Connect',
        subtitle: 'Talent Directory & Project Management',
        description: 'A comprehensive platform for managing internal and external talent. Features real-time project tracking, skill matrices, and seamless directory integration.',
        tags: ['React', 'Vite', 'Tailwind', 'Google Apps Script'],
        icon: Users,
        color: 'from-orange-500/20 to-red-500/20',
        border: 'group-hover:border-orange-500/50',
    },
    {
        id: 'a1-director',
        title: 'D2R / AI Director',
        subtitle: 'Scheduling & Planning AI Web App',
        description: 'Advanced web application utilizing modern full-stack patterns to provide intelligent resource scheduling, AI-driven planning scenarios, and timeline visualization.',
        tags: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind'],
        icon: Server,
        color: 'from-indigo-500/20 to-violet-500/20',
        border: 'group-hover:border-indigo-500/50',
    }
];

export default function Portfolio() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-neutral-800 selection:text-white relative overflow-hidden">
            {/* Subtle animated background gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[150px] rounded-full" />
            </div>

            {/* Navigation */}
            <header className="fixed top-0 w-full z-50 border-b border-neutral-900/50 bg-neutral-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium text-sm tracking-tight">Back to Home</span>
                    </a>

                    <div className="flex items-center gap-3 opacity-80 cursor-default">
                        <img src="/icuni_logo.png" alt="ICUNI Labs Logo" className="w-6 h-6 rounded object-contain" />
                        <span className="font-bold text-sm tracking-widest uppercase text-neutral-500">ICUNI Labs / Portfolio</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-3xl mb-16"
                >
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                        Built for Impact.
                    </h1>
                    <p className="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-2xl font-light">
                        A showcase of our high-performance desktop applications, enterprise web platforms, and specialized tools. Handcrafted by ICUNI Labs.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map((project, index) => {
                        const Icon = project.icon;
                        const isHovered = hoveredId === project.id;

                        // To silence exhaustive-deps or unused warning for isHovered in real lint if needed, we apply it dynamically or use it in the DOM

                        return (
                            <motion.div
                                key={project.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                onHoverStart={() => setHoveredId(project.id)}
                                onHoverEnd={() => setHoveredId(null)}
                                className={`
                                    relative group overflow-hidden rounded-2xl border border-neutral-800/60
                                    bg-neutral-900/20 backdrop-blur-sm transition-all duration-500
                                    hover:bg-neutral-900/40 hover:-translate-y-1 ${project.border}
                                `}
                            >
                                {/* Hover background gradient */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${project.color} ${isHovered ? 'opacity-100' : 'opacity-0'} group-hover:opacity-100 transition-opacity duration-500`} />

                                <div className="relative z-10 p-8 h-full flex flex-col pointer-events-none">
                                    <div className="mb-6 flex justify-between items-start">
                                        <div className="p-3 bg-neutral-800/50 rounded-xl border border-neutral-700/50 text-neutral-300 group-hover:text-white group-hover:scale-110 transition-all duration-300">
                                            <Icon size={24} strokeWidth={1.5} />
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                                            <ExternalLink size={20} className="text-neutral-400" />
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-neutral-100 mb-1 group-hover:text-white transition-colors">
                                        {project.title}
                                    </h3>
                                    <p className="text-sm font-medium text-neutral-500 mb-4 tracking-wide uppercase">
                                        {project.subtitle}
                                    </p>

                                    <p className="text-neutral-400 text-sm leading-relaxed mb-8 flex-grow">
                                        {project.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {project.tags.map(tag => (
                                            <span
                                                key={tag}
                                                className="px-2.5 py-1 text-xs font-medium bg-neutral-800/50 text-neutral-300 rounded-md border border-neutral-700/30 group-hover:border-neutral-600/50 transition-colors"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
}
