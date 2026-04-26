import React from 'react';
import { X, Share, PlusSquare, ArrowUp, Globe } from 'lucide-react';
import { createPortal } from 'react-dom';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isIOS: boolean;
  onInstall?: () => void;
  canInstall: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ 
  isOpen, 
  onClose, 
  isIOS, 
  onInstall,
  canInstall 
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[3000000] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-[32px] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500">
        <div className="p-8 space-y-8">
          <div className="flex justify-between items-start">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Globe className="w-8 h-8 text-emerald-500" />
            </div>
            <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase tracking-tight italic">
              Instalar <span className="text-emerald-500">Veridian</span>
            </h3>
            <p className="text-sm text-white/40 leading-relaxed">
              Convierte Veridian en una aplicación táctica en tu pantalla de inicio para acceso inmediato y sin distracciones.
            </p>
          </div>

          {isIOS ? (
            <div className="space-y-6 bg-white/5 p-6 rounded-2xl border border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
                  <Share className="w-4 h-4 text-blue-400" />
                </div>
                <p className="text-xs text-white/60">
                  1. Pulsa el botón de <span className="text-blue-400 font-bold">Compartir</span> en tu navegador.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-white/60">
                  2. Selecciona <span className="text-white font-bold italic">"Añadir a pantalla de inicio"</span>.
                </p>
              </div>
              <div className="pt-4 flex justify-center">
                <div className="animate-bounce">
                  <ArrowUp className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {canInstall ? (
                <button
                  onClick={onInstall}
                  className="w-full py-4 rounded-2xl bg-emerald-500 text-black font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"
                >
                  Instalar Terminal
                </button>
              ) : (
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-center">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
                    Usa un navegador compatible (Chrome/Safari) para habilitar la instalación táctica.
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="pt-4">
            <p className="text-[9px] font-mono text-center text-white/20 uppercase tracking-[0.3em]">
              Sincronización de Dispositivo V.9
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
