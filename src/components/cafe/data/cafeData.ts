
export type CafeContentType = 'headline' | 'standard' | 'compact' | 'visual' | 'deep-dive';

export interface BaseCafeItem {
    id: string;
    type: CafeContentType;
}

export interface HeadlineItem extends BaseCafeItem {
    type: 'headline';
    title: string;
    subtitle: string;
    category: string;
    readTime: string;
    content: string;
    imageUrl: string;
    author?: string;
}

export interface StandardItem extends BaseCafeItem {
    type: 'standard';
    title: string;
    category: string;
    readTime: string;
    content: string;
    imageUrl: string;
}

export interface CompactItem extends BaseCafeItem {
    type: 'compact';
    title: string; // Section title like "Espresso Shots"
    items: {
        id: string;
        title: string;
        summary: string;
        details?: string; // New field for expandable content
        category: string;
        time: string;
    }[];
}

export interface VisualItem extends BaseCafeItem {
    type: 'visual';
    title: string;
    imageUrl: string;
    caption: string;
    content?: string; // New field for expandable content
    source?: string;
}

export interface DeepDiveItem extends BaseCafeItem {
    type: 'deep-dive';
    title: string;
    subtitle: string;
    category: string;
    readTime: string;
    content: string;
    imageUrl: string;
}

export type CafeItem = HeadlineItem | StandardItem | CompactItem | VisualItem | DeepDiveItem;

export interface CafeConsensusPoll {
    id: string;
    question: string;
    options: {
        id: string;
        label: string;
        votes: number; // For simulation
    }[];
    totalVotes: number;
}

export const CAFE_NEWS: CafeItem[] = [
    {
        id: "1",
        type: "headline",
        title: "La Revolución Silenciosa de la Fusión Nuclear",
        subtitle: "Cómo un reactor en Francia podría cambiar el destino energético del planeta para siempre.",
        category: "Deep Tech",
        readTime: "4 min",
        author: "Elena R. Veridian",
        imageUrl: "https://images.unsplash.com/photo-1518364538800-6bae3c2ea0f2?auto=format&fit=crop&q=80&w=2000",
        content: `En las colinas de Cadarache, al sur de Francia, se está construyendo la máquina más compleja jamás diseñada por el ser humano: **el ITER**. No es solo un experimento científico; es la apuesta de 35 naciones para replicar, aquí en la Tierra, **el mismo proceso que alimenta a las estrellas**.\n\nDurante décadas, la **fusión nuclear** —la unión de núcleos atómicos para liberar energía— ha sido el "santo grial" de la física. A diferencia de la fisión (usada en las centrales actuales), la fusión no genera residuos radiactivos de larga duración ni conlleva el riesgo de fusiones del núcleo descontroladas. Y lo más importante: su combustible es **prácticamente inagotable**, derivado del agua de mar.\n\n"Estamos, literalmente, intentando poner el sol en una botella", explica el Dr. Aris Vourdas, físico del proyecto. La "botella" es un tokamak, una cámara de vacío en forma de donut donde potentes campos magnéticos confinan un plasma a **150 millones de grados Celsius**, diez veces más caliente que el núcleo del Sol.\n\nPero el camino no ha sido fácil. Retrasos técnicos, sobrecostos y la inmensa dificultad de ingeniería han marcado el proyecto. Sin embargo, 2024 ha traído avances cruciales. Nuevos **imanes superconductores**, capaces de levantar un portaaviones, han sido instalados con éxito.\n\nLa comunidad científica contiene la respiración: si ITER logra generar más energía de la que consume, la puerta a una era de **energía limpia e ilimitada** se abrirá de par en par. Mientras tanto, startups privadas en EE.UU. y Reino Unido están compitiendo con reactores más pequeños y ágiles. La carrera por la fusión ya no es solo científica, es geopolítica y comercial. Y el ganador podría definir la economía del siglo XXI.`
    },
    {
        id: "2",
        type: "standard",
        title: "El Renacimiento de los Trenes Nocturnos",
        category: "Viajes & Sostenibilidad",
        readTime: "3 min",
        imageUrl: "https://images.unsplash.com/photo-1474487548417-781cb71495f3?auto=format&fit=crop&q=80&w=1000",
        content: "Europa está redescubriendo el romance y la practicidad de viajar mientras duermes. Una nueva red de **trenes nocturnos** está conectando capitales como París, Berlín, Viena y Zúrich, ofreciendo una alternativa baja en carbono a los vuelos de corta distancia.\n\nOperadores como **ÖBB Nightjet** están invirtiendo en vagones modernos con cápsulas privadas y diseño minimalista, lejos de las literas incómodas del pasado. 'Es recuperar el tiempo', dice un pasajero frecuente. 'Te duermes en el centro de una ciudad y despiertas en el corazón de otra'.\n\nEste resurgimiento es impulsado tanto por la demanda de los viajeros conscientes del clima como por políticas gubernamentales. Francia, por ejemplo, ha prohibido vuelos domésticos donde existe una alternativa en tren de menos de 2.5 horas."
    },
    {
        id: "3",
        type: "compact", // Espresso Shots
        title: "Espresso Shots",
        items: [
            {
                id: "c1",
                title: "Apple Vision Pro 2",
                summary: "Rumores apuntan a una versión 'Air' más ligera.",
                details: "Fuentes internas sugieren que Apple busca reducir el peso en un **40%** y el precio a **$1,500** para masificar la computación espacial. Se espera un lanzamiento a finales de 2026.",
                category: "Tech",
                time: "Take"
            },
            {
                id: "c2",
                title: "Récord en el Prado",
                summary: "El museo madrileño supera los 3.5M de visitantes.",
                details: "El auge del turismo post-pandemia y las exposiciones temporales de **Guido Reni y Picasso** han impulsado estas cifras históricas, aunque la dirección advierte sobre la saturación de las salas principales.",
                category: "Cultura",
                time: "Dato"
            },
            {
                id: "c3",
                title: "Bitcoin Halving",
                summary: "Analistas predicen volatilidad extrema.",
                details: "Históricamente, el **halving** (reducción de la recompensa de minado) precede a un mercado alcista, pero la situación macroeconómica actual con tipos de interés altos podría romper este patrón.",
                category: "Finanzas",
                time: "Take"
            }
        ]
    },
    {
        id: "4",
        type: "visual",
        title: "La Epidemia Silenciosa",
        imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
        caption: "La inversión global en salud mental ha crecido un 40% desde 2020.",
        content: "A pesar del aumento en la inversión, la salud mental sigue representando menos del **2% de los presupuestos sanitarios** nacionales en promedio.\n\nLa OMS advierte que sin un cambio estructural, el costo económico de la pérdida de productividad superará los **6 billones de dólares** para 2030.\n\nLa gráfica muestra una correlación directa entre la inversión preventiva y la reducción de bajas laborales en países nórdicos."
    },
    {
        id: "5",
        type: "standard",
        title: "La Arquitectura del Bienestar",
        category: "Diseño",
        readTime: "2 min",
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000",
        content: "Nuestros edificios nos están enfermando, pero una nueva ola de arquitectos quiere curarnos. El **diseño biofílico** —la integración de naturaleza en espacios construidos— está pasando de ser una tendencia estética a una necesidad de salud pública.\n\nEstudios recientes demuestran que la incorporación de luz natural, vegetación y materiales orgánicos en oficinas reduce el estrés un **15%** y aumenta la productividad un **6%**. No se trata solo de poner plantas en las esquinas; es repensar la ventilación, los flujos de movimiento y la conexión visual con el exterior."
    },
    {
        id: "6",
        type: "deep-dive",
        title: "La Psicología del 'Doomscrolling'",
        subtitle: "¿Por qué no podemos dejar de mirar noticias malas? La ciencia detrás de nuestra adicción a la negatividad.",
        category: "Psicología",
        readTime: "5 min",
        imageUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000",
        content: "Es la 1:00 AM. Tienes que levantarte en seis horas. Pero ahí estás, deslizando el dedo hacia arriba, consumiendo una tragedia tras otra: crisis climática, inestabilidad política, escándalos.\n\nLos psicólogos evolutivos llaman a esto **'sesgo de negatividad'**. Nuestro cerebro está cableado para priorizar la información peligrosa sobre la placentera porque, ancestralmente, ignorar un peligro podía ser fatal. Las redes sociales han hackeado este mecanismo de supervivencia, convirtiéndolo en un bucle de retención.\n\n'No es masoquismo, es **vigilancia**', explica la Dra. Sarah Rose, neurocientífica. 'Tu cerebro cree que si recopila suficiente información sobre la amenaza, podrá controlarla'. El problema es que en el mundo digital, la amenaza es abstracta y constante, y la 'solución' nunca llega.\n\nLa cura no es la ignorancia, sino el **consumo intencional**. Plataformas como Veridian buscan romper este ciclo ofreciendo finitud: un inicio y un final claro. Saber que 'ya estás al día' permite al cerebro desactivar la alerta y descansar. La información debe ser una herramienta para entender el mundo, no un peso que nos impida vivir en él."
    }
];

export const DAILY_CONSENSUS: CafeConsensusPoll = {
    id: "p1",
    question: "Fusión Nuclear: ¿Crees que llegará a tiempo para frenar el cambio climático?",
    options: [
        { id: "opt1", label: "Sí, es nuestra mejor esperanza", votes: 8420 },
        { id: "opt2", label: "No, llegará demasiado tarde", votes: 3150 },
        { id: "opt3", label: "Solo es una distracción costosa", votes: 1240 }
    ],
    totalVotes: 12810
};

