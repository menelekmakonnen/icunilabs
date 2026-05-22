import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { personas } from '../../data/personaData';
import { handleLinkClick } from '../../router';

export default function Navbar() {
    const [whoDropdownOpen, setWhoDropdownOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const whoDropdownRef = useRef<HTMLDivElement>(null);
    const whoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (whoDropdownRef.current && !whoDropdownRef.current.contains(e.target as Node)) {
                setWhoDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    // Close mobile menu on navigation
    useEffect(() => {
        const onNav = () => setMobileOpen(false);
        window.addEventListener('popstate', onNav);
        return () => window.removeEventListener('popstate', onNav);
    }, []);

    const handleWhoEnter = () => {
        if (whoTimeoutRef.current) clearTimeout(whoTimeoutRef.current);
        setWhoDropdownOpen(true);
    };
    const handleWhoLeave = () => {
        whoTimeoutRef.current = setTimeout(() => setWhoDropdownOpen(false), 200);
    };

    return (
        <header className="fixed top-0 w-full z-50 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between mt-1">

                {/* Logo */}
                <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <img src="/icuni_logo.webp" alt="ICUNI Labs Logo" className="w-8 h-8 rounded-md object-contain" />
                    <span className="font-bold text-lg tracking-tight">ICUNI Labs</span>
                </a>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">

                    {/* The Systems — simple link */}
                    <a href="/" onClick={handleLinkClick} className="hover:text-neutral-50 transition-colors text-white font-semibold">The Systems</a>

                    {/* Who We Help dropdown */}
                    <div
                        ref={whoDropdownRef}
                        className="relative"
                        onMouseEnter={handleWhoEnter}
                        onMouseLeave={handleWhoLeave}
                    >
                        <a
                            href="/who-we-help"
                            className="flex items-center gap-1 hover:text-neutral-50 transition-colors cursor-pointer"
                            onClick={(e) => { handleLinkClick(e); if (whoDropdownOpen) { e.preventDefault(); } setWhoDropdownOpen(!whoDropdownOpen); }}
                        >
                            Who We Help
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${whoDropdownOpen ? 'rotate-180' : ''}`} />
                        </a>

                        <div
                            className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 origin-top ${whoDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
                            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.03)' }}
                        >
                            <div className="py-2">
                                {personas.map((p) => (
                                    <a
                                        key={p.id}
                                        href={`/${p.slug}`}
                                        className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-900/70 transition-colors"
                                        onClick={(e) => { handleLinkClick(e); setWhoDropdownOpen(false); }}
                                    >
                                        <p.icon className="w-4 h-4" style={{ color: p.accentColor }} />
                                        <span className="text-sm">{p.title}</span>
                                    </a>
                                ))}
                                <a
                                    href="/who-we-help"
                                    className="flex items-center gap-2 px-4 py-2.5 text-[#00bfff] hover:text-white hover:bg-neutral-900/70 transition-colors border-t border-neutral-800/50 mt-1 text-xs font-bold uppercase tracking-widest"
                                    onClick={(e) => { handleLinkClick(e); setWhoDropdownOpen(false); }}
                                >
                                    View All →
                                </a>
                            </div>
                        </div>
                    </div>

                    <a href="/portfolio" onClick={handleLinkClick} className="hover:text-neutral-50 transition-colors">Portfolio</a>
                    <a href="/demos" onClick={handleLinkClick} className="hover:text-neutral-50 transition-colors">Demos</a>
                    <a href="/jobs" onClick={handleLinkClick} className="hover:text-neutral-50 transition-colors">Careers</a>
                </nav>

                {/* CTA + Mobile Toggle */}
                <div className="flex items-center gap-4">
                    <a href="/portal" onClick={handleLinkClick} className="hidden md:block text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                        Client Login
                    </a>
                    <a
                        href="/referral"
                        onClick={handleLinkClick}
                        className="hidden md:block text-sm font-semibold px-4 py-2 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] text-white rounded hover:shadow-[0_0_15px_rgba(255,102,0,0.3)] transition-all"
                    >
                        Refer & Earn
                    </a>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden text-neutral-400 hover:text-white transition-colors cursor-pointer"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        aria-label="Toggle menu"
                    >
                        {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

            </div>

            {/* Mobile Menu */}
            <div
                className={`md:hidden border-t border-neutral-900 bg-neutral-950/95 backdrop-blur-xl overflow-y-auto transition-all duration-300 ${mobileOpen ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <nav className="flex flex-col px-6 py-4 gap-1 text-sm font-medium text-neutral-400">
                    <a href="/" className="py-3 hover:text-white transition-colors border-b border-neutral-900 text-white font-semibold" onClick={(e) => { handleLinkClick(e); setMobileOpen(false); }}>The Systems</a>

                    {/* Who We Help sub-section */}
                    <div className="py-3 border-b border-neutral-900">
                        <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2 block">Who We Help</span>
                        <div className="flex flex-col gap-1 ml-2 mt-2">
                            {personas.map((p) => (
                                <a
                                    key={p.id}
                                    href={`/${p.slug}`}
                                    className="flex items-center gap-2 py-2 text-neutral-400 hover:text-white transition-colors"
                                    onClick={(e) => { handleLinkClick(e); setMobileOpen(false); }}
                                >
                                    <p.icon className="w-4 h-4" style={{ color: p.accentColor }} />
                                    {p.title}
                                </a>
                            ))}
                        </div>
                    </div>

                    <a href="/portfolio" className="py-3 hover:text-white transition-colors border-b border-neutral-900" onClick={(e) => { handleLinkClick(e); setMobileOpen(false); }}>Portfolio</a>
                    <a href="/demos" className="py-3 hover:text-white transition-colors border-b border-neutral-900" onClick={(e) => { handleLinkClick(e); setMobileOpen(false); }}>Demos</a>
                    <a href="/jobs" className="py-3 hover:text-white transition-colors border-b border-neutral-900" onClick={(e) => { handleLinkClick(e); setMobileOpen(false); }}>Careers</a>
                    <a href="/referral" className="py-3 hover:text-white transition-colors border-b border-neutral-900 bg-gradient-to-r from-[#ff7a00] to-[#ff9533] bg-clip-text text-transparent font-semibold" onClick={(e) => { handleLinkClick(e); setMobileOpen(false); }}>Refer & Earn</a>
                    <a href="/portal" className="py-3 hover:text-white transition-colors border-b border-neutral-900" onClick={(e) => { handleLinkClick(e); setMobileOpen(false); }}>Client Login</a>

                    <a
                        href="/contact"
                        className="mt-3 text-center py-3 bg-neutral-50 text-neutral-950 rounded font-bold hover:bg-neutral-200 transition-colors"
                        onClick={(e) => { handleLinkClick(e); setMobileOpen(false); }}
                    >
                        Audit First
                    </a>
                </nav>
            </div>
        </header>
    );
}
