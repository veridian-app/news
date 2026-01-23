import { BottomDock } from "../components/BottomDock";
import { Settings, User, Bell, Shield } from "lucide-react";

const Profile = () => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-20" style={{ paddingBottom: `calc(60px + env(safe-area-inset-bottom))` }}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Perfil</h1>
              <p className="text-muted-foreground">Gestiona tu cuenta y preferencias</p>
            </div>
          </div>

          {/* Settings Sections */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <Settings className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">Ajustes</h3>
                  <p className="text-sm text-muted-foreground">Configuración general</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">Notificaciones</h3>
                  <p className="text-sm text-muted-foreground">Gestiona tus alertas</p>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">Privacidad</h3>
                  <p className="text-sm text-muted-foreground">Controla tu información</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Dock Navigation */}
      <BottomDock />
    </div>
  );
};

export default Profile;

