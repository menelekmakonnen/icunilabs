
import { Settings } from 'lucide-react';
import { personas } from '../../data/personaData';

export default function Footer() {
    return (
        <footer className="border-t border-neutral-900 bg-neutral-950 text-neutral-400 relative z-10">
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings className="w-5 h-5 text-neutral-500" />
                            <span className="font-bold text-lg text-neutral-50 tracking-tight">ICUNI Labs</span>
                        </div>
                        <p className="text-sm max-w-sm mb-6">
                            ICUNI Labs builds the systems behind better operations.
                        </p>
                        <a href="mailto:labs@icuni.org" className="text-sm hover:text-neutral-50 transition-colors">
                            labs@icuni.org
                        </a>
                    </div>

                    <div>
                        <h4 className="text-neutral-50 font-medium mb-4 text-sm">Framework</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#problem" className="hover:text-neutral-50 transition-colors">The Problem</a></li>
                            <li><a href="#method" className="hover:text-neutral-50 transition-colors">The Method</a></li>
                            <li><a href="#demo" className="hover:text-neutral-50 transition-colors">Systems Lab</a></li>
                            <li><a href="#diagnostic" className="hover:text-neutral-50 transition-colors">Diagnostic</a></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-neutral-50 font-medium mb-4 text-sm">Who We Help</h4>
                        <ul className="space-y-2 text-sm">
                            {personas.map((p) => (
                                <li key={p.id}>
                                    <a href={`#${p.slug}`} className="hover:text-neutral-50 transition-colors">
                                        {p.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-neutral-50 font-medium mb-4 text-sm">Engage</h4>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#contact" className="hover:text-neutral-50 transition-colors">Systems Audit</a></li>
                            <li><a href="#contact" className="hover:text-neutral-50 transition-colors">Build Sprint</a></li>
                            <li><a href="#portfolio" className="hover:text-neutral-50 transition-colors">Portfolio</a></li>
                            <li><a href="#portal" className="hover:text-neutral-50 transition-colors">Client Login</a></li>
                        </ul>
                    </div>

                </div>

                <div className="border-t border-neutral-900 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between text-xs">
                    <p>© {new Date().getFullYear()} ICUNI Labs. All rights reserved.</p>
                    <div className="flex gap-4 mt-4 md:mt-0">
                        <span>Available for projects in Ghana, UK, EU, US and remote teams globally.</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
