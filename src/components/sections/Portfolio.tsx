import { motion } from 'framer-motion';
import { ArrowLeft, ExternalLink, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { portfolioProjects } from '../../data/portfolioData';
import FilterDrawer from '../layout/FilterDrawer';

export default function Portfolio() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedTag, setSelectedTag] = useState<string | null>(() => {
        try {
            const hash = window.location.hash;
            if (hash.includes('?filter=')) {
                const filter = new URLSearchParams(hash.split('?')[1]).get('filter');
                return filter ? decodeURIComponent(filter) : null;
            }
        } catch {
            // ignore parsing errors
        }
        return null;
    });

    // Extract unique tags
    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        portfolioProjects.forEach(p => p.tags.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, []);

    // Filter projects
    const filteredProjects = useMemo(() => {
        if (!selectedTag) return portfolioProjects;
        return portfolioProjects.filter(p => p.tags.includes(selectedTag));
    }, [selectedTag]);

    const handleSelectTag = (tag: string | null) => {
        setSelectedTag(tag);
        if (tag) {
            window.location.hash = `#portfolio?filter=${encodeURIComponent(tag)}`;
        } else {
            window.location.hash = `#portfolio`;
        }
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-neutral-800 selection:text-white relative overflow-hidden">
            {/* Subtle animated background gradients */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[150px] rounded-full" />
            </div>

            {/* Navigation */}
            <header className="fixed top-0 w-full z-40 border-b border-neutral-900/50 bg-neutral-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium text-sm tracking-tight">Back to Home</span>
                    </a>

                    <div className="flex items-center gap-3 opacity-80 cursor-default">
                        <img src="/icuni_logo.png" alt="ICUNI Labs Logo" className="w-6 h-6 rounded object-contain" />
                        <span className="font-bold text-sm tracking-widest uppercase text-neutral-500 hidden md:inline-block">ICUNI Labs / Portfolio</span>
                    </div>
                </div>
            </header>

            <main className="relative z-10 pt-32 pb-24 px-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl"
                    >
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Built for Impact.
                        </h1>
                        <p className="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-2xl font-light">
                            A showcase of our high-performance desktop applications, enterprise web platforms, and specialized tools. Handcrafted by ICUNI Labs.
                        </p>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        onClick={() => setIsFilterOpen(true)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${selectedTag ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'
                            }`}
                    >
                        <Filter size={18} />
                        {selectedTag ? `Filtered: ${selectedTag}` : 'Filter Projects'}
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredProjects.map((project, index) => {
                        const Icon = project.icon;
                        const isHovered = hoveredId === project.id;

                        return (
                            <a
                                href={`#project/${project.id}`}
                                key={project.id}
                                className="block h-full"
                            >
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    onHoverStart={() => setHoveredId(project.id)}
                                    onHoverEnd={() => setHoveredId(null)}
                                    className={`
                                        h-[420px] relative group overflow-hidden rounded-2xl border border-neutral-800/60
                                        bg-neutral-900 transition-all duration-500 transform
                                        hover:-translate-y-1 hover:shadow-2xl ${project.border}
                                    `}
                                >
                                    {/* Background Image Layer */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                                        style={{ backgroundImage: `url('${project.imageUrl}')` }}
                                    />

                                    {/* Heavy Dark Overlay */}
                                    <div className="absolute inset-0 bg-neutral-950/80 group-hover:bg-neutral-950/70 transition-colors duration-500" />

                                    {/* Subtle Tint Overlay */}
                                    <div className={`absolute inset-0 bg-gradient-to-br ${project.color} ${isHovered ? 'opacity-30' : 'opacity-10'} transition-opacity duration-500`} />

                                    <div className="relative z-10 p-8 h-full flex flex-col pointer-events-none">
                                        <div className="mb-6 flex justify-between items-start">
                                            <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800/80 text-white backdrop-blur-md shadow-lg group-hover:scale-110 transition-all duration-300">
                                                <Icon size={24} strokeWidth={1.5} />
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                <ExternalLink size={20} className="text-white drop-shadow-md" />
                                            </div>
                                        </div>

                                        <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
                                            {project.title}
                                        </h3>
                                        <p className="text-xs font-bold text-neutral-400 mb-4 tracking-[0.15em] uppercase drop-shadow-sm">
                                            {project.subtitle}
                                        </p>

                                        <p className="text-neutral-300 text-sm leading-relaxed mb-6 flex-grow font-medium line-clamp-3">
                                            {project.description}
                                        </p>

                                        <div className="flex flex-wrap gap-2 mt-auto">
                                            {project.tags.slice(0, 3).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="px-2.5 py-1 text-xs font-bold bg-neutral-950/60 text-neutral-200 rounded border border-neutral-700/50 backdrop-blur-md shadow-sm"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                            {project.tags.length > 3 && (
                                                <span className="px-2.5 py-1 text-xs font-bold bg-neutral-950/60 text-neutral-400 rounded border border-neutral-800/50 backdrop-blur-md">
                                                    +{project.tags.length - 3}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            </a>
                        );
                    })}
                </div>
            </main>

            {/* Filter Drawer Component */}
            <FilterDrawer
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                availableTags={availableTags}
                selectedTag={selectedTag}
                onSelectTag={handleSelectTag}
            />
        </div>
    );
}
