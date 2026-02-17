import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { DockVisibilityProvider } from "./contexts/DockVisibilityContext";
import { SearchProvider } from "./contexts/SearchContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";

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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SearchProvider>
            <DockVisibilityProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<VeridianLanding />} />
                <Route path="/privacidad" element={<PrivacyPolicy />} />
                <Route path="/terminos" element={<TermsAndConditions />} />
                <Route path="/aviso-legal" element={<LegalNotice />} />

                {/* Protected routes - require authentication */}
                <Route path="/veridian-news" element={
                  <ProtectedRoute>
                    <VeridianNews />
                  </ProtectedRoute>
                } />
                <Route path="/library" element={
                  <ProtectedRoute>
                    <LibraryView />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />
                <Route path="/cafe" element={
                  <ProtectedRoute>
                    <CafeVeridian />
                  </ProtectedRoute>
                } />
                <Route path="/categorias" element={
                  <ProtectedRoute>
                    <CategoriesPage />
                  </ProtectedRoute>
                } />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </DockVisibilityProvider>
          </SearchProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
