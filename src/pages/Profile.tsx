import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  User as UserIcon, 
  Settings, 
  LogOut, 
  Shield, 
  Brain, 
  Zap, 
  ArrowRight,
  Lock,
  Globe,
  ChevronRight,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  UserPlus,
  X,
  Volume2,
  Cpu,
  Fingerprint,
  Radio,
  Monitor
} from "lucide-react";
import { cn } from "@/lib/utils";

const Profile = () => {
  const { user, signOut, isAuthenticated, signInWithGoogle, signInWithApple, signInWithPassword, signUpWithPassword } = useAuth();
  const navigate = useNavigate();

  // Auth States for Guest view
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Functional Settings State
  const [activePanel, setActivePanel] = useState<null | 'ai' | 'security' | 'terminal' | 'nodes' | 'prefs'>(null);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('veridian_settings');
    return saved ? JSON.parse(saved) : {
      aiBias: 50,
      aiDepth: 75,
      stealthMode: true,
      autoWipe: false,
      terminalVolume: 80,
      retroInterface: false,
      encryptionLevel: 'High'
    };
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem('veridian_settings', JSON.stringify(settings));
  }, [settings]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Completa todos los campos");
      return;
    }
    setIsSubmitting(true);
    setError(null);

    if (authMode === 'login') {
      const { error: authError } = await signInWithPassword(email, password);
      if (authError) setError(authError.message);
      setIsSubmitting(false);
    } else {
      const { error: authError } = await signUpWithPassword(email, password);
      setIsSubmitting(false);
      if (authError) setError(authError.message);
      else setIsSent(true);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError(null);
    try {
      const { error: authError } = provider === 'google' ? await signInWithGoogle() : await signInWithApple();
      if (authError) {
        if (authError.message.includes("provider is not enabled")) {
          setError(`El acceso con ${provider === 'google' ? 'Google' : 'Apple'} no está habilitado en Supabase.`);
        } else {
          setError(authError.message);
        }
      }
    } catch (err) {
      setError("Error de conexión");
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-[#020305] text-white overflow-hidden font-sans">
      
      {/* Background elements */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(16,185,129,0.05),transparent_50%)]" />
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#020305] to-transparent z-10" />
      </div>

      <div className="relative z-10 w-full h-full overflow-y-auto px-6 py-12 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-12 pb-32">
          
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/5">
            <div className="space-y-1">
              <h1 className="text-4xl font-black tracking-tighter uppercase">Centro de Control</h1>
              <p className="text-sm font-mono text-emerald-500/60 uppercase tracking-[0.2em]">Protocolo de Inteligencia // v1.2</p>
            </div>
            
            {isAuthenticated && (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-all text-xs font-bold uppercase tracking-widest"
              >
                <LogOut className="w-4 h-4" />
                Desconectar Terminal
              </button>
            )}
          </header>

          {!isAuthenticated ? (
            /* Restricted Access State */
            <section className="flex flex-col items-center justify-center py-20 text-center space-y-10">
              <div className="relative">
                <div className="w-24 h-24 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 animate-pulse">
                  {authMode === 'signup' ? <UserPlus className="w-10 h-10 text-emerald-500" /> : <Lock className="w-10 h-10 text-emerald-500" />}
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center animate-bounce shadow-[0_0_15px_rgba(16,185,129,0.5)]">
                  <Shield className="w-3 h-3 text-black" />
                </div>
              </div>

              <div className="space-y-3 px-8">
                <h2 className="text-3xl font-bold tracking-tight uppercase">{authMode === 'signup' ? 'Nuevo Registro' : 'Acceso Restringido'}</h2>
                <p className="text-sm text-white/40 leading-relaxed max-w-sm mx-auto">
                  {authMode === 'signup' ? 'Crea tu perfil de agente para guardar tus preferencias.' : 'Identifícate en el terminal para desbloquear tu centro de inteligencia personalizado.'}
                </p>
              </div>

              <div className="w-full max-w-md space-y-6 bg-white/[0.02] border border-white/5 p-8 rounded-[32px] backdrop-blur-xl">
                
                {!isSent ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <SocialButton icon={Globe} label="Google" onClick={() => handleOAuth('google')} />
                      <SocialButton icon={Shield} label="Apple" onClick={() => handleOAuth('apple')} />
                    </div>
                    
                    <div className="relative flex items-center justify-center">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                      <span className="relative px-4 bg-[#050608] text-[9px] font-mono text-white/20 uppercase tracking-[0.2em]">Terminal Manual</span>
                    </div>

                    <form onSubmit={handleAuthAction} className="space-y-4 text-left">
                      <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Correo de Agente"
                          className="w-full h-14 pl-12 pr-4 bg-zinc-900/50 border border-white/5 rounded-2xl text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                        />
                      </div>

                      <div className="relative group">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Clave de Seguridad"
                          className="w-full h-14 pl-12 pr-12 bg-zinc-900/50 border border-white/5 rounded-2xl text-sm focus:outline-none focus:border-emerald-500/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {error && <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">{error}</p>}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-14 bg-white text-black font-black uppercase text-[11px] tracking-widest rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-3 shadow-xl"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                          <>
                            {authMode === 'signup' ? 'Crear Cuenta' : 'Entrar al Sistema'}
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}
                        className="w-full text-center text-[9px] font-black uppercase tracking-widest text-emerald-500/60 hover:text-emerald-400 transition-colors"
                      >
                        {authMode === 'signup' ? 'Ya tengo cuenta // Login' : '¿Eres nuevo? // Crear Registro'}
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="space-y-6 py-4">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                      <Mail className="w-8 h-8 text-emerald-500" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-bold uppercase tracking-tighter">Verificación enviada</h3>
                      <p className="text-xs text-white/40">Revisa tu bandeja de entrada para activar tu terminal Veridian.</p>
                    </div>
                    <button onClick={() => setIsSent(false)} className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Volver</button>
                  </div>
                )}
              </div>
            </section>
          ) : (
            /* Authenticated Bento Grid */
            <section className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={cn(itemStyle.bentoCard, "md:col-span-2 flex items-center gap-8 p-10 group overflow-hidden")}>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative">
                    <div className="w-24 h-24 rounded-[32px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative z-10 overflow-hidden">
                      <div className="absolute inset-0 bg-emerald-500/5 animate-pulse" />
                      <UserIcon className="w-10 h-10 text-emerald-500 relative z-20" />
                    </div>
                    <div className={itemStyle.statusDot(true)} />
                  </div>
                  <div className="space-y-2 relative z-10">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-2">
                      <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                      Agente Verificado
                    </p>
                    <h3 className="text-4xl font-black tracking-tighter uppercase">{user?.email?.split('@')[0]}</h3>
                    <div className="flex items-center gap-4 text-[10px] text-white/40 font-mono uppercase tracking-widest">
                      <span className="flex items-center gap-1.5 border border-white/5 px-2 py-1 rounded-md bg-white/5"><Shield className="w-3 h-3 text-emerald-500" /> Nivel 1</span>
                      <span className="flex items-center gap-1.5 border border-white/5 px-2 py-1 rounded-md bg-white/5"><Globe className="w-3 h-3 text-emerald-500" /> Global Access</span>
                    </div>
                  </div>
                </div>

                <div className={cn(itemStyle.bentoCard, "group hover:border-emerald-500/30 transition-all duration-500")}>
                  <div className="h-full flex flex-col justify-between relative z-10">
                    <div className="flex justify-between items-start">
                      <Zap className="w-6 h-6 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-500 uppercase">Sync OK</div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Señal de Pureza</p>
                      <p className="text-5xl font-black text-emerald-500 tracking-tighter tabular-nums">98.4<span className="text-2xl text-emerald-500/40">%</span></p>
                    </div>
                    <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-out w-[98.4%]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Advanced Controls Grid */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Sistemas de Control</h4>
                  <div className="h-px flex-1 mx-6 bg-white/5" />
                  <span className="text-[8px] font-mono text-emerald-500/40 uppercase">Ajustes de Terminal</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <SystemButton 
                    icon={Brain} 
                    label="Algoritmo IA" 
                    desc="Calibrar sesgo y profundidad" 
                    badge="Optimus"
                    onClick={() => setActivePanel('ai')}
                  />
                  <SystemButton 
                    icon={Shield} 
                    label="Seguridad" 
                    desc="Encriptación Biométrica" 
                    active 
                    onClick={() => setActivePanel('security')}
                  />
                  <SystemButton 
                    icon={Zap} 
                    label="Terminal" 
                    desc="Modo Stealth y Sonidos" 
                    onClick={() => setActivePanel('terminal')}
                  />
                  <SystemButton 
                    icon={Globe} 
                    label="Red Nodal" 
                    desc="Localización y Latencia" 
                    badge="5ms"
                    onClick={() => setActivePanel('nodes')}
                  />
                  <SystemButton 
                    icon={Settings} 
                    label="Preferencias" 
                    desc="Ajustes de Interfaz Global" 
                    onClick={() => setActivePanel('prefs')}
                  />
                  <SystemButton 
                    icon={LogOut} 
                    label="Desconexión" 
                    desc="Cierre de Sesión Seguro" 
                    variant="danger"
                    onClick={handleSignOut}
                  />
                </div>
              </div>
            </section>
          )}

          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-none z-40">
            <div className="px-6 py-2.5 rounded-full bg-black/80 border border-emerald-500/20 backdrop-blur-xl shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Sincronización Veridian Estable
              </p>
            </div>
          </div>
          <div className="fixed bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#020305] to-transparent pointer-events-none z-30" />
          <div className="h-[400px]" />
        </div>
      </div>

      {/* Settings Overlay System */}
      {activePanel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[40px] overflow-hidden shadow-2xl relative animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
            {/* Background Tactical Grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            
            <header className="p-8 border-b border-white/5 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  {activePanel === 'ai' && <Brain className="w-5 h-5 text-emerald-500" />}
                  {activePanel === 'security' && <Shield className="w-5 h-5 text-emerald-500" />}
                  {activePanel === 'terminal' && <Zap className="w-5 h-5 text-emerald-500" />}
                  {activePanel === 'nodes' && <Globe className="w-5 h-5 text-emerald-500" />}
                  {activePanel === 'prefs' && <Settings className="w-5 h-5 text-emerald-500" />}
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase tracking-tighter">
                    {activePanel === 'ai' && "Algoritmo Optimus"}
                    {activePanel === 'security' && "Protocolos de Seguridad"}
                    {activePanel === 'terminal' && "Ajustes de Terminal"}
                    {activePanel === 'nodes' && "Mapa de Red Nodal"}
                    {activePanel === 'prefs' && "Preferencias Globales"}
                  </h2>
                  <p className="text-[9px] font-mono text-emerald-500/60 uppercase tracking-[0.2em]">Configuración de Sistema //</p>
                </div>
              </div>
              <button 
                onClick={() => setActivePanel(null)}
                className="p-3 rounded-full hover:bg-white/5 transition-colors group"
              >
                <X className="w-5 h-5 text-white/40 group-hover:text-white" />
              </button>
            </header>

            <main className="p-8 space-y-8 relative z-10 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {activePanel === 'ai' && (
                <div className="space-y-8">
                  <SettingSlider 
                    label="Filtro de Sesgo Político" 
                    icon={Brain}
                    value={settings.aiBias} 
                    onChange={(v) => setSettings({...settings, aiBias: v})}
                    leftLabel="Izquierda"
                    rightLabel="Derecha"
                  />
                  <SettingSlider 
                    label="Profundidad de Análisis" 
                    icon={Cpu}
                    value={settings.aiDepth} 
                    onChange={(v) => setSettings({...settings, aiDepth: v})}
                    leftLabel="Superficial"
                    rightLabel="Omnisciente"
                  />
                </div>
              )}

              {activePanel === 'security' && (
                <div className="space-y-4">
                  <SettingToggle 
                    label="Encriptación Biométrica" 
                    desc="Requiere huella dactilar para abrir noticias restringidas."
                    icon={Fingerprint}
                    active={true}
                  />
                  <SettingToggle 
                    label="Auto-Wipe de Sesión" 
                    desc="Borra todo rastro de navegación al cerrar la pestaña."
                    icon={Shield}
                    active={settings.autoWipe}
                    onToggle={() => setSettings({...settings, autoWipe: !settings.autoWipe})}
                  />
                  <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex items-center gap-4">
                    <Shield className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-[10px] font-black uppercase text-emerald-500">Nivel de Protección: {settings.encryptionLevel}</p>
                      <p className="text-[9px] text-emerald-500/40">Grado militar AES-256 activo.</p>
                    </div>
                  </div>
                </div>
              )}

              {activePanel === 'terminal' && (
                <div className="space-y-8">
                  <SettingSlider 
                    label="Volumen de Sistema" 
                    icon={Volume2}
                    value={settings.terminalVolume} 
                    onChange={(v) => setSettings({...settings, terminalVolume: v})}
                  />
                  <SettingToggle 
                    label="Modo Stealth" 
                    desc="Interfaz de bajo contraste y modo incógnito forzado."
                    icon={Zap}
                    active={settings.stealthMode}
                    onToggle={() => setSettings({...settings, stealthMode: !settings.stealthMode})}
                  />
                  <SettingToggle 
                    label="Interfaz Retro" 
                    desc="Activa fuentes CRT y efectos de terminal antiguo."
                    icon={Monitor}
                    active={settings.retroInterface}
                    onToggle={() => setSettings({...settings, retroInterface: !settings.retroInterface})}
                  />
                </div>
              )}

              {activePanel === 'nodes' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    <NodeStatus city="New York" latency="12ms" status="Stable" />
                    <NodeStatus city="London" latency="8ms" status="Optimal" />
                    <NodeStatus city="Tokyo" latency="45ms" status="Connected" />
                    <NodeStatus city="Madrid" latency="5ms" status="Local Host" />
                  </div>
                  <div className="p-6 rounded-3xl bg-zinc-800/50 border border-white/5 flex flex-col items-center gap-3">
                    <Radio className="w-8 h-8 text-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-mono text-white/40 uppercase">Escaneando red de nodos global...</p>
                  </div>
                </div>
              )}

              {activePanel === 'prefs' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => {
                        setSettings({...settings, retroInterface: false});
                        document.documentElement.classList.remove('light-mode');
                      }}
                      className={cn(
                        "p-6 rounded-3xl border text-center space-y-2 transition-all",
                        !document.documentElement.classList.contains('light-mode') 
                          ? "bg-emerald-500/10 border-emerald-500/40" 
                          : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                    >
                      <p className={cn(
                        "text-[10px] font-black uppercase",
                        !document.documentElement.classList.contains('light-mode') ? "text-emerald-500" : "text-white/40"
                      )}>Tema Tactical</p>
                      <div className="w-12 h-6 bg-emerald-500 rounded-full mx-auto shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                    </button>

                    <button 
                      onClick={() => {
                        document.documentElement.classList.add('light-mode');
                      }}
                      className={cn(
                        "p-6 rounded-3xl border text-center space-y-2 transition-all",
                        document.documentElement.classList.contains('light-mode') 
                          ? "bg-blue-500/10 border-blue-500/40" 
                          : "bg-white/5 border-white/5 hover:border-white/20"
                      )}
                    >
                      <p className={cn(
                        "text-[10px] font-black uppercase",
                        document.documentElement.classList.contains('light-mode') ? "text-blue-600" : "text-white/40"
                      )}>Tema Light</p>
                      <div className="w-12 h-6 bg-zinc-200 rounded-full mx-auto" />
                    </button>
                  </div>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('veridian_settings');
                      window.location.reload();
                    }}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                  >
                    Reiniciar Preferencias de Fábrica
                  </button>
                </div>
              )}
            </main>

            <footer className="p-8 border-t border-white/5 bg-black/20 flex items-center justify-between relative z-10">
              <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Sincronizado con Veridian Cloud</p>
              <button 
                onClick={() => setActivePanel(null)}
                className="px-6 py-2.5 bg-emerald-500 text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-emerald-400 transition-all shadow-lg"
              >
                Confirmar Cambios
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
};

const SettingSlider = ({ label, value, onChange, icon: Icon, leftLabel, rightLabel }: any) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon className="w-4 h-4 text-emerald-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{label}</span>
      </div>
      <span className="text-[10px] font-mono text-emerald-500">{value}%</span>
    </div>
    <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
      <div 
        className="absolute inset-0 bg-emerald-500/20" 
        style={{ width: `${value}%` }} 
      />
      <input 
        type="range" 
        min="0" 
        max="100" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div 
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-emerald-500 shadow-xl pointer-events-none"
        style={{ left: `calc(${value}% - 8px)` }}
      />
    </div>
    {leftLabel && (
      <div className="flex justify-between text-[8px] font-mono uppercase text-white/20">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    )}
  </div>
);

const SettingToggle = ({ label, desc, active, onToggle, icon: Icon }: any) => (
  <button 
    onClick={onToggle}
    className="w-full flex items-start gap-4 p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all text-left group"
  >
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
      active ? "bg-emerald-500 text-black" : "bg-white/5 text-white/20 group-hover:text-white/40"
    )}>
      <Icon className="w-5 h-5" />
    </div>
    <div className="flex-1">
      <h4 className="text-[11px] font-black uppercase tracking-widest mb-1">{label}</h4>
      <p className="text-[9px] text-white/30 leading-relaxed">{desc}</p>
    </div>
    <div className={cn(
      "w-10 h-6 rounded-full relative transition-all duration-500 mt-2",
      active ? "bg-emerald-500" : "bg-white/10"
    )}>
      <div className={cn(
        "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-lg",
        active ? "left-5" : "left-1"
      )} />
    </div>
  </button>
);

const NodeStatus = ({ city, latency, status }: any) => (
  <div className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-all group">
    <div className="flex items-center gap-4">
      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">{city}</span>
    </div>
    <div className="flex items-center gap-6">
      <span className="text-[10px] font-mono text-emerald-500/60">{latency}</span>
      <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-white/5 text-white/20">{status}</span>
    </div>
  </div>
);

const SystemButton = ({ icon: Icon, label, desc, badge, active, variant, onClick }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-5 p-6 rounded-[24px] border transition-all duration-500 group text-left relative overflow-hidden",
      active ? "bg-emerald-500/10 border-emerald-500/30" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/10 shadow-lg",
      variant === 'danger' && "hover:border-red-500/20 hover:bg-red-500/5"
    )}
  >
    {active && (
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] -mr-16 -mt-16" />
    )}
    
    <div className={cn(
      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 relative z-10",
      active ? "bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]" : "bg-white/5 group-hover:bg-emerald-500/10",
      variant === 'danger' && "group-hover:bg-red-500/20"
    )}>
      <Icon className={cn(
        "w-6 h-6 transition-all duration-500",
        active ? "text-emerald-400" : "text-white/30 group-hover:text-emerald-400",
        variant === 'danger' && "group-hover:text-red-400"
      )} />
    </div>

    <div className="flex-1 relative z-10">
      <div className="flex items-center gap-2 mb-0.5">
        <h4 className={cn(
          "text-[11px] font-black uppercase tracking-widest transition-colors",
          active ? "text-white" : "text-white/70 group-hover:text-white"
        )}>{label}</h4>
        {badge && (
          <span className="text-[7px] font-black px-1.5 py-0.5 rounded bg-emerald-500 text-black uppercase tracking-tighter">
            {badge}
          </span>
        )}
      </div>
      <p className="text-[10px] text-white/30 font-medium tracking-wide">{desc}</p>
    </div>

    <ChevronRight className={cn(
      "w-4 h-4 transition-all duration-500",
      active ? "text-emerald-400" : "text-white/5 group-hover:text-emerald-400 group-hover:translate-x-1",
      variant === 'danger' && "group-hover:text-red-500/50"
    )} />
  </button>
);

const SocialButton = ({ icon: Icon, label, onClick }: any) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all group"
  >
    <Icon className="w-4 h-4 text-white/20 group-hover:text-emerald-400 transition-colors" />
    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60 group-hover:text-white transition-colors">{label}</span>
  </button>
);

const itemStyle = {
  bentoCard: "p-6 rounded-2xl bg-white/[0.015] border border-white/5 shadow-xl relative overflow-hidden",
  statusDot: (active: boolean) => cn(
    "absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-[#020305]",
    active ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-zinc-800"
  )
};

export default Profile;
