import { Card } from "@/components/ui/card";
import { Shield, Database, Lock, Eye, Trash2, FileText, Mail } from "lucide-react";

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
            Última actualización: 6 de febrero de 2026
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
              <p><strong className="text-foreground">Email de contacto:</strong> <a href="mailto:contacto@veridian.news" className="text-primary hover:underline">contacto@veridian.news</a></p>
              <p><strong className="text-foreground">Delegado de Protección de Datos:</strong> Puede contactarnos en <a href="mailto:privacidad@veridian.news" className="text-primary hover:underline">privacidad@veridian.news</a></p>
            </div>
          </section>

          {/* Normativa aplicable */}
          <section>
            <h2 className="text-2xl font-bold mb-4">2. Normativa Aplicable</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Esta política de privacidad se rige por la siguiente normativa:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong className="text-foreground">RGPD:</strong> Reglamento (UE) 2016/679 del Parlamento Europeo y del Consejo, de 27 de abril de 2016 (Reglamento General de Protección de Datos)</li>
                <li><strong className="text-foreground">LOPDGDD:</strong> Ley Orgánica 3/2018, de 5 de diciembre, de Protección de Datos Personales y garantía de los derechos digitales</li>
                <li><strong className="text-foreground">LSSI-CE:</strong> Ley 34/2002, de 11 de julio, de servicios de la sociedad de la información y de comercio electrónico</li>
              </ul>
            </div>
          </section>

          {/* Datos que recopilamos */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Database className="w-6 h-6" />
              3. Datos que Recopilamos
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="font-semibold text-foreground mb-2">3.1. Datos de Registro en Waitlist</h3>
                <p>Cuando te registras en nuestra lista de espera, recopilamos:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Nombre</li>
                  <li>Dirección de correo electrónico</li>
                  <li>Código de referido (si aplica)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">3.2. Datos de Uso de Veridian News</h3>
                <p>Durante el uso de nuestra plataforma de noticias, podemos recopilar:</p>
                <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                  <li>Identificador anónimo de usuario (generado localmente, no vinculado a datos personales)</li>
                  <li>Interacciones con noticias (likes, artículos marcados como leídos)</li>
                  <li>Preferencias de contenido y categorías de interés</li>
                  <li>Respuestas a encuestas anónimas de preferencias</li>
                </ul>
                <p className="mt-2 italic">
                  <strong className="text-foreground">Importante:</strong> Estos datos se almacenan de forma que no permiten
                  identificar a usuarios individuales y se utilizan únicamente para personalizar tu experiencia.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-2">3.3. Estadísticas Anónimas de Uso (Oraculus)</h3>
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

          {/* Uso Comercial de Datos */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Database className="w-6 h-6" />
              4. Uso Comercial de Datos
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                En Veridian News valoramos la transparencia. Queremos informarte que, conforme a la legislación vigente
                y respetando siempre tu privacidad y derechos:
              </p>
              <div className="bg-primary/5 p-4 rounded-lg border border-primary/10">
                <p className="font-medium text-foreground mb-2">Podremos realizar actividades comerciales con los datos recopilados.</p>
                <p className="text-sm">
                  Esto puede incluir el análisis de tendencias de mercado, creación de informes agregados anónimos,
                  y colaboración con terceros para mejorar nuestros servicios o desarrollar nuevos productos.
                </p>
              </div>
              <p>
                <strong className="text-foreground">Garantía de Privacidad:</strong> Estas actividades se realizarán siempre garantizando el
                anonimato de los usuarios o, en caso de requerir datos personales, se solicitará tu consentimiento
                explícito previo para esa finalidad concreta, cumpliendo estrictamente con el RGPD y la LOPDGDD.
              </p>
            </div>
          </section>

          {/* Finalidad del tratamiento */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Eye className="w-6 h-6" />
              5. Finalidad del Tratamiento
            </h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Utilizamos tus datos para:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Gestionar tu registro en la lista de espera</li>
                <li>Gestionar el sistema de referidos</li>
                <li>Personalizar tu feed de noticias según tus preferencias e intereses</li>
                <li>Recordar tus interacciones (likes, leídos) para mejorar tu experiencia</li>
                <li>Verificar tu acceso a Oraculus</li>
                <li>Mejorar nuestros servicios mediante análisis de tendencias anónimas</li>
                <li>Enviar comunicaciones relacionadas con el servicio (si has dado tu consentimiento)</li>
              </ul>
            </div>
          </section>

          {/* Base legal */}
          <section>
            <h2 className="text-2xl font-bold mb-4">6. Base Legal del Tratamiento</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>El tratamiento de tus datos se basa en (Art. 6 RGPD):</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong className="text-foreground">Consentimiento (Art. 6.1.a):</strong> Para el registro en la waitlist, encuestas de preferencias y uso de cookies no esenciales</li>
                <li><strong className="text-foreground">Ejecución de contrato (Art. 6.1.b):</strong> Para la prestación del servicio de Veridian News</li>
                <li><strong className="text-foreground">Interés legítimo (Art. 6.1.f):</strong> Para el análisis de estadísticas anónimas que nos permiten mejorar el servicio</li>
              </ul>
            </div>
          </section>

          {/* Conservación de datos */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Lock className="w-6 h-6" />
              7. Conservación de Datos
            </h2>
            <div className="space-y-2 text-muted-foreground">
              <p><strong className="text-foreground">Datos de waitlist:</strong> Se conservarán mientras mantengas tu registro activo o hasta que solicites su eliminación.</p>
              <p><strong className="text-foreground">Datos de interacciones:</strong> Se conservan mientras utilices el servicio y se eliminan a petición del usuario.</p>
              <p><strong className="text-foreground">Estadísticas anónimas:</strong> Se conservan de forma indefinida ya que no contienen datos personales identificables.</p>
              <p><strong className="text-foreground">Datos de preferencias:</strong> Se conservan mientras uses la plataforma para mantener la personalización del servicio.</p>
            </div>
          </section>

          {/* Derechos */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Trash2 className="w-6 h-6" />
              8. Tus Derechos (RGPD)
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>De acuerdo con el Reglamento General de Protección de Datos (RGPD) y la LOPDGDD, tienes derecho a:</p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li><strong className="text-foreground">Acceso (Art. 15 RGPD):</strong> Obtener información sobre qué datos tenemos sobre ti</li>
                <li><strong className="text-foreground">Rectificación (Art. 16 RGPD):</strong> Corregir datos inexactos o incompletos</li>
                <li><strong className="text-foreground">Supresión (Art. 17 RGPD):</strong> Solicitar la eliminación de tus datos ("derecho al olvido")</li>
                <li><strong className="text-foreground">Oposición (Art. 21 RGPD):</strong> Oponerte al tratamiento de tus datos</li>
                <li><strong className="text-foreground">Limitación (Art. 18 RGPD):</strong> Limitar el tratamiento en ciertos casos</li>
                <li><strong className="text-foreground">Portabilidad (Art. 20 RGPD):</strong> Recibir tus datos en formato estructurado y de uso común</li>
                <li><strong className="text-foreground">Retirar consentimiento:</strong> En cualquier momento, sin afectar tratamientos anteriores</li>
              </ul>
              <p className="mt-4">
                Para ejercer estos derechos, puedes contactarnos en: <a href="mailto:privacidad@veridian.news" className="text-primary hover:underline">privacidad@veridian.news</a>
              </p>
              <p>
                Responderemos a tu solicitud en el plazo máximo de un mes, ampliable a dos meses en casos de especial complejidad.
              </p>
            </div>
          </section>

          {/* Seguridad */}
          <section>
            <h2 className="text-2xl font-bold mb-4">9. Seguridad de los Datos</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos (Art. 32 RGPD):</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Cifrado de datos en tránsito (HTTPS/TLS)</li>
                <li>Almacenamiento seguro en servidores de Supabase ubicados en la Unión Europea</li>
                <li>Acceso restringido a datos personales mediante Row Level Security (RLS)</li>
                <li>Anonimización y seudonimización de estadísticas de uso</li>
                <li>Identificadores de usuario generados localmente sin vinculación a datos personales</li>
              </ul>
            </div>
          </section>

          {/* Transferencias internacionales */}
          <section>
            <h2 className="text-2xl font-bold mb-4">10. Transferencias Internacionales</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Tus datos se almacenan en servidores de Supabase ubicados en la Unión Europea.
              </p>
              <p>
                En caso de servicios auxiliares que impliquen transferencias fuera del Espacio Económico Europeo,
                se garantizan las salvaguardias adecuadas según el Art. 46 RGPD, incluyendo cláusulas contractuales
                tipo aprobadas por la Comisión Europea o decisiones de adecuación.
              </p>
            </div>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold mb-4">11. Cookies y Tecnologías Similares</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>Utilizamos las siguientes tecnologías de almacenamiento local:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li><strong className="text-foreground">LocalStorage técnico:</strong> Para recordar preferencias de usuario, noticias leídas y likes</li>
                <li><strong className="text-foreground">Cookies de sesión:</strong> Para mantener tu sesión activa</li>
                <li><strong className="text-foreground">Identificador anónimo:</strong> Generado localmente para sincronizar preferencias</li>
              </ul>
              <p className="mt-2">
                <strong className="text-foreground">No utilizamos cookies de seguimiento ni de marketing.</strong> Puedes gestionar las cookies
                desde la configuración de tu navegador. Ten en cuenta que la eliminación de datos locales puede
                afectar a la personalización de tu experiencia.
              </p>
            </div>
          </section>

          {/* Menores */}
          <section>
            <h2 className="text-2xl font-bold mb-4">12. Protección de Menores</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                De conformidad con el Art. 8 RGPD y el Art. 7 LOPDGDD, nuestro servicio está dirigido a usuarios mayores de 14 años.
                Si eres menor de 14 años, necesitas el consentimiento de tus padres o tutores legales para usar nuestros servicios
                y proporcionar cualquier dato personal.
              </p>
            </div>
          </section>

          {/* Modificaciones */}
          <section>
            <h2 className="text-2xl font-bold mb-4">13. Modificaciones de la Política</h2>
            <div className="space-y-2 text-muted-foreground">
              <p>
                Nos reservamos el derecho de modificar esta política de privacidad para adaptarla a novedades
                legislativas o jurisprudenciales. Las modificaciones serán publicadas en esta página con la
                fecha de actualización. Te recomendamos revisarla periódicamente.
              </p>
              <p>
                En caso de cambios sustanciales que afecten al tratamiento de tus datos, te notificaremos
                a través de los medios disponibles.
              </p>
            </div>
          </section>

          {/* Contacto */}
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Mail className="w-6 h-6" />
              14. Contacto y Reclamaciones
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p>Para cualquier consulta sobre protección de datos, puedes contactarnos:</p>
              <div className="bg-background/50 p-4 rounded-lg space-y-1">
                <p><strong className="text-foreground">Asociación Juvenil Junior Empresa Axis</strong></p>
                <p>Calle Convento Carmelitas, 1</p>
                <p>46010, Valencia, España</p>
                <p>Teléfono: +34 622163317</p>
                <p>Email general: <a href="mailto:contacto@veridian.news" className="text-primary hover:underline">contacto@veridian.news</a></p>
                <p>Email privacidad: <a href="mailto:privacidad@veridian.news" className="text-primary hover:underline">privacidad@veridian.news</a></p>
              </div>
              <p className="mt-4">
                También tienes derecho a presentar una reclamación ante la Agencia Española de Protección de Datos (AEPD)
                si consideras que el tratamiento de tus datos no se ajusta a la normativa vigente.
              </p>
              <div className="bg-background/50 p-4 rounded-lg space-y-1">
                <p><strong className="text-foreground">Agencia Española de Protección de Datos</strong></p>
                <p>C/ Jorge Juan, 6</p>
                <p>28001 Madrid</p>
                <p>Web: <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">www.aepd.es</a></p>
              </div>
            </div>
          </section>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
