import { BottomDock } from "../components/BottomDock";
import { ProfileSurvey } from "../components/profile/ProfileSurvey";
import { useAuth } from "@/contexts/AuthContext";
import { Settings, User, Bell, Shield, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-black text-white pt-6" style={{ paddingBottom: `calc(80px + env(safe-area-inset-bottom))` }}>
      <div className="container mx-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <User className="w-8 h-8 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">Perfil</h1>
              {isAuthenticated && user?.email && (
                <p className="text-white/60 text-sm">{user.email}</p>
              )}
            </div>
          </div>

          {/* Profile Survey */}
          {isAuthenticated && <ProfileSurvey />}

          {/* Settings Sections */}
          <div className="space-y-3">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <Settings className="w-5 h-5 text-emerald-400" />
                <div className="flex-1">
                  <h3 className="font-semibold">Ajustes</h3>
                  <p className="text-sm text-white/60">Configuración general</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center gap-4">
                <Bell className="w-5 h-5 text-emerald-400" />
                <div className="flex-1">
                  <h3 className="font-semibold">Notificaciones</h3>
                  <p className="text-sm text-white/60">Gestiona tus alertas</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => navigate('/privacidad')}
              className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <Shield className="w-5 h-5 text-emerald-400" />
                <div className="flex-1">
                  <h3 className="font-semibold">Privacidad</h3>
                  <p className="text-sm text-white/60">Controla tu información</p>
                </div>
              </div>
            </div>

            {/* Sign Out */}
            {isAuthenticated && (
              <button
                onClick={handleSignOut}
                className="w-full bg-red-500/10 border border-red-500/20 rounded-xl p-4 hover:bg-red-500/20 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <LogOut className="w-5 h-5 text-red-400" />
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-red-400">Cerrar sesión</h3>
                    <p className="text-sm text-white/60">Salir de tu cuenta</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Dock Navigation */}
      <BottomDock />
    </div>
  );
};

export default Profile;
