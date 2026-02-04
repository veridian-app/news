import { Home, Search, Coffee, Bell, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useDockVisibility } from "@/contexts/DockVisibilityContext";
import { motion, AnimatePresence } from "framer-motion";

const DockItem = ({ icon, path, isActive }: { icon: React.ReactNode, path: string, isActive: boolean }) => (
  <Link to={path} className={cn(
    "relative p-1.5 transition-all duration-300",
    isActive ? "text-white scale-110" : "text-white/40 hover:text-white/80"
  )}>
    {icon}
    {isActive && (
      <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full shadow-[0_0_6px_2px_rgba(16,185,129,0.5)]" />
    )}
  </Link>
);

export const BottomDock = () => {
  const location = useLocation();
  const { isVisible } = useDockVisibility();

  const isActive = (path: string) => location.pathname === path;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="fixed bottom-3 left-1/2 -translate-x-1/2 z-50 w-[85%] max-w-xs pb-[env(safe-area-inset-bottom)]"
        >
          <div className="flex items-center justify-between px-4 py-2.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl">
            <DockItem icon={<Home size={20} />} path="/" isActive={isActive("/")} />
            <DockItem icon={<Search size={20} />} path="/trends" isActive={isActive("/trends")} />

            {/* Central Café Button */}
            <div className="relative -top-4">
              <Link
                to="/cafe"
                className="flex items-center justify-center w-11 h-11 bg-gradient-to-tr from-green-600 to-emerald-500 rounded-full shadow-lg shadow-green-900/50 border-[3px] border-black active:scale-95 transition-transform"
              >
                <Coffee className="text-white" size={20} />
              </Link>
            </div>

            <DockItem icon={<Bell size={20} />} path="/notifications" isActive={isActive("/notifications")} />
            <DockItem icon={<User size={20} />} path="/profile" isActive={isActive("/profile")} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
