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
                    await fetch(scriptUrl, {
                        method: 'POST',
                        body: JSON.stringify(formData),
                        headers: {
                            'Content-Type': 'text/plain;charset=utf-8', // Bypass CORS preflight for simple requests
                        }
                    });
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
        <section id="contact" className="py-24 md:py-32 bg-neutral-950 border-t border-neutral-900">
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
                        Book your systems audit to get started.
                    </motion.p>
                </div>

                {/* Fake Interactive Form / System Intake Demo */}
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl p-6 md:p-10 relative overflow-hidden min-h-[400px]">

                    <div className="absolute top-0 left-0 w-full h-1 bg-neutral-800">
                        <motion.div
                            className="h-full bg-neutral-100"
                            initial={{ width: '33%' }}
                            animate={{ width: `${(step / 3) * 100}%` }}
                            transition={{ duration: 0.3 }}
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
                                    <h3 className="text-xl font-semibold mb-6">Basic Information</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Name</label>
                                        <input
                                            type="text" required
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-white focus:outline-none focus:border-neutral-500 transition-colors"
                                            placeholder="Jane Doe"
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Work Email</label>
                                        <input
                                            type="email" required
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-white focus:outline-none focus:border-neutral-500 transition-colors"
                                            placeholder="jane@company.com"
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                    <button type="submit" className="w-full bg-white text-black font-semibold py-3 rounded mt-8 hover:bg-neutral-200 transition-colors">
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
                                    <h3 className="text-xl font-semibold mb-6">Current Operations</h3>
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-400 mb-2">Team Size</label>
                                        <select
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-white focus:outline-none focus:border-neutral-500 transition-colors appearance-none"
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
                                            className="w-full bg-neutral-950 border border-neutral-800 rounded px-4 py-3 text-white focus:outline-none focus:border-neutral-500 transition-colors"
                                            placeholder="e.g., Client onboarding takes too long and steps get missed..."
                                            onChange={(e) => setFormData({ ...formData, bottleneck: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex gap-4 mt-8">
                                        <button type="button" onClick={() => setStep(1)} className="w-1/3 bg-transparent border border-neutral-700 text-white font-semibold py-3 rounded hover:bg-neutral-800 transition-colors">
                                            Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-2/3 bg-white text-black font-semibold py-3 rounded hover:bg-neutral-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
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
                                    className="text-center py-12"
                                >
                                    <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="text-2xl font-bold mb-4">You're a great fit.</h3>
                                    <p className="text-neutral-400 mb-8 max-w-md mx-auto">
                                        We've auto-scored your intake. Our systems indicate we can eliminate your primary bottleneck. Let's schedule your audit.
                                    </p>
                                    <a href="mailto:labs@icuni.org" className="inline-block bg-white text-black font-semibold px-8 py-4 rounded hover:bg-neutral-200 transition-colors">
                                        Access Calendar
                                    </a>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </div>

            </div>
        </section>
    );
}
