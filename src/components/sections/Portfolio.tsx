
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, Filter, ChevronLeft, ChevronRight, ArrowRight, Search, X } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import { portfolioProjects } from '../../data/portfolioData';
import FilterDrawer from '../layout/FilterDrawer';
import ScrollNavigation from '../layout/ScrollNavigation';

export default function Portfolio() {
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [heroIndex, setHeroIndex] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTag, setSelectedTag] = useState<string | null>(() => {
        try {
            const hash = window.location.hash;
            if (hash.includes('?filter=')) {
                const filter = new URLSearchParams(hash.split('?')[1]).get('filter');
                return filter ? decodeURIComponent(filter) : null;
            }
        } catch {
            // ignore
        }
        return null;
    });

    const gridRef = useRef<HTMLDivElement>(null);

    const availableTags = useMemo(() => {
        const tags = new Set<string>();
        portfolioProjects.forEach(p => p.tags.forEach(t => tags.add(t)));
        return Array.from(tags).sort();
    }, []);

    const filteredProjects = useMemo(() => {
        let projects = portfolioProjects;
        if (selectedTag) {
            projects = projects.filter(p => p.tags.includes(selectedTag));
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            projects = projects.filter(p =>
                p.title.toLowerCase().includes(q) ||
                p.subtitle.toLowerCase().includes(q) ||
                p.description.toLowerCase().includes(q) ||
                p.tags.some(t => t.toLowerCase().includes(q))
            );
        }
        return projects;
    }, [selectedTag, searchQuery]);

    const handleSelectTag = (tag: string | null) => {
        setSelectedTag(tag);
        window.location.hash = tag ? `#portfolio?filter=${encodeURIComponent(tag)}` : `#portfolio`;
    };

    // Featured projects for the carousel (first 5)
    const featured = portfolioProjects.slice(0, 5);

    // Auto-advance carousel
    useEffect(() => {
        const timer = setInterval(() => {
            setHeroIndex(prev => (prev + 1) % featured.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [featured.length]);

    const goHero = (dir: number) => {
        setHeroIndex(prev => (prev + dir + featured.length) % featured.length);
    };

    const currentFeatured = featured[heroIndex];
    const FeaturedIcon = currentFeatured.icon;

    const scrollToGrid = () => {
        gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-neutral-800 selection:text-white relative overflow-hidden">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 blur-[150px] rounded-full" />
            </div>

            {/* ====== BRANDED HEADER ====== */}
            <header className="fixed top-0 w-full z-40 border-b border-neutral-900/50 bg-neutral-950/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-3 text-neutral-400 hover:text-white transition-colors group">
                        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                        <img src="/icuni_logo.png" alt="ICUNI Labs" className="w-6 h-6 rounded object-contain" />
                        <span className="font-bold text-sm tracking-tight hidden sm:inline-block">ICUNI Labs</span>
                    </a>

                    <div className="flex items-center gap-3">
                        {/* Search */}
                        <div className="relative hidden md:block">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search projects..."
                                className="pl-9 pr-8 py-2 text-xs bg-neutral-900/60 border border-neutral-800 rounded-full text-white placeholder:text-neutral-600 focus:outline-none focus:border-[#00bfff]/50 focus:ring-1 focus:ring-[#00bfff]/20 w-48 focus:w-64 transition-all duration-300"
                            />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white cursor-pointer">
                                    <X size={12} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-xs transition-all cursor-pointer ${selectedTag ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white border border-neutral-700'}`}
                        >
                            <Filter size={14} />
                            {selectedTag ? `${selectedTag}` : 'Filter'}
                        </button>

                        <span className="font-bold text-[10px] tracking-[0.2em] uppercase text-neutral-500 hidden md:inline-block border-l border-neutral-800 pl-3">
                            Portfolio
                        </span>
                    </div>
                </div>
            </header>

            <main className="relative z-10">

                {/* ====== SLIDING HERO CAROUSEL ====== */}
                <section className="pt-20 relative overflow-hidden">
                    <div className="relative h-[420px] md:h-[500px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentFeatured.id}
                                className="absolute inset-0"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {/* Background image */}
                                <div
                                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[6s] ease-out scale-105"
                                    style={{ backgroundImage: `url('${currentFeatured.imageUrl}')` }}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-neutral-950 via-neutral-950/85 to-neutral-950/40" />
                                <div className={`absolute inset-0 bg-gradient-to-br ${currentFeatured.color} opacity-20`} />

                                {/* Content */}
                                <div className="relative z-10 h-full max-w-7xl mx-auto px-6 flex items-center">
                                    <motion.div
                                        className="max-w-xl"
                                        initial={{ opacity: 0, x: -30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.5, delay: 0.15 }}
                                    >
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 bg-neutral-950/60 rounded-lg border border-neutral-800/60 backdrop-blur-md">
                                                <FeaturedIcon size={20} strokeWidth={1.5} className="text-white" />
                                            </div>
                                            <span className="text-xs font-bold uppercase tracking-[0.15em] text-neutral-400">{currentFeatured.subtitle}</span>
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-3">{currentFeatured.title}</h2>
                                        <p className="text-neutral-300 text-sm md:text-base leading-relaxed mb-4 line-clamp-2">{currentFeatured.description}</p>

                                        {/* Impact preview */}
                                        <p className="text-neutral-500 text-xs leading-relaxed mb-6 line-clamp-2 italic">
                                            "{currentFeatured.businessImpact}"
                                        </p>

                                        <div className="flex gap-3 items-center">
                                            <a
                                                href={`#project/${currentFeatured.id}`}
                                                className="group inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#00bfff] to-[#0080ff] shadow-[0_0_20px_rgba(0,191,255,0.25)] text-white font-bold rounded hover:shadow-[0_0_30px_rgba(0,191,255,0.4)] transition-all text-sm"
                                            >
                                                Read Case Study
                                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </a>
                                            <button
                                                onClick={scrollToGrid}
                                                className="text-neutral-500 hover:text-white text-xs font-medium transition-colors cursor-pointer underline underline-offset-2"
                                            >
                                                Browse All
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {/* Carousel controls */}
                        <div className="absolute bottom-6 right-6 z-20 flex items-center gap-3">
                            <button onClick={() => goHero(-1)} className="p-2 bg-neutral-950/60 border border-neutral-800 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors backdrop-blur-md cursor-pointer">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <div className="flex gap-1.5">
                                {featured.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setHeroIndex(i)}
                                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === heroIndex ? 'w-6 bg-[#00bfff] shadow-[0_0_8px_rgba(0,191,255,0.5)]' : 'w-1.5 bg-neutral-700 hover:bg-neutral-500'}`}
                                    />
                                ))}
                            </div>
                            <button onClick={() => goHero(1)} className="p-2 bg-neutral-950/60 border border-neutral-800 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors backdrop-blur-md cursor-pointer">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </section>

                {/* ====== STICKY TAG FILTER STRIP ====== */}
                <div className="border-t border-b border-neutral-800/60 bg-neutral-950/90 backdrop-blur-md sticky top-16 z-30">
                    <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3 overflow-x-auto scrollbar-none">
                        <button
                            onClick={() => handleSelectTag(null)}
                            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${!selectedTag ? 'bg-[#00bfff] text-white shadow-[0_0_10px_rgba(0,191,255,0.3)]' : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-800'}`}
                        >
                            All ({portfolioProjects.length})
                        </button>
                        {availableTags.map(tag => {
                            const count = portfolioProjects.filter(p => p.tags.includes(tag)).length;
                            return (
                                <button
                                    key={tag}
                                    onClick={() => handleSelectTag(tag)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer ${selectedTag === tag ? 'bg-white text-neutral-950 shadow-lg' : 'bg-neutral-800/50 text-neutral-400 hover:bg-neutral-700 hover:text-white border border-neutral-800'}`}
                                >
                                    {tag} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ====== GRID HEADER ====== */}
                <div ref={gridRef} className="max-w-7xl mx-auto px-6 pt-12 pb-8 scroll-mt-32">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                                The Work
                            </h1>
                            <p className="text-neutral-500 text-sm">
                                {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}{selectedTag ? ` in "${selectedTag}"` : ''}{searchQuery ? ` matching "${searchQuery}"` : ''} — click any card to read the full case study
                            </p>
                        </div>
                        {(selectedTag || searchQuery) && (
                            <button
                                onClick={() => { handleSelectTag(null); setSearchQuery(''); }}
                                className="text-xs text-neutral-400 hover:text-white transition-colors underline underline-offset-2 cursor-pointer"
                            >
                                Clear all filters
                            </button>
                        )}
                    </div>
                </div>

                {/* ====== PROJECT GRID ====== */}
                <div className="max-w-7xl mx-auto px-6 pb-12">
                    {filteredProjects.length === 0 ? (
                        <div className="text-center py-20">
                            <p className="text-neutral-500 text-lg mb-4">No projects match your criteria.</p>
                            <button onClick={() => { handleSelectTag(null); setSearchQuery(''); }} className="text-[#00bfff] hover:underline text-sm font-medium cursor-pointer">
                                Clear filters
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.map((project, index) => {
                                const Icon = project.icon;
                                const isHovered = hoveredId === project.id;

                                return (
                                    <a
                                        href={`#project/${project.id}`}
                                        key={project.id}
                                        id={`card-${project.id}`}
                                        className="block h-full scroll-mt-32"
                                    >
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: index * 0.04 }}
                                            onHoverStart={() => setHoveredId(project.id)}
                                            onHoverEnd={() => setHoveredId(null)}
                                            className={`
                                                h-[440px] relative group overflow-hidden rounded-2xl border border-neutral-800/60
                                                bg-neutral-900 transition-all duration-500 transform
                                                hover:-translate-y-1 hover:shadow-2xl ${project.border}
                                            `}
                                        >
                                            {/* Background Image */}
                                            <div
                                                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                                                style={{ backgroundImage: `url('${project.imageUrl}')` }}
                                            />
                                            <div className="absolute inset-0 bg-neutral-950/80 group-hover:bg-neutral-950/70 transition-colors duration-500" />
                                            <div className={`absolute inset-0 bg-gradient-to-br ${project.color} ${isHovered ? 'opacity-30' : 'opacity-10'} transition-opacity duration-500`} />

                                            <div className="relative z-10 p-8 h-full flex flex-col pointer-events-none">
                                                <div className="mb-4 flex justify-between items-start">
                                                    <div className="p-3 bg-neutral-950/70 rounded-xl border border-neutral-800/80 text-white backdrop-blur-md shadow-lg group-hover:scale-110 transition-all duration-300">
                                                        <Icon size={24} strokeWidth={1.5} />
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                                                        <ExternalLink size={20} className="text-white drop-shadow-md" />
                                                    </div>
                                                </div>

                                                <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-md">{project.title}</h3>
                                                <p className="text-xs font-bold text-neutral-400 mb-3 tracking-[0.15em] uppercase drop-shadow-sm">{project.subtitle}</p>
                                                <p className="text-neutral-300 text-sm leading-relaxed mb-4 flex-grow font-medium line-clamp-3">{project.description}</p>

                                                {/* Hover impact statement */}
                                                <div className={`overflow-hidden transition-all duration-500 ${isHovered ? 'max-h-20 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                                                    <p className="text-xs text-neutral-500 italic leading-relaxed line-clamp-2">
                                                        Impact: "{project.businessImpact}"
                                                    </p>
                                                </div>

                                                <div className="flex items-center justify-between mt-auto">
                                                    <div className="flex flex-wrap gap-2">
                                                        {project.tags.slice(0, 2).map(tag => (
                                                            <span key={tag} className="px-2.5 py-1 text-xs font-bold bg-neutral-950/60 text-neutral-200 rounded border border-neutral-700/50 backdrop-blur-md shadow-sm">{tag}</span>
                                                        ))}
                                                        {project.tags.length > 2 && (
                                                            <span className="px-2.5 py-1 text-xs font-bold bg-neutral-950/60 text-neutral-400 rounded border border-neutral-800/50 backdrop-blur-md">+{project.tags.length - 2}</span>
                                                        )}
                                                    </div>
                                                    <span className={`text-xs font-bold text-[#00bfff] transition-all duration-300 ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
                                                        Read More →
                                                    </span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </a>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ====== FOOTER CTA ====== */}
                <section className="border-t border-neutral-800/60 py-20">
                    <div className="max-w-2xl mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-4">
                            Like what you see?
                        </h2>
                        <p className="text-neutral-500 mb-8 text-lg leading-relaxed">
                            Every project here started with a conversation about one bottleneck. Let's start yours.
                        </p>
                        <a
                            href="/#contact"
                            className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#00bfff] to-[#0080ff] shadow-[0_0_20px_rgba(0,191,255,0.25)] text-white font-bold rounded hover:shadow-[0_0_30px_rgba(0,191,255,0.4)] transition-all"
                        >
                            Let's Fix the Chaos
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                    </div>
                </section>

            </main>

            <ScrollNavigation />

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
