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
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
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
              </div>
            </div>
          </section>

          {/* Objeto */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Objeto</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                El presente aviso legal regula el uso del sitio web y los servicios ofrecidos por 
                Asociación Juvenil Junior Empresa Axis, en particular la plataforma de análisis de 
                artículos periodísticos "Oraculus".
              </p>
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
                servicios ofrecidos, de conformidad con la legislación aplicable.
              </p>
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
                  <li>La exactitud absoluta de los análisis generados por Oraculus</li>
                  <li>Las decisiones tomadas basándose en los análisis proporcionados</li>
                  <li>Interrupciones técnicas o fallos en el servicio</li>
                  <li>El contenido de artículos de terceros analizados</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Enlaces externos */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Enlaces Externos</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                El sitio web puede contener enlaces a sitios web de terceros. No tenemos control 
                sobre estos sitios y no asumimos responsabilidad por su contenido o políticas de privacidad.
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
                Este aviso legal se rige por la legislación española. Para la resolución de cualquier 
                controversia, las partes se someten a los juzgados y tribunales de Valencia, España.
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
              </div>
            </div>
          </section>
        </Card>
      </div>
    </div>
  );
};

export default LegalNotice;

