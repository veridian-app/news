import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
    ChevronDown,
    Check,
    Lock,
    Sparkles,
    User,
    Briefcase,
    Heart
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface SurveyData {
    gender: string;
    ageRange: string;
    profession: string;
    interests: string[];
}

const genderOptions = [
    { value: "male", label: "Hombre" },
    { value: "female", label: "Mujer" },
    { value: "non-binary", label: "No binario" },
    { value: "prefer-not", label: "Prefiero no decirlo" },
];

const ageRangeOptions = [
    { value: "18-24", label: "18-24 años" },
    { value: "25-34", label: "25-34 años" },
    { value: "35-44", label: "35-44 años" },
    { value: "45-54", label: "45-54 años" },
    { value: "55-64", label: "55-64 años" },
    { value: "65+", label: "65+ años" },
    { value: "prefer-not", label: "Prefiero no decirlo" },
];

const professionOptions = [
    { value: "student", label: "Estudiante" },
    { value: "tech", label: "Tecnología / IT" },
    { value: "business", label: "Negocios / Finanzas" },
    { value: "healthcare", label: "Salud / Medicina" },
    { value: "education", label: "Educación" },
    { value: "creative", label: "Creativo / Diseño" },
    { value: "legal", label: "Legal / Derecho" },
    { value: "marketing", label: "Marketing / Comunicación" },
    { value: "engineering", label: "Ingeniería" },
    { value: "research", label: "Investigación / Ciencia" },
    { value: "retail", label: "Comercio / Retail" },
    { value: "freelance", label: "Freelance / Autónomo" },
    { value: "retired", label: "Jubilado/a" },
    { value: "other", label: "Otro" },
    { value: "prefer-not", label: "Prefiero no decirlo" },
];

const interestOptions = [
    { value: "technology", label: "Tecnología", icon: "💻" },
    { value: "business", label: "Negocios", icon: "💼" },
    { value: "politics", label: "Política", icon: "🏛️" },
    { value: "science", label: "Ciencia", icon: "🔬" },
    { value: "health", label: "Salud", icon: "🏥" },
    { value: "sports", label: "Deportes", icon: "⚽" },
    { value: "entertainment", label: "Entretenimiento", icon: "🎬" },
    { value: "culture", label: "Cultura", icon: "🎭" },
    { value: "art", label: "Arte", icon: "🎨" },
    { value: "fashion", label: "Moda", icon: "👗" },
    { value: "travel", label: "Viajes", icon: "✈️" },
    { value: "food", label: "Gastronomía", icon: "🍽️" },
    { value: "environment", label: "Medio Ambiente", icon: "🌱" },
    { value: "economy", label: "Economía", icon: "📈" },
    { value: "startups", label: "Startups", icon: "🚀" },
    { value: "ai", label: "Inteligencia Artificial", icon: "🤖" },
];

interface SelectDropdownProps {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    placeholder: string;
    icon?: React.ReactNode;
}

const SelectDropdown = ({ value, options, onChange, placeholder, icon }: SelectDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl",
                    "bg-white/5 border border-white/10 text-left",
                    "hover:bg-white/10 transition-colors",
                    value ? "text-white" : "text-white/50"
                )}
            >
                <div className="flex items-center gap-2">
                    {icon}
                    <span>{selectedOption?.label || placeholder}</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 py-2 rounded-xl bg-zinc-900 border border-white/10 shadow-xl max-h-60 overflow-y-auto"
                    >
                        {options.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full px-4 py-2 text-left hover:bg-white/10 transition-colors flex items-center justify-between",
                                    value === option.value && "text-emerald-400"
                                )}
                            >
                                {option.label}
                                {value === option.value && <Check className="w-4 h-4" />}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export const ProfileSurvey = () => {
    const { user } = useAuth();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [surveyData, setSurveyData] = useState<SurveyData>({
        gender: "",
        ageRange: "",
        profession: "",
        interests: [],
    });

    // Load existing survey data
    useEffect(() => {
        const loadSurveyData = async () => {
            if (!user) return;

            try {
                // @ts-ignore - user_surveys table needs to be created
                const { data, error } = await supabase
                    .from('user_surveys')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (data && !error) {
                    setSurveyData({
                        gender: data.gender || "",
                        ageRange: data.age_range || "",
                        profession: data.profession || "",
                        interests: data.interests || [],
                    });
                }
            } catch (err) {
                console.log('No existing survey data');
            }
        };

        loadSurveyData();
    }, [user]);

    const toggleInterest = (interest: string) => {
        setSurveyData(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest]
        }));
    };

    const handleSave = async () => {
        if (!user) return;

        setIsSaving(true);
        try {
            // @ts-ignore - user_surveys table needs to be created
            const { error } = await supabase
                .from('user_surveys')
                .upsert({
                    user_id: user.id,
                    gender: surveyData.gender,
                    age_range: surveyData.ageRange,
                    profession: surveyData.profession,
                    interests: surveyData.interests,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'user_id' });

            if (error) throw error;

            toast({
                title: "✨ Preferencias guardadas",
                description: "Gracias por ayudarnos a mejorar tu experiencia",
            });
        } catch (err) {
            console.error('Error saving survey:', err);
            toast({
                title: "Error",
                description: "No se pudieron guardar las preferencias",
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    const completionPercentage = [
        surveyData.gender,
        surveyData.ageRange,
        surveyData.profession,
        surveyData.interests.length > 0
    ].filter(Boolean).length * 25;

    return (
        <motion.div
            layout
            className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-2xl overflow-hidden"
        >
            {/* Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-left">
                        <h3 className="font-semibold text-white">Personaliza tu experiencia</h3>
                        <p className="text-sm text-white/60">
                            {completionPercentage === 100
                                ? "¡Perfil completado!"
                                : `${completionPercentage}% completado`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {completionPercentage < 100 && (
                        <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full transition-all"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                    )}
                    <ChevronDown className={cn(
                        "w-5 h-5 text-white/60 transition-transform",
                        isExpanded && "rotate-180"
                    )} />
                </div>
            </button>

            {/* Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-0 space-y-6">
                            {/* Privacy Disclaimer */}
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                                <Lock className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-white/70">
                                    <span className="font-medium text-white">Tu privacidad es importante.</span>{" "}
                                    Esta información es completamente privada y solo se usa para personalizar
                                    tu experiencia de noticias. Nunca compartiremos estos datos públicamente.
                                </p>
                            </div>

                            {/* Gender */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">Género</label>
                                <SelectDropdown
                                    value={surveyData.gender}
                                    options={genderOptions}
                                    onChange={(v) => setSurveyData(prev => ({ ...prev, gender: v }))}
                                    placeholder="Selecciona tu género"
                                    icon={<User className="w-4 h-4 text-white/40" />}
                                />
                            </div>

                            {/* Age Range */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">Rango de edad</label>
                                <SelectDropdown
                                    value={surveyData.ageRange}
                                    options={ageRangeOptions}
                                    onChange={(v) => setSurveyData(prev => ({ ...prev, ageRange: v }))}
                                    placeholder="Selecciona tu rango de edad"
                                />
                            </div>

                            {/* Profession */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-white/80">Profesión</label>
                                <SelectDropdown
                                    value={surveyData.profession}
                                    options={professionOptions}
                                    onChange={(v) => setSurveyData(prev => ({ ...prev, profession: v }))}
                                    placeholder="Selecciona tu profesión"
                                    icon={<Briefcase className="w-4 h-4 text-white/40" />}
                                />
                            </div>

                            {/* Interests */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Heart className="w-4 h-4 text-white/40" />
                                    <label className="text-sm font-medium text-white/80">
                                        Intereses <span className="text-white/40">(selecciona varios)</span>
                                    </label>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {interestOptions.map((interest) => {
                                        const isSelected = surveyData.interests.includes(interest.value);
                                        return (
                                            <button
                                                key={interest.value}
                                                type="button"
                                                onClick={() => toggleInterest(interest.value)}
                                                className={cn(
                                                    "px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
                                                    isSelected
                                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                                                        : "bg-white/5 text-white/60 border border-white/10 hover:bg-white/10"
                                                )}
                                            >
                                                <span>{interest.icon}</span>
                                                <span>{interest.label}</span>
                                                {isSelected && <Check className="w-3 h-3" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Save Button */}
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className={cn(
                                    "w-full py-3 rounded-xl font-medium transition-all",
                                    "bg-gradient-to-r from-emerald-500 to-emerald-600",
                                    "hover:from-emerald-400 hover:to-emerald-500",
                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                    "text-white shadow-lg shadow-emerald-500/20"
                                )}
                            >
                                {isSaving ? "Guardando..." : "Guardar preferencias"}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
