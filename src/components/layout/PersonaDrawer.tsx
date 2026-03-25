import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Users } from 'lucide-react';
import { useEffect } from 'react';
import { personas } from '../../data/personaData';

interface PersonaDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function PersonaDrawer({ isOpen, onClose }: PersonaDrawerProps) {

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm z-[100] cursor-pointer"
                        aria-hidden="true"
                    />

                    {/* Drawer Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-[85vw] md:w-[33vw] max-w-md bg-neutral-900 border-l border-neutral-800 shadow-2xl z-[101] flex flex-col overflow-hidden"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Who We Help"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-800/60 bg-neutral-900/50">
                            <div className="flex items-center gap-3">
                                <Users size={20} className="text-neutral-400" />
                                <h2 className="text-xl font-bold tracking-tight text-white">Who We Help</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                                aria-label="Close drawer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content - Persona List */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                            <p className="text-sm text-neutral-500 mb-6 font-medium">
                                ICUNI Labs works best with ambitious companies that have momentum but need sharper systems. Find your profile.
                            </p>

                            <div className="flex flex-col gap-3">
                                {personas.map(persona => (
                                    <a
                                        key={persona.id}
                                        href={`#${persona.slug}`}
                                        onClick={onClose}
                                        className="group flex items-start gap-4 p-4 rounded-xl bg-neutral-800/20 hover:bg-neutral-800/50 border border-transparent hover:border-neutral-700/50 transition-all duration-300"
                                    >
                                        <div
                                            className="p-2.5 rounded-lg border bg-neutral-950/60 backdrop-blur-md shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110"
                                            style={{ borderColor: persona.accentColor + '30' }}
                                        >
                                            <persona.icon className="w-5 h-5" style={{ color: persona.accentColor }} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-white mb-1 group-hover:text-white transition-colors">{persona.title}</h3>
                                            <p className="text-xs text-neutral-500 leading-relaxed line-clamp-2">{persona.tileTeaser}</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-neutral-600 group-hover:text-white shrink-0 mt-1 group-hover:translate-x-1 transition-all" />
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-neutral-800/60 bg-neutral-900/80">
                            <a
                                href="#who-we-help"
                                onClick={onClose}
                                className="block w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-semibold text-center transition-colors text-sm"
                            >
                                View All Profiles
                            </a>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
