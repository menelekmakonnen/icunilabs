
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';

export default function ScrollNavigation() {
    const [showTopBtn, setShowTopBtn] = useState(false);
    const [showBottomBtn, setShowBottomBtn] = useState(true);

    useEffect(() => {
        const handleScroll = () => {
            const scrollY = window.scrollY;
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;

            // Show "Back to Top" if scrolled down a bit (e.g., 300px)
            if (scrollY > 300) {
                setShowTopBtn(true);
            } else {
                setShowTopBtn(false);
            }

            // Show "Skip to Bottom" if not near the bottom
            // "Near bottom" = within 100px of the end
            if (scrollY + windowHeight < documentHeight - 100) {
                setShowBottomBtn(true);
            } else {
                setShowBottomBtn(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Initial check
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const scrollToBottom = () => {
        window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
        });
    };

    return (
        <div className="fixed bottom-8 right-8 flex flex-col gap-3 z-50 pointer-events-none">
            <AnimatePresence>
                {/* Back to Top Button */}
                {showTopBtn && (
                    <motion.button
                        key="top-btn"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={scrollToTop}
                        className="bg-neutral-800/80 backdrop-blur-md border border-neutral-700 text-neutral-400 hover:text-white p-3 rounded-full shadow-lg pointer-events-auto transition-colors group"
                        aria-label="Back to Top"
                    >
                        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    </motion.button>
                )}

                {/* Skip to Bottom Button */}
                {showBottomBtn && (
                    <motion.button
                        key="bottom-btn"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        onClick={scrollToBottom}
                        className="bg-neutral-800/80 backdrop-blur-md border border-neutral-700 text-neutral-400 hover:text-white p-3 rounded-full shadow-lg pointer-events-auto transition-colors group"
                        aria-label="Skip to Bottom"
                    >
                        <ArrowDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
