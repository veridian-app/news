import { useEffect, useRef } from "react";

interface LiquidProgressBarProps {
    progress: number; // 0 to 100
    orientation?: 'horizontal' | 'vertical';
}

export const LiquidProgressBar = ({ progress }: LiquidProgressBarProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    // Use a ref for progress to access the latest value inside the animation loop without restarting it
    const progressRef = useRef(progress);

    useEffect(() => {
        progressRef.current = Math.min(Math.max(progress / 100, 0), 1.0);
    }, [progress]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let time = 0;
        let currentFillHeight = 0;

        // Colors - Veridian Green Theme adaptation
        const cols = {
            dark: '#064e3b',   // emerald-900 (Deepest part)
            medium: '#10b981', // emerald-500 (Body)
            crema: '#6ee7b7',  // emerald-300 (Top foam/light)
            steam: 'rgba(16, 185, 129, 0.2)' // Vapor
        };

        // Particles
        const bubbles: any[] = [];
        const steam: any[] = [];

        const resize = () => {
            if (!container) return { width: 0, height: 0 };
            const width = container.clientWidth;
            const height = container.clientHeight;
            const dpr = window.devicePixelRatio || 1;

            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);

            return { width, height };
        };

        let dims = resize();
        let width = dims.width;
        let height = dims.height;

        const spawnSteam = (surfaceY: number) => {
            if (progressRef.current > 0.1 && surfaceY > 0) {
                // Reduced spawn rate from > 0.85 to > 0.96 (4% chance)
                if (Math.random() > 0.96) {
                    steam.push({
                        x: width / 2 + (Math.random() - 0.5) * 20,
                        y: surfaceY,
                        vx: (Math.random() - 0.5) * 0.3,
                        // Slower rising speed
                        vy: -0.5 - Math.random() * 0.5,
                        size: 5 + Math.random() * 10,
                        growth: 0.1 + Math.random() * 0.1,
                        life: 1,
                        fade: 0.005 + Math.random() * 0.005
                    });
                }
            }
        };

        const updateSteam = () => {
            for (let i = steam.length - 1; i >= 0; i--) {
                let s = steam[i];
                s.y += s.vy;
                s.x += s.vx;
                s.size += s.growth;
                s.life -= s.fade;
                if (s.life <= 0) steam.splice(i, 1);
            }
        };

        const drawSteam = () => {
            steam.forEach(s => {
                ctx.beginPath();
                const gradient = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.size);
                // Reduced max opacity from 0.3 to 0.15 for subtle effect
                gradient.addColorStop(0, `rgba(255, 255, 255, ${s.life * 0.15})`);
                gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
                ctx.fillStyle = gradient;
                ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
                ctx.fill();
            });
        };

        const spawnBubbles = (surfaceY: number) => {
            // Reduced spawn rate from > 0.9 to > 0.97 (3% chance)
            if (Math.random() > 0.97 && currentFillHeight > 20) {
                bubbles.push({
                    x: Math.random() * width,
                    y: height + 10,
                    // Slower bubble rise
                    vy: -0.5 - Math.random() * 1.0,
                    size: 1 + Math.random() * 3,
                    wobbleOffset: Math.random() * Math.PI * 2
                });
            }
        };

        const updateAndDrawBubbles = (surfaceY: number) => {
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)"; // Slightly reduced opacity
            for (let i = bubbles.length - 1; i >= 0; i--) {
                let b = bubbles[i];
                b.y += b.vy;
                let wobble = Math.sin(time * 0.05 + b.wobbleOffset) * 1;

                if (b.y <= surfaceY) {
                    bubbles.splice(i, 1);
                    continue;
                }
                ctx.beginPath();
                ctx.arc(b.x + wobble, b.y, b.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            time += 1;

            const targetHeightPx = height * progressRef.current;
            // Smooth interpolation
            currentFillHeight += (targetHeightPx - currentFillHeight) * 0.05;
            let surfaceY = height - currentFillHeight;

            spawnSteam(surfaceY);
            updateSteam();
            spawnBubbles(surfaceY);

            // Draw Liquid
            if (currentFillHeight > 0) {
                ctx.beginPath();
                ctx.moveTo(0, height);

                // Wave effect - Slower wave speed (time * 0.02)
                for (let x = 0; x <= width; x += 2) {
                    let wave = Math.sin(x * 0.05 + time * 0.03) * 2;
                    if (progressRef.current > 0.98) wave *= 0.1; // Reduce wave when full
                    ctx.lineTo(x, surfaceY + wave);
                }
                ctx.lineTo(width, height);
                ctx.closePath();

                const grad = ctx.createLinearGradient(0, surfaceY, 0, height);
                grad.addColorStop(0, cols.crema);
                grad.addColorStop(0.2, cols.medium);
                grad.addColorStop(1, cols.dark);

                ctx.fillStyle = grad;
                ctx.fill();

                updateAndDrawBubbles(surfaceY);
            }

            drawSteam();
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            const d = resize();
            width = d.width;
            height = d.height;
        };

        window.addEventListener('resize', handleResize);
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full rounded-[2rem] overflow-hidden bg-zinc-900/30 border border-white/10 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)] backdrop-blur-sm"
        >
            {/* Tube Highlights (CSS Overlay mimicking the glass effect) */}
            <div className="absolute inset-0 z-20 pointer-events-none rounded-[2rem] shadow-[inset_0_0_15px_rgba(255,255,255,0.05)]">
                <div className="absolute top-2 left-2 w-[2px] h-[95%] bg-white/20 blur-[2px] rounded-full opacity-60"></div>
                <div className="absolute top-2 right-2 w-[1px] h-[95%] bg-white/10 blur-[1px] rounded-full opacity-40"></div>
            </div>

            <canvas ref={canvasRef} className="absolute inset-0 z-10 w-full h-full" />
        </div>
    );
};
