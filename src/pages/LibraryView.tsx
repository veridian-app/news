import { useState } from "react";
import { Search, Download, TrendingUp, Globe, Heart, Zap, FileText, BarChart3 } from "lucide-react";
import { BottomDock } from "../components/BottomDock";
import "./LibraryView.css";

interface SavedItem {
  id: string;
  title: string;
  type: 'economic' | 'international' | 'health' | 'tech' | 'politics';
  savedAt: Date;
  category: string;
}

const LibraryView = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todo");

  // Datos simulados
  const savedItems: SavedItem[] = [
    {
      id: "1",
      title: "Inflación en España baja al 3.2% en noviembre, según datos del INE",
      type: "economic",
      savedAt: new Date(2024, 10, 24, 14, 0),
      category: "Economía"
    },
    {
      id: "2",
      title: "Cumbre del G20: Acuerdos sobre cambio climático y comercio internacional",
      type: "international",
      savedAt: new Date(2024, 10, 23, 10, 30),
      category: "Política"
    },
    {
      id: "3",
      title: "Nuevo estudio sobre eficacia de vacunas contra variantes emergentes",
      type: "health",
      savedAt: new Date(2024, 10, 22, 16, 45),
      category: "Salud"
    },
    {
      id: "4",
      title: "Avances en inteligencia artificial: GPT-5 muestra mejoras en razonamiento",
      type: "tech",
      savedAt: new Date(2024, 10, 21, 9, 15),
      category: "Tech"
    },
    {
      id: "5",
      title: "PIB de la Eurozona crece 0.3% en el tercer trimestre",
      type: "economic",
      savedAt: new Date(2024, 10, 20, 11, 20),
      category: "Economía"
    },
    {
      id: "6",
      title: "Tensiones geopolíticas en Oriente Medio: Análisis de expertos",
      type: "international",
      savedAt: new Date(2024, 10, 19, 13, 10),
      category: "Política"
    },
    {
      id: "7",
      title: "Investigación sobre longevidad: Descubrimientos en terapia génica",
      type: "health",
      savedAt: new Date(2024, 10, 18, 15, 30),
      category: "Salud"
    },
    {
      id: "8",
      title: "Quantum computing: IBM anuncia nuevo procesador de 1000 qubits",
      type: "tech",
      savedAt: new Date(2024, 10, 17, 8, 45),
      category: "Tech"
    },
  ];

  const categories = ["Todo", "Economía", "Política", "Salud", "Tech"];

  const getTypeIcon = (type: SavedItem['type']) => {
    switch (type) {
      case 'economic':
        return <TrendingUp className="w-4 h-4" />;
      case 'international':
        return <Globe className="w-4 h-4" />;
      case 'health':
        return <Heart className="w-4 h-4" />;
      case 'tech':
        return <Zap className="w-4 h-4" />;
      case 'politics':
        return <FileText className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'][date.getMonth()];
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} • ${hours}:${minutes}`;
  };

  const getTopCategory = () => {
    const categoryCounts = savedItems.reduce((acc, item) => {
      acc[item.category] = (acc[item.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0];
    return topCategory ? topCategory[0] : "Ninguno";
  };

  const filteredItems = savedItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "Todo" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const activeThemes = new Set(savedItems.map(item => item.category)).size;

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
          <div key={item.id} className="item-card">
            <div className="card-header">
              <div className="card-icon">
                {getTypeIcon(item.type)}
              </div>
            </div>
            <div className="card-body">
              <h3 className="card-title">{item.title}</h3>
            </div>
            <div className="card-footer">
              <span className="card-date">{formatDate(item.savedAt)}</span>
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

