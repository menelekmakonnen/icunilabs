
import { Settings } from 'lucide-react';

export default function Navbar() {
    return (
        <header className="fixed top-0 w-full z-50 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between mt-1">

                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-neutral-400" />
                    <span className="font-bold text-lg tracking-tight">ICUNI Labs</span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
                    <a href="#method" className="hover:text-neutral-50 transition-colors">The Method</a>
                    <a href="#offers" className="hover:text-neutral-50 transition-colors">Services</a>
                    <a href="#demo" className="hover:text-neutral-50 transition-colors">Systems</a>
                </nav>

                {/* CTA */}
                <div className="flex items-center gap-4">
                    <a href="#portal" className="hidden md:block text-sm font-medium text-neutral-400 hover:text-white transition-colors">
                        Client Login
                    </a>
                    <a
                        href="#contact"
                        className="text-sm font-medium px-4 py-2 bg-neutral-50 text-neutral-950 rounded hover:bg-neutral-200 transition-colors"
                    >
                        Audit First
                    </a>
                </div>

            </div>
        </header>
    );
}
