import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle2, Circle, Clock, ArrowRight, LogOut, ChevronRight } from 'lucide-react';

// Mock Data for the Portal Demo
const mockData = {
    clientName: 'Acme Corp',
    projectName: 'Ops Infrastructure Overhaul',
    currentPhase: 'Build Sprint',
    completionPercentage: 65,
    nextMilestone: 'Deploy automated intake pipeline to production.',
    lastUpdate: '2026-02-24: Completed data schema migration to Google Sheets.',
    documents: [
        { name: 'ICUNI_Audit_Report.pdf', type: 'PDF', date: 'Feb 10' },
        { name: 'System_Architecture_Map.pdf', type: 'PDF', date: 'Feb 15' },
        { name: 'ILSF_Operations_Manual.gdoc', type: 'Docs', date: 'Feb 20' }
    ],
    milestones: [
        { name: 'Systems Diagnosis', status: 'completed' },
        { name: 'Architecture Design', status: 'completed' },
        { name: 'Core Infrastructure Build', status: 'active' },
        { name: 'Workflow Automations', status: 'pending' },
        { name: 'Testing & Handover', status: 'pending' },
    ]
};

export default function ClientPortal() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [email, setEmail] = useState('');
    const [loginState, setLoginState] = useState<'idle' | 'sending' | 'sent'>('idle');

    // Handle Magic Link Demo
    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setLoginState('sending');
        setTimeout(() => {
            setLoginState('sent');
            // Auto-login for demo purposes after "clicking" the link
            setTimeout(() => {
                setIsLoggedIn(true);
            }, 1500);
        }, 1000);
    };

    const handleLogout = () => {
        setIsLoggedIn(false);
        setLoginState('idle');
        setEmail('');
        window.location.hash = ''; // Return to main site
    };

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-neutral-50 selection:bg-neutral-800 selection:text-white pt-20">
                <motion.div
                    className="w-full max-w-md bg-neutral-900/50 border border-neutral-800 rounded-xl p-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold tracking-tight mb-2">Client Portal</h2>
                        <p className="text-neutral-400 text-sm">Access your project dashboard & unreleased assets.</p>
                    </div>

                    <AnimatePresence mode="wait">
                        {loginState === 'idle' && (
                            <motion.form
                                key="login-form"
                                onSubmit={handleLogin}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-neutral-400 mb-2">Work Email</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-white focus:outline-none focus:border-neutral-500 transition-colors"
                                        placeholder="you@company.com"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-white text-black font-semibold py-3 rounded hover:bg-neutral-200 transition-colors flex justify-center items-center gap-2"
                                >
                                    Send Magic Link
                                </button>
                            </motion.form>
                        )}

                        {loginState === 'sending' && (
                            <motion.div
                                key="sending"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex flex-col items-center justify-center py-8 space-y-4"
                            >
                                <span className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                                <p className="text-neutral-400 text-sm font-medium">Generating secure token...</p>
                            </motion.div>
                        )}

                        {loginState === 'sent' && (
                            <motion.div
                                key="sent"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-6"
                            >
                                <div className="w-12 h-12 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h3 className="font-semibold mb-2">Link Sent</h3>
                                <p className="text-sm text-neutral-400 max-w-xs mx-auto">
                                    Check <span className="text-white font-medium">{email}</span> for your login link.
                                </p>
                                <p className="text-xs text-neutral-600 mt-6">(Auto-redirecting for demo...)</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-950 text-neutral-50 pt-24 pb-20 selection:bg-neutral-800 selection:text-white">
            <div className="max-w-5xl mx-auto px-6">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-neutral-900 pb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-800 bg-neutral-900/50 text-xs font-medium text-emerald-400 mb-4">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Live Project
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">{mockData.clientName}</h1>
                        <p className="text-xl text-neutral-400">{mockData.projectName}</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-sm text-neutral-500 hover:text-white transition-colors self-start md:self-auto"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </header>

                <div className="grid md:grid-cols-3 gap-8">

                    {/* Main Content Column */}
                    <div className="md:col-span-2 space-y-8">

                        {/* Project Status */}
                        <section className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold">Active Phase: {mockData.currentPhase}</h2>
                                <span className="text-sm font-mono text-neutral-500">{mockData.completionPercentage}% Complete</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="h-2 w-full bg-neutral-950 rounded-full overflow-hidden mb-8 border border-neutral-800">
                                <motion.div
                                    className="h-full bg-white"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${mockData.completionPercentage}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>

                            {/* Milestones Pipeline */}
                            <div className="space-y-4">
                                {mockData.milestones.map((milestone, idx) => (
                                    <div key={idx} className="flex items-start gap-4">
                                        <div className="mt-0.5">
                                            {milestone.status === 'completed' && <CheckCircle2 className="w-5 h-5 text-neutral-500" />}
                                            {milestone.status === 'active' && <Circle className="w-5 h-5 text-white animate-pulse" />}
                                            {milestone.status === 'pending' && <Circle className="w-5 h-5 text-neutral-800" />}
                                        </div>
                                        <div>
                                            <p className={`font-medium ${milestone.status === 'pending' ? 'text-neutral-600' : 'text-neutral-200'}`}>
                                                {milestone.name}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Next Milestone & Updates */}
                        <div className="grid sm:grid-cols-2 gap-4">
                            <section className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-xl">
                                <div className="flex items-center gap-2 text-neutral-400 mb-4">
                                    <ArrowRight className="w-4 h-4" />
                                    <h3 className="text-sm font-medium uppercase tracking-wider">Up Next</h3>
                                </div>
                                <p className="text-neutral-200 font-medium leading-relaxed">
                                    {mockData.nextMilestone}
                                </p>
                            </section>

                            <section className="bg-neutral-900/30 border border-neutral-800 p-6 rounded-xl">
                                <div className="flex items-center gap-2 text-neutral-400 mb-4">
                                    <Clock className="w-4 h-4" />
                                    <h3 className="text-sm font-medium uppercase tracking-wider">Latest Activity</h3>
                                </div>
                                <p className="text-neutral-200 text-sm leading-relaxed">
                                    {mockData.lastUpdate}
                                </p>
                            </section>
                        </div>

                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-8">

                        {/* Document Hub */}
                        <section className="bg-neutral-900/40 border border-neutral-800 p-6 rounded-xl">
                            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-neutral-500" />
                                Project Files
                            </h2>
                            <div className="space-y-3">
                                {mockData.documents.map((doc, idx) => (
                                    <a
                                        key={idx}
                                        href="#"
                                        className="group block p-3 bg-neutral-950 border border-neutral-800 rounded hover:border-neutral-600 transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="truncate pr-4">
                                                <p className="text-sm font-medium text-neutral-200 truncate">{doc.name}</p>
                                                <p className="text-xs text-neutral-500 mt-1">{doc.type} • {doc.date}</p>
                                            </div>
                                            <ChevronRight className="w-4 h-4 text-neutral-700 group-hover:text-neutral-400 transition-colors flex-shrink-0" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                            <p className="mt-6 text-xs text-neutral-500 text-center">
                                Secured by Google Drive
                            </p>
                        </section>

                    </div>

                </div>
            </div>
        </div>
    );
}
