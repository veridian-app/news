# Instrucciones para Configuración de n8n (Veridian News)

Hola, necesitamos actualizar el workflow de noticias para que deje de usar Google Sheets y empiece a guardar las noticias en nuestra base de datos (Supabase). Esto hará que la web cargue instantáneamente.

Adjunto encontrarás el archivo: `workflow_veridian_news.json`.

## Pasos para instalar

1.  **Importar el Workflow**:
    *   Entra en n8n.
    *   Crea un nuevo workflow o abre el existente.
    *   Ve al menú (tres puntos o "Workflow") -> **Import from File**.
    *   Selecciona el archivo `.json` adjunto.

2.  **Configurar Conexión a Supabase**:
    *   Busca el nodo llamado **"Supabase_Insert_News"** (es el último, el que reemplaza al de Sheets).
    *   Haz doble clic para editarlo.
    *   Necesitas rellenar estos dos campos con nuestras credenciales:

    **URL Base**:
    `https://fouigwvpyrgbdclbevhi.supabase.co`

    **Header Authorization (o API Key)**:
    *(Aquí debes pegar la clave `service_role` que Pedro te pasará. Es la que empieza por `sb_secret_...`)*

3.  **Verificar y Activar**:
    *   Haz clic en "Execute Node" para probar que funciona (debería salir un tick verde).
    *   Guarda el workflow.
    *   Actívalo (switch "Active" en verde arriba a la derecha).

---
**Nota técnica**: Este nodo hace un POST a `/rest/v1/daily_news` enviando el JSON de la noticia. Ya no dependemos de la hoja de cálculo.
