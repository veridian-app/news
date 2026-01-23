import { useNavigate, useLocation } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Newspaper, BookOpen } from "lucide-react";

export const AppNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname.startsWith("/oraculus")) return "oraculus";
    if (location.pathname.startsWith("/veridian-news")) return "veridian-news";
    if (location.pathname.startsWith("/library")) return "library";
    return "oraculus";
  };

  const handleTabChange = (value: string) => {
    if (value === "oraculus") {
      navigate("/oraculus");
    } else if (value === "veridian-news") {
      navigate("/veridian-news");
    } else if (value === "library") {
      navigate("/library");
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4">
        <Tabs value={getActiveTab()} onValueChange={handleTabChange} className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-none h-16">
            <TabsTrigger 
              value="oraculus" 
              className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 hover:text-white transition-colors"
            >
              <Brain className="w-4 h-4" />
              Oraculus
            </TabsTrigger>
            <TabsTrigger 
              value="veridian-news"
              className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 hover:text-white transition-colors"
            >
              <Newspaper className="w-4 h-4" />
              Veridian News
            </TabsTrigger>
            <TabsTrigger 
              value="library"
              className="flex items-center gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/70 hover:text-white transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Guardados
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};


