import { Home, LayoutGrid, Search, Coffee, Brain, Bookmark, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useDockVisibility } from "@/contexts/DockVisibilityContext";
import { useSearch } from "@/contexts/SearchContext";

const DockItem = ({ icon, path, isActive }: { icon: React.ReactNode, path: string, isActive: boolean }) => (
  <Link to={path} className={cn(
    "relative flex flex-col items-center justify-center transition-all duration-300",
    isActive ? "text-emerald-400 scale-110" : "text-white/40 hover:text-white/80"
  )}>
    {icon}
    {isActive && (
      <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,1)]" />
    )}
  </Link>
);

const SearchButton = ({ isActive }: { isActive: boolean }) => {
  const { openSearch, searchQuery } = useSearch();

  return (
    <button
      onClick={openSearch}
      className={cn(
        "relative flex flex-col items-center justify-center transition-all duration-300",
        isActive || searchQuery ? "text-emerald-400 scale-110" : "text-white/40 hover:text-white/80"
      )}
    >
      <Search size={24} />
      {(isActive || searchQuery) && (
        <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,1)]" />
      )}
    </button>
  );
};

import { createPortal } from "react-dom";

export const BottomDock = () => {
  const location = useLocation();
  const { isVisible } = useDockVisibility();
  const { showSearchModal } = useSearch();

  const isActive = (path: string) => {
    if (path === "/" && location.pathname !== "/") return false;
    return location.pathname.startsWith(path);
  };

  const isCafeActive = isActive("/cafe");
  const isProfileActive = isActive("/profile");

  // Usamos createPortal para asegurar que el dock esté por encima de TODO
  return createPortal(
    <>
      {/* Tactical Frame Navigation Dock - AT THE VERY BOTTOM */}
      <div 
        style={{ 
          position: 'fixed', 
          bottom: '0', 
          left: '0',
          right: '0', 
          zIndex: 1000000,
          pointerEvents: 'auto',
          display: 'flex',
          justifyContent: 'center',
          background: '#020305',
          borderTop: '1px solid rgba(16, 185, 129, 0.4)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.8)'
        }}
      >
        <div className="flex items-center w-full max-w-lg px-8 py-4 justify-between relative">
          {/* Visual Indicator of Active Frame */}
          <div className="absolute top-0 left-0 w-full h-[1px] bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]" />
          
          <DockItem icon={<Home size={24} />} path="/" isActive={location.pathname === "/" || location.pathname === "/veridian-news"} />
          <SearchButton isActive={showSearchModal} />

          {/* Hub Central Táctico - Solid Frame Hub */}
          <Link
            to="/cafe"
            className="relative flex items-center justify-center -mt-8"
          >
            <div className={cn(
              "w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 border-4 border-[#020305] shadow-[0_5px_20px_rgba(0,0,0,0.5)]",
              isCafeActive ? "bg-emerald-400 scale-110 shadow-[0_0_40px_rgba(16,185,129,0.7)]" : "bg-emerald-500 hover:bg-emerald-400"
            )}>
              <Coffee className="text-black" size={30} />
            </div>
          </Link>

          <DockItem icon={<LayoutGrid size={24} />} path="/categorias" isActive={isActive("/categorias")} />
          <DockItem icon={<User size={24} />} path="/profile" isActive={isProfileActive} />
          
        </div>
      </div>
    </>,
    document.body
  );
};
