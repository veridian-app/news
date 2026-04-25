import { Globe } from "lucide-react";

interface TacticalLoaderProps {
  progress?: number;
}

export const TacticalLoader = ({ progress }: TacticalLoaderProps) => {
  return (
    <div className="fixed inset-0 z-[100] bg-[#020408] flex flex-col items-center justify-center p-6 overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(16,185,129,0.08),_transparent_70%)] animate-pulse" />
      <div className="absolute inset-0 intelligence-grid opacity-20" />
      
      {/* Tactical Compass Ring */}
      <div className="absolute w-[500px] h-[500px] border border-emerald-500/5 rounded-full animate-spin-slow opacity-20" />
      <div className="absolute w-[600px] h-[600px] border border-emerald-500/5 rounded-full animate-reverse-spin opacity-10" />

      <div className="relative flex flex-col items-center gap-12">
        {/* Rotating Globe Core - Premium 3D Effect */}
        <div className="relative group">
          {/* Orbital Glow */}
          <div className="absolute -inset-12 bg-emerald-500/10 blur-[80px] rounded-full animate-pulse group-hover:bg-emerald-500/20 transition-all duration-1000" />
          
          <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full flex items-center justify-center">
             {/* 3D Atmosphere Outer Ring */}
             <div className="absolute inset-0 border-[1px] border-emerald-500/30 rounded-full animate-pulse shadow-[0_0_30px_rgba(16,185,129,0.1)]" />
             
             {/* Orbital Scanning Rings */}
             <div className="absolute inset-[-15px] border-t-2 border-emerald-400/40 rounded-full animate-spin" style={{ animationDuration: '4s' }} />
             <div className="absolute inset-[-30px] border-l-2 border-emerald-500/20 rounded-full animate-reverse-spin" style={{ animationDuration: '6s' }} />
             
             {/* Internal Scanning Beams */}
             <div className="absolute inset-4 border-[0.5px] border-emerald-500/10 rounded-full animate-spin-slow" />
             
             {/* The Globe Icon - Central Focal Point */}
             <div className="relative z-10 transition-transform duration-700 group-hover:scale-110">
               <Globe className="w-20 h-20 md:w-28 md:h-28 text-emerald-500 animate-[pulse_3s_ease-in-out_infinite] drop-shadow-[0_0_20px_rgba(16,185,129,0.6)]" />
               
               {/* 3D Inner Shadow Effect */}
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_transparent_40%,_rgba(0,0,0,0.6)_100%)] rounded-full pointer-events-none" />
             </div>
             
             {/* Radar Sweep Scanning Effect */}
             <div className="absolute inset-0 bg-conic-gradient from-emerald-500/30 to-transparent animate-spin rounded-full opacity-40 mix-blend-screen" style={{ animationDuration: '5s' }} />
          </div>
        </div>

        {/* Intelligence Extraction Status */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full" />
            </div>
            <span className="text-sm md:text-base font-tactical font-black text-white tracking-[0.6em] uppercase">
              Extracting_Intelligence
            </span>
          </div>
          <div className="text-[10px] font-tactical text-emerald-500/60 tracking-[0.3em] font-bold">
            SYNCHRONIZING_GLOBAL_NODES // ADAPTING_THEATER_VIEW
          </div>
        </div>

        {/* Tactical Progress Bar - Premium Minimalist */}
        <div className="relative w-72 md:w-96 group">
          <div className="absolute -inset-1 bg-emerald-500/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative h-[2px] w-full bg-white/5 overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-1000 cubic-bezier(0.4, 0, 0.2, 1) shadow-[0_0_15px_rgba(16,185,129,0.8)]"
              style={{ width: `${progress ?? 10}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[8px] font-tactical text-emerald-500/40">SECURE_LINK: ESTABLISHED</span>
            <span className="text-[8px] font-tactical text-emerald-500/40">{progress ?? 10}%_COMPLETE</span>
          </div>
        </div>

        {/* Matrix-like data stream effect */}
        <div className="flex gap-8 mt-4">
           <div className="flex flex-col items-center gap-1">
             <div className="text-[8px] font-tactical text-emerald-500/30">GEO_COORD</div>
             <div className="text-[10px] font-tactical text-white/50">40.7128 N</div>
           </div>
           <div className="flex flex-col items-center gap-1">
             <div className="text-[8px] font-tactical text-emerald-500/30">SIG_INT</div>
             <div className="text-[10px] font-tactical text-white/50">ENCRYPTED</div>
           </div>
           <div className="flex flex-col items-center gap-1">
             <div className="text-[8px] font-tactical text-emerald-500/30">NODE_STAT</div>
             <div className="text-[10px] font-tactical text-emerald-400">ACTIVE</div>
           </div>
        </div>
      </div>
    </div>
  );
};
