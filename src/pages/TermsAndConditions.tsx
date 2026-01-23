import { Card } from "@/components/ui/card";
import { FileText, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Términos y Condiciones</h1>
          <p className="text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="p-6 md:p-8 bg-card/50 backdrop-blur border-border/50 space-y-6">
          {/* Aceptación */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              1. Aceptación de los Términos
            </h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Al acceder y utilizar este sitio web y sus servicios, aceptas estar sujeto a estos Términos y Condiciones. 
                Si no estás de acuerdo con alguna parte de estos términos, no debes utilizar nuestros servicios.
              </p>
            </div>
          </section>

          {/* Información de la entidad */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Información de la Entidad</h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Denominación social:</strong> Asociación Juvenil Junior Empresa Axis</p>
              <p><strong className="text-foreground">NIF:</strong> G56547938</p>
              <p><strong className="text-foreground">Domicilio:</strong> Calle Convento Carmelitas, 1, 46010, Valencia, España</p>
              <p><strong className="text-foreground">Teléfono:</strong> +34 622163317</p>
            </div>
          </section>

          {/* Descripción del servicio */}
          <section>
            <h2 className="text-2xl font-bold mb-4">3. Descripción del Servicio</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Ofrecemos una plataforma de análisis de artículos periodísticos mediante inteligencia artificial 
                (Oraculus) que permite:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Analizar la fiabilidad de fuentes citadas en artículos</li>
                <li>Detectar sesgos periodísticos</li>
                <li>Evaluar la objetividad de artículos</li>
                <li>Obtener métricas de calidad periodística</li>
              </ul>
              <p className="mt-2">
                El acceso a Oraculus requiere estar registrado en nuestra lista de espera y haber referido 
                al menos 3 usuarios.
              </p>
            </div>
          </section>

          {/* Uso del servicio */}
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Uso del Servicio</h2>
            <div className="space-y-3 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">4.1. Uso Permitido</h3>
                <p>Puedes usar nuestros servicios para:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Análisis personal de artículos periodísticos</li>
                  <li>Investigación académica o profesional</li>
                  <li>Verificación de información periodística</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">4.2. Uso Prohibido</h3>
                <p>Queda prohibido:</p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Usar el servicio para actividades ilegales</li>
                  <li>Intentar acceder no autorizado a sistemas o datos</li>
                  <li>Usar el servicio para generar contenido difamatorio o malicioso</li>
                  <li>Reproducir, copiar o revender el servicio sin autorización</li>
                  <li>Usar bots o scripts automatizados para sobrecargar el servicio</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Limitación de responsabilidad */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6" />
              5. Limitación de Responsabilidad
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>
                <strong className="text-foreground">5.1. Naturaleza del Servicio</strong>
              </p>
              <p>
                Oraculus es una herramienta de análisis asistida por inteligencia artificial. Los resultados 
                son generados automáticamente y deben ser considerados como una ayuda para el análisis, 
                no como una verdad absoluta.
              </p>
              <p className="mt-4">
                <strong className="text-foreground">5.2. Exactitud de los Resultados</strong>
              </p>
              <p>
                No garantizamos la exactitud absoluta de los análisis. Los resultados pueden contener errores 
                o interpretaciones incorrectas. Siempre debes verificar la información de forma independiente 
                antes de tomar decisiones importantes.
              </p>
              <p className="mt-4">
                <strong className="text-foreground">5.3. Disponibilidad del Servicio</strong>
              </p>
              <p>
                Nos esforzamos por mantener el servicio disponible, pero no garantizamos disponibilidad 
                ininterrumpida. El servicio puede estar sujeto a mantenimiento, actualizaciones o interrupciones 
                técnicas.
              </p>
              <p className="mt-4">
                <strong className="text-foreground">5.4. Exclusiones</strong>
              </p>
              <p>
                No seremos responsables de:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Decisiones tomadas basándose en los análisis proporcionados</li>
                <li>Daños indirectos, pérdidas de beneficios o datos</li>
                <li>Errores en el análisis de artículos</li>
                <li>Interrupciones del servicio</li>
              </ul>
            </div>
          </section>

          {/* Propiedad intelectual */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Propiedad Intelectual</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Todos los derechos de propiedad intelectual sobre la plataforma, incluyendo el código, diseño, 
                logotipos y contenido, pertenecen a Asociación Juvenil Junior Empresa Axis o sus licenciantes.
              </p>
              <p>
                Los artículos analizados pertenecen a sus respectivos autores y medios. No reclamamos 
                propiedad sobre el contenido de terceros.
              </p>
            </div>
          </section>

          {/* Sistema de referidos */}
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Sistema de Referidos</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                El sistema de referidos permite desbloquear acceso a Oraculus mediante la invitación de otros usuarios.
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Cada usuario recibe un código único de referido</li>
                <li>Se requiere un mínimo de 3 referidos para desbloquear Oraculus</li>
                <li>Los códigos de referido son personales e intransferibles</li>
                <li>Nos reservamos el derecho de verificar y eliminar referidos fraudulentos</li>
              </ul>
            </div>
          </section>

          {/* Modificaciones */}
          <section>
            <h2 className="text-2xl font-bold mb-4">8. Modificaciones del Servicio</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Nos reservamos el derecho de modificar, suspender o discontinuar cualquier aspecto del servicio 
                en cualquier momento, con o sin previo aviso.
              </p>
            </div>
          </section>

          {/* Terminación */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <XCircle className="w-6 h-6" />
              9. Terminación
            </h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Podemos terminar o suspender tu acceso al servicio inmediatamente, sin previo aviso, 
                si violas estos términos o realizas un uso inadecuado del servicio.
              </p>
            </div>
          </section>

          {/* Ley aplicable */}
          <section>
            <h2 className="text-2xl font-bold mb-4">10. Ley Aplicable y Jurisdicción</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Estos términos se rigen por la legislación española. Para cualquier controversia, 
                las partes se someten a los juzgados y tribunales de Valencia, España.
              </p>
            </div>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-bold mb-4">11. Contacto</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Para cualquier consulta sobre estos términos:</p>
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

export default TermsAndConditions;

