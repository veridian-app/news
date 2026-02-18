import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import https from 'https';
import sharp from 'sharp';

// ─── Configuration ────────────────────────────────────────────────

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY!;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
const BATCH_SIZE = 5;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ─── Shared Utilities ─────────────────────────────────────────────

async function geminiAnalysis(prompt: string, systemPrompt: string | null = null, temperature = 0.4, model = 'gemini-2.0-flash'): Promise<any | null> {
    if (!GEMINI_API_KEY) return null;
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }] } : undefined,
                    generationConfig: {
                        temperature: temperature,
                        maxOutputTokens: 2048,
                        response_mime_type: "application/json"
                    }
                })
            }
        );

        if (!response.ok) {
            console.error(`❌ Error Gemini (${model}): ${response.status}`);
            return null;
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) return null;

        try {
            return JSON.parse(text);
        } catch (e) {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);
            return null;
        }
    } catch (error) {
        console.error('❌ Error analysis:', error);
        return null;
    }
}

function formatearImporte(importe: number): string {
    if (importe >= 1000000) return `${(importe / 1000000).toFixed(1).replace('.0', '')}M€`;
    if (importe >= 1000) return `${Math.round(importe / 1000)}K€`;
    return `${importe.toFixed(0)}€`;
}

// ─── Job: Analyze Sources (BOE, BDNS, PLACSP) ─────────────────────

const BOE_MONEY_KEYWORDS = ['euro', 'euros', '€', 'eur', 'subvención', 'licitación', 'adjudicación', 'contrato', 'ayuda', 'financiación', 'presupuesto', 'millón', 'beca'];

async function processBOE(dateStr?: string) {
    const today = new Date();
    const date = dateStr ?
        { year: dateStr.split('-')[0], month: dateStr.split('-')[1], day: dateStr.split('-')[2], formatted: dateStr } :
        { year: today.getFullYear().toString(), month: String(today.getMonth() + 1).padStart(2, '0'), day: String(today.getDate()).padStart(2, '0'), formatted: today.toISOString().split('T')[0] };

    console.log(`🏛️ BOE Analysis for ${date.formatted}`);
    const entries: any[] = [];
    try {
        const htmlUrl = `https://www.boe.es/boe/dias/${date.year}/${date.month}/${date.day}/`;
        const htmlResponse = await fetch(htmlUrl, { headers: { 'User-Agent': 'Veridian-BOE/1.0' } });
        if (htmlResponse.ok) {
            const htmlText = await htmlResponse.text();
            const paragraphRegex = /<(?:li|p)[^>]*>([\s\S]*?)<\/(?:li|p)>/gi;
            let pMatch;
            while ((pMatch = paragraphRegex.exec(htmlText)) !== null) {
                const content = pMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                if (content.length > 50) {
                    const linkMatch = pMatch[0].match(/href="([^"]+)"/i);
                    const url = linkMatch ? (linkMatch[1].startsWith('http') ? linkMatch[1] : `https://www.boe.es${linkMatch[1]}`) : '';
                    entries.push({ titulo: content.substring(0, 200), texto: content, seccion: 'HTML', url });
                }
            }
        }
    } catch (e) { console.error("Error fetching BOE HTML", e); }

    if (entries.length === 0) return { message: 'No entries found', count: 0 };
    const moneyEntries = entries.filter(e => BOE_MONEY_KEYWORDS.some(k => e.texto.toLowerCase().includes(k)));
    let saved = 0;
    const results = [];

    for (const entry of moneyEntries.slice(0, 15)) {
        let fullText = entry.texto;
        try {
            if (entry.url) {
                const detailRes = await fetch(entry.url, { headers: { 'User-Agent': 'Veridian-BOE/1.0' } });
                if (detailRes.ok) {
                    const detailHtml = await detailRes.text();
                    const bodyMatch = detailHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
                    if (bodyMatch) fullText = bodyMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
                }
            }
        } catch (e) { console.error(`Error fetching detail for ${entry.url}`, e); }

        let fallbackAmount = 0;
        const moneyRegex = /([\d\.]+(?:,\d+)?)\s*(?:€|euros|eur)/i;
        const matchMoney = fullText.match(moneyRegex);
        if (matchMoney) {
            let cleanRaw = matchMoney[1];
            if (cleanRaw.includes(',')) cleanRaw = cleanRaw.replace(/\./g, '').replace(',', '.');
            else cleanRaw = cleanRaw.replace(/\./g, '');
            fallbackAmount = parseFloat(cleanRaw);
        }

        const systemPrompt = `Eres experto en gasto público. Extrae datos BOE. JSON: { "beneficiario": string, "importe_total": number, "moneda": "EUR", "organismo_pagador": string, "tipo_adjudicacion": string, "resumen_veridian": string, "contexto_detallado": string }`;
        const analysis = await geminiAnalysis(
            `Analiza: ${fullText.substring(0, 15000)}. fallbackAmount: ${fallbackAmount}`,
            systemPrompt
        );

        if (analysis && (analysis.importe_total > 0 || fallbackAmount > 0)) {
            if ((!analysis.importe_total || analysis.importe_total === 0) && fallbackAmount > 0) analysis.importe_total = fallbackAmount;

            const { data: existing } = await supabase.from('boe_expenses').select('id').eq('boe_url', entry.url).single();
            const payload = {
                beneficiario: analysis.beneficiario || 'No especificado',
                importe_total: analysis.importe_total,
                moneda: analysis.moneda || 'EUR',
                organismo_pagador: analysis.organismo_pagador,
                tipo_adjudicacion: analysis.tipo_adjudicacion,
                resumen_veridian: analysis.resumen_veridian,
                contexto_detallado: analysis.contexto_detallado
            };

            if (existing) {
                await supabase.from('boe_expenses').update(payload).eq('id', existing.id);
            } else {
                await supabase.from('boe_expenses').insert({
                    ...payload,
                    boe_date: date.formatted,
                    boe_section: entry.seccion,
                    boe_url: entry.url,
                    texto_original: entry.texto.substring(0, 2000),
                    titulo_original: entry.titulo
                });
            }
            saved++;
            results.push(analysis);
        }
    }
    return { saved, count: entries.length, money_candidates: moneyEntries.length };
}

async function processBDNS() {
    console.log('🏛️ BDNS Analysis');
    const url = 'https://www.pap.hacienda.gob.es/bdnstrans/api/concesiones/busqueda?vpd=GE&page=0&pageSize=30&order=importe&direccion=desc';
    let concesiones: any[] = [];
    try {
        const res = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'Veridian/1.0' } });
        if (res.ok) {
            const data = await res.json();
            concesiones = data.content || [];
        }
    } catch (e) { return { error: 'Fetch failed' }; }

    let saved = 0;
    for (const concesion of concesiones.filter(c => c.importe >= 5000).slice(0, 15)) {
        const { data: existing } = await supabase.from('bdns_subvenciones').select('id').eq('bdns_id', concesion.id).single();
        if (existing) continue;

        const systemPrompt = `Resume subvención. JSON: { "resumen_veridian": string (max 15 words), "contexto_detallado": string }`;
        const analisis = await geminiAnalysis(`Importe: ${concesion.importe}€. Beneficiario: ${concesion.beneficiario}. Objeto: ${concesion.convocatoria}`, systemPrompt) || {
            resumen_veridian: `${formatearImporte(concesion.importe)} a ${concesion.beneficiario}`,
            contexto_detallado: `Subvención de ${formatearImporte(concesion.importe)} para ${concesion.convocatoria}`
        };

        const { error } = await supabase.from('bdns_subvenciones').insert({
            bdns_id: concesion.id,
            codigo_concesion: concesion.codConcesion,
            fecha_concesion: concesion.fechaConcesion,
            beneficiario: concesion.beneficiario,
            importe: concesion.importe,
            instrumento: concesion.instrumento,
            convocatoria: concesion.convocatoria,
            numero_convocatoria: concesion.numeroConvocatoria,
            administracion: concesion.nivel1,
            departamento: concesion.nivel2,
            organo: concesion.nivel3,
            resumen_veridian: analisis.resumen_veridian,
            contexto_detallado: analisis.contexto_detallado
        });
        if (!error) saved++;
    }
    return { saved, total_fetched: concesiones.length };
}

async function processPLACSP() {
    console.log('🏛️ PLACSP Analysis');
    const PLACSP_ATOM_URL = 'https://contrataciondelsectorpublico.gob.es/sindicacion/sindicacion_643/licitacionesPerfilesContratanteCompleto3.atom';

    function fetchXMLInsecure(url: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const agent = new https.Agent({ rejectUnauthorized: false });
            https.get(url, { agent }, (res) => {
                let data = '';
                res.on('data', c => data += c);
                res.on('end', () => resolve(data));
            }).on('error', reject);
        });
    }

    let entries: any[] = [];
    try {
        const xml = await fetchXMLInsecure(PLACSP_ATOM_URL);
        const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
        let match;
        while ((match = entryRegex.exec(xml)) !== null) {
            const content = match[1];
            const summary = content.match(/<summary type="text">(.*?)<\/summary>/)?.[1] || '';
            const importeMatch = summary.match(/Importe: (\d+(\.\d+)?) EUR/);
            entries.push({
                id: content.match(/<id>(.*?)<\/id>/)?.[1] || '',
                title: content.match(/<title>(.*?)<\/title>/)?.[1] || '',
                updated: content.match(/<updated>(.*?)<\/updated>/)?.[1] || '',
                summary,
                link: content.match(/<link href="(.*?)"/)?.[1] || '',
                importe: importeMatch ? parseFloat(importeMatch[1]) : 0,
                organo: summary.match(/Órgano de Contratación: (.*?);/)?.[1] || 'Desconocido',
                estado: summary.match(/Estado: (\w+)/)?.[1] || 'PUB'
            });
        }
    } catch (e) { return { error: 'Fetch failed' }; }

    let saved = 0;
    for (const entry of entries.filter(e => e.importe >= 15000).slice(0, 10)) {
        const { data: existing } = await supabase.from('placsp_contratos').select('id').eq('placsp_id', entry.id).single();
        if (existing) continue;

        const systemPrompt = `Resume licitación. JSON: { "resumen_veridian": string (max 15 words), "contexto_detallado": string }`;
        const analisis = await geminiAnalysis(`Licitación: ${entry.title}. Organo: ${entry.organo}. Importe: ${entry.importe}`, systemPrompt, 0.3) || {
            resumen_veridian: `${formatearImporte(entry.importe)} - ${entry.organo}`,
            contexto_detallado: entry.title
        };

        const { error } = await supabase.from('placsp_contratos').insert({
            placsp_id: entry.id,
            titulo: entry.title,
            organo_contratacion: entry.organo,
            fecha_publicacion: entry.updated,
            importe: entry.importe,
            estado: entry.estado,
            link_licitacion: entry.link,
            raw_summary: entry.summary,
            resumen_veridian: analisis.resumen_veridian,
            contexto_detallado: analisis.contexto_detallado
        });
        if (!error) saved++;
    }
    return { saved, total_entries: entries.length };
}

// ─── Job: Curate Cafe ─────────────────────────────────────────────

async function curateCafe() {
    console.log('☕ Curating daily Café Veridian content...');
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: recentNews } = await supabase
        .from('daily_news')
        .select('id, title, summary, content')
        .not('image', 'is', null).neq('image', '').neq('image', 'GENERATION_FAILED')
        .gte('published_at', twoDaysAgo.toISOString())
        .order('published_at', { ascending: false }).limit(30);

    if (!recentNews || recentNews.length === 0) return { message: 'No news available' };

    const prompt = `Eres editor de Café Veridian. Selecciona 5-6 noticias y crea 2 encuestas.
    JSON: {
      "selectedNewsIds": ["uuid"],
      "curationReason": "string",
      "polls": [{ "question": "string", "options": ["string"], "relatedNewsId": "uuid" }]
    }
    Noticias: ${recentNews.map((n: any, i: number) => `[${n.id}] ${n.title}`).join('\n')}`;

    const curationData = await geminiAnalysis(prompt, null, 0.7);
    if (!curationData) throw new Error('Curation failed');

    const today = new Date().toISOString().split('T')[0];
    await supabase.from('daily_news').update({ cafe_featured_date: null }).not('cafe_featured_date', 'is', null);

    if (curationData.selectedNewsIds?.length) {
        await supabase.from('daily_news').update({ cafe_featured_date: today }).in('id', curationData.selectedNewsIds);
    }

    const pollResults = [];
    for (const poll of (curationData.polls || [])) {
        const { error } = await supabase.from('daily_polls').insert({
            question: poll.question,
            options: poll.options.map((l: any, i: number) => ({ id: `opt${i + 1}`, label: l })),
            related_news_id: poll.relatedNewsId || null
        });
        if (!error) pollResults.push(poll.question);
    }

    return { curated: curationData.selectedNewsIds.length, polls: pollResults };
}

// ─── Job: Generate Covers ─────────────────────────────────────────

async function generateCovers(specificNewsId?: string) {
    let query = supabase.from('daily_news').select('id, title, summary');
    if (specificNewsId) query = query.eq('id', specificNewsId);
    else query = query.or('image.is.null,image.eq.""').limit(5);

    const { data: newsItems } = await query;
    if (!newsItems?.length) return { message: 'No items pending' };

    const results = [];
    for (const item of newsItems) {
        try {
            console.log(`Generating image for: ${item.title}`);
            const promptData = await geminiAnalysis(`Create strictly prompt: Title: "${item.title}"`, "Art director creating image prompts. Return ONLY prompt text.", 0.7, 'gemini-1.5-flash');
            const imagePrompt = typeof promptData === 'string' ? promptData : (promptData?.prompt || `Editorial news photography for: ${item.title}`);

            const imgRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ instances: [{ prompt: imagePrompt }], parameters: { sampleCount: 1, aspectRatio: "16:9" } })
            });

            const imgData = await imgRes.json();
            const b64 = imgData.predictions?.[0]?.bytesBase64Encoded;
            if (!b64) throw new Error('No image returned');

            const buffer = await sharp(Buffer.from(b64, 'base64')).resize(1200, null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
            const fileName = `${item.id}_${Date.now()}.webp`;

            await supabase.storage.from('news-covers').upload(fileName, buffer, { contentType: 'image/webp', upsert: true });
            const { data: { publicUrl } } = supabase.storage.from('news-covers').getPublicUrl(fileName);

            await supabase.from('daily_news').update({ image: publicUrl }).eq('id', item.id);
            results.push({ id: item.id, url: publicUrl });

        } catch (e: any) {
            console.error(`Error ${item.id}`, e);
            if (e.message.includes('No image')) await supabase.from('daily_news').update({ image: 'GENERATION_FAILED' }).eq('id', item.id);
            results.push({ id: item.id, error: e.message });
        }
    }
    return { processed: results };
}

// ─── Job: Generate Polls ──────────────────────────────────────────

async function generatePolls() {
    console.log('🗳️ Generating Polls');
    const { data: todayNews } = await supabase.from('daily_news').select('id, title, summary')
        .not('image', 'is', null).neq('image', '').neq('image', 'GENERATION_FAILED')
        .order('published_at', { ascending: false }).limit(5);

    if (!todayNews?.length) return { message: 'No news' };

    const prompt = `Genera 2 preguntas de opinión. JSON: { "polls": [{ "question": "string", "options": ["string"], "relatedNewsTitle": "string" }] }. News: ${todayNews.map((n: any) => n.title).join('\n')}`;
    const data = await geminiAnalysis(prompt, null, 0.7);

    const results = [];
    if (data?.polls) {
        for (const poll of data.polls) {
            const related = todayNews.find((n: any) => n.title.includes(poll.relatedNewsTitle?.substring(0, 10)));
            const { error } = await supabase.from('daily_polls').insert({
                question: poll.question,
                options: poll.options.map((l: any, i: number) => ({ id: `opt${i + 1}`, label: l })),
                related_news_id: related?.id || null
            });
            if (!error) results.push(poll.question);
        }
    }
    return { generated: results };
}

// ─── Job: Optimize Images ─────────────────────────────────────────

async function optimizeImages() {
    const { data: newsItems } = await supabase.from('daily_news').select('id, image').like('image', '%.png%').limit(BATCH_SIZE);
    if (!newsItems?.length) return { message: 'No PNGs found' };

    const results = [];
    for (const item of newsItems) {
        try {
            if (!item.image) continue;
            const oldFileName = item.image.split('/news-covers/')[1].split('?')[0];
            const { data: fileData, error: downErr } = await supabase.storage.from('news-covers').download(oldFileName);
            if (downErr) throw downErr;

            const buffer = await sharp(Buffer.from(await fileData.arrayBuffer())).resize(1200, null, { withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
            const newFileName = oldFileName.replace(/\.png$/i, '.webp');

            await supabase.storage.from('news-covers').upload(newFileName, buffer, { contentType: 'image/webp', upsert: true });
            const { data: { publicUrl } } = supabase.storage.from('news-covers').getPublicUrl(newFileName);

            await supabase.from('daily_news').update({ image: publicUrl }).eq('id', item.id);
            await supabase.storage.from('news-covers').remove([oldFileName]);
            results.push({ id: item.id, url: publicUrl });
        } catch (e: any) {
            results.push({ id: item.id, error: e.message });
        }
    }
    return { processed: results };
}

// ─── Main Handler ─────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const authHeader = req.headers['authorization'];
    const isVercelCron = req.headers['user-agent'] === 'vercel-cron/1.0';
    if (!isVercelCron && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { job, source } = req.query;

    try {
        let result;
        switch (job) {
            case 'analyze-sources':
                switch (source) {
                    case 'boe': result = await processBOE(req.query.date as string); break;
                    case 'bdns': result = await processBDNS(); break;
                    case 'placsp': result = await processPLACSP(); break;
                    default: return res.status(400).json({ error: 'Missing defined source' });
                }
                break;
            case 'curate-cafe': result = await curateCafe(); break;
            case 'generate-covers': result = await generateCovers(); break;
            case 'generate-polls': result = await generatePolls(); break;
            case 'optimize-images': result = await optimizeImages(); break;
            default: return res.status(400).json({ error: 'Invalid job' });
        }
        return res.status(200).json(result);
    } catch (e: any) {
        console.error('Job failed:', e);
        return res.status(500).json({ error: e.message });
    }
}
