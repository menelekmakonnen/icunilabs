import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Menu, X } from 'lucide-react';
import { personas } from '../../data/personaData';

const systemLinks = [
    { title: "From Chaos to System", href: "#hero" },
    { title: "Business Operations Systems", href: "#operations-explainer" },
    { title: "Where we come in", href: "#services" },
    { title: "Best Fit", href: "#who-we-help" },
    { title: "See the Work", href: "#portfolio-proof" },
    { title: "The Method", href: "#method" },
    { title: "Get Started", href: "#contact" },
];

export default function Navbar() {
    const [whoDropdownOpen, setWhoDropdownOpen] = useState(false);
    const [sysDropdownOpen, setSysDropdownOpen] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    
    const whoDropdownRef = useRef<HTMLDivElement>(null);
    const sysDropdownRef = useRef<HTMLDivElement>(null);
    const whoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const sysTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const close = (e: MouseEvent) => {
            if (whoDropdownRef.current && !whoDropdownRef.current.contains(e.target as Node)) {
                setWhoDropdownOpen(false);
            }
            if (sysDropdownRef.current && !sysDropdownRef.current.contains(e.target as Node)) {
                setSysDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', close);
        return () => document.removeEventListener('mousedown', close);
    }, []);

    // Close mobile menu on hash change
    useEffect(() => {
        const onHash = () => setMobileOpen(false);
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    const handleWhoEnter = () => {
        if (whoTimeoutRef.current) clearTimeout(whoTimeoutRef.current);
        setSysDropdownOpen(false); // Make sure other opens are closed
        setWhoDropdownOpen(true);
    };
    const handleWhoLeave = () => {
        whoTimeoutRef.current = setTimeout(() => setWhoDropdownOpen(false), 200);
    };

    const handleSysEnter = () => {
        if (sysTimeoutRef.current) clearTimeout(sysTimeoutRef.current);
        setWhoDropdownOpen(false);
        setSysDropdownOpen(true);
    };
    const handleSysLeave = () => {
        sysTimeoutRef.current = setTimeout(() => setSysDropdownOpen(false), 200);
    };

    return (
        <header className="fixed top-0 w-full z-50 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between mt-1">

                {/* Logo */}
                <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer">
                    <img src="/icuni_logo.png" alt="ICUNI Labs Logo" className="w-8 h-8 rounded-md object-contain" />
                    <span className="font-bold text-lg tracking-tight">ICUNI Labs</span>
                </a>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">

                    {/* The Systems dropdown */}
                    <div
                        ref={sysDropdownRef}
                        className="relative"
                        onMouseEnter={handleSysEnter}
                        onMouseLeave={handleSysLeave}
                    >
                        <button
                            className="flex items-center gap-1 hover:text-neutral-50 transition-colors cursor-pointer text-white font-semibold"
                            onClick={() => setSysDropdownOpen(!sysDropdownOpen)}
                        >
                            The Systems
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${sysDropdownOpen ? 'rotate-180 text-[#00bfff]' : ''}`} />
                        </button>

                        <div
                            className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden transition-all duration-200 origin-top ${sysDropdownOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}
                            style={{ boxShadow: '0 16px 48px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(0,191,255,0.1)' }}
                        >
                            <div className="py-2 flex flex-col">
                                {systemLinks.map((link, idx) => (
                                    <a
                                        key={idx}
                                        href={link.href}
                                        className="relative flex items-center gap-3 px-5 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-900/70 transition-colors group overflow-hidden"
                                        onClick={() => setSysDropdownOpen(false)}
                                    >
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00bfff] opacity-0 group-hover:opacity-100 transition-opacity" />
                                        <span className="text-sm font-medium relative z-10 group-hover:translate-x-1 transition-transform">{link.title}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Who We Help dropdown */}
                    <div
                        ref={whoDropdownRef}
                        className="relative"
                        onMouseEnter={handleWhoEnter}
                        onMouseLeave={handleWhoLeave}
                    >
                        <a
                            href="#who-we-help"
                            className="flex items-center gap-1 hover:text-neutral-50 transition-colors cursor-pointer"
                            onClick={(e) => { if (whoDropdownOpen) { e.preventDefault(); } setWhoDropdownOpen(!whoDropdownOpen); }}
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
                                        href={`#${p.slug}`}
                                        className="flex items-center gap-3 px-4 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-900/70 transition-colors"
                                        onClick={() => setWhoDropdownOpen(false)}
                                    >
                                        <p.icon className="w-4 h-4" style={{ color: p.accentColor }} />
                                        <span className="text-sm">{p.title}</span>
                                    </a>
                                ))}
                                <a
                                    href="#who-we-help"
                                    className="flex items-center gap-2 px-4 py-2.5 text-[#00bfff] hover:text-white hover:bg-neutral-900/70 transition-colors border-t border-neutral-800/50 mt-1 text-xs font-bold uppercase tracking-widest"
                                    onClick={() => setWhoDropdownOpen(false)}
                                >
                                    View All →
                                </a>
                            </div>
                        </div>
                    </div>

                    <a href="#portfolio" className="hover:text-neutral-50 transition-colors">Portfolio</a>
                </nav>

                {/* CTA + Mobile Toggle */}
                <div className="flex items-center gap-4">
                    <a href="#portal" className="hidden md:block text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                        Client Login
                    </a>
                    <a
                        href="#contact"
                        className="hidden md:block text-sm font-medium px-4 py-2 bg-neutral-50 text-neutral-950 rounded hover:bg-neutral-200 transition-colors"
                    >
                        Audit First
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
                    
                    {/* The Systems sub-section */}
                    <div className="py-3 border-b border-neutral-900">
                        <span className="text-[#00bfff] text-xs font-bold uppercase tracking-wider mb-2 block">The Systems</span>
                        <div className="flex flex-col gap-1 ml-2 mt-2">
                            {systemLinks.map((link, idx) => (
                                <a
                                    key={idx}
                                    href={link.href}
                                    className="py-2 text-neutral-400 hover:text-white transition-colors"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {link.title}
                                </a>
                            ))}
                        </div>
                    </div>

                    <a href="#portfolio" className="py-3 hover:text-white transition-colors border-b border-neutral-900" onClick={() => setMobileOpen(false)}>Portfolio</a>

                    {/* Who We Help sub-section */}
                    <div className="py-3 border-b border-neutral-900">
                        <span className="text-neutral-500 text-xs font-bold uppercase tracking-wider mb-2 block">Who We Help</span>
                        <div className="flex flex-col gap-1 ml-2 mt-2">
                            {personas.map((p) => (
                                <a
                                    key={p.id}
                                    href={`#${p.slug}`}
                                    className="flex items-center gap-2 py-2 text-neutral-400 hover:text-white transition-colors"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <p.icon className="w-4 h-4" style={{ color: p.accentColor }} />
                                    {p.title}
                                </a>
                            ))}
                        </div>
                    </div>

                    <a href="#portal" className="py-3 hover:text-white transition-colors border-b border-neutral-900" onClick={() => setMobileOpen(false)}>Client Login</a>

                    <a
                        href="#contact"
                        className="mt-3 text-center py-3 bg-neutral-50 text-neutral-950 rounded font-bold hover:bg-neutral-200 transition-colors"
                        onClick={() => setMobileOpen(false)}
                    >
                        Audit First
                    </a>
                </nav>
            </div>
        </header>
    );
}
