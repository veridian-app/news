import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, TrendingUp, TrendingDown, FileText, Edit3, BookOpen, Shield, Brain, Upload, Download, File as FileIcon, Globe, X, History, ChevronRight, Sparkles, LayoutDashboard, Search, ArrowRight, Rocket, ExternalLink, Users, Building2, MapPin, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import { motion, AnimatePresence } from "framer-motion";
import { BottomDock } from "@/components/BottomDock";
import { ResearchPanel } from "@/components/ResearchPanel";
import { cn } from "@/lib/utils";
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
  entities?: Array<{
    name: string;
    type: "Person" | "Organization" | "Location" | "Event";
    role: string;
    sentiment: "Positive" | "Negative" | "Neutral";
  }>;
}

interface AnalysisHistoryItem {
  id: string;
  date: string;
  type: 'url' | 'file' | 'text';
  summary: string;
  score?: number;
  reliability?: string;
  result: AnalysisResult;
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

  // Core State
  const [articleText, setArticleText] = useState("");
  const [articleUrl, setArticleUrl] = useState("");
  const [articleTitle, setArticleTitle] = useState("");
  const [citationFormat, setCitationFormat] = useState<string>("APA");
  const [isResearchPanelOpen, setIsResearchPanelOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // UI State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [analysisMode, setAnalysisMode] = useState<"external" | "own">("external");

  // Data State
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisHistoryItem[]>([]);

  // Load history on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('oraculus_history');
      if (saved) setHistory(JSON.parse(saved));
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []);

  const addToHistory = (result: AnalysisResult, type: 'url' | 'file' | 'text', contentSummary: string) => {
    const newItem: AnalysisHistoryItem = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type,
      summary: contentSummary,
      score: result.summary.objectivityScore,
      reliability: result.summary.overallReliability,
      result
    };

    // Keep last 5 items
    const newHistory = [newItem, ...history].slice(0, 5);
    setHistory(newHistory);
    localStorage.setItem('oraculus_history', JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('oraculus_history');
  };

  const loadFromHistory = (item: AnalysisHistoryItem) => {
    setAnalysisResult(item.result);
    // Scroll to results
    setTimeout(() => {
      const resultsElement = document.getElementById('analysis-results');
      if (resultsElement) resultsElement.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

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
        // Use CDN worker matching the exact installed version
        const pdfjsVersion = pdfjsLib.version;
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

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

      addToHistory(
        data,
        analysisMode === 'own' ? 'text' : (articleUrl ? 'url' : (selectedFile ? 'file' : 'text')),
        articleUrl || (selectedFile ? selectedFile.name : (articleText.substring(0, 50) + "..."))
      );
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

  // Render Helpers
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-400";
    if (score >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getReliabilityColor = (reliability: string) => {
    if (reliability.includes("Very High") || reliability.includes("Muy Alta") || reliability.includes("High") || reliability.includes("Alta")) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    if (reliability.includes("Medium") || reliability.includes("Media")) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
    return "bg-red-500/10 text-red-400 border-red-500/20";
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "None":
      case "Nula":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Low":
      case "Leve":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "Medium":
      case "Moderada":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "High":
      case "Alta":
      case "Significant":
      case "Significativa":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24 font-sans selection:bg-primary/20">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 pt-6 md:pt-12">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20 backdrop-blur-sm shadow-[0_0_15px_-3px_rgba(16,185,129,0.2)]">
              <Brain className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Oraculus</h1>
              <p className="text-sm text-muted-foreground hidden md:block">
                {language === "es" ? "Sistema de Análisis de Integridad Informativa" : "Information Integrity Analysis System"}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLanguage(language === "es" ? "en" : "es")}
              className="rounded-full hover:bg-white/5"
            >
              <span className="text-xs font-bold">{language === "es" ? "ES" : "EN"}</span>
            </Button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!analysisResult ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Input Section */}
              <div className="space-y-6">
                {/* Mode Toggle */}
                <div className="flex justify-center">
                  <div className="bg-secondary/30 p-1.5 rounded-full border border-white/5 flex gap-1 backdrop-blur-md">
                    <Button
                      variant={analysisMode === 'external' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setAnalysisMode('external')}
                      className="rounded-full px-6 transition-all"
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      {t.tabs.external}
                    </Button>
                    <Button
                      variant={analysisMode === 'own' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setAnalysisMode('own')}
                      className="rounded-full px-6 transition-all"
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      {t.tabs.own}
                    </Button>
                  </div>
                </div>

                {/* Main Input Card */}
                <Card className="p-1 border-white/10 bg-black/20 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                  <div className="bg-card/95 p-6 md:p-10 rounded-lg border border-white/5">
                    <div className="space-y-6">
                      {/* Unified Dropzone Area */}
                      <div
                        className={cn(
                          "relative rounded-xl border-2 border-dashed border-white/10 bg-black/20 transition-all duration-300",
                          "hover:border-primary/50 hover:bg-black/30 group-hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.1)]",
                          (selectedFile || articleText || articleUrl) && "border-primary/50 bg-primary/5"
                        )}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files[0];
                          if (file) {
                            if (file.type === 'application/pdf' || file.name.endsWith('.pdf') ||
                              file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                              file.name.endsWith('.docx') || file.type === 'text/plain' || file.name.endsWith('.txt')) {
                              setSelectedFile(file);
                              setArticleText("");
                              setArticleUrl("");
                            } else {
                              toast.error("File type not supported. Use PDF, DOCX or TXT.");
                            }
                          }
                        }}
                      >
                        <label className="flex flex-col items-center justify-center w-full min-h-[200px] cursor-pointer p-8 text-center">
                          {selectedFile ? (
                            <div className="space-y-3 animate-in fade-in zoom-in duration-300">
                              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-2">
                                <FileIcon className="w-8 h-8 text-primary" />
                              </div>
                              <p className="font-medium text-lg text-primary-foreground">{selectedFile.name}</p>
                              <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                              <Button variant="ghost" size="sm" onClick={(e) => { e.preventDefault(); setSelectedFile(null); }}>
                                <X className="w-4 h-4 mr-2" />
                                {language === "es" ? "Cambiar archivo" : "Change file"}
                              </Button>
                            </div>
                          ) : <>
                            <div
                              className="mb-4 p-4 rounded-full bg-white/5 hover:bg-primary/20 transition-all cursor-pointer group-hover:scale-110 duration-300"
                              onClick={(e) => {
                                e.preventDefault();
                                document.getElementById('file-upload')?.click();
                              }}
                            >
                              <Upload className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-lg font-medium mb-2">
                              {analysisMode === 'external'
                                ? (language === "es" ? "Arrastra un archivo o pega una URL" : "Drag a file or paste a URL")
                                : (language === "es" ? "Pega tu texto aquí o sube un archivo" : "Paste your text here or upload a file")}
                            </p>
                            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                              PDF, DOCX, TXT {language === "es" ? "o enlaces directos a artículos" : "or direct article links"}
                            </p>

                            {/* URL/Text Input Overlay */}
                            <div className="w-full max-w-xl relative" onClick={e => e.stopPropagation()}>
                              <div className="relative group/input">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                                  {articleUrl ? <Globe className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-muted-foreground" />}
                                </div>
                                <Textarea
                                  value={articleText || articleUrl}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (val.trim().startsWith('http')) {
                                      setArticleUrl(val);
                                      setArticleText("");
                                    } else {
                                      setArticleText(val);
                                      setArticleUrl("");
                                    }
                                  }}
                                  placeholder={analysisMode === 'external' ? "https://..." : (language === "es" ? "Escribe o pega texto..." : "Type or paste text...")}
                                  className="pl-10 min-h-[60px] py-4 bg-black/40 border-white/10 focus:border-primary/50 transition-all resize-y text-sm md:text-base font-mono rounded-lg"
                                />
                              </div>
                              <div className="mt-2 flex justify-between items-center text-xs text-muted-foreground px-1">
                                <span>{(articleText || articleUrl).length > 0 ? `${(articleText || articleUrl).length} chars` : ""}</span>
                                {analysisMode === 'own' && (
                                  <div className="flex items-center gap-2">
                                    <span className="opacity-70">Format:</span>
                                    <Select value={citationFormat} onValueChange={(v: any) => setCitationFormat(v)}>
                                      <SelectTrigger className="h-6 w-[80px] text-xs bg-transparent border-white/10 px-2">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="APA">APA</SelectItem>
                                        <SelectItem value="MLA">MLA</SelectItem>
                                        <SelectItem value="Chicago">Chicago</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}
                              </div>
                            </div>

                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.txt"
                              onChange={handleFileSelect}
                              className="hidden"
                              id="file-upload"
                            />
                          </>
                          }
                        </label>
                      </div>

                      <Button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || isProcessingFile || (!articleText.trim() && !articleUrl.trim() && !selectedFile)}
                        className="w-full h-12 text-lg font-medium shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all bg-gradient-to-r from-primary to-emerald-600 hover:from-primary/90 hover:to-emerald-600/90"
                        size="lg"
                      >
                        {isExtracting ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {t.buttons.extracting}
                          </>
                        ) : isAnalyzing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {t.buttons.analyzing}
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-5 w-5" />
                            {t.buttons.analyze}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* History Section */}
                {history.length > 0 && (
                  <div className="pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <History className="w-4 h-4" />
                        {language === "es" ? "Análisis Recientes" : "Recent Analysis"}
                      </p>
                      <button onClick={clearHistory} className="text-xs text-muted-foreground hover:text-red-400 transition-colors uppercase tracking-wider font-semibold">
                        {language === "es" ? "Limpiar" : "Clear"}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {history.map(item => (
                        <button
                          key={item.id}
                          onClick={() => loadFromHistory(item)}
                          className="flex items-center gap-3 p-3 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 transition-colors text-left group active:scale-[0.98]"
                        >
                          <div className="p-2 rounded bg-black/20 text-muted-foreground group-hover:text-primary transition-colors">
                            {item.type === 'url' ? <Globe className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate text-foreground group-hover:text-white transition-colors">
                              {item.summary || "Untitled"}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</span>
                              {item.score !== undefined && (
                                <Badge variant="outline" className={cn("text-[10px] h-4 border-white/10", getScoreColor(item.score).replace('text-', 'text-'))}>
                                  {item.score}/100
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-transform group-hover:translate-x-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              id="analysis-results"
              className="space-y-6 pb-12"
            >
              {/* Results Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <Button variant="ghost" className="hover:bg-white/5 -ml-2 text-muted-foreground hover:text-foreground" onClick={() => setAnalysisResult(null)}>
                  <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                  {language === "es" ? "Nuevo Análisis" : "New Analysis"}
                </Button>

                <div className="flex gap-2 w-full sm:w-auto">
                  <Button onClick={() => generatePDF(analysisResult)} variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none border-white/10 hover:bg-white/5">
                    <Download className="w-4 h-4" /> PDF
                  </Button>
                  <Button onClick={() => generateDOC(analysisResult)} variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none border-white/10 hover:bg-white/5">
                    <Download className="w-4 h-4" /> DOCX
                  </Button>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Objectivity Score */}
                <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Shield className="w-24 h-24" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mb-2 uppercase tracking-wider">{t.results.objectivityScore}</p>
                  <div className="flex items-end gap-2">
                    <span className={cn("text-5xl font-bold tracking-tighter", getScoreColor(analysisResult.summary.objectivityScore || 0))}>
                      {analysisResult.summary.objectivityScore}
                    </span>
                    <span className="text-lg text-muted-foreground mb-1.5 font-light">/100</span>
                  </div>
                  <Progress value={analysisResult.summary.objectivityScore} className="h-1.5 mt-4 bg-white/5" indicatorClassName={getScoreColor(analysisResult.summary.objectivityScore || 0).replace('text-', 'bg-')} />
                </Card>

                {/* Reliability */}
                <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-md flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Brain className="w-24 h-24" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mb-3 uppercase tracking-wider">{t.results.overallReliability}</p>
                  <div className={cn("inline-flex self-start px-4 py-1.5 rounded-full text-sm font-medium border", getReliabilityColor(analysisResult.summary.overallReliability))}>
                    {analysisResult.summary.overallReliability}
                  </div>
                </Card>

                {/* Plagiarism Risk */}
                <Card className="p-6 border-white/10 bg-black/20 backdrop-blur-md relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <AlertCircle className="w-24 h-24" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium mb-2 uppercase tracking-wider">{t.results.plagiarismRisk}</p>
                  <div className="flex items-end gap-2">
                    <span className={cn("text-5xl font-bold tracking-tighter",
                      analysisResult.summary.plagiarismAnalysis?.percentage < 15 ? "text-emerald-400" :
                        analysisResult.summary.plagiarismAnalysis?.percentage < 40 ? "text-yellow-400" : "text-red-400"
                    )}>
                      {analysisResult.summary.plagiarismAnalysis?.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 font-medium bg-white/5 inline-block px-2 py-1 rounded">
                    {analysisResult.summary.plagiarismAnalysis?.level}
                  </p>
                </Card>
              </div>

              {/* Hoax Alerts Banner */}
              {analysisResult.summary.hoaxAlerts && analysisResult.summary.hoaxAlerts.length > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-5 flex gap-4 animate-in fade-in slide-in-from-top-4">
                  <div className="bg-red-500/20 p-2 rounded-full h-fit">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-red-400">{t.source.confirmedMisinformation}</h3>
                    <ul className="space-y-2 text-sm text-red-200/80">
                      {analysisResult.summary.hoaxAlerts.map((alert, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="opacity-50">•</span>
                          <span>{alert.claim}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Detailed Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full bg-black/20 backdrop-blur-sm border border-white/5 p-1 h-auto grid grid-cols-2 md:grid-cols-4 gap-1 rounded-xl">
                  <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all py-3">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    {language === "es" ? "Resumen" : "Overview"}
                  </TabsTrigger>
                  <TabsTrigger value="bias" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all py-3">
                    <Brain className="w-4 h-4 mr-2" />
                    {t.results.biasAnalysis}
                  </TabsTrigger>
                  <TabsTrigger value="sources" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all py-3">
                    <BookOpen className="w-4 h-4 mr-2" />
                    {language === "es" ? "Fuentes" : "Sources"}
                  </TabsTrigger>
                  {analysisMode === 'own' && (
                    <TabsTrigger value="improvements" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary border border-transparent data-[state=active]:border-primary/20 transition-all py-3">
                      <Sparkles className="w-4 h-4 mr-2" />
                      {language === "es" ? "Mejoras" : "Improvements"}
                    </TabsTrigger>
                  )}
                </TabsList>

                <div className="mt-6 space-y-6">
                  <TabsContent value="overview" className="space-y-6 focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    {/* Summary Text */}
                    <Card className="p-6 md:p-8 bg-card/40 backdrop-blur border-border/50">
                      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-primary">
                        <Sparkles className="w-5 h-5" />
                        {t.results.executiveSummary}
                      </h3>

                      <div className="grid md:grid-cols-2 gap-8">
                        {/* Concerns */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-red-400 uppercase tracking-wider pb-2 border-b border-white/5">
                            <TrendingDown className="w-4 h-4" />
                            {t.results.mainConcerns}
                          </div>
                          {analysisResult.summary.mainConcerns.length > 0 ? (
                            <ul className="space-y-3">
                              {analysisResult.summary.mainConcerns.map((c, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex gap-3 group">
                                  <div className="w-1.5 h-1.5 rounded-full bg-red-500/50 mt-1.5 group-hover:scale-125 transition-transform" />
                                  <span className="leading-relaxed">{c}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic opacity-50">None detected</p>
                          )}
                        </div>

                        {/* Strengths */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 text-sm font-medium text-emerald-400 uppercase tracking-wider pb-2 border-b border-white/5">
                            <TrendingUp className="w-4 h-4" />
                            {t.results.strengths}
                          </div>
                          {analysisResult.summary.strengths.length > 0 ? (
                            <ul className="space-y-3">
                              {analysisResult.summary.strengths.map((c, i) => (
                                <li key={i} className="text-sm text-muted-foreground flex gap-3 group">
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 mt-1.5 group-hover:scale-125 transition-transform" />
                                  <span className="leading-relaxed">{c}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-muted-foreground italic opacity-50">None detected</p>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Key Entities & Connections */}
                    {analysisResult.entities && analysisResult.entities.length > 0 && (
                      <Card className="p-6 md:p-8 bg-card/40 backdrop-blur border-border/50">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-primary">
                          <Users className="w-5 h-5" />
                          Key Entities & Connections
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {analysisResult.entities.map((entity, i) => (
                            <div key={i} className="p-4 rounded-lg bg-black/20 border border-white/5 hover:border-primary/20 transition-colors">
                              <div className="flex justify-between items-start mb-2">
                                <div className="p-2 bg-white/5 rounded-md">
                                  {entity.type === 'Person' && <Users className="w-4 h-4 text-primary" />}
                                  {entity.type === 'Organization' && <Building2 className="w-4 h-4 text-orange-400" />}
                                  {entity.type === 'Location' && <MapPin className="w-4 h-4 text-emerald-400" />}
                                  {entity.type === 'Event' && <Calendar className="w-4 h-4 text-purple-400" />}
                                </div>
                                <Badge variant="outline" className={cn(
                                  "text-[10px] px-2 py-0.5 h-auto uppercase tracking-wider",
                                  entity.sentiment === 'Positive' ? 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10' :
                                    entity.sentiment === 'Negative' ? 'text-red-400 border-red-500/20 bg-red-500/10' :
                                      'text-gray-400 border-gray-500/20 bg-gray-500/10'
                                )}>
                                  {entity.sentiment}
                                </Badge>
                              </div>
                              <h4 className="font-medium text-sm text-white mb-1">{entity.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">{entity.role}</p>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="bias" className="focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(analysisResult.biasAnalysis || {})
                        .filter(([_, val]: [string, any]) => val && val.severity && val.severity !== 'None' && val.severity !== 'Nula')
                        .map(([key, val]: [string, any]) => (
                          <Card key={key} className="p-6 bg-card/40 backdrop-blur border-border/50 hover:border-primary/20 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                              <h4 className="font-medium capitalize text-lg group-hover:text-primary transition-colors">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                              <Badge variant="outline" className={cn("px-3 py-1", getSeverityColor(val.severity))}>
                                {val.severity}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{val.explanation}</p>
                            {val.quotes && val.quotes.length > 0 && (
                              <div className="bg-black/20 p-4 rounded-lg text-sm italic text-muted-foreground border-l-2 border-primary/20">
                                "{val.quotes[0]}"
                              </div>
                            )}
                          </Card>
                        ))}
                      {Object.entries(analysisResult.biasAnalysis || {}).filter(([_, val]: [string, any]) => val && val.severity && val.severity !== 'None' && val.severity !== 'Nula').length === 0 && (
                        <div className="col-span-2 py-12 text-center text-muted-foreground">
                          <CheckCircle2 className="w-12 h-12 text-emerald-500/50 mx-auto mb-4" />
                          <p className="text-lg font-medium">No significant biases detected</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="sources" className="focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="space-y-4">
                      {analysisResult.sources?.map((source, i) => (
                        <Card key={i} className="p-6 bg-card/40 backdrop-blur border-border/50 hover:bg-card/60 transition-colors">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-4">
                            <div>
                              <h4 className="font-medium text-lg text-primary flex items-center gap-2">
                                {source.name}
                                <ExternalLink className="w-3 h-3 opacity-50" />
                              </h4>
                              {source.url && <a href={source.url} target="_blank" className="text-xs text-muted-foreground hover:text-white truncate max-w-sm block mt-1 transition-colors">{source.url}</a>}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className={cn(
                                (source.craap?.overall?.includes('High') || source.confidenceScore > 80) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              )}>
                                Run Score: {source.craap?.overall || `${source.confidenceScore}%`}
                              </Badge>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed bg-black/10 p-3 rounded-lg border border-white/5">
                            {source.summary}
                          </p>

                          {source.craap && (
                            <div className="col-span-2 md:col-span-4 mt-4 pt-4 border-t border-white/5">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">CRAAP Analysis Methodology</p>
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {Object.entries(source.craap).filter(([k]) => k !== 'overall').map(([key, val]: [string, any]) => (
                                  <div key={key} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] uppercase tracking-wider font-medium">
                                      <span className="opacity-70">{key}</span>
                                      <span className={cn(
                                        val.score >= 4 ? "text-emerald-400" : (val.score >= 3 ? "text-yellow-400" : "text-red-400")
                                      )}>{val.score}/5</span>
                                    </div>
                                    <Progress value={(val.score / 5) * 100} className="h-1 bg-white/5" indicatorClassName={
                                      val.score >= 4 ? "bg-emerald-500" : (val.score >= 3 ? "bg-yellow-500" : "bg-red-500")
                                    } />
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </Card>
                      ))}
                      {(!analysisResult.sources || analysisResult.sources.length === 0) && (
                        <div className="py-12 text-center text-muted-foreground">
                          <p>No external sources detected in text</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {analysisMode === 'own' && (
                    <TabsContent value="improvements" className="focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="space-y-4">
                        {analysisResult.improvementSuggestions?.map((imp, i) => (
                          <Card key={i} className="p-6 bg-card/40 backdrop-blur border-border/50">
                            <div className="flex gap-4">
                              <div className="p-2 bg-primary/10 rounded-lg h-fit border border-primary/20">
                                <Sparkles className="w-5 h-5 text-primary" />
                              </div>
                              <div className="space-y-4 flex-1">
                                <p className="text-sm font-medium leading-relaxed">{imp.reason}</p>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                  <div className="p-4 bg-red-500/5 rounded-lg border border-red-500/10">
                                    <p className="text-xs text-red-500 mb-2 font-bold uppercase tracking-wider">Before</p>
                                    <p className="opacity-80 italic">"{imp.current}"</p>
                                  </div>
                                  <div className="p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                    <p className="text-xs text-emerald-500 mb-2 font-bold uppercase tracking-wider">After</p>
                                    <p className="opacity-80 font-medium">"{imp.suggestion}"</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>
                  )}
                </div>
              </Tabs>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <BottomDock />

      {/* Research Chat FAB */}
      <AnimatePresence>
        {!isAnalyzing && analysisResult && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <Button
              onClick={() => setIsResearchPanelOpen(true)}
              className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white p-0 flex items-center justify-center border border-white/20"
            >
              <Sparkles className="w-6 h-6 animate-pulse" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <ResearchPanel
        isOpen={isResearchPanelOpen}
        onClose={() => setIsResearchPanelOpen(false)}
        articleContext={analysisMode === 'own' ? articleText : (articleText || "No context available")}
        articleTitle={articleTitle}
      />
    </div>
  );
};

export default Oraculus;
