import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import VeridianLanding from "./pages/VeridianLanding";

import VeridianNews from "./pages/VeridianNews";
import LibraryView from "./pages/LibraryView";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import LegalNotice from "./pages/LegalNotice";
import CafeVeridian from "./pages/CafeVeridian";
import { AppNavigation } from "./components/AppNavigation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<VeridianLanding />} />
          <Route path="/veridian-news" element={<VeridianNews />} />
          <Route path="/library" element={<LibraryView />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/terminos" element={<TermsAndConditions />} />
          <Route path="/aviso-legal" element={<LegalNotice />} />
          <Route path="/cafe" element={<CafeVeridian />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
