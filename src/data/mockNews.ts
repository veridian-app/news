import { NewsItem } from "../utils/news-utils";

export const mockNews: NewsItem[] = [
  {
    id: 'mock-geo-1',
    title: 'GEOPOLÍTICA: Tensión en el Estrecho de Ormuz por movimientos navales',
    summary: 'Nuevos informes de inteligencia sugieren un despliegue masivo en la zona estratégica.',
    content: 'La situación en el Estrecho de Ormuz ha alcanzado un nuevo nivel de alerta tras el despliegue de fragatas en la zona. Los analistas de Veridian sugieren que este movimiento geopolítico podría afectar los precios del crudo global en las próximas 48 horas. La OTAN sigue de cerca los movimientos.',
    image: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=800',
    date: new Date().toISOString(),
    source: 'Veridian Intel',
    category: 'geopolítica'
  },
  {
    id: 'mock-tech-1',
    title: 'TECNOLOGÍA: OpenAI anuncia GPT-5 con razonamiento avanzado',
    summary: 'La nueva arquitectura promete capacidades de planificación y resolución de problemas complejos.',
    content: 'OpenAI ha revelado los primeros detalles de su próxima frontera en IA. El modelo presenta una mejora sustancial en el razonamiento lógico y la capacidad de interactuar con herramientas externas de manera autónoma.',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800',
    date: new Date().toISOString(),
    source: 'Veridian Tech',
    category: 'tecnología'
  },
  {
    id: 'mock-esp-1',
    title: 'ESPAÑA: Nueva ley de startups entra en vigor para fomentar la inversión',
    summary: 'El Gobierno busca posicionar al país como un hub tecnológico en el sur de Europa.',
    content: 'La Moncloa ha ratificado el paquete de medidas que facilitará la creación de empresas tecnológicas en territorio español. La ley incluye incentivos fiscales para nómadas digitales y fundadores.',
    image: 'https://images.unsplash.com/photo-1543783232-af9942f4a47d?w=800',
    date: new Date().toISOString(),
    source: 'EFE / Veridian',
    category: 'españa'
  },
  {
    id: 'mock-emp-1',
    title: 'EMPRESA: Apple supera las expectativas de ingresos en el último trimestre',
    summary: 'Las ventas del iPhone y los servicios digitales impulsan las acciones a máximos históricos.',
    content: 'Los resultados financieros de Cupertino muestran una resiliencia sorprendente en el mercado global. El CEO Tim Cook destacó el crecimiento en mercados emergentes y la adopción de servicios de suscripción.',
    image: 'https://images.unsplash.com/photo-1510511459019-5dee997d7db4?w=800',
    date: new Date().toISOString(),
    source: 'Bloomberg',
    category: 'empresa'
  },
  {
    id: 'mock-pol-1',
    title: 'POLÍTICA: El Congreso debate la reforma de las pensiones',
    summary: 'Sesión clave para el futuro de la sostenibilidad financiera del sistema público.',
    content: 'Los grupos parlamentarios se reúnen para votar las enmiendas al proyecto de ley de pensiones. La tensión política es máxima ante la falta de consenso en algunos puntos críticos.',
    image: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800',
    date: new Date().toISOString(),
    source: 'Veridian News',
    category: 'política'
  },
  {
    id: 'mock-dep-1',
    title: 'DEPORTES: España se prepara para la final del Mundial',
    summary: 'La selección absoluta ultima los detalles del entrenamiento previo al gran encuentro.',
    content: 'El ambiente en la concentración es de máximo optimismo. Los jugadores clave se han recuperado de sus molestias y el seleccionador confía en un planteamiento táctico agresivo para la final.',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800',
    date: new Date().toISOString(),
    source: 'Marca / Veridian',
    category: 'deportes'
  },
  {
    id: 'mock-int-1',
    title: 'INTERNACIONAL: La ONU advierte sobre la crisis humanitaria en el Sahel',
    summary: 'Nuevos informes alertan sobre la escasez de recursos y la inestabilidad en la región.',
    content: 'La comunidad internacional se moviliza para enviar ayuda de emergencia a las zonas más afectadas. El secretario general de la ONU pide un cese de hostilidades inmediato.',
    image: 'https://images.unsplash.com/photo-1532375811408-16e163d131ec?w=800',
    date: new Date().toISOString(),
    source: 'Reuters',
    category: 'internacional'
  }
];
