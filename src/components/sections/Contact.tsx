import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Contact() {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        businessSize: '1-10', // Default value
        bottleneck: '',
    });

    const handleNext = async (e: React.FormEvent) => {
        e.preventDefault();

        if (step === 1) {
            setStep(2);
            return;
        }

        if (step === 2) {
            setIsSubmitting(true);

            try {
                const scriptUrl = import.meta.env.VITE_APPS_SCRIPT_URL;

                if (scriptUrl) {
                    // Real submission to Apps Script
                    const response = await fetch(scriptUrl, {
                        method: 'POST',
                        body: JSON.stringify(formData),
                        headers: {
                            'Content-Type': 'text/plain;charset=utf-8', // Bypass CORS preflight for simple requests
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const result = await response.json().catch(() => null);
                    if (result && result.status !== 200) {
                        throw new Error(result.message || 'Server error from Apps Script');
                    }
                } else {
                    // Simulated submission for the demo if URL isn't set yet
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }

                setStep(3);
            } catch (error) {
                console.error("Submission failed", error);
                alert("System error. Please try again or email us directly.");
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <section id="contact" className="py-24 md:py-32 border-t border-neutral-900 bg-transparent">
            <div className="max-w-3xl mx-auto px-6">

                <div className="text-center mb-16">
                    <motion.h2
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        Let’s Fix the Chaos.
                    </motion.h2>
                    <motion.p
                        className="text-neutral-400"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        If operations are slowing growth, creating confusion, or relying too much on manual effort, ICUNI Labs can help you map the bottleneck and build the right system around it.
                    </motion.p>
                </div>

                {/* Fake Interactive Form / System Intake Demo */}
                <div className="bg-neutral-950/60 backdrop-blur-xl border border-neutral-800 rounded-xl p-6 md:p-10 relative overflow-hidden min-h-[400px] shadow-[0_8px_32px_rgba(0,0,0,0.4)]" style={{ boxShadow: 'inset 0 1px 0 0 rgba(255,255,255,0.02)' }}>

                    <div className="absolute top-0 left-0 w-full h-1 bg-neutral-900">
                        <motion.div
                            className="h-full bg-gradient-to-r from-[#ff6600] to-[#00bfff] shadow-[0_0_10px_rgba(0,191,255,0.5)]"
                            initial={{ width: '33%' }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                            transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                    </div>

                    <form onSubmit={handleNext} className="mt-4">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-xl font-semibold mb-6 text-white">Basic Information</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Name</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] focus:shadow-[0_0_15px_rgba(0,191,255,0.15)] transition-all duration-300 placeholder:text-neutral-600"
                                            placeholder="Jane Doe"
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Work Email</label>
                                        <input
                                            type="email" required
                                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] focus:shadow-[0_0_15px_rgba(0,191,255,0.15)] transition-all duration-300 placeholder:text-neutral-600"
                                            placeholder="jane@company.com"
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-white font-bold py-3 rounded-lg mt-8 shadow-[0_4px_14px_rgba(0,191,255,0.2)] hover:shadow-[0_6px_20px_rgba(0,191,255,0.4)] hover:-translate-y-[1px] transition-all duration-300">
                                        Continue
                                    </button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-6"
                                >
                                    <h3 className="text-xl font-semibold mb-6 text-white">Current Operations</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Team Size</label>
                                        <select
                                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] focus:shadow-[0_0_15px_rgba(0,191,255,0.15)] transition-all duration-300 appearance-none cursor-pointer"
                                            onChange={(e) => setFormData({ ...formData, businessSize: e.target.value })}
                                        >
                                            <option>1-10</option>
                                            <option>11-50</option>
                                            <option>51-200</option>
                                            <option>200+</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Primary Bottleneck</label>
                                        <textarea
                                            required rows={3}
                                            className="w-full bg-neutral-900/50 border border-neutral-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#00bfff] focus:ring-1 focus:ring-[#00bfff] focus:shadow-[0_0_15px_rgba(0,191,255,0.15)] transition-all duration-300 placeholder:text-neutral-600 resize-none"
                                            placeholder="e.g., Client onboarding takes too long and steps get missed..."
                                            onChange={(e) => setFormData({ ...formData, bottleneck: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-8">
                                        <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-transparent border border-neutral-700 text-neutral-300 font-medium py-3 rounded-lg hover:border-neutral-500 hover:text-white transition-colors duration-300">
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-2/3 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-white font-bold py-3 rounded-lg hover:shadow-[0_6px_20px_rgba(0,191,255,0.4)] hover:-translate-y-[1px] transition-all duration-300 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none flex justify-center items-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin"></span>
                                                    Running Analysis...
                                                </>
                                            ) : (
                                                'Analyze Fit'
                                            )}
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-8"
                                >
                                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                                        <div className="absolute inset-0 bg-[#00bfff]/20 rounded-full animate-ping"></div>
                                        <div className="absolute inset-0 bg-[#00bfff]/30 rounded-full blur-md"></div>
                                        <svg className="w-8 h-8 text-[#00bfff] relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">You're a great fit.</h3>
                                    <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                                        We've auto-scored your intake. Our systems indicate we can eliminate your primary bottleneck. Please select a time for your audit below.
                                    </p>

                                    <div className="w-full h-[600px] bg-white rounded-lg overflow-hidden border border-neutral-800 relative">
                                        <iframe
                                            src="https://calendar.app.google/V27jaS7QNUALdhXJ9"
                                            style={{ border: 0 }}
                                            width="100%"
                                            height="100%"
                                            frameBorder="0"
                                            title="Select a Date & Time"
                                        ></iframe>
                                        {/* Fallback/Loading State Overlay if needed, or just let iframe load */}
                                    </div>
                                    <div className="mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setStep(4)}
                                            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-[#00bfff] to-[#0080ff] text-white font-bold rounded-lg hover:shadow-[0_6px_20px_rgba(0,191,255,0.4)] hover:-translate-y-[1px] transition-all duration-300"
                                        >
                                            I've Selected My Time
                                        </button>
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-4">
                                        Powered by Google Calendar
                                    </p>
                                </motion.div>
                            )}

                            {step === 4 && (
                                <motion.div
                                    key="step4"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-16"
                                >
                                    <div className="w-20 h-20 bg-[#00bfff]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-10 h-10 text-[#00bfff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-3xl font-bold mb-4 text-white">Intake Complete</h3>
                                    <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                                        We look forward to diving into your systems. You will receive a calendar invitation and further details shortly.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setStep(1);
                                            setFormData({ name: '', email: '', businessSize: '1-10', bottleneck: '' });
                                        }}
                                        className="px-8 py-3 bg-neutral-800 text-white font-medium rounded-lg hover:bg-neutral-700 transition-colors"
                                    >
                                        Return Home
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

            </div>
        </section>
    );
}
