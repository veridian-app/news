import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
// Supabase import removed — analysis now uses Vercel API route
import { Loader2, Lock, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, FileText, Edit3, BookOpen, Shield, Brain, Upload, Download, File, Globe } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface CraapScore {
  score: number;
  reasoning: string;
}

interface CraapAnalysis {
  currency: CraapScore;
  relevance: CraapScore;
  authority: CraapScore;
  accuracy: CraapScore;
  purpose: CraapScore;
  overall: string;
}

interface Source {
  name: string;
  url?: string;
  type: string;
  accessibility: string;
  publicationDate?: string;
  summary?: string;
  confidenceScore?: number;
  craap: CraapAnalysis;
  perspective: {
    tone: string;
    orientation: string;
  };
}

interface BiasItem {
  severity: string;
  explanation: string;
  quotes?: string[];
}

interface PlagiarismAnalysis {
  percentage: number;
  level: "None" | "Low" | "Moderate" | "High" | "Very High";
  explanation: string;
  flaggedSections?: Array<{
    text: string;
    reason: string;
    suggestion: string;
  }>;
}

interface CitationSuggestion {
  text: string;
  suggestedCitation: string;
  format: "APA" | "MLA" | "Chicago";
}

interface ImprovementSuggestion {
  type: "language" | "source" | "balance" | "claim";
  location: string; // Texto o posición aproximada
  current: string;
  suggestion: string;
  reason: string;
}

interface AnalysisResult {
  sources: Source[];
  biasAnalysis: {
    selectionBias?: BiasItem;
    misrepresentation?: BiasItem;
    loadedLanguage?: BiasItem;
    falseExperts?: BiasItem;
    confirmationBias?: BiasItem;
    framing?: BiasItem;
    omission?: BiasItem;
    appealToEmotion?: BiasItem;
    sensationalism?: BiasItem;
    falseEquivalence?: BiasItem;
    agendaSetting?: BiasItem;
    hastyGeneralization?: BiasItem;
  };
  summary: {
    overallReliability: string;
    mainConcerns: string[];
    strengths: string[];
    objectivityScore?: number;
    objectivityExplanation?: string;
    hoaxAlerts?: Array<{
      type: "buloConfirmado" | "posibleBulo";
      claim: string;
      reason: string;
    }>;
    plagiarismAnalysis?: PlagiarismAnalysis;
  };
  // Nuevos campos para modo "auditar propio texto"
  isOwnText?: boolean;
  detectedSources?: string[]; // Fuentes mencionadas en el texto
  missingCitations?: string[]; // Afirmaciones sin citar
  citationSuggestions?: CitationSuggestion[];
  improvementSuggestions?: ImprovementSuggestion[];
  detectedReferences?: Array<{
    name: string;
    url?: string;
    context: string; // Dónde aparece en el texto
  }>;
}

// Translations for Oraculus
const translations = {
  es: {
    locked: {
      title: "Oraculus Bloqueado",
      message: (remaining: number) => `Necesitas ${remaining} referido${remaining === 1 ? "" : "s"} más para desbloquear Oraculus y asegurar tu lugar en la beta de la plataforma.`,
      progress: (count: number) => `Progreso: ${count}/3 referidos`,
      backButton: "Volver al inicio",
      bonus: "Bonus: con 1 referido recibes la mini guía antisesgos. Con 5 referidos tendrás adelantos y 3 meses premium al lanzamiento.",
    },
    header: {
      unlocked: "Oraculus Desbloqueado",
      title: "Oraculus",
      subtitle: "Sistema avanzado de análisis de fuentes y detección de sesgos periodísticos",
      subtitle2: "Potenciando el pensamiento crítico mediante análisis integral de integridad académica y credibilidad de fuentes",
      founderAccess: (date: string) => `Acceso fundador hasta ${date}`,
    },
    tabs: {
      external: "Analizar Artículo Externo",
      own: "Auditar Mi Texto",
    },
    fileUpload: {
      option1: "Opción 1: Sube un documento (PDF, DOC, DOCX, TXT)",
      chooseFile: "Elegir Archivo",
      processing: "Procesando archivo...",
      description: "Sube archivos PDF, DOC, DOCX o TXT. El texto se extraerá automáticamente.",
      success: (name: string) => `Archivo "${name}" procesado exitosamente`,
    },
    urlInput: {
      option2: "Opción 2: Pega la URL del artículo",
      placeholder: "https://ejemplo.com/articulo...",
      description: "Oraculus extraerá automáticamente el contenido del artículo, incluyendo todos los enlaces y referencias",
    },
    textInput: {
      option3: "Opción 3: Pega el texto del artículo directamente",
      placeholder: "Copia y pega el texto completo del artículo...",
      ownPlaceholder: "Pega aquí tu texto completo. Oraculus detectará sesgos, fuentes citadas, y te ayudará a mejorar la objetividad y citación...",
    },
    ownText: {
      title: "Audita tu propio texto",
      description: "Oraculus analizará tus sesgos, detectará fuentes citadas, sugerirá mejoras y generará referencias bibliográficas para mejorar tu pensamiento crítico e integridad académica",
      citationFormat: "Formato de citas preferido",
    },
    buttons: {
      analyze: "Analizar Artículo",
      auditing: "Auditando tu texto...",
      analyzing: "Analizando...",
      extracting: "Extrayendo contenido...",
      audit: "Auditar Mi Texto",
    },
    success: {
      auditCompleted: "Auditoría completada",
      analysisCompleted: "Análisis completado",
    },
    results: {
      executiveSummary: "Resumen General",
      objectivityScore: "Score de Objetividad",
      plagiarismRisk: "Evaluación de Riesgo de Plagio",
      level: "Nivel",
      overallReliability: "Fiabilidad General",
      mainConcerns: "Principales Preocupaciones",
      strengths: "Fortalezas",
      biasAnalysis: "Análisis de Sesgos",
      sourcesAnalysis: "Análisis de Fuentes",
      craapAnalysis: "Análisis CRAAP de tus Fuentes",
      craapDescription: "Evaluación detallada de las fuentes que has utilizado en tu texto según el método CRAAP (Currency, Relevance, Authority, Accuracy, Purpose):",
      detectedSources: "Fuentes Detectadas en tu Texto",
      missingCitations: "Afirmaciones sin Citar Requieren Fuentes",
      missingCitationsDesc: "Estas afirmaciones requieren atribución de fuente para respaldar la integridad académica y el pensamiento crítico:",
      bibliographicReferences: "Referencias Bibliográficas",
      referencesDetected: (format: string) => `Referencias detectadas en formato ${format}:`,
      copyAll: "Copiar todas las referencias",
      copied: "Referencias copiadas al portapapeles",
      improvementSuggestions: "Recomendaciones de Mejora del Pensamiento Crítico",
      improvementDesc: "Recomendaciones profesionales para mejorar la objetividad, integridad académica y análisis crítico. Estas sugerencias están diseñadas para fomentar el pensamiento independiente en lugar de proporcionar soluciones directas de copiar y pegar:",
      downloadPDF: "Descargar PDF",
      downloadDOC: "Descargar DOC",
      pdfSuccess: "Reporte PDF descargado exitosamente",
      docSuccess: "Reporte DOC descargado exitosamente",
      pdfError: "Error al generar reporte PDF",
      docError: "Error al generar reporte DOC",
    },
    errors: {
      noText: "Por favor, pega tu texto para auditar",
      noInput: "Por favor, ingresa el texto del artículo o una URL",
      invalidUrl: "Por favor, ingresa una URL válida (debe empezar con http:// o https://)",
      textTooLong: "El texto es demasiado largo. Por favor, limítalo a 100,000 caracteres.",
      timeout: "El análisis está tardando demasiado. Por favor, intenta con un texto más corto.",
      analyzing: "Error analizando. Por favor, intenta de nuevo.",
      fileProcessing: "Error procesando archivo",
      unsupportedFile: "Tipo de archivo no soportado. Por favor, sube archivos PDF, DOC, DOCX o TXT.",
    },
    craap: {
      currency: "Actualidad",
      relevance: "Relevancia",
      authority: "Autoridad",
      accuracy: "Exactitud",
      purpose: "Propósito",
      score: "Puntuación CRAAP",
      notAvailable: "Análisis CRAAP no disponible para esta fuente.",
    },
    bias: {
      selectionBias: "Sesgo de Selección",
      misrepresentation: "Falsificación",
      loadedLanguage: "Lenguaje Cargado",
      falseExperts: "Falsos Expertos",
      confirmationBias: "Sesgo de Confirmación",
      framing: "Enmarcado",
      omission: "Omisión",
      appealToEmotion: "Apelación a la Emoción",
      sensationalism: "Sensacionalismo",
      falseEquivalence: "Falsa Equivalencia",
      agendaSetting: "Establecimiento de Agenda",
      hastyGeneralization: "Generalización Apresurada",
      textualEvidence: "Evidencia Textual",
      noExplanation: "Sesgo detectado pero explicación detallada no disponible.",
    },
    severity: {
      none: "Nula",
      low: "Leve",
      moderate: "Moderada",
      significant: "Significativa",
      high: "Alta",
      veryHigh: "Muy Alta",
    },
    source: {
      confidence: "confianza",
      tone: "Tono",
      orientation: "Orientación",
      notSpecified: "No especificado",
      appearsIn: "Aparece en",
      context: "Contexto",
      issue: "Problema",
      recommendation: "Recomendación",
      flaggedSections: "Secciones Marcadas que Requieren Revisión",
      confirmedMisinformation: "Bulo Confirmado",
      possibleMisinformation: "Posible Bulo Detectado",
      exampleIssue: "Ejemplo del problema",
      criticalThinking: "Enfoque de pensamiento crítico",
      criticalThinkingNote: "Esta es una guía conceptual para desarrollar tu pensamiento crítico, no un reemplazo literal. Reflexiona sobre los principios subyacentes y adáptalos a tu propio estilo analítico y voz.",
      approximateLocation: "Ubicación aproximada",
      language: "Lenguaje",
      sources: "Fuentes",
      balance: "Balance",
      claim: "Afirmación",
    },
    footer: {
      copyright: "© 2024 - Oraculus. Herramientas avanzadas de análisis de fuentes y pensamiento crítico para la excelencia académica.",
      privacy: "Política de Privacidad",
      terms: "Términos y Condiciones",
      legal: "Aviso Legal",
    },
  },
  en: {
    locked: {
      title: "Oraculus Locked",
      message: (remaining: number) => `You need ${remaining} more referral${remaining === 1 ? "" : "s"} to unlock Oraculus and secure your place in the platform beta.`,
      progress: (count: number) => `Progress: ${count}/3 referrals`,
      backButton: "Return to Home",
      bonus: "Bonus: with 1 referral you receive the mini anti-bias guide. With 5 referrals you'll get early access and 3 months premium at launch.",
    },
    header: {
      unlocked: "Oraculus Unlocked",
      title: "Oraculus",
      subtitle: "Advanced Source Analysis & Journalistic Bias Detection System",
      subtitle2: "Empowering critical thinking through comprehensive academic integrity and source credibility analysis",
      founderAccess: (date: string) => `Founder Access until ${date}`,
    },
    tabs: {
      external: "Analyze External Article",
      own: "Audit My Text",
    },
    fileUpload: {
      option1: "Option 1: Upload a document (PDF, DOC, DOCX, TXT)",
      chooseFile: "Choose File",
      processing: "Processing file...",
      description: "Upload PDF, DOC, DOCX, or TXT files. The text will be extracted automatically.",
      success: (name: string) => `File "${name}" processed successfully`,
    },
    urlInput: {
      option2: "Option 2: Paste the article URL",
      placeholder: "https://example.com/article...",
      description: "Oraculus will automatically extract the article content, including all links and references",
    },
    textInput: {
      option3: "Option 3: Paste the article text directly",
      placeholder: "Copy and paste the complete article text...",
      ownPlaceholder: "Paste your complete text here. Oraculus will detect biases, cited sources, and help you improve objectivity and citation practices...",
    },
    ownText: {
      title: "Audit Your Own Text",
      description: "Oraculus will analyze your biases, detect cited sources, suggest improvements, and generate bibliographic references to enhance your critical thinking and academic integrity",
      citationFormat: "Preferred Citation Format",
    },
    buttons: {
      analyze: "Analyze Article",
      auditing: "Auditing your text...",
      analyzing: "Analyzing...",
      extracting: "Extracting content...",
      audit: "Audit My Text",
    },
    success: {
      auditCompleted: "Audit completed",
      analysisCompleted: "Analysis completed",
    },
    results: {
      executiveSummary: "Executive Summary",
      objectivityScore: "Objectivity Score",
      plagiarismRisk: "Plagiarism Risk Assessment",
      level: "Level",
      overallReliability: "Overall Reliability",
      mainConcerns: "Main Concerns",
      strengths: "Strengths",
      biasAnalysis: "Bias Analysis",
      sourcesAnalysis: "Source Analysis",
      craapAnalysis: "CRAAP Analysis of Your Sources",
      craapDescription: "Detailed evaluation of the sources you have used in your text according to the CRAAP method (Currency, Relevance, Authority, Accuracy, Purpose):",
      detectedSources: "Sources Detected in Your Text",
      missingCitations: "Uncited Claims Requiring Sources",
      missingCitationsDesc: "These claims require source attribution to support academic integrity and critical thinking:",
      bibliographicReferences: "Bibliographic References",
      referencesDetected: (format: string) => `References detected in ${format} format:`,
      copyAll: "Copy All References",
      copied: "References copied to clipboard",
      improvementSuggestions: "Critical Thinking Enhancement Recommendations",
      improvementDesc: "Professional recommendations to enhance objectivity, academic integrity, and critical analysis. These suggestions are designed to foster independent thinking rather than providing direct copy-paste solutions:",
      downloadPDF: "Download PDF",
      downloadDOC: "Download DOC",
      pdfSuccess: "PDF report downloaded successfully",
      docSuccess: "DOC report downloaded successfully",
      pdfError: "Error generating PDF report",
      docError: "Error generating DOC report",
    },
    errors: {
      noText: "Please paste your text to audit",
      noInput: "Please enter the article text or a URL",
      invalidUrl: "Please enter a valid URL (must start with http:// or https://)",
      textTooLong: "The text is too long. Please limit it to 100,000 characters.",
      timeout: "The analysis is taking too long. Please try with a shorter text.",
      analyzing: "Error analyzing. Please try again.",
      fileProcessing: "Error processing file",
      unsupportedFile: "Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files.",
    },
    craap: {
      currency: "Currency",
      relevance: "Relevance",
      authority: "Authority",
      accuracy: "Accuracy",
      purpose: "Purpose",
      score: "CRAAP Score",
      notAvailable: "CRAAP analysis not available for this source.",
    },
    bias: {
      selectionBias: "Selection Bias",
      misrepresentation: "Misrepresentation",
      loadedLanguage: "Loaded Language",
      falseExperts: "False Experts",
      confirmationBias: "Confirmation Bias",
      framing: "Framing",
      omission: "Omission",
      appealToEmotion: "Appeal to Emotion",
      sensationalism: "Sensationalism",
      falseEquivalence: "False Equivalence",
      agendaSetting: "Agenda Setting",
      hastyGeneralization: "Hasty Generalization",
      textualEvidence: "Textual Evidence",
      noExplanation: "Bias detected but detailed explanation not available.",
    },
    severity: {
      none: "None",
      low: "Low",
      moderate: "Moderate",
      significant: "Significant",
      high: "High",
      veryHigh: "Very High",
    },
    source: {
      confidence: "confidence",
      tone: "Tone",
      orientation: "Orientation",
      notSpecified: "Not specified",
      appearsIn: "Appears in",
      context: "Context",
      issue: "Issue",
      recommendation: "Recommendation",
      flaggedSections: "Flagged Sections Requiring Review",
      confirmedMisinformation: "Confirmed Misinformation",
      possibleMisinformation: "Possible Misinformation Detected",
      exampleIssue: "Example of the issue",
      criticalThinking: "Critical thinking approach",
      criticalThinkingNote: "This is a conceptual guidance to develop your critical thinking, not a literal replacement. Reflect on the underlying principles and adapt them to your own analytical style and voice.",
      approximateLocation: "Approximate location",
      language: "Language",
      sources: "Sources",
      balance: "Balance",
      claim: "Claim",
    },
    footer: {
      copyright: "© 2024 - Oraculus. Advanced source analysis and critical thinking tools for academic excellence.",
      privacy: "Privacy Policy",
      terms: "Terms and Conditions",
      legal: "Legal Notice",
    },
  },
};

const Oraculus = () => {
  const navigate = useNavigate();
  const { language, setLanguage } = useLanguage();
  const t = translations[language];
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [referralCount, setReferralCount] = useState(0);
  const [articleText, setArticleText] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [founderAccessUntil, setFounderAccessUntil] = useState<string | null>(null);
  const [isFounderAccess, setIsFounderAccess] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<"external" | "own">("external");
  const [citationFormat, setCitationFormat] = useState<"APA" | "MLA" | "Chicago">("APA");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  useEffect(() => {
    // Oraculus es ahora público y sin restricciones
    setIsUnlocked(true);
    setReferralCount(3);
    setIsFounderAccess(true);
  }, []);

  const isValidUrl = (string: string) => {
    try {
      const url = new URL(string);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
      return false;
    }
  };

  const processFile = async (file: File): Promise<string> => {
    setIsProcessingFile(true);
    try {
      const fileType = file.type;
      const fileName = file.name.toLowerCase();

      // Process TXT files
      if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
        const text = await file.text();
        return text;
      }

      // Process PDF files
      if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
        const pdfjsLib = await import('pdfjs-dist');
        // Use local worker from public folder (more reliable than CDN)
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .filter((str: string) => str.trim().length > 0)
            .join(' ');
          fullText += pageText + '\n\n';
        }

        return fullText.trim();
      }

      // Process DOC/DOCX files
      if (
        fileType === 'application/msword' ||
        fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        fileName.endsWith('.doc') ||
        fileName.endsWith('.docx')
      ) {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        return result.value;
      }

      throw new Error(t.errors.unsupportedFile);
    } catch (error: any) {
      console.error('Error processing file:', error);
      throw new Error(`Error processing file: ${error.message}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setArticleUrl(""); // Clear URL when file is selected

    try {
      const text = await processFile(file);
      setArticleText(text);
      toast.success(t.fileUpload.success(file.name));
    } catch (error: any) {
      toast.error(error.message || t.errors.fileProcessing);
      setSelectedFile(null);
    }
  };

  const generatePDF = async (result: AnalysisResult) => {
    try {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF();

      let yPos = 20;
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxWidth = pageWidth - 2 * margin;

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(t.results.executiveSummary === "Executive Summary" ? 'Oraculus Analysis Report' : 'Reporte de Análisis Oraculus', margin, yPos);
      yPos += 15;

      // Executive Summary
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(t.results.executiveSummary, margin, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      if (result.summary.objectivityScore !== undefined) {
        doc.text(`${t.results.objectivityScore}: ${result.summary.objectivityScore}/100`, margin, yPos);
        yPos += 7;
      }

      if (result.summary.plagiarismAnalysis) {
        doc.text(`${t.results.plagiarismRisk}: ${result.summary.plagiarismAnalysis.percentage}% (${result.summary.plagiarismAnalysis.level})`, margin, yPos);
        yPos += 7;
        if (result.summary.plagiarismAnalysis.explanation) {
          const explanationLines = doc.splitTextToSize(result.summary.plagiarismAnalysis.explanation, maxWidth);
          doc.text(explanationLines, margin, yPos);
          yPos += explanationLines.length * 5 + 5;
        }
      }

      doc.text(`${t.results.overallReliability}: ${result.summary.overallReliability}`, margin, yPos);
      yPos += 10;

      // Main Concerns
      if (result.summary.mainConcerns.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${t.results.mainConcerns}:`, margin, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        result.summary.mainConcerns.forEach((concern) => {
          const lines = doc.splitTextToSize(`• ${concern}`, maxWidth);
          doc.text(lines, margin, yPos);
          yPos += lines.length * 5 + 3;
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
        });
        yPos += 5;
      }

      // Strengths
      if (result.summary.strengths.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${t.results.strengths}:`, margin, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        result.summary.strengths.forEach((strength) => {
          const lines = doc.splitTextToSize(`• ${strength}`, maxWidth);
          doc.text(lines, margin, yPos);
          yPos += lines.length * 5 + 3;
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
        });
        yPos += 5;
      }

      // Bias Analysis
      const biases = Object.entries(result.biasAnalysis).filter(([_, value]) => value && value.severity && value.severity !== "None" && value.severity !== "Nula");
      if (biases.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(t.results.biasAnalysis, margin, yPos);
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        biases.forEach(([key, value]) => {
          if (!value || !value.severity) return;
          const biasNameMap: { [key: string]: string } = {
            selectionBias: t.bias.selectionBias,
            misrepresentation: t.bias.misrepresentation,
            loadedLanguage: t.bias.loadedLanguage,
            falseExperts: t.bias.falseExperts,
            confirmationBias: t.bias.confirmationBias,
            framing: t.bias.framing,
            omission: t.bias.omission,
            appealToEmotion: t.bias.appealToEmotion,
            sensationalism: t.bias.sensationalism,
            falseEquivalence: t.bias.falseEquivalence,
            agendaSetting: t.bias.agendaSetting,
            hastyGeneralization: t.bias.hastyGeneralization,
          };
          const biasName = biasNameMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          doc.setFont('helvetica', 'bold');
          doc.text(`${biasName}: ${value.severity}`, margin, yPos);
          yPos += 7;
          doc.setFont('helvetica', 'normal');
          if (value.explanation) {
            const lines = doc.splitTextToSize(value.explanation, maxWidth);
            doc.text(lines, margin, yPos);
            yPos += lines.length * 5 + 5;
          }
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
        });
      }

      // Sources
      if (result.sources && result.sources.length > 0) {
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(result.isOwnText ? t.results.craapAnalysis : t.results.sourcesAnalysis, margin, yPos);
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        result.sources.forEach((source, idx) => {
          doc.setFont('helvetica', 'bold');
          doc.text(`${idx + 1}. ${source.name}`, margin, yPos);
          yPos += 7;
          doc.setFont('helvetica', 'normal');
          if (source.summary) {
            const lines = doc.splitTextToSize(source.summary, maxWidth);
            doc.text(lines, margin, yPos);
            yPos += lines.length * 5 + 3;
          }
          if (source.confidenceScore !== undefined) {
            doc.text(`${t.source.confidence}: ${source.confidenceScore}%`, margin, yPos);
            yPos += 7;
          }
          yPos += 5;
          if (yPos > 280) {
            doc.addPage();
            yPos = 20;
          }
        });
      }

      // Save PDF
      const fileName = `oraculus-analysis-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      toast.success(t.results.pdfSuccess);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error(t.results.pdfError);
    }
  };

  const generateDOC = async (result: AnalysisResult) => {
    try {
      const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');
      const { saveAs } = await import('file-saver');

      const children: any[] = [];

      // Title
      children.push(
        new Paragraph({
          text: t.results.executiveSummary === "Executive Summary" ? "Oraculus Analysis Report" : "Reporte de Análisis Oraculus",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      );

      // Executive Summary
      children.push(
        new Paragraph({
          text: t.results.executiveSummary,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
        })
      );

      if (result.summary.objectivityScore !== undefined) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${t.results.objectivityScore}: `, bold: true }),
              new TextRun({ text: `${result.summary.objectivityScore}/100` }),
            ],
            spacing: { after: 200 },
          })
        );
      }

      if (result.summary.plagiarismAnalysis) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${t.results.plagiarismRisk}: `, bold: true }),
              new TextRun({ text: `${result.summary.plagiarismAnalysis.percentage}% (${result.summary.plagiarismAnalysis.level})` }),
            ],
            spacing: { after: 200 },
          })
        );
        if (result.summary.plagiarismAnalysis.explanation) {
          children.push(
            new Paragraph({
              text: result.summary.plagiarismAnalysis.explanation,
              spacing: { after: 200 },
            })
          );
        }
      }

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `${t.results.overallReliability}: `, bold: true }),
            new TextRun({ text: result.summary.overallReliability }),
          ],
          spacing: { after: 300 },
        })
      );

      // Main Concerns
      if (result.summary.mainConcerns.length > 0) {
        children.push(
          new Paragraph({
            text: t.results.mainConcerns,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          })
        );
        result.summary.mainConcerns.forEach((concern) => {
          children.push(
            new Paragraph({
              text: `• ${concern}`,
              spacing: { after: 150 },
            })
          );
        });
      }

      // Strengths
      if (result.summary.strengths.length > 0) {
        children.push(
          new Paragraph({
            text: t.results.strengths,
            heading: HeadingLevel.HEADING_2,
            spacing: { after: 200 },
          })
        );
        result.summary.strengths.forEach((strength) => {
          children.push(
            new Paragraph({
              text: `• ${strength}`,
              spacing: { after: 150 },
            })
          );
        });
      }

      // Bias Analysis
      const biases = Object.entries(result.biasAnalysis).filter(([_, value]) => value && value.severity && value.severity !== "None" && value.severity !== "Nula");
      if (biases.length > 0) {
        children.push(
          new Paragraph({
            text: t.results.biasAnalysis,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          })
        );

        biases.forEach(([key, value]) => {
          if (!value || !value.severity) return;
          const biasNameMap: { [key: string]: string } = {
            selectionBias: t.bias.selectionBias,
            misrepresentation: t.bias.misrepresentation,
            loadedLanguage: t.bias.loadedLanguage,
            falseExperts: t.bias.falseExperts,
            confirmationBias: t.bias.confirmationBias,
            framing: t.bias.framing,
            omission: t.bias.omission,
            appealToEmotion: t.bias.appealToEmotion,
            sensationalism: t.bias.sensationalism,
            falseEquivalence: t.bias.falseEquivalence,
            agendaSetting: t.bias.agendaSetting,
            hastyGeneralization: t.bias.hastyGeneralization,
          };
          const biasName = biasNameMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${biasName}: `, bold: true }),
                new TextRun({ text: value.severity }),
              ],
              spacing: { after: 150 },
            })
          );
          if (value.explanation) {
            children.push(
              new Paragraph({
                text: value.explanation,
                spacing: { after: 200 },
              })
            );
          }
        });
      }

      // Sources
      if (result.sources && result.sources.length > 0) {
        children.push(
          new Paragraph({
            text: result.isOwnText ? t.results.craapAnalysis : t.results.sourcesAnalysis,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 200 },
          })
        );

        result.sources.forEach((source, idx) => {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `${idx + 1}. ${source.name}`, bold: true }),
              ],
              spacing: { after: 150 },
            })
          );
          if (source.summary) {
            children.push(
              new Paragraph({
                text: source.summary,
                spacing: { after: 150 },
              })
            );
          }
          if (source.confidenceScore !== undefined) {
            children.push(
              new Paragraph({
                children: [
                  new TextRun({ text: `${t.source.confidence}: `, bold: true }),
                  new TextRun({ text: `${source.confidenceScore}%` }),
                ],
                spacing: { after: 200 },
              })
            );
          }
        });
      }

      const doc = new Document({
        sections: [
          {
            children,
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const fileName = `oraculus-analysis-${new Date().toISOString().split('T')[0]}.docx`;
      saveAs(blob, fileName);
      toast.success(t.results.docSuccess);
    } catch (error: any) {
      console.error('Error generating DOC:', error);
      toast.error(t.results.docError);
    }
  };

  const handleAnalyze = async () => {
    const hasText = articleText.trim().length > 0;
    const hasUrl = articleUrl.trim().length > 0;
    const urlIsValid = hasUrl && isValidUrl(articleUrl.trim());

    if (analysisMode === "own") {
      if (!hasText) {
        toast.error(t.errors.noText);
        return;
      }
    } else {
      if (!hasText && !hasUrl) {
        toast.error(t.errors.noInput);
        return;
      }

      if (hasUrl && !urlIsValid) {
        toast.error(t.errors.invalidUrl);
        return;
      }
    }

    setIsAnalyzing(true);
    setIsExtracting(hasUrl && analysisMode === "external");
    setAnalysisResult(null);

    // Validate text length (100,000 characters for complex papers)
    const textToAnalyze = hasText ? articleText : "";
    if (textToAnalyze.length > 100000) {
      toast.error(t.errors.textTooLong);
      setIsAnalyzing(false);
      setIsExtracting(false);
      return;
    }

    try {
      // Create a 2.5 minute timeout for the request
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(t.errors.timeout)), 150000);
      });

      const analysisPromise = fetch("/api/analyze-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleText: hasText ? articleText : undefined,
          articleUrl: hasUrl && analysisMode === "external" ? articleUrl.trim() : undefined,
          isOwnText: analysisMode === "own",
          citationFormat: analysisMode === "own" ? citationFormat : undefined,
          language: language,
        }),
      }).then(async (resp) => {
        const json = await resp.json();
        if (!resp.ok) return { data: null, error: json.error || json };
        return { data: json, error: null };
      });


      let response;
      try {
        response = await Promise.race([analysisPromise, timeoutPromise]) as any;
      } catch (fetchError: any) {
        // Manejar errores de fetch, incluyendo 429 Too Many Requests
        console.error("Error en la petición:", fetchError);

        if (fetchError?.message?.includes('429') || fetchError?.response?.status === 429 || fetchError?.status === 429) {
          throw new Error(language === "es"
            ? "Demasiadas solicitudes. Por favor, espera unos minutos antes de intentar de nuevo. Si el problema persiste, es posible que hayas alcanzado el límite de tu plan de Supabase."
            : "Too many requests. Please wait a few minutes before trying again. If the problem persists, you may have reached your Supabase plan limit.");
        }

        if (fetchError?.message?.includes('non-2xx')) {
          throw new Error(language === "es"
            ? "Error del servidor. Por favor, intenta de nuevo en unos momentos."
            : "Server error. Please try again in a few moments.");
        }

        throw fetchError;
      }

      // Log completo de la respuesta para debugging
      console.log("Respuesta completa del backend:", response);
      console.log("Tipo de respuesta:", typeof response);
      console.log("Estructura de respuesta:", JSON.stringify(response, null, 2));

      // Verificar si es una respuesta de Supabase con estructura { data, error }
      let data, error;
      if (response && typeof response === 'object') {
        if ('data' in response && 'error' in response) {
          // Estructura de Supabase: { data, error }
          data = response.data;
          error = response.error;
        } else if ('error' in response) {
          // Solo tiene error
          error = response.error;
          data = null;
        } else {
          // La respuesta completa es el data
          data = response;
          error = null;
        }
      } else {
        data = response;
        error = null;
      }

      if (error) {
        console.error("Error del backend:", error);

        // Manejar errores 429 específicamente
        if (error?.message?.includes('429') || error?.status === 429 || (typeof error === 'object' && error?.response?.status === 429)) {
          throw new Error(language === "es"
            ? "Demasiadas solicitudes. Por favor, espera unos minutos antes de intentar de nuevo. Si el problema persiste, es posible que hayas alcanzado el límite de tu plan de Supabase."
            : "Too many requests. Please wait a few minutes before trying again. If the problem persists, you may have reached your Supabase plan limit.");
        }

        throw new Error(typeof error === 'string' ? error : (error?.message || t.errors.analyzing));
      }

      // Verificar si la respuesta tiene un error en el campo error
      if (data && data.error) {
        console.error("Error en data.error:", data.error);
        throw new Error(typeof data.error === 'string' ? data.error : (data.error?.message || t.errors.analyzing));
      }

      // Validar que la respuesta tenga la estructura mínima esperada
      if (!data) {
        console.error("Respuesta vacía del backend");
        throw new Error(language === "es" ? "El análisis no devolvió resultados válidos. Por favor, intenta de nuevo." : "Analysis did not return valid results. Please try again.");
      }

      // Transformar formato antiguo (fuentes, analisis_craap, sesgo, confiabilidad) al formato nuevo
      if (data.fuentes || data.analisis_craap || data.sesgo || data.confiabilidad) {
        console.log("⚠️ Detectado formato antiguo, transformando...");
        console.log("Estructura recibida:", JSON.stringify(data, null, 2));

        // Transformar fuentes a sources
        if (data.fuentes && Array.isArray(data.fuentes)) {
          data.sources = data.fuentes.map((fuente: any) => {
            // Si la fuente ya tiene craap completo, usarlo; si no, crear uno por defecto
            let craap;
            if (fuente.craap && typeof fuente.craap === 'object') {
              // Ya tiene craap, usarlo
              craap = fuente.craap;
            } else {
              // Crear craap por defecto usando analisis_craap global si existe
              craap = {
                currency: {
                  score: 3,
                  reasoning: data.analisis_craap?.currency || fuente.currency || ""
                },
                relevance: {
                  score: 3,
                  reasoning: data.analisis_craap?.relevance || fuente.relevance || ""
                },
                authority: {
                  score: 3,
                  reasoning: data.analisis_craap?.authority || fuente.authority || ""
                },
                accuracy: {
                  score: 3,
                  reasoning: data.analisis_craap?.accuracy || fuente.accuracy || ""
                },
                purpose: {
                  score: 3,
                  reasoning: data.analisis_craap?.purpose || fuente.purpose || ""
                },
                overall: "Media"
              };
            }

            return {
              name: fuente.nombre || fuente.name || "Fuente desconocida",
              url: fuente.url || "",
              type: fuente.tipo || fuente.type || "mención",
              accessibility: fuente.accessibility || "Desconocida",
              publicationDate: fuente.publicationDate || "Desconocida",
              summary: fuente.detalles || fuente.summary || "",
              confidenceScore: fuente.confidenceScore !== undefined ? fuente.confidenceScore : 50,
              craap: craap,
              perspective: fuente.perspective || {
                tone: "Neutral",
                orientation: "Centro"
              }
            };
          });
        }

        // Transformar sesgo a biasAnalysis
        if (data.sesgo) {
          const nivel = data.sesgo.nivel || data.sesgo.severity || "Nula";
          const severity = nivel === "Moderado" || nivel === "Significativa" ? "Significant" :
            nivel === "Leve" ? "Low" : "None";

          data.biasAnalysis = {
            selectionBias: {
              severity: severity,
              explanation: data.sesgo.justificacion || data.sesgo.explanation || "",
              quotes: []
            }
          };
        }

        // Transformar confiabilidad a summary - manejar múltiples estructuras posibles
        if (data.confiabilidad || data.sesgo) {
          let confiabilidadNivel = "Media";
          let justificacion = "";
          let plagiarismAnalysis = {
            percentage: 0,
            level: "None" as const,
            explanation: language === "es" ? "No se detectó riesgo de plagio." : "No plagiarism risk detected.",
            flaggedSections: [] as any[]
          };

          // Manejar diferentes estructuras de confiabilidad
          if (data.confiabilidad) {
            // Estructura 1: { nivel: "Alta", justificacion: "..." }
            if (data.confiabilidad.nivel) {
              confiabilidadNivel = data.confiabilidad.nivel;
              justificacion = data.confiabilidad.justificacion || "";
            }
            // Estructura 2: { credibility: "Alta", notes: "..." }
            else if (data.confiabilidad.credibility) {
              confiabilidadNivel = data.confiabilidad.credibility;
              justificacion = data.confiabilidad.notes || data.confiabilidad.justificacion || "";
            }
            // Estructura 3: { level: "High", justification: "..." }
            else if (data.confiabilidad.level) {
              confiabilidadNivel = data.confiabilidad.level;
              justificacion = data.confiabilidad.justification || data.confiabilidad.justificacion || "";
            }

            // Extraer plagiarismAnalysis si existe dentro de confiabilidad
            if (data.confiabilidad.plagiarismAnalysis) {
              plagiarismAnalysis = data.confiabilidad.plagiarismAnalysis;
            }
          }

          // Si no hay confiabilidad pero hay sesgo, usar sesgo
          if (!data.confiabilidad && data.sesgo) {
            justificacion = data.sesgo.justificacion || data.sesgo.explanation || "";
          }

          const overallReliability = confiabilidadNivel === "Alta" || confiabilidadNivel === "High" ? "High" :
            confiabilidadNivel === "Muy Alta" || confiabilidadNivel === "Very High" ? "Very High" :
              confiabilidadNivel === "Media" || confiabilidadNivel === "Medium" ? "Medium" :
                confiabilidadNivel === "Baja" || confiabilidadNivel === "Low" ? "Low" : "Very Low";

          // Calcular objectivityScore basado en confiabilidad
          let objectivityScore = 60;
          if (confiabilidadNivel === "Alta" || confiabilidadNivel === "High") {
            objectivityScore = 75;
          } else if (confiabilidadNivel === "Muy Alta" || confiabilidadNivel === "Very High") {
            objectivityScore = 85;
          } else if (confiabilidadNivel === "Media" || confiabilidadNivel === "Medium") {
            objectivityScore = 60;
          } else if (confiabilidadNivel === "Baja" || confiabilidadNivel === "Low") {
            objectivityScore = 45;
          } else {
            objectivityScore = 35;
          }

          data.summary = {
            overallReliability: overallReliability,
            mainConcerns: justificacion ? [justificacion] : [],
            strengths: [],
            objectivityScore: objectivityScore,
            objectivityExplanation: justificacion || "",
            hoaxAlerts: [],
            plagiarismAnalysis: plagiarismAnalysis
          };
        }

        // Limpiar campos antiguos
        delete data.fuentes;
        delete data.analisis_craap;
        delete data.sesgo;
        delete data.confiabilidad;

        console.log("✅ Formato transformado correctamente");
        console.log("Estructura transformada:", JSON.stringify(data, null, 2));
      }

      // Transformar summary si tiene estructura incorrecta
      if (data.summary && (!data.summary.overallReliability || !Array.isArray(data.summary.mainConcerns) || !Array.isArray(data.summary.strengths))) {
        console.log("⚠️ Detectado summary con estructura incorrecta, transformando...");
        console.log("Summary recibido:", JSON.stringify(data.summary, null, 2));

        const oldSummary = data.summary;

        // Extraer valores de diferentes estructuras posibles
        let overallReliability = "Medium";
        let mainConcerns: string[] = [];
        let strengths: string[] = [];
        let objectivityScore = 60;
        let objectivityExplanation = "";
        let hoaxAlerts: any[] = [];
        let plagiarismAnalysis = {
          percentage: 0,
          level: "None" as const,
          explanation: language === "es" ? "No se detectó riesgo de plagio." : "No plagiarism risk detected.",
          flaggedSections: [] as any[]
        };

        // Estructura 1: { credibility: "Alta", reason: "...", plagiarismAnalysis: {...} }
        if (oldSummary.credibility) {
          const credibility = oldSummary.credibility;
          overallReliability = credibility === "Alta" || credibility === "High" ? "High" :
            credibility === "Muy Alta" || credibility === "Very High" ? "Very High" :
              credibility === "Media" || credibility === "Medium" ? "Medium" :
                credibility === "Baja" || credibility === "Low" ? "Low" : "Very Low";

          objectivityExplanation = oldSummary.reason || oldSummary.justificacion || oldSummary.explanation || "";
          mainConcerns = objectivityExplanation ? [objectivityExplanation] : [];

          if (credibility === "Alta" || credibility === "High") {
            objectivityScore = 75;
          } else if (credibility === "Muy Alta" || credibility === "Very High") {
            objectivityScore = 85;
          } else if (credibility === "Media" || credibility === "Medium") {
            objectivityScore = 60;
          } else if (credibility === "Baja" || credibility === "Low") {
            objectivityScore = 45;
          } else {
            objectivityScore = 35;
          }
        }
        // Estructura 2: { nivel: "Alta", justificacion: "..." }
        else if (oldSummary.nivel) {
          const nivel = oldSummary.nivel;
          overallReliability = nivel === "Alta" ? "High" :
            nivel === "Muy Alta" ? "Very High" :
              nivel === "Media" ? "Medium" :
                nivel === "Baja" ? "Low" : "Very Low";

          objectivityExplanation = oldSummary.justificacion || oldSummary.explanation || "";
          mainConcerns = objectivityExplanation ? [objectivityExplanation] : [];

          if (nivel === "Alta") {
            objectivityScore = 75;
          } else if (nivel === "Muy Alta") {
            objectivityScore = 85;
          } else if (nivel === "Media") {
            objectivityScore = 60;
          } else if (nivel === "Baja") {
            objectivityScore = 45;
          } else {
            objectivityScore = 35;
          }
        }
        // Estructura 3: Intentar extraer de campos existentes
        else {
          overallReliability = oldSummary.overallReliability || "Medium";
          mainConcerns = Array.isArray(oldSummary.mainConcerns) ? oldSummary.mainConcerns :
            oldSummary.mainConcerns ? [oldSummary.mainConcerns] : [];
          strengths = Array.isArray(oldSummary.strengths) ? oldSummary.strengths :
            oldSummary.strengths ? [oldSummary.strengths] : [];
          objectivityScore = oldSummary.objectivityScore || 60;
          objectivityExplanation = oldSummary.objectivityExplanation || oldSummary.explanation || "";
          hoaxAlerts = Array.isArray(oldSummary.hoaxAlerts) ? oldSummary.hoaxAlerts : [];
        }

        // Extraer plagiarismAnalysis si existe
        if (oldSummary.plagiarismAnalysis) {
          plagiarismAnalysis = oldSummary.plagiarismAnalysis;
        }

        // Reconstruir summary con estructura correcta
        data.summary = {
          overallReliability: overallReliability,
          mainConcerns: mainConcerns,
          strengths: strengths,
          objectivityScore: objectivityScore,
          objectivityExplanation: objectivityExplanation,
          hoaxAlerts: hoaxAlerts,
          plagiarismAnalysis: plagiarismAnalysis
        };

        console.log("✅ Summary transformado correctamente");
        console.log("Summary transformado:", JSON.stringify(data.summary, null, 2));
      }

      if (!data.summary) {
        console.error("Respuesta sin summary:", data);
        console.error("Claves disponibles en data:", Object.keys(data));
        throw new Error(language === "es" ? "El análisis no devolvió resultados válidos. Por favor, intenta de nuevo." : "Analysis did not return valid results. Please try again.");
      }

      // Validar estructura mínima de summary después de la transformación
      if (!data.summary.overallReliability || !Array.isArray(data.summary.mainConcerns) || !Array.isArray(data.summary.strengths)) {
        console.error("Estructura de summary inválida después de transformación:", data.summary);
        throw new Error(language === "es" ? "La estructura del análisis es inválida. Por favor, intenta de nuevo." : "Analysis structure is invalid. Please try again.");
      }

      // Normalizar estructura de sesgos si viene en formato incorrecto
      if (data && data.biasAnalysis) {
        const normalizedBiasAnalysis: any = {};

        Object.entries(data.biasAnalysis).forEach(([key, value]) => {
          // Si el valor es un array (formato incorrecto), convertirlo al formato correcto
          if (Array.isArray(value)) {
            normalizedBiasAnalysis[key] = {
              severity: "Low", // By default, if there are quotes it's at least "Low"
              explanation: `${value.length} instance(s) of this bias detected in the text.`,
              quotes: value
            };
          }
          // Si ya es un objeto con la estructura correcta, mantenerlo
          else if (value && typeof value === 'object' && 'severity' in value) {
            normalizedBiasAnalysis[key] = value;
          }
          // Si es null o undefined, omitirlo
        });

        data.biasAnalysis = normalizedBiasAnalysis;
        console.log("Bias Analysis normalizado:", normalizedBiasAnalysis);
      }

      // Debug: verificar estructura de fuentes
      if (data && data.sources) {
        console.log("Sources recibidas:", data.sources);
        data.sources.forEach((source: any, idx: number) => {
          console.log(`Fuente ${idx + 1} (${source.name}):`, {
            hasCraap: !!source.craap,
            craap: source.craap,
            hasConfidenceScore: source.confidenceScore !== undefined,
            confidenceScore: source.confidenceScore
          });
        });
      }

      // Asegurar que sources y biasAnalysis existan como arrays/objetos
      if (!data.sources) {
        data.sources = [];
      }

      // Asegurar que todas las fuentes tengan análisis CRAAP completo
      if (data.sources && Array.isArray(data.sources)) {
        data.sources = data.sources.map((source: any) => {
          // Si la fuente no tiene craap o tiene estructura incorrecta, crear uno completo
          if (!source.craap || typeof source.craap !== 'object' || !source.craap.currency) {
            console.log(`⚠️ Fuente "${source.name}" sin CRAAP completo, creando análisis por defecto`);
            source.craap = {
              currency: {
                score: source.craap?.currency?.score || 3,
                reasoning: source.craap?.currency?.reasoning || (language === "es" ? "Análisis de actualidad no disponible." : "Currency analysis not available.")
              },
              relevance: {
                score: source.craap?.relevance?.score || 3,
                reasoning: source.craap?.relevance?.reasoning || (language === "es" ? "Análisis de relevancia no disponible." : "Relevance analysis not available.")
              },
              authority: {
                score: source.craap?.authority?.score || 3,
                reasoning: source.craap?.authority?.reasoning || (language === "es" ? "Análisis de autoridad no disponible." : "Authority analysis not available.")
              },
              accuracy: {
                score: source.craap?.accuracy?.score || 3,
                reasoning: source.craap?.accuracy?.reasoning || (language === "es" ? "Análisis de precisión no disponible." : "Accuracy analysis not available.")
              },
              purpose: {
                score: source.craap?.purpose?.score || 3,
                reasoning: source.craap?.purpose?.reasoning || (language === "es" ? "Análisis de propósito no disponible." : "Purpose analysis not available.")
              },
              overall: source.craap?.overall || "Media"
            };
          }
          return source;
        });
      }
      if (!data.biasAnalysis) {
        data.biasAnalysis = {};
      }
      if (!data.summary.hoaxAlerts) {
        data.summary.hoaxAlerts = [];
      }
      if (!data.summary.plagiarismAnalysis) {
        data.summary.plagiarismAnalysis = {
          percentage: 0,
          level: language === "es" ? "Ninguno" : "None",
          explanation: language === "es" ? "No se detectó riesgo de plagio." : "No plagiarism risk detected.",
          flaggedSections: []
        };
      }

      setAnalysisResult(data);
      toast.success(analysisMode === "own" ? t.success.auditCompleted : t.success.analysisCompleted);
    } catch (error: any) {
      console.error("Error analyzing:", error);
      console.error("Error details:", {
        message: error?.message,
        stack: error?.stack,
        response: error?.response,
        status: error?.status,
        statusCode: error?.statusCode
      });

      // Detectar errores 429 específicamente
      let errorMessage = error?.message || t.errors.analyzing;

      if (error?.message?.includes('429') ||
        error?.status === 429 ||
        error?.statusCode === 429 ||
        error?.response?.status === 429 ||
        error?.message?.includes('Too Many Requests') ||
        error?.message?.includes('Demasiadas solicitudes')) {
        errorMessage = language === "es"
          ? "Demasiadas solicitudes. Por favor, espera unos minutos antes de intentar de nuevo. Si el problema persiste, es posible que hayas alcanzado el límite de tu plan de Supabase."
          : "Too many requests. Please wait a few minutes before trying again. If the problem persists, you may have reached your Supabase plan limit.";
      }

      toast.error(errorMessage);
      setAnalysisResult(null);
      setIsAnalyzing(false);
      setIsExtracting(false);
    } finally {
      setIsAnalyzing(false);
      setIsExtracting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "None":
      case "Nula":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
      case "Low":
      case "Leve":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
      case "Significant":
      case "Significativa":
        return "bg-red-500/20 text-red-400 border-red-500/50";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getReliabilityColor = (reliability: string) => {
    if (reliability.includes("Very High") || reliability.includes("Muy Alta")) {
      return "text-emerald-400";
    }
    if (reliability.includes("High") || reliability.includes("Alta")) {
      return "text-emerald-300";
    }
    if (reliability.includes("Medium") || reliability.includes("Media")) {
      return "text-yellow-400";
    }
    if (reliability.includes("Low") || reliability.includes("Baja")) {
      return "text-orange-400";
    }
    if (reliability.includes("Very Low") || reliability.includes("Muy Baja")) {
      return "text-red-400";
    }
    return "text-red-400";
  };

  const getPlagiarismColor = (percentage: number) => {
    if (percentage < 10) return "text-emerald-400";
    if (percentage < 25) return "text-yellow-400";
    if (percentage < 50) return "text-orange-400";
    return "text-red-400";
  };

  const getPlagiarismLevel = (percentage: number): "None" | "Low" | "Moderate" | "High" | "Very High" => {
    if (percentage < 5) return "None";
    if (percentage < 15) return "Low";
    if (percentage < 30) return "Moderate";
    if (percentage < 50) return "High";
    return "Very High";
  };

  if (!isUnlocked) {
    const remaining = Math.max(3 - referralCount, 0);
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center space-y-6 bg-card/50 backdrop-blur border-border/50">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold mb-2">{t.locked.title}</h1>
            <p className="text-muted-foreground">
              {t.locked.message(remaining)}
            </p>
          </div>
          <Progress value={(referralCount / 3) * 100} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {t.locked.progress(referralCount)}
          </p>
          <Button onClick={() => navigate("/")} variant="outline" className="w-full">
            {t.locked.backButton}
          </Button>
          <p className="text-xs text-muted-foreground">
            {t.locked.bonus}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1"></div>
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <Select value={language} onValueChange={(value: "es" | "en") => setLanguage(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400">
              {t.header.unlocked}
            </Badge>
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent tracking-tight">
              {t.header.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto font-light">
              {t.header.subtitle}
            </p>
            <p className="text-sm text-muted-foreground/80 max-w-2xl mx-auto">
              {t.header.subtitle2}
            </p>
          </div>
          {isFounderAccess && (
            <div className="flex justify-center pt-2">
              <div className="px-4 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs uppercase tracking-[0.3em]">
                {founderAccessUntil ? t.header.founderAccess(new Date(founderAccessUntil).toLocaleDateString(language === "es" ? "es-ES" : "en-US")) : t.header.founderAccess("")}
              </div>
            </div>
          )}
        </div>

        {/* Mode Selector */}
        <Tabs value={analysisMode} onValueChange={(v) => {
          setAnalysisMode(v as "external" | "own");
          setAnalysisResult(null);
          if (v === "own") {
            setArticleUrl("");
          }
        }} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="external" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t.tabs.external}
            </TabsTrigger>
            <TabsTrigger value="own" className="flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              {t.tabs.own}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="external" className="mt-4">
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50 shadow-lg">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t.fileUpload.option1}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={handleFileSelect}
                      disabled={isAnalyzing || isProcessingFile}
                      className="hidden"
                      id="file-upload-external"
                    />
                    <label
                      htmlFor="file-upload-external"
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">{t.fileUpload.chooseFile}</span>
                    </label>
                    {selectedFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <File className="w-4 h-4" />
                        <span>{selectedFile.name}</span>
                      </div>
                    )}
                    {isProcessingFile && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.fileUpload.description}
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{language === "es" ? "O" : "OR"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t.urlInput.option2}
                  </label>
                  <Textarea
                    value={articleUrl}
                    onChange={(e) => {
                      setArticleUrl(e.target.value);
                      setSelectedFile(null); // Clear file when URL is entered
                    }}
                    placeholder={t.urlInput.placeholder}
                    className="min-h-[80px] bg-background/50 font-mono text-sm"
                    disabled={isAnalyzing}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.urlInput.description}
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">{language === "es" ? "O" : "OR"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t.textInput.option3}
                  </label>
                  <Textarea
                    value={articleText}
                    onChange={(e) => setArticleText(e.target.value)}
                    placeholder={t.textInput.placeholder}
                    className="min-h-[200px] bg-background/50"
                    disabled={isAnalyzing}
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || isProcessingFile || (!articleText.trim() && !articleUrl.trim() && !selectedFile)}
                  className="w-full"
                  size="lg"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.buttons.extracting}
                    </>
                  ) : isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.buttons.analyzing}
                    </>
                  ) : (
                    t.buttons.analyze
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="own" className="mt-4">
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50 shadow-lg">
              <div className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Brain className="w-5 h-5 text-primary mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{t.ownText.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.ownText.description}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    {t.fileUpload.option1}
                  </label>
                  <div className="flex items-center gap-2 mb-4">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      onChange={handleFileSelect}
                      disabled={isAnalyzing || isProcessingFile}
                      className="hidden"
                      id="file-upload-own"
                    />
                    <label
                      htmlFor="file-upload-own"
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg cursor-pointer hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-sm">{t.fileUpload.chooseFile}</span>
                    </label>
                    {selectedFile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <File className="w-4 h-4" />
                        <span>{selectedFile.name}</span>
                      </div>
                    )}
                    {isProcessingFile && (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t.fileUpload.description}
                  </p>

                  <div className="relative mb-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">{language === "es" ? "O" : "OR"}</span>
                    </div>
                  </div>

                  <label className="text-sm font-medium mb-2 block">
                    {t.textInput.option3.replace("article", "text")}
                  </label>
                  <Textarea
                    value={articleText}
                    onChange={(e) => setArticleText(e.target.value)}
                    placeholder={t.textInput.ownPlaceholder}
                    className="min-h-[300px] bg-background/50"
                    disabled={isAnalyzing}
                  />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">
                      {t.ownText.citationFormat}
                    </label>
                    <div className="flex gap-2">
                      {(["APA", "MLA", "Chicago"] as const).map((format) => (
                        <Button
                          key={format}
                          type="button"
                          variant={citationFormat === format ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCitationFormat(format)}
                          disabled={isAnalyzing}
                        >
                          {format}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || isProcessingFile || (!articleText.trim() && !selectedFile)}
                  className="w-full"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.buttons.auditing}
                    </>
                  ) : (
                    <>
                      <Edit3 className="mr-2 h-4 w-4" />
                      {t.buttons.audit}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Results Section */}
        {analysisResult && analysisResult.summary && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Summary Card */}
            <Card className="p-6 bg-card/50 backdrop-blur border-border/50 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Shield className="w-6 h-6" />
                  {t.results.executiveSummary}
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => generatePDF(analysisResult)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {t.results.downloadPDF}
                  </Button>
                  <Button
                    onClick={() => generateDOC(analysisResult)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {t.results.downloadDOC}
                  </Button>
                </div>
              </div>
              <div className="space-y-4">
                {/* Objectivity Score */}
                {analysisResult.summary.objectivityScore !== undefined && (
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{t.results.objectivityScore}</p>
                      <Badge className={`text-lg px-3 py-1 ${analysisResult.summary.objectivityScore >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" :
                        analysisResult.summary.objectivityScore >= 60 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" :
                          "bg-red-500/20 text-red-400 border-red-500/50"
                        }`}>
                        {analysisResult.summary.objectivityScore}/100
                      </Badge>
                    </div>
                    <Progress value={analysisResult.summary.objectivityScore} className="h-2 mb-2" />
                    {analysisResult.summary.objectivityExplanation && (
                      <p className="text-xs text-muted-foreground">{analysisResult.summary.objectivityExplanation}</p>
                    )}
                  </div>
                )}

                {/* Plagiarism Analysis - Always show */}
                {analysisResult.summary.plagiarismAnalysis !== undefined && (
                  <div className="p-4 rounded-lg bg-background/50 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className={`w-4 h-4 ${getPlagiarismColor(analysisResult.summary.plagiarismAnalysis.percentage)}`} />
                        <p className="text-sm font-medium">{t.results.plagiarismRisk}</p>
                      </div>
                      <Badge className={`text-lg px-3 py-1 ${analysisResult.summary.plagiarismAnalysis.percentage < 10 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" :
                        analysisResult.summary.plagiarismAnalysis.percentage < 25 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" :
                          analysisResult.summary.plagiarismAnalysis.percentage < 50 ? "bg-orange-500/20 text-orange-400 border-orange-500/50" :
                            "bg-red-500/20 text-red-400 border-red-500/50"
                        }`}>
                        {analysisResult.summary.plagiarismAnalysis.percentage}%
                      </Badge>
                    </div>
                    <Progress
                      value={analysisResult.summary.plagiarismAnalysis.percentage}
                      className={`h-2 mb-2 ${getPlagiarismColor(analysisResult.summary.plagiarismAnalysis.percentage)}`}
                    />
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t.results.level}: <span className={getPlagiarismColor(analysisResult.summary.plagiarismAnalysis.percentage)}>
                          {analysisResult.summary.plagiarismAnalysis.level}
                        </span>
                      </p>
                      {analysisResult.summary.plagiarismAnalysis.explanation && (
                        <p className="text-xs text-muted-foreground">{analysisResult.summary.plagiarismAnalysis.explanation}</p>
                      )}
                    </div>
                    {analysisResult.summary.plagiarismAnalysis.flaggedSections && analysisResult.summary.plagiarismAnalysis.flaggedSections.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground mb-2">{t.source.flaggedSections}:</p>
                        {analysisResult.summary.plagiarismAnalysis.flaggedSections.map((section, idx) => (
                          <div key={idx} className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30">
                            <p className="text-xs text-muted-foreground italic mb-1">"{section.text.substring(0, 100)}..."</p>
                            <p className="text-xs text-muted-foreground mb-1"><strong>{t.source.issue}:</strong> {section.reason}</p>
                            <p className="text-xs text-emerald-400"><strong>{t.source.recommendation}:</strong> {section.suggestion}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Hoax Alerts */}
                {analysisResult.summary.hoaxAlerts && analysisResult.summary.hoaxAlerts.length > 0 && (
                  <div className="p-4 rounded-lg border-2 space-y-3">
                    {analysisResult.summary.hoaxAlerts.some(alert => alert.type === "buloConfirmado") && (
                      <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-red-400" />
                          <p className="font-bold text-red-400">⚠️ {t.source.confirmedMisinformation}</p>
                        </div>
                        <div className="space-y-2">
                          {analysisResult.summary.hoaxAlerts
                            .filter(alert => alert.type === "buloConfirmado")
                            .map((alert, idx) => (
                              <div key={idx} className="text-sm">
                                <p className="font-medium text-red-300 mb-1">"{alert.claim}"</p>
                                <p className="text-red-200/80">{alert.reason}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                    {analysisResult.summary.hoaxAlerts.some(alert => alert.type === "posibleBulo") && (
                      <div className="p-3 rounded-lg bg-yellow-500/20 border border-yellow-500/50">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-yellow-400" />
                          <p className="font-bold text-yellow-400">⚠️ {t.source.possibleMisinformation}</p>
                        </div>
                        <div className="space-y-2">
                          {analysisResult.summary.hoaxAlerts
                            .filter(alert => alert.type === "posibleBulo")
                            .map((alert, idx) => (
                              <div key={idx} className="text-sm">
                                <p className="font-medium text-yellow-300 mb-1">"{alert.claim}"</p>
                                <p className="text-yellow-200/80">{alert.reason}</p>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-2">{t.results.overallReliability}</p>
                  <p className={`text-2xl font-bold ${getReliabilityColor(analysisResult.summary.overallReliability)}`}>
                    {analysisResult.summary.overallReliability}
                  </p>
                </div>

                {analysisResult.summary.mainConcerns.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {t.results.mainConcerns}
                    </p>
                    <ul className="space-y-1">
                      {analysisResult.summary.mainConcerns.map((concern, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <TrendingDown className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                          {concern}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysisResult.summary.strengths.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      {t.results.strengths}
                    </p>
                    <ul className="space-y-1">
                      {analysisResult.summary.strengths.map((strength, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                          <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>

            {/* Bias Analysis */}
            {analysisResult.biasAnalysis && Object.entries(analysisResult.biasAnalysis).some(([_, value]) => value && value.severity && value.severity !== "None" && value.severity !== "Nula") && (
              <Card className="p-6 bg-card/50 backdrop-blur border-border/50 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Brain className="w-6 h-6" />
                  {t.results.biasAnalysis}
                </h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(analysisResult.biasAnalysis)
                    .filter(([_, value]) => value && value.severity && value.severity !== "None" && value.severity !== "Nula")
                    .map(([key, value]) => {
                      if (!value || !value.severity) return null;
                      const biasNameMap: { [key: string]: string } = {
                        selectionBias: t.bias.selectionBias,
                        misrepresentation: t.bias.misrepresentation,
                        loadedLanguage: t.bias.loadedLanguage,
                        falseExperts: t.bias.falseExperts,
                        confirmationBias: t.bias.confirmationBias,
                        framing: t.bias.framing,
                        omission: t.bias.omission,
                        appealToEmotion: t.bias.appealToEmotion,
                        sensationalism: t.bias.sensationalism,
                        falseEquivalence: t.bias.falseEquivalence,
                        agendaSetting: t.bias.agendaSetting,
                        hastyGeneralization: t.bias.hastyGeneralization,
                      };
                      const biasName = biasNameMap[key] || key;
                      return (
                        <div key={key} className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium">{biasName}</p>
                            <Badge className={getSeverityColor(value.severity)}>
                              {value.severity === "Leve" || value.severity === "Low" ? t.severity.low :
                                value.severity === "Significativa" || value.severity === "Significant" ? t.severity.significant :
                                  value.severity === "Moderada" || value.severity === "Moderate" ? t.severity.moderate :
                                    value.severity === "Alta" || value.severity === "High" ? t.severity.high :
                                      value.severity === "Muy Alta" || value.severity === "Very High" ? t.severity.veryHigh :
                                        value.severity === "Nula" || value.severity === "None" ? t.severity.none :
                                          value.severity}
                            </Badge>
                          </div>
                          {value.explanation ? (
                            <p className="text-sm text-muted-foreground mb-3">{value.explanation}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground mb-3 italic">{t.bias.noExplanation}</p>
                          )}
                          {value.quotes && Array.isArray(value.quotes) && value.quotes.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/50">
                              <p className="text-xs font-medium text-muted-foreground mb-2">{t.bias.textualEvidence}:</p>
                              <div className="space-y-2">
                                {value.quotes.map((quote, idx) => (
                                  <div key={idx} className="text-xs bg-background/70 p-2 rounded border-l-2 border-primary/50 italic text-muted-foreground">
                                    "{quote}"
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                    .filter(item => item !== null)}
                </div>
              </Card>
            )}

            {/* Own Text Specific Sections */}
            {analysisResult.isOwnText && (
              <>
                {/* Missing Citations */}
                {analysisResult.missingCitations && analysisResult.missingCitations.length > 0 && (
                  <Card className="p-6 bg-card/50 backdrop-blur border-border/50 border-yellow-500/30 shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <AlertCircle className="w-6 h-6 text-yellow-400" />
                      {t.results.missingCitations}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t.results.missingCitationsDesc}
                    </p>
                    <div className="space-y-2">
                      {analysisResult.missingCitations.map((claim, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                          <p className="text-sm text-muted-foreground italic">"{claim}"</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Improvement Suggestions */}
                {analysisResult.improvementSuggestions && analysisResult.improvementSuggestions.length > 0 && (
                  <Card className="p-6 bg-card/50 backdrop-blur border-border/50 border-primary/30 shadow-lg">
                    <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                      <Brain className="w-6 h-6" />
                      {t.results.improvementSuggestions}
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t.results.improvementDesc}
                    </p>
                    <div className="space-y-4">
                      {analysisResult.improvementSuggestions.map((suggestion, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-background/50 border border-border/50">
                          <div className="flex items-start gap-3">
                            <Badge variant="outline" className="shrink-0">
                              {suggestion.type === "language" && t.source.language}
                              {suggestion.type === "source" && t.source.sources}
                              {suggestion.type === "balance" && t.source.balance}
                              {suggestion.type === "claim" && t.source.claim}
                            </Badge>
                            <div className="flex-1 space-y-3">
                              <p className="text-sm font-medium">{suggestion.reason}</p>

                              <div className="space-y-2">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">{t.source.exampleIssue}:</p>
                                  <div className="bg-red-500/10 border border-red-500/30 rounded p-2">
                                    <p className="text-xs text-foreground leading-relaxed">
                                      {suggestion.current}
                                    </p>
                                  </div>
                                </div>

                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">{t.source.criticalThinking}:</p>
                                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2">
                                    <p className="text-xs text-foreground leading-relaxed">
                                      {suggestion.suggestion}
                                    </p>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 italic">
                                    {t.source.criticalThinkingNote}
                                  </p>
                                </div>
                              </div>

                              {suggestion.location && (
                                <div className="pt-2 border-t border-border/50">
                                  <p className="text-xs text-muted-foreground">
                                    <span className="font-medium">{t.source.approximateLocation}:</span> {suggestion.location.substring(0, 100)}{suggestion.location.length > 100 ? '...' : ''}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Sources Analysis - Show for both modes (external and own) */}
            {analysisResult.sources && analysisResult.sources.length > 0 && (
              <Card className="p-6 bg-card/50 backdrop-blur border-border/50 shadow-lg">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-6 h-6" />
                  {analysisResult.isOwnText ? t.results.craapAnalysis : t.results.sourcesAnalysis}
                </h2>
                {analysisResult.isOwnText && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {t.results.craapDescription}
                  </p>
                )}
                <div className="space-y-4">
                  {[...analysisResult.sources]
                    .sort((a, b) => {
                      // Sort by publication date (most recent first)
                      const dateA = a.publicationDate && a.publicationDate !== 'Desconocida' && a.publicationDate !== 'Unknown'
                        ? new Date(a.publicationDate).getTime()
                        : 0;
                      const dateB = b.publicationDate && b.publicationDate !== 'Desconocida' && b.publicationDate !== 'Unknown'
                        ? new Date(b.publicationDate).getTime()
                        : 0;
                      return dateB - dateA;
                    })
                    .map((source, idx) => (
                      <div key={idx} className="p-4 rounded-lg bg-background/50 border border-border/50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-start gap-2">
                              <h3 className="font-semibold text-lg">{source.name}</h3>
                              {source.confidenceScore !== undefined && (
                                <Badge className={`text-xs ${source.confidenceScore >= 80 ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" :
                                  source.confidenceScore >= 60 ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/50" :
                                    "bg-red-500/20 text-red-400 border-red-500/50"
                                  }`}>
                                  {source.confidenceScore}% {t.source.confidence}
                                </Badge>
                              )}
                            </div>
                            {source.url && (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline mt-1 block truncate max-w-md"
                              >
                                {source.url}
                              </a>
                            )}
                            {source.summary && (
                              <p className="text-sm text-muted-foreground mt-2 italic">{source.summary}</p>
                            )}
                            <div className="flex gap-2 mt-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">{source.type}</Badge>
                              <Badge variant="outline" className="text-xs">{source.accessibility}</Badge>
                              {source.publicationDate && source.publicationDate !== 'Desconocida' && source.publicationDate !== 'Unknown' && (
                                <Badge variant="outline" className="text-xs">
                                  {new Date(source.publicationDate).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {source.craap && source.craap.overall && (
                            <Badge className={`${getReliabilityColor(source.craap.overall)} border-current ml-2`}>
                              {source.craap.overall}
                            </Badge>
                          )}
                        </div>

                        {source.perspective && (
                          <div className="grid md:grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t.source.tone}</p>
                              <p className="text-sm font-medium">{source.perspective.tone || t.source.notSpecified}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">{t.source.orientation}</p>
                              <p className="text-sm font-medium">{source.perspective.orientation || t.source.notSpecified}</p>
                            </div>
                          </div>
                        )}

                        {source.craap ? (
                          <div className="space-y-3 mt-3 pt-3 border-t border-border/50">
                            <p className="text-sm font-medium mb-3">{t.craap.score}</p>
                            <div className="space-y-3">
                              {Object.entries(source.craap)
                                .filter(([key]) => key !== "overall")
                                .map(([key, value]) => {
                                  if (!value || typeof value !== 'object' || !('score' in value)) {
                                    return null;
                                  }
                                  const craapValue = value as CraapScore;
                                  const scoreNames: { [key: string]: string } = {
                                    currency: t.craap.currency,
                                    relevance: t.craap.relevance,
                                    authority: t.craap.authority,
                                    accuracy: t.craap.accuracy,
                                    purpose: t.craap.purpose
                                  };
                                  return (
                                    <div key={key} className="space-y-1.5">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="font-medium text-muted-foreground">
                                          {scoreNames[key] || key}
                                        </span>
                                        <span className="font-bold text-foreground">{craapValue.score}/5</span>
                                      </div>
                                      <Progress
                                        value={(craapValue.score / 5) * 100}
                                        className="h-2"
                                      />
                                      {craapValue.reasoning && (
                                        <p className="text-xs text-muted-foreground italic mt-1">
                                          {craapValue.reasoning}
                                        </p>
                                      )}
                                    </div>
                                  );
                                })
                                .filter(item => item !== null)}
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3 pt-3 border-t border-border/50">
                            <p className="text-xs text-muted-foreground italic">
                              {t.craap.notAvailable}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative py-8 px-4 border-t border-border/50 mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center text-sm text-muted-foreground space-y-4">
            <p>{t.footer.copyright}</p>
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <a
                href="/privacidad"
                className="hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                {t.footer.privacy}
              </a>
              <span className="text-border">•</span>
              <a
                href="/terminos"
                className="hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                {t.footer.terms}
              </a>
              <span className="text-border">•</span>
              <a
                href="/aviso-legal"
                className="hover:text-primary transition-colors underline-offset-4 hover:underline"
              >
                {t.footer.legal}
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Oraculus;
