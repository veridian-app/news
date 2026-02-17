
export interface SourceProfile {
    name: string;
    bias: 'Left' | 'Center-Left' | 'Center' | 'Center-Right' | 'Right' | 'Satire' | 'Pro-Science' | 'Official';
    reliability: 'High' | 'Mixed' | 'Low' | 'Unknown';
    description: string;
    type: 'News' | 'Encyclopedia' | 'Government' | 'Academic' | 'Social' | 'Other';
}

export const sourceDNA: Record<string, SourceProfile> = {
    // English / International
    'nytimes.com': {
        name: 'The New York Times',
        bias: 'Center-Left',
        reliability: 'High',
        description: 'Influential American newspaper of record.',
        type: 'News'
    },
    'foxnews.com': {
        name: 'Fox News',
        bias: 'Right',
        reliability: 'Mixed',
        description: 'US conservative cable news channel.',
        type: 'News'
    },
    'cnn.com': {
        name: 'CNN',
        bias: 'Center-Left',
        reliability: 'Mixed',
        description: 'Major US cable news network.',
        type: 'News'
    },
    'bbc.com': {
        name: 'BBC',
        bias: 'Center',
        reliability: 'High',
        description: 'British public service broadcaster.',
        type: 'News'
    },
    'bbc.co.uk': {
        name: 'BBC',
        bias: 'Center',
        reliability: 'High',
        description: 'British public service broadcaster.',
        type: 'News'
    },
    'reuters.com': {
        name: 'Reuters',
        bias: 'Center',
        reliability: 'High',
        description: 'International news agency known for neutrality.',
        type: 'News'
    },
    'apnews.com': {
        name: 'AP News',
        bias: 'Center',
        reliability: 'High',
        description: 'American non-profit news agency.',
        type: 'News'
    },
    'wikipedia.org': {
        name: 'Wikipedia',
        bias: 'Center',
        reliability: 'Mixed',
        description: 'Open collaborative encyclopedia.',
        type: 'Encyclopedia'
    },

    // Spanish / Latino
    'elpais.com': {
        name: 'El País',
        bias: 'Center-Left',
        reliability: 'High',
        description: 'Periódico global en español, línea progresista.',
        type: 'News'
    },
    'elmundo.es': {
        name: 'El Mundo',
        bias: 'Center-Right',
        reliability: 'High',
        description: 'Diario español de línea conservadora/liberal.',
        type: 'News'
    },
    'abc.es': {
        name: 'ABC',
        bias: 'Right',
        reliability: 'High',
        description: 'Periódico conservador y monárquico español.',
        type: 'News'
    },
    'elconfidencial.com': {
        name: 'El Confidencial',
        bias: 'Center-Right',
        reliability: 'High',
        description: 'Nativo digital español centrado en economía.',
        type: 'News'
    },
    'eldiario.es': {
        name: 'elDiario.es',
        bias: 'Left',
        reliability: 'High',
        description: 'Nativo digital español progresista.',
        type: 'News'
    },
    'lavanguardia.com': {
        name: 'La Vanguardia',
        bias: 'Center',
        reliability: 'High',
        description: 'Diario centrista de Barcelona.',
        type: 'News'
    },
    'rtve.es': {
        name: 'RTVE',
        bias: 'Center',
        reliability: 'High',
        description: 'Radiotelevisión pública española.',
        type: 'News'
    },
    'clarin.com': {
        name: 'Clarín',
        bias: 'Center-Right',
        reliability: 'Mixed',
        description: 'Mayor diario de Argentina.',
        type: 'News'
    },
    'lanacion.com.ar': {
        name: 'La Nación',
        bias: 'Center-Right',
        reliability: 'High',
        description: 'Diario conservador de referencia en Argentina.',
        type: 'News'
    },

    // Tech / Science
    'nature.com': {
        name: 'Nature',
        bias: 'Pro-Science',
        reliability: 'High',
        description: 'Premier scientific journal.',
        type: 'Academic'
    },
    'science.org': {
        name: 'Science',
        bias: 'Pro-Science',
        reliability: 'High',
        description: 'Premier scientific journal.',
        type: 'Academic'
    },
    'techcrunch.com': {
        name: 'TechCrunch',
        bias: 'Pro-Science',
        reliability: 'High',
        description: 'Technology news and startups.',
        type: 'News'
    }
};

export function getSourceDNA(url: string): SourceProfile | null {
    try {
        const domain = new URL(url).hostname.replace('www.', '').toLowerCase();

        // Exact match
        if (sourceDNA[domain]) return sourceDNA[domain];

        // Subdomain or parent match
        const parts = domain.split('.');
        if (parts.length > 2) {
            const parent = parts.slice(parts.length - 2).join('.');
            if (sourceDNA[parent]) return sourceDNA[parent];
        }

        // TLD Check fallback
        if (domain.endsWith('.gov') || domain.endsWith('.gob.es')) {
            return { name: domain, bias: 'Official', reliability: 'High', description: 'Official Government Source', type: 'Government' };
        }
        if (domain.endsWith('.edu')) {
            return { name: domain, bias: 'Pro-Science', reliability: 'High', description: 'Academic Institution', type: 'Academic' };
        }

        return null;
    } catch (e) {
        return null;
    }
}
