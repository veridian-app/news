import { Home, Search, Plus, Bell, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const DockItem = ({ icon, path, isActive }: { icon: React.ReactNode, path: string, isActive: boolean }) => (
  <Link to={path} className={cn(
    "relative p-2 transition-all duration-300",
    isActive ? "text-white scale-110" : "text-white/40 hover:text-white/80"
  )}>
    {icon}
    {isActive && (
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-500 rounded-full shadow-[0_0_8px_2px_rgba(59,130,246,0.5)]" />
    )}
  </Link>
);

export const BottomDock = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-between px-6 py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
        <DockItem icon={<Home size={24} />} path="/" isActive={isActive("/")} />
        <DockItem icon={<Search size={24} />} path="/trends" isActive={isActive("/trends")} />

        {/* Central Add Button */}
        <div className="relative -top-6">
          <button className="flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-900/50 border-4 border-black active:scale-95 transition-transform">
            <Plus className="text-white" size={28} />
          </button>
        </div>

        <DockItem icon={<Bell size={24} />} path="/notifications" isActive={isActive("/notifications")} />
        <DockItem icon={<User size={24} />} path="/profile" isActive={isActive("/profile")} />
      </div>
    </div>
  );
};
