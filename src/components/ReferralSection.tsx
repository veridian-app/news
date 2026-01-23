import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Copy, Check, Share2, Unlock, Gift, Key, Sparkles, Crown } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ReferralSectionProps {
  referralCode: string;
  referralCount: number;
  founderMember?: boolean | null;
  registrationOrder?: number | null;
  freeAccessUntil?: string | null;
}

export const ReferralSection = ({ referralCode, referralCount, founderMember, registrationOrder, freeAccessUntil }: ReferralSectionProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const referralUrl = `${window.location.origin}?ref=${referralCode}`;

  const rewardTiers = [
    {
      threshold: 1,
      title: "Mini Guía Antisesgos",
      description: "PDF para detectar titulares manipuladores y agendas ocultas.",
      icon: Gift,
    },
    {
      threshold: 3,
      title: "Oraculus + Beta",
      description: "Acceso al analizador y reserva de plaza en la beta de la plataforma.",
      icon: Key,
    },
    {
      threshold: 5,
      title: "Adelantos + 3 meses premium",
      description: "Todo antes que nadie y 3 meses gratis cuando lancemos.",
      icon: Sparkles,
    },
    {
      threshold: 10,
      title: "El Consejo",
      description: "Grupo privado que guía el roadmap y decide qué investigar.",
      icon: Crown,
    },
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      toast.success("¡Enlace copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Error al copiar");
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Únete a la lista de espera",
          text: "Únete a la revolución de las noticias objetivas",
          url: referralUrl,
        });
      } catch {
        // Usuario canceló
      }
    } else {
      copyToClipboard();
    }
  };

  const nextTier = rewardTiers.find((tier) => referralCount < tier.threshold);

  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/20 space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold">¡Comparte y gana recompensas reales!</h3>
        <p className="text-sm text-muted-foreground">
          Cada referido te acerca a la plataforma definitiva de noticias objetivas.
        </p>
        {founderMember ? (
          <p className="text-xs text-emerald-300">
            Eres analista fundador #{registrationOrder}. Acceso gratuito garantizado hasta{" "}
            {freeAccessUntil ? new Date(freeAccessUntil).toLocaleDateString("es-ES") : "dentro de 1 año"}.
          </p>
        ) : (
          nextTier && (
            <p className="text-xs text-primary">
              Te falta{nextTier.threshold - referralCount === 1 ? "" : "n"} {nextTier.threshold - referralCount} referido
              {nextTier.threshold - referralCount === 1 ? "" : "s"} para desbloquear: {nextTier.title}.
            </p>
          )
        )}
      </div>

      <div className="flex gap-2">
        <Input value={referralUrl} readOnly className="bg-background/50 border-border/50" />
        <Button
          size="icon"
          variant="outline"
          onClick={copyToClipboard}
          className="shrink-0 border-primary/30 hover:bg-primary/10"
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <Button onClick={shareNative} className="w-full bg-gradient-glow hover:shadow-glow transition-all duration-300">
        <Share2 className="mr-2 h-4 w-4" />
        Compartir enlace
      </Button>

      <div className="text-center text-xs text-muted-foreground">
        Tu código personal: <span className="font-mono font-bold text-primary">{referralCode}</span>
      </div>

      <div className="grid gap-3">
        {rewardTiers.map((tier) => {
          const unlocked = referralCount >= tier.threshold || (founderMember && tier.threshold === 3);
          const Icon = tier.icon;
          return (
            <div
              key={tier.threshold}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                unlocked ? "border-emerald-400/50 bg-emerald-500/10" : "border-border/50 bg-card/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${unlocked ? "bg-emerald-500/20" : "bg-muted"}`}>
                  <Icon className={`w-5 h-5 ${unlocked ? "text-emerald-300" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-[0.3em]">
                    {tier.threshold} referido{tier.threshold > 1 ? "s" : ""}
                  </p>
                  <p className="font-semibold text-sm">{tier.title}</p>
                </div>
                <span className={`ml-auto text-xs font-semibold ${unlocked ? "text-emerald-300" : "text-muted-foreground"}`}>
                  {unlocked ? "Desbloqueado" : `${Math.max(tier.threshold - referralCount, 0)} restantes`}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">{tier.description}</p>

              {tier.threshold === 3 && (
                <Button
                  onClick={() => navigate("/oraculus")}
                  disabled={!unlocked}
                  size="sm"
                  className="mt-3 w-full"
                  variant={unlocked ? "default" : "outline"}
                >
                  {unlocked ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Acceder a Oraculus
                    </>
                  ) : (
                    `Te faltan ${Math.max(3 - referralCount, 0)} referidos`
                  )}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};