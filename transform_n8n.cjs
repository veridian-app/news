const fs = require('fs');
const path = require('path');

const inputFile = path.join(process.cwd(), 'untitled folder', 'Scrapper y Filtro Veridian.txt');
const outputFile = path.join(process.cwd(), 'untitled folder', 'n8n_workflow_integrated.json');

try {
    const rawData = fs.readFileSync(inputFile, 'utf8');
    const workflow = JSON.parse(rawData);

    // 1. Remove Google Sheets Node
    const googleSheetNodeIndex = workflow.nodes.findIndex(n => n.type === 'n8n-nodes-base.googleSheets');
    if (googleSheetNodeIndex === -1) {
        console.log('Google Sheets node not found, maybe already removed?');
    } else {
        // Get the ID of the node to remove to clean up connections later? 
        // Actually, we just swap it.
        const oldNode = workflow.nodes[googleSheetNodeIndex];

        // 2. Create Supabase Node
        const newNode = {
            "parameters": {
                "method": "POST",
                "url": "={{ $vars.SUPABASE_URL }}/rest/v1/daily_news",
                "sendHeaders": true,
                "headerParameters": {
                    "parameters": [
                        {
                            "name": "apikey",
                            "value": "={{ $vars.SUPABASE_SERVICE_KEY }}"
                        },
                        {
                            "name": "Authorization",
                            "value": "Bearer {{ $vars.SUPABASE_SERVICE_KEY }}"
                        },
                        {
                            "name": "Content-Type",
                            "value": "application/json"
                        },
                        {
                            "name": "Prefer",
                            "value": "return=representation"
                        }
                    ]
                },
                "sendBody": true,
                "specifyBody": "json",
                "jsonBody": "={{ JSON.stringify({\n  title: $('Procesar_Grupos').item.json.tema,\n  content: $json.message.content,\n  summary: $json.message.content.substring(0, 200) + '...',\n  source: $('Procesar_Grupos').item.json.fuentes_usadas,\n  url: $('Procesar_Grupos').item.json.links_referencia.split(',')[0],\n  metadata: {\n    all_links: $('Procesar_Grupos').item.json.links_referencia,\n    all_sources: $('Procesar_Grupos').item.json.fuentes_usadas\n  }\n}) }}",
                "options": {}
            },
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": oldNode.position,
            "id": "new-supabase-insert-node", // Unique ID
            "name": "Supabase_Insert_News"
        };

        // Replace the node
        workflow.nodes[googleSheetNodeIndex] = newNode;

        // 3. Update Connections
        // The previous node was "El Redactor Neutral (AI_Writer)" (id: 49d56dbf-e40f-4b32-9c6d-a8d0819786ee)
        // We need to ensure it connects to our new node name

        if (workflow.connections["El Redactor Neutral (AI_Writer)"]) {
            workflow.connections["El Redactor Neutral (AI_Writer)"].main[0] = [
                {
                    "node": "Supabase_Insert_News",
                    "type": "main",
                    "index": 0
                }
            ];
        }
    }

    // Write the result
    fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2));
    console.log('Successfully created', outputFile);

} catch (err) {
    console.error('Error:', err);
    process.exit(1);
}
