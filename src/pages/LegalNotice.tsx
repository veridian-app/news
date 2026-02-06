import { Card } from "@/components/ui/card";
import { Scale, Building2, Mail, Phone, MapPin } from "lucide-react";

const LegalNotice = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Scale className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Aviso Legal</h1>
          <p className="text-muted-foreground">
            Última actualización: 6 de febrero de 2026
          </p>
        </div>

        <Card className="p-6 md:p-8 bg-card/50 backdrop-blur border-border/50 space-y-6">
          {/* Datos identificativos */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Building2 className="w-6 h-6" />
              1. Datos Identificativos
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <div className="bg-background/50 p-4 rounded-lg space-y-2">
                <p className="flex items-start gap-2">
                  <strong className="text-foreground min-w-[120px]">Denominación:</strong>
                  <span>Asociación Juvenil Junior Empresa Axis</span>
                </p>
                <p className="flex items-start gap-2">
                  <strong className="text-foreground min-w-[120px]">NIF:</strong>
                  <span>G56547938</span>
                </p>
                <p className="flex items-start gap-2">
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Domicilio:</strong> Calle Convento Carmelitas, 1, 46010, Valencia, España</span>
                </p>
                <p className="flex items-start gap-2">
                  <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Teléfono:</strong> +34 622163317</span>
                </p>
                <p className="flex items-start gap-2">
                  <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Email:</strong> contacto@veridian.news</span>
                </p>
              </div>
            </div>
          </section>

          {/* Objeto */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Objeto</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                El presente aviso legal regula el uso del sitio web veridian.news y los servicios ofrecidos por
                Asociación Juvenil Junior Empresa Axis, en particular:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong className="text-foreground">Veridian News:</strong> Plataforma de noticias con análisis de sesgos y contenido objetivado</li>
                <li><strong className="text-foreground">Café Veridian:</strong> Briefing diario de noticias curadas y contextualizadas</li>
                <li><strong className="text-foreground">Oraculus:</strong> Herramienta de análisis de artículos periodísticos (próximamente)</li>
              </ul>
            </div>
          </section>

          {/* Condiciones de acceso */}
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Condiciones de Acceso y Uso</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                El acceso y uso de este sitio web implica la aceptación plena de las condiciones
                establecidas en este aviso legal, así como en nuestra Política de Privacidad y
                Términos y Condiciones.
              </p>
              <p>
                El usuario se compromete a hacer un uso adecuado y lícito del sitio web y de los
                servicios ofrecidos, de conformidad con la legislación aplicable, especialmente:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información y de comercio electrónico (LSSI-CE)</li>
                <li>Reglamento General de Protección de Datos (RGPD) - Reglamento (UE) 2016/679</li>
                <li>Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD)</li>
              </ul>
            </div>
          </section>

          {/* Propiedad intelectual */}
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Propiedad Intelectual e Industrial</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Todos los contenidos del sitio web, incluyendo textos, gráficos, logotipos, iconos,
                imágenes, código fuente, y el diseño general, son propiedad de Asociación Juvenil
                Junior Empresa Axis o de terceros que han autorizado su uso.
              </p>
              <p>
                Queda expresamente prohibida la reproducción, distribución, comunicación pública y
                transformación de los contenidos sin la autorización expresa del titular de los derechos.
              </p>
              <p>
                <strong className="text-foreground">Contenido de noticias:</strong> Las noticias mostradas en Veridian News son
                una selección editorial de contenidos de actualidad. Las imágenes pueden ser generadas
                por inteligencia artificial o provenir de fuentes con licencia. El contenido original
                de los artículos enlazados pertenece a sus respectivos medios de comunicación.
              </p>
            </div>
          </section>

          {/* Responsabilidades */}
          <section>
            <h2 className="text-2xl font-bold mb-4">5. Responsabilidades</h2>
            <div className="space-y-3 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">5.1. Del Usuario</h3>
                <p>
                  El usuario es responsable de la veracidad de los datos que proporciona y del uso
                  que hace del servicio. Debe utilizar el servicio de forma lícita y conforme a estos términos.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">5.2. De la Entidad</h3>
                <p>
                  Asociación Juvenil Junior Empresa Axis no se hace responsable de:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1 mt-2">
                  <li>La exactitud absoluta de las noticias o análisis mostrados</li>
                  <li>Las decisiones tomadas basándose en la información proporcionada</li>
                  <li>Interrupciones técnicas o fallos en el servicio</li>
                  <li>El contenido de artículos de terceros enlazados o referenciados</li>
                  <li>La exactitud absoluta de los análisis generados por Oraculus</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Enlaces externos */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Enlaces Externos</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                El sitio web puede contener enlaces a sitios web de terceros, especialmente a medios
                de comunicación cuyas noticias son referenciadas. No tenemos control sobre estos sitios
                y no asumimos responsabilidad por su contenido o políticas de privacidad.
              </p>
            </div>
          </section>

          {/* Modificaciones */}
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Modificaciones</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Nos reservamos el derecho de modificar este aviso legal en cualquier momento.
                Las modificaciones entrarán en vigor desde su publicación en el sitio web.
              </p>
            </div>
          </section>

          {/* Legislación aplicable */}
          <section>
            <h2 className="text-2xl font-bold mb-4">8. Legislación Aplicable</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Este aviso legal se rige por la legislación española y europea aplicable, incluyendo:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Reglamento General de Protección de Datos (RGPD)</li>
                <li>Ley Orgánica 3/2018 de Protección de Datos (LOPDGDD)</li>
                <li>Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI-CE)</li>
              </ul>
              <p className="mt-2">
                Para la resolución de cualquier controversia, las partes se someten a los juzgados
                y tribunales de Valencia, España.
              </p>
            </div>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6" />
              9. Contacto
            </h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Para cualquier consulta o comunicación:</p>
              <div className="bg-background/50 p-4 rounded-lg space-y-1">
                <p><strong className="text-foreground">Asociación Juvenil Junior Empresa Axis</strong></p>
                <p>Calle Convento Carmelitas, 1</p>
                <p>46010, Valencia, España</p>
                <p>Teléfono: +34 622163317</p>
                <p>Email: <a href="mailto:contacto@veridian.news" className="text-primary hover:underline">contacto@veridian.news</a></p>
              </div>
            </div>
          </section>
        </Card>
      </div>
    </div>
  );
};

export default LegalNotice;
