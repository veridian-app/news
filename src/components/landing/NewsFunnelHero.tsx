import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Smartphone } from "lucide-react";

export const NewsFunnelHero = ({ language }: { language: 'es' | 'en' }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Animation values
    const opacityNoise = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
    const scaleNoise = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
    const yNoise = useTransform(scrollYProgress, [0, 0.6], [0, 200]);

    const opacityLogo = useTransform(scrollYProgress, [0.6, 0.8], [0, 1]);
    const scaleLogo = useTransform(scrollYProgress, [0.6, 0.8], [0.5, 1.2]);
    const yLogo = useTransform(scrollYProgress, [0.6, 1], [50, 0]);

    const opacitySubtitle = useTransform(scrollYProgress, [0.8, 1], [0, 1]);

    const headlines = [
        { text: "CRISIS!", x: -150, y: -100, rotate: -12, color: "bg-red-500" },
        { text: "FAKE?", x: 180, y: -80, rotate: 10, color: "bg-orange-500" },
        { text: "SCANDAL", x: -80, y: 120, rotate: -5, color: "bg-yellow-500" },
        { text: "VIRAL", x: 120, y: 80, rotate: 8, color: "bg-blue-500" },
        { text: "PANIC", x: -180, y: 20, rotate: -15, color: "bg-purple-500" },
        { text: "SHOCK", x: 200, y: 150, rotate: 12, color: "bg-pink-500" },
    ];

    return (
        <div ref={containerRef} className="h-[250vh] relative z-10 w-full">
            <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden">

                {/* Title - Stays visible but fades slightly */}
                <motion.div
                    style={{ opacity: useTransform(scrollYProgress, [0, 0.2], [1, 0.5]) }}
                    className="absolute top-24 md:top-32 text-center z-20 px-4"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in-up">
                        <span className="text-sm font-medium text-white/90">
                            {language === 'es' ? 'Revolucionando el consumo de noticias' : 'Revolutionizing news consumption'}
                        </span>
                    </div>

                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter leading-[1.1] mb-6 max-w-4xl bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent drop-shadow-sm">
                        {language === 'es' ? 'Noticias sin ruido.' : 'News without noise.'}
                        <br className="hidden md:block" />
                        <span className="text-white">
                            {language === 'es' ? 'Solo la verdad.' : 'Just the truth.'}
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed">
                        {language === 'es'
                            ? 'Inteligencia Artificial ética al servicio de tu criterio.'
                            : 'Ethical AI at the service of your judgment.'}
                    </p>
                </motion.div>

                {/* The Funnel / Filter Area */}
                <div className="relative w-full max-w-lg h-[60vh] flex items-center justify-center mt-32 md:mt-40">

                    {/* Noisy Headlines - Moving into the "Funnel" */}
                    {headlines.map((item, index) => (
                        <motion.div
                            key={index}
                            style={{
                                opacity: opacityNoise,
                                scale: scaleNoise,
                                x: useTransform(scrollYProgress, [0, 0.6], [item.x, 0]),
                                y: useTransform(scrollYProgress, [0, 0.6], [item.y, 100]),
                                rotate: useTransform(scrollYProgress, [0, 0.6], [item.rotate, 0]),
                            }}
                            className={`absolute px-4 py-2 md:px-6 md:py-3 rounded-lg font-bold text-white shadow-xl ${item.color} backdrop-blur-md border border-white/20 text-sm md:text-base whitespace-nowrap`}
                        >
                            {item.text}
                        </motion.div>
                    ))}

                    {/* The Veridian Filter/Logo Output */}
                    <motion.div
                        style={{
                            opacity: opacityLogo,
                            scale: scaleLogo,
                            y: yLogo,
                        }}
                        className="absolute z-30 flex flex-col items-center"
                    >
                        <div className="w-20 h-20 md:w-28 md:h-28 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Shield className="w-10 h-10 md:w-14 md:h-14 text-white fill-white/20" />
                        </div>

                        <motion.div
                            style={{ opacity: opacitySubtitle, y: useTransform(scrollYProgress, [0.8, 1], [20, 0]) }}
                            className="mt-6 text-center"
                        >
                            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Veridian</h2>
                            <p className="text-white/60 text-sm md:text-base mt-1">
                                {language === 'es' ? 'Verdad verificada' : 'Verified Truth'}
                            </p>
                        </motion.div>
                    </motion.div>

                    {/* Funnel Visualization (Subtle glowing ring) */}
                    <motion.div
                        style={{
                            opacity: useTransform(scrollYProgress, [0, 0.5, 0.8], [0, 1, 0]),
                            scale: useTransform(scrollYProgress, [0, 0.5], [1.5, 0.5]),
                        }}
                        className="absolute w-64 h-64 border-2 border-blue-500/30 rounded-full blur-xl"
                    />

                </div>
            </div>
        </div>
    );
};
