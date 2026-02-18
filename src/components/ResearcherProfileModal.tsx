import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExternalLink, BookOpen, GraduationCap, Building2, TrendingUp, Calendar, Quote, Link as LinkIcon, Loader2, DollarSign, AlertTriangle, MapPin, Target } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Card } from "@/components/ui/card";

interface ResearcherProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    entityName: string;
    entityType?: 'Person' | 'Organization' | 'Location' | 'Event' | string;
}

interface Paper {
    title: string;
    year: number;
    citationCount: number;
    venue: string;
    url: string;
}

interface AuthorData {
    authorId: string;
    name: string;
    affiliations: string[];
    paperCount: number;
    citationCount: number;
    hIndex: number;
    homepage?: string;
    papers: Paper[];
}

interface OrganizationData {
    description: string;
    type: string;
    headquarters: string;
    keyPeople: string[];
    funding: string;
    stance: string;
    controversies: string[];
}

export function ResearcherProfileModal({ isOpen, onClose, entityName, entityType = 'Person' }: ResearcherProfileModalProps) {
    const { language, t } = useLanguage();
    const [authorData, setAuthorData] = useState<AuthorData | null>(null);
    const [orgData, setOrgData] = useState<OrganizationData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && entityName) {
            if (entityType === 'Person') {
                fetchAuthorData();
            } else {
                fetchOrgData();
            }
        } else {
            setAuthorData(null);
            setOrgData(null);
            setError(null);
        }
    }, [isOpen, entityName, entityType]);

    const fetchOrgData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ entityName, language: language === 'es' ? 'es' : 'en', type: 'entity' })
            });

            if (!response.ok) throw new Error("Analysis failed");
            const data = await response.json();
            setOrgData(data);
        } catch (err) {
            console.error("Error analyzing entity:", err);
            setError(language === "es" ? "No se pudo analizar la organización." : "Could not analyze organization.");
        } finally {
            setLoading(false);
        }
    };

    const fetchAuthorData = async () => {
        setLoading(true);
        setError(null);
        try {
            // First, search for the author to get ID
            const searchRes = await fetch(`/api/scholar/author?query=${encodeURIComponent(entityName)}`);
            if (!searchRes.ok) throw new Error("Search failed");
            const searchData = await searchRes.json();

            if (!searchData.data || searchData.data.length === 0) {
                // Fallback to Org analysis if person not found? No, just error for now.
                throw new Error("Author not found");
            }

            const authorId = searchData.data[0].authorId;
            const cleanAuthorId = String(authorId).split(':')[0];

            // Then fetch details
            const detailsRes = await fetch(`/api/scholar/author?authorId=${cleanAuthorId}`);
            if (!detailsRes.ok) throw new Error("Details failed");
            const detailsData = await detailsRes.json();

            setAuthorData({
                authorId: detailsData.authorId,
                name: detailsData.name,
                affiliations: detailsData.affiliations || [],
                paperCount: detailsData.paperCount,
                citationCount: detailsData.citationCount,
                hIndex: detailsData.hIndex,
                homepage: detailsData.homepage,
                papers: detailsData.papers?.map((p: any) => ({
                    title: p.title,
                    year: p.year,
                    citationCount: p.citationCount,
                    venue: p.venue,
                    url: p.url
                })) || []
            });

        } catch (err) {
            console.error("Error fetching author:", err);
            setError(language === "es" ? "No se pudo cargar la información del investigador." : "Could not load researcher information.");
        } finally {
            setLoading(false);
        }
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p>{language === "es" ? "Analizando perfil..." : "Analyzing profile..."}</p>
                </div>
            );
        }

        if (error) {
            const isNotFound = error === "Author not found" || error.includes("not found");
            return (
                <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2 p-8 text-center">
                    {isNotFound ? (
                        <>
                            <div className="p-3 bg-white/5 rounded-full mb-2">
                                <GraduationCap className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="font-medium">{language === "es" ? "Investigador no encontrado" : "Researcher not found"}</p>
                            <p className="text-xs opacity-50 max-w-xs">
                                {language === "es"
                                    ? "No pudimos encontrar un perfil exacto en Semantic Scholar. Puede que el nombre difiera ligeramente."
                                    : "We couldn't match this exact name in Semantic Scholar. The spelling might differ."}
                            </p>
                        </>
                    ) : (
                        <>
                            <p>{error}</p>
                            <p className="text-xs opacity-50">
                                {entityType === 'Person'
                                    ? (language === "es" ? "Intenta buscar manualmente en Google Scholar." : "Try searching manually on Google Scholar.")
                                    : (language === "es" ? "Intenta buscar en la web oficial." : "Try checking their official website.")}
                            </p>
                        </>
                    )}
                </div>
            );
        }

        if (entityType === 'Person' && authorData) {
            return (
                <div className="h-full flex flex-col">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-1 p-6 pb-2">
                        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10 text-center">
                            <h4 className="text-2xl font-bold text-primary">{authorData.hIndex}</h4>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">h-index</p>
                        </div>
                        <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/10 text-center">
                            <h4 className="text-2xl font-bold text-purple-400">{authorData.paperCount}</h4>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{language === "es" ? "Publicaciones" : "Publications"}</p>
                        </div>
                        <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10 text-center">
                            <h4 className="text-2xl font-bold text-emerald-400">{authorData.citationCount}</h4>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{language === "es" ? "Citas" : "Citations"}</p>
                        </div>
                    </div>

                    <Tabs defaultValue="papers" className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 border-b border-white/5">
                            <TabsList className="bg-transparent h-10 p-0 gap-6">
                                <TabsTrigger value="papers" className="bg-transparent border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none px-0 font-medium">{language === "es" ? "Publicaciones Recientes" : "Recent Papers"}</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="papers" className="flex-1 overflow-hidden m-0">
                            <ScrollArea className="h-full p-6 pt-4">
                                <div className="space-y-3">
                                    {authorData.papers && authorData.papers.length > 0 ? authorData.papers.slice(0, 10).map((paper, i) => (
                                        <Card key={i} className="p-4 bg-white/5 border-white/5 hover:border-white/10 transition-colors group">
                                            <h5 className="font-medium text-sm mb-2 group-hover:text-primary transition-colors leading-relaxed">{paper.title}</h5>
                                            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                                {paper.year && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {paper.year}</span>}
                                                {paper.citationCount !== undefined && <span className="flex items-center gap-1"><Quote className="w-3 h-3" /> {paper.citationCount} cites</span>}
                                                {paper.venue && <span className="flex items-center gap-1 truncate max-w-[150px]"><BookOpen className="w-3 h-3" /> {paper.venue}</span>}

                                                {paper.url && (
                                                    <a href={paper.url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 hover:text-white transition-colors">
                                                        <ExternalLink className="w-3 h-3" />
                                                        {language === "es" ? "Ver" : "View"}
                                                    </a>
                                                )}
                                            </div>
                                        </Card>
                                    )) : (
                                        <div className="text-center py-8 text-muted-foreground">
                                            {language === "es" ? "No se encontraron publicaciones recientes." : "No recent papers found."}
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                </div>
            );
        }

        if (entityType !== 'Person' && orgData) {
            return (
                <ScrollArea className="h-full p-6">
                    <div className="space-y-6">
                        {/* Essential Info */}
                        <div className="flex gap-4">
                            <div className="p-3 bg-white/5 rounded-lg h-fit">
                                <Building2 className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-medium text-muted-foreground mb-1">{orgData.type} • {orgData.headquarters}</h4>
                                <p className="leading-relaxed">{orgData.description}</p>
                            </div>
                        </div>

                        {/* Stance/Bias Badge */}
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-sm font-medium text-muted-foreground">{language === 'es' ? 'Posición / Alineación' : 'Stance / Alignment'}</span>
                            <Badge variant="outline" className="text-sm">{orgData.stance}</Badge>
                        </div>

                        {/* Key People & Funding */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <Card className="p-4 bg-white/5 border-white/5">
                                <h5 className="text-sm font-semibold mb-3 flex items-center gap-2 text-primary">
                                    <Target className="w-4 h-4" />
                                    {language === 'es' ? 'Personas Clave' : 'Key People'}
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                    {orgData.keyPeople.map((person, i) => (
                                        <Badge key={i} variant="secondary" className="bg-white/10 hover:bg-white/20">{person}</Badge>
                                    ))}
                                </div>
                            </Card>

                            <Card className="p-4 bg-white/5 border-white/5">
                                <h5 className="text-sm font-semibold mb-3 flex items-center gap-2 text-emerald-400">
                                    <DollarSign className="w-4 h-4" />
                                    {language === 'es' ? 'Financiación' : 'Funding'}
                                </h5>
                                <p className="text-sm text-muted-foreground">{orgData.funding}</p>
                            </Card>
                        </div>

                        {/* Controversies */}
                        {orgData.controversies && orgData.controversies.length > 0 && (
                            <div className="space-y-3">
                                <h5 className="text-sm font-semibold flex items-center gap-2 text-orange-400">
                                    <AlertTriangle className="w-4 h-4" />
                                    {language === 'es' ? 'Controversias y Críticas' : 'Controversies & Criticism'}
                                </h5>
                                {orgData.controversies.map((item, i) => (
                                    <div key={i} className="p-3 bg-orange-500/5 border border-orange-500/10 rounded-lg text-sm text-orange-200/80">
                                        {item}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </ScrollArea>
            );
        }

        return null;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0 gap-0 bg-black/90 border-white/10 backdrop-blur-xl">
                <DialogHeader className="p-6 pb-2 border-b border-white/5 space-y-1">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                        {entityType === 'Person' ? <GraduationCap className="w-6 h-6 text-primary" /> : <Building2 className="w-6 h-6 text-primary" />}
                        {loading ? (language === "es" ? "Buscando..." : "Searching...") : entityName}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground flex items-center gap-2">
                        {entityType === 'Person' && authorData?.affiliations && authorData.affiliations.length > 0 && (
                            <>
                                <Building2 className="w-3 h-3" />
                                {authorData.affiliations[0]}
                            </>
                        )}
                        {entityType !== 'Person' && (language === "es" ? "Perfil Corporativo" : "Corporate Profile")}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden relative">
                    {renderContent()}
                </div>
            </DialogContent>
        </Dialog>
    );
}
