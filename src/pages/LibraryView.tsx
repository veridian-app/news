import { useState } from "react";
import { Search, Download, TrendingUp, Globe, Heart, Zap, FileText, BarChart3, Bookmark } from "lucide-react";
import { BottomDock } from "../components/BottomDock";
import "./LibraryView.css";
import { useSavedNews } from "@/hooks/use-saved-news";
import { useNavigate } from "react-router-dom";

const LibraryView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todo");
  const { savedNews } = useSavedNews();
  const navigate = useNavigate();

  const categories = ["Todo", "Economía", "Política", "Salud", "Tech", "Ciencia", "Tecnología", "Deportes", "Cultura", "Medioambiente", "Internacional", "Educación", "Sociedad"];

  // Helper to guess category type for icon
  const getCategoryType = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('econ') || cat.includes('finan') || cat.includes('mercado')) return 'economic';
    if (cat.includes('polít') || cat.includes('gob') || cat.includes('elecc')) return 'politics';
    if (cat.includes('inter') || cat.includes('mund') || cat.includes('glob')) return 'international';
    if (cat.includes('salud') || cat.includes('med') || cat.includes('sanid')) return 'health';
    if (cat.includes('tech') || cat.includes('tecn') || cat.includes('ia') || cat.includes('soft') || cat.includes('app')) return 'tech';
    return 'general';
  };

  const getTypeIcon = (category: string) => {
    const type = getCategoryType(category);
    switch (type) {
      case 'economic': return <TrendingUp className="w-4 h-4" />;
      case 'international': return <Globe className="w-4 h-4" />;
      case 'health': return <Heart className="w-4 h-4" />;
      case 'tech': return <Zap className="w-4 h-4" />;
      case 'politics': return <FileText className="w-4 h-4" />;
      default: return <Bookmark className="w-4 h-4" />;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const day = date.getDate().toString().padStart(2, '0');
      const month = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'][date.getMonth()];
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${day} ${month} • ${hours}:${minutes}`;
    } catch (e) {
      return '';
    }
  };

  const getCategoryFromItem = (item: any) => {
    // Logic to detect category if not present, or default to General
    // Since we don't save category in NewsItem interface used in useSavedNews yet,
    // we might need to derive it or update the interface. 
    // For now, let's use a simple heuristic or default.
    return "General";
    // TODO: Improve this detailed logic later or import detectCategory
  };

  const getTopCategory = () => {
    if (savedNews.length === 0) return "Ninguno";
    // Simplified top category logic
    return "General";
  };

  const filteredItems = savedNews.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    // For now, assuming everything is "General" or we need to add category to saved item
    // const matchesCategory = selectedCategory === "Todo" || getCategoryFromItem(item) === selectedCategory; 
    // To mimic behavior:
    return matchesSearch;
  });

  const activeThemes = 1; // Simplified for now

  return (
    <div className="library-view">
      {/* Cabecera de Valor */}
      <header className="library-header">
        <div className="header-content">
          <h1 className="header-title">Mi Dossier</h1>
          <div className="header-stats">
            <span className="stat-item">{savedItems.length} Datos guardados</span>
            <span className="stat-divider">|</span>
            <span className="stat-item">{activeThemes} Temas activos</span>
            <span className="stat-divider">|</span>
            <span className="stat-item">Top tema: {getTopCategory()}</span>
          </div>
        </div>
      </header>

      {/* Buscador Inteligente */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Buscar en mis datos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Colecciones Automáticas */}
      <div className="categories-container">
        <div className="categories-scroll">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-chip ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Archivos */}
      <div className="items-grid">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="item-card cursor-pointer active:scale-95 transition-transform"
            onClick={() => navigate(`/veridian-news?newsId=${item.id}`)}
          >
            <div className="card-header">
              <div className="card-icon">
                {getTypeIcon("General")}
              </div>
            </div>
            <div className="card-body">
              <h3 className="card-title line-clamp-3">{item.title}</h3>
            </div>
            <div className="card-footer">
              <span className="card-date">{formatDate(item.date)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Botón Flotante Exportar */}
      <button className="export-button" title="Exportar datos">
        <Download className="w-5 h-5" />
      </button>

      {/* Bottom Dock Navigation */}
      <BottomDock />
    </div>
  );
};

export default LibraryView;

