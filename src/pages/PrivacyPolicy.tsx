import { Card } from "@/components/ui/card";
import { Shield, Database, Lock, Eye, Trash2, FileText } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Política de Privacidad</h1>
          <p className="text-muted-foreground">
            Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card className="p-6 md:p-8 bg-card/50 backdrop-blur border-border/50 space-y-6">
          {/* Responsable del tratamiento */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6" />
              1. Responsable del Tratamiento
            </h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Denominación social:</strong> Asociación Juvenil Junior Empresa Axis</p>
              <p><strong className="text-foreground">NIF:</strong> G56547938</p>
              <p><strong className="text-foreground">Domicilio:</strong> Calle Convento Carmelitas, 1, 46010, Valencia, España</p>
              <p><strong className="text-foreground">Teléfono:</strong> +34 622163317</p>
              <p><strong className="text-foreground">Email de contacto:</strong> Puede contactarnos a través del formulario de la web</p>
            </div>
          </section>

          {/* Datos que recopilamos */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Database className="w-6 h-6" />
              2. Datos que Recopilamos
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">2.1. Datos de Registro en Waitlist</h3>
                <p>Cuando te registras en nuestra lista de espera, recopilamos:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Nombre</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Código de referido (si aplica)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">2.2. Estadísticas Anónimas de Uso</h3>
                <p>Recopilamos estadísticas anónimas y agregadas sobre el uso de Oraculus:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Dominio del artículo analizado (ej: "elpais.com")</li>
                  <li>Hash anónimo de la URL (no la URL completa)</li>
                  <li>Métricas del análisis (score de objetividad, número de fuentes, sesgos detectados)</li>
                  <li>Fecha del análisis (sin hora exacta)</li>
                </ul>
                <p className="mt-2 italic">
                  <strong className="text-foreground">Importante:</strong> Estas estadísticas NO contienen datos personales ni contenido de artículos. 
                  No podemos identificar a usuarios individuales a partir de estos datos.
                </p>
              </div>
            </div>
          </section>

          {/* Finalidad del tratamiento */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6" />
              3. Finalidad del Tratamiento
            </h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Utilizamos tus datos para:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Gestionar tu registro en la lista de espera</li>
                <li>Gestionar el sistema de referidos</li>
                <li>Verificar tu acceso a Oraculus</li>
                <li>Mejorar nuestros servicios mediante análisis de tendencias anónimas</li>
                <li>Analizar el uso del producto para optimización</li>
              </ul>
            </div>
          </section>

          {/* Base legal */}
          <section>
            <h2 className="text-2xl font-bold mb-4">4. Base Legal</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>El tratamiento de tus datos se basa en:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong className="text-foreground">Consentimiento:</strong> Para el registro en la waitlist y uso de Oraculus</li>
                <li><strong className="text-foreground">Interés legítimo:</strong> Para el análisis de estadísticas anónimas que nos permiten mejorar el servicio</li>
              </ul>
            </div>
          </section>

          {/* Conservación de datos */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6" />
              5. Conservación de Datos
            </h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Datos de waitlist:</strong> Se conservarán mientras mantengas tu registro activo o hasta que solicites su eliminación.</p>
              <p><strong className="text-foreground">Estadísticas anónimas:</strong> Se conservan de forma indefinida ya que no contienen datos personales identificables.</p>
            </div>
          </section>

          {/* Derechos */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Tus Derechos (RGPD)</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>De acuerdo con el Reglamento General de Protección de Datos (RGPD), tienes derecho a:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong className="text-foreground">Acceso:</strong> Obtener información sobre qué datos tenemos sobre ti</li>
                <li><strong className="text-foreground">Rectificación:</strong> Corregir datos inexactos o incompletos</li>
                <li><strong className="text-foreground">Supresión:</strong> Solicitar la eliminación de tus datos</li>
                <li><strong className="text-foreground">Oposición:</strong> Oponerte al tratamiento de tus datos</li>
                <li><strong className="text-foreground">Limitación:</strong> Limitar el tratamiento en ciertos casos</li>
                <li><strong className="text-foreground">Portabilidad:</strong> Recibir tus datos en formato estructurado</li>
                <li><strong className="text-foreground">Retirar consentimiento:</strong> En cualquier momento, sin afectar tratamientos anteriores</li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, puedes contactarnos en: <strong className="text-foreground">+34 622163317</strong> o a través del formulario de contacto.
              </p>
            </div>
          </section>

          {/* Seguridad */}
          <section>
            <h2 className="text-2xl font-bold mb-4">7. Seguridad de los Datos</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Cifrado de datos en tránsito (HTTPS)</li>
                <li>Almacenamiento seguro en servidores de Supabase (Europa)</li>
                <li>Acceso restringido a datos personales</li>
                <li>Anonimización de estadísticas de uso</li>
              </ul>
            </div>
          </section>

          {/* Transferencias internacionales */}
          <section>
            <h2 className="text-2xl font-bold mb-4">8. Transferencias Internacionales</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Tus datos se almacenan en servidores de Supabase ubicados en la Unión Europea. 
                En caso de transferencias fuera de la UE, se garantizan las salvaguardias adecuadas 
                según el RGPD.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4">9. Cookies y Tecnologías Similares</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Utilizamos cookies técnicas necesarias para el funcionamiento del sitio:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Cookies de sesión para mantener tu sesión activa</li>
                <li>LocalStorage para recordar tu email en la sesión</li>
              </ul>
              <p className="mt-2">
                No utilizamos cookies de seguimiento ni de marketing. Puedes gestionar las cookies 
                desde la configuración de tu navegador.
              </p>
            </div>
          </section>

          {/* Menores */}
          <section>
            <h2 className="text-2xl font-bold mb-4">10. Protección de Menores</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Nuestro servicio está dirigido a usuarios mayores de 16 años. Si eres menor de 16 años, 
                necesitas el consentimiento de tus padres o tutores legales para usar nuestros servicios.
              </p>
            </div>
          </section>

          {/* Modificaciones */}
          <section>
            <h2 className="text-2xl font-bold mb-4">11. Modificaciones de la Política</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Nos reservamos el derecho de modificar esta política de privacidad. 
                Las modificaciones serán publicadas en esta página con la fecha de actualización. 
                Te recomendamos revisarla periódicamente.
              </p>
            </div>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-bold mb-4">12. Contacto y Reclamaciones</h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Para cualquier consulta sobre protección de datos, puedes contactarnos:</p>
              <div className="bg-background/50 p-4 rounded-lg space-y-1">
                <p><strong className="text-foreground">Asociación Juvenil Junior Empresa Axis</strong></p>
                <p>Calle Convento Carmelitas, 1</p>
                <p>46010, Valencia, España</p>
                <p>Teléfono: +34 622163317</p>
              </div>
              <p className="mt-4">
                También tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD) 
                si consideras que el tratamiento de tus datos no se ajusta a la normativa vigente.
              </p>
              <p>
                <strong className="text-foreground">AEPD:</strong> www.aepd.es | C/ Jorge Juan, 6, 28001 Madrid
              </p>
            </div>
          </section>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

