import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    availableTags: string[];
    selectedTag: string | null;
    onSelectTag: (tag: string | null) => void;
}

export default function FilterDrawer({ isOpen, onClose, availableTags, selectedTag, onSelectTag }: FilterDrawerProps) {

    // Close on escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    // Prevent body scroll when drawer is open
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
                    {/* Backdrop Overlay */}
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
                        aria-label="Filter Projects"
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between p-6 border-b border-neutral-800/60 bg-neutral-900/50">
                            <div className="flex items-center gap-3">
                                <Filter size={20} className="text-neutral-400" />
                                <h2 className="text-xl font-bold tracking-tight text-white">Filters</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
                                aria-label="Close filters"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Content - Tags List */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
                            <p className="text-sm text-neutral-500 mb-6 font-medium uppercase tracking-wider">
                                Filter by Technology or Sector
                            </p>

                            <div className="flex flex-col gap-2">
                                {/* 'All Projects' Option */}
                                <button
                                    onClick={() => {
                                        onSelectTag(null);
                                        onClose();
                                    }}
                                    className={`
                                        flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all font-medium text-left
                                        ${selectedTag === null ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-neutral-800/30 text-neutral-300 hover:bg-neutral-800 hover:text-white'}
                                    `}
                                >
                                    <span>All Projects</span>
                                    {selectedTag === null && <ChevronRight size={16} className="opacity-70" />}
                                </button>

                                {/* Dynamic Tags */}
                                {availableTags.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => {
                                            onSelectTag(tag);
                                            onClose();
                                        }}
                                        className={`
                                            flex items-center justify-between w-full px-4 py-3 rounded-xl transition-all font-medium text-left
                                            ${selectedTag === tag ? 'bg-neutral-100 text-neutral-950 shadow-lg' : 'bg-neutral-800/30 text-neutral-300 hover:bg-neutral-800 hover:text-white'}
                                        `}
                                    >
                                        <span>{tag}</span>
                                        {selectedTag === tag && <ChevronRight size={16} className="opacity-70" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Drawer Footer */}
                        <div className="p-6 border-t border-neutral-800/60 bg-neutral-900/80">
                            <button
                                onClick={onClose}
                                className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl font-semibold transition-colors"
                            >
                                View Results
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
