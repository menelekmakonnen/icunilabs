import { useState, useEffect, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { handleLinkClick } from '../../router';
import { TOTAL_PROJECT_COUNT } from '../../data/portfolioData';

interface SubheadlineSegment {
    text: string;
    color?: string;
}

type Subheadline = SubheadlineSegment[];

const allSubheadlines: Subheadline[] = [
    [{ text: "We can build literally " }, { text: "any digital product.", color: "#00bfff" }, { text: " Challenge us." }],
    [{ text: "Demo in 3 days. No proposal. No commitment. " }, { text: "Just proof.", color: "#ff7a00" }],
    [{ text: "From print shops to swim schools — " }, { text: "if it runs on data, we build it.", color: "#00bfff" }],
    [{ text: "AI-powered systems " }, { text: "that run your business while you sleep.", color: "#ff7a00" }],
    [{ text: "No subscriptions. No vendor lock-in. " }, { text: "Just your system, forever.", color: "#00bfff" }],
    [{ text: `${TOTAL_PROJECT_COUNT}+ systems built. Zero we couldn't solve. ` }, { text: "Your move.", color: "#ff7a00" }],
    [{ text: "Your data stays yours. " }, { text: "Privacy-first. Always encrypted.", color: "#10b981" }],
    [{ text: "We protect your business data " }, { text: "like it's our own.", color: "#10b981" }],
];

function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

function flattenLine(line: Subheadline): string {
    return line.map(s => s.text).join('');
}

function renderTypedText(line: Subheadline, charCount: number) {
    let remaining = charCount;
    const elements: React.ReactNode[] = [];

    for (let i = 0; i < line.length && remaining > 0; i++) {
        const seg = line[i];
        const visibleChars = Math.min(remaining, seg.text.length);
        const visibleText = seg.text.slice(0, visibleChars);
        remaining -= visibleChars;

        elements.push(
            <span key={i} style={seg.color ? { color: seg.color } : undefined}>
                {visibleText}
            </span>
        );
    }

    return elements;
}

type Phase = 'typing' | 'holding' | 'deleting';

export default function Hero() {
    const [shuffled] = useState(() => shuffleArray(allSubheadlines));
    const [lineIndex, setLineIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [phase, setPhase] = useState<Phase>('typing');
    const [cursorVisible, setCursorVisible] = useState(true);

    const currentLine = shuffled[lineIndex];
    const fullLength = flattenLine(currentLine).length;

    // Typing & deleting
    const tick = useCallback(() => {
        if (phase === 'typing') {
            if (charIndex < fullLength) {
                setCharIndex(prev => prev + 1);
            } else {
                setPhase('holding');
                setCursorVisible(true);
            }
        } else if (phase === 'deleting') {
            if (charIndex > 0) {
                setCharIndex(prev => prev - 1);
            } else {
                setPhase('typing');
                setLineIndex(prev => (prev + 1) % shuffled.length);
            }
        }
    }, [charIndex, fullLength, phase, shuffled.length]);

    useEffect(() => {
        if (phase === 'typing' || phase === 'deleting') {
            const speed = phase === 'deleting' ? 5 : 8;
            const timer = setTimeout(tick, speed);
            return () => clearTimeout(timer);
        } else if (phase === 'holding') {
            // Blink cursor periodically during the 30s hold
            const blinkTimer = setInterval(() => {
                setCursorVisible(prev => !prev);
            }, 400);

            // Wait 30 seconds
            const holdTimer = setTimeout(() => {
                setPhase('deleting');
                setCursorVisible(true);
            }, 30000);

            return () => {
                clearInterval(blinkTimer);
                clearTimeout(holdTimer);
            };
        }
    }, [tick, phase]);

    return (
        <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-20">

            {/* Dot grid */}
            <div aria-hidden="true" className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            {/* Ambient glow */}
            <div aria-hidden="true" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-[#00bfff]/10 to-[#ff7a00]/5 blur-[120px] rounded-full pointer-events-none z-0" />

            <div className="max-w-4xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">

                {/* SEO Text Block Hidden Visually */}
                <div className="sr-only">
                    <h1>From Chaos To System</h1>
                    <h2>Accepting New Projects</h2>
                    {allSubheadlines.map((headline, idx) => (
                        <p key={idx}>{flattenLine(headline)}</p>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs font-medium text-neutral-400 mb-8 shadow-[0_0_10px_rgba(0,191,255,0.05)] backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-[#00bfff] animate-pulse shadow-[0_0_8px_rgba(0,191,255,0.8)]"></span>
                        Accepting New Projects
                    </div>
                </motion.div>

                <motion.h1
                    className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white mb-8 leading-[1.1]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                >
                    FROM <br className="md:hidden" />
                    <motion.span 
                        className="inline-block cursor-pointer bg-clip-text text-transparent bg-gradient-to-br from-[#ff9944] to-[#ff7a00] drop-shadow-[0_0_15px_rgba(255,102,0,0.4)]"
                        whileHover={{ x: [-3, 3, -1, 1, -2, 2, 0], y: [1, -1, 2, -2, 1, -1, 0] }}
                        transition={{ duration: 0.3, repeat: Infinity, repeatType: "mirror" }}
                    >
                        CHAOS
                    </motion.span>
                    <br /> TO {' '}
                    <span className="relative inline-block cursor-pointer group whitespace-nowrap transition-transform duration-300 group-hover:scale-105">
                        <span className="relative z-10 bg-clip-text text-transparent bg-gradient-to-br from-[#33ccff] to-[#0099cc] drop-shadow-[0_0_20px_rgba(0,191,255,0.4)] transition-all duration-500 group-hover:drop-shadow-[0_0_35px_rgba(0,191,255,0.7)]">SYSTEM</span>
                        <div className="absolute -inset-x-2 -inset-y-1 bg-[#00bfff]/0 group-hover:bg-[#00bfff]/[0.06] rounded-lg transition-all duration-500 pointer-events-none" />
                    </span>
                </motion.h1>

                {/* Code-style typewriter subheadline */}
                <div className="min-h-[2.5rem] md:min-h-[2rem] flex items-start justify-center mb-10 max-w-2xl w-full">
                    <p className="text-base md:text-lg text-neutral-300 font-bold leading-relaxed font-mono tracking-tight">
                        <span className="text-neutral-600 mr-1">{'>'}</span>
                        {renderTypedText(currentLine, charIndex)}
                        <span
                            className="inline-block w-[8px] h-[1.15em] ml-[2px] align-middle transition-opacity duration-100"
                            style={{
                                backgroundColor: cursorVisible ? '#00bfff' : 'transparent',
                                boxShadow: cursorVisible ? '0 0 6px rgba(0,191,255,0.6)' : 'none',
                            }}
                        />
                    </p>
                </div>

                <motion.div
                    className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                >
                    <a
                        href="/contact"
                        onClick={handleLinkClick}
                        className="group flex items-center justify-center gap-2 px-8 py-4 bg-transparent border border-[#00bfff]/50 text-[#00bfff] shadow-[inset_0_0_10px_rgba(0,191,255,0.05)] font-bold rounded hover:bg-[#00bfff]/10 hover:shadow-[0_0_15px_rgba(0,191,255,0.2)] transition-all"
                    >
                        Let's Fix the Chaos!
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                    <a
                        href="/demos"
                        onClick={handleLinkClick}
                        className="flex items-center justify-center px-8 py-4 bg-transparent border border-[#ff7a00]/50 text-[#ff7a00] font-bold rounded hover:bg-[#ff7a00]/10 hover:border-[#ff7a00] transition-all shadow-[inset_0_0_10px_rgba(255,102,0,0.05)]"
                    >
                        See Live Demos
                    </a>
                </motion.div>

                <motion.p
                    className="text-sm text-neutral-500 mt-6 max-w-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.7 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                    We don't pitch. We build. Tell us what can't be solved — we'll show you it can.
                </motion.p>

                <motion.div
                    className="flex items-center gap-3 mt-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <span className="text-xs text-neutral-500">Your data is encrypted, private, and never shared with third parties.</span>
                </motion.div>

            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                transition={{ delay: 1, duration: 1 }}
            >
                <span className="text-[10px] tracking-widest uppercase text-neutral-500 font-bold">Scroll</span>
                <motion.div
                    className="w-[1px] h-12 bg-gradient-to-b from-[#00bfff] to-transparent"
                    animate={{ scaleY: [0, 1, 0], transformOrigin: ["top", "top", "bottom"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                />
            </motion.div>
        </section>
    );
}
