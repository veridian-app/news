import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { DockVisibilityProvider } from "./contexts/DockVisibilityContext";
import { SearchProvider } from "./contexts/SearchContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { BottomDock } from "./components/BottomDock";
import { SearchModal } from "./components/SearchModal";
import { ShieldCheck } from "lucide-react";
// import { motion } from "framer-motion";

import VeridianLanding from "./pages/VeridianLanding";
import VeridianNews from "./pages/VeridianNews";
import LibraryView from "./pages/LibraryView";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import LegalNotice from "./pages/LegalNotice";
import CafeVeridian from "./pages/CafeVeridian";
import CategoriesPage from "./pages/CategoriesPage";
import Oraculus from "./pages/Oraculus";

const queryClient = new QueryClient();

const RootRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020305] flex flex-col items-center justify-center space-y-6">
      <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full" />
          <div className="relative w-16 h-16 rounded-2xl bg-zinc-900 border border-emerald-500/30 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-[0.4em] animate-pulse">Sincronizando Terminal</p>
          <p className="text-[8px] font-mono text-white/20 uppercase tracking-widest">Protocolo de Acceso Seguro v1.2</p>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? <VeridianNews /> : <VeridianLanding />;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  return (
    <>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/landing" element={<VeridianLanding />} />
        <Route path="/noticias" element={<Navigate to="/" replace />} />
        <Route path="/veridian-news" element={<Navigate to="/" replace />} />
        <Route path="/categorias" element={<CategoriesPage />} />
        <Route path="/privacidad" element={<PrivacyPolicy />} />
        <Route path="/terminos" element={<TermsAndConditions />} />
        <Route path="/aviso-legal" element={<LegalNotice />} />

        <Route path="/library" element={
          <ProtectedRoute>
            <LibraryView />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cafe" element={
          <ProtectedRoute>
            <CafeVeridian />
          </ProtectedRoute>
        } />
        <Route path="/oraculus" element={
          <ProtectedRoute>
            <Oraculus />
          </ProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
      <SearchModal />
      {isAuthenticated && <BottomDock />}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SearchProvider>
            <DockVisibilityProvider>
              <AppContent />
            </DockVisibilityProvider>
          </SearchProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
