
import { motion } from 'framer-motion';

export default function Authority() {
    return (
        <section className="py-32 border-t border-neutral-800 text-center px-6 relative">
            <div className="max-w-4xl mx-auto">

                <motion.h2
                    className="text-3xl md:text-5xl font-black tracking-tight mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    Built for Businesses Growing<br />
                    <span className="text-[#ff6600] drop-shadow-[0_0_15px_rgba(255,102,0,0.4)]">Faster Than Their Operations.</span>
                </motion.h2>

                <div className="space-y-6 text-xl md:text-2xl font-medium text-neutral-300">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        We don’t sell software. We build <span className="text-[#00bfff] drop-shadow-[0_0_8px_rgba(0,191,255,0.4)] font-bold">systems.</span>
                    </motion.p>

                    <motion.div
                        className="flex flex-col gap-2 text-neutral-500 text-lg md:text-xl"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <p className="line-through">No bloated enterprise tools.</p>
                        <p className="line-through">No unnecessary complexity.</p>
                        <p className="line-through">No theoretical AI decks.</p>
                    </motion.div>

                    <motion.p
                        className="text-xl md:text-3xl font-bold text-white pt-6"
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        Just practical implementation that works.
                    </motion.p>
                </div>

            </div>
        </section>
    );
}
