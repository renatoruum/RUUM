// Sugestão de atualização para o backend:

// Versão atual (como está no seu código):
export async function upsetImagesInAirtable(imagesArray) {
    const tableName = "Images";
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const email = "galia@acasa7.com.br"
    const clientId = "recZqOfnZXwqbbVZY";
    const invoiceId = "reclDmUiMoLKzRe8k"
    const userId = "recMjeDtB77Ijl9BL"

    for (const img of imagesArray) {
        console.log("Processing image:", img);
        // Busca registro existente pelo campo 'imgUrl'
        const records = await baseInstance(tableName)
            .select({
                filterByFormula: `{IMAGE_CRM} = '${img.imgUrl}'`,
                maxRecords: 1,
            })
            .firstPage();

        const fields = {
            Invoices: [invoiceId],
            Clients: [clientId],
            ["Property's URL"]: img.propertyUrl || '',
            Decluttering: img.retirar,
            ["Image Workflow"]: "SmartStage",
            ["INPUT IMAGE"]: img.imgUrl ? [{ url: img.imgUrl }] : [],
            ["Room Type"]: img.tipo,
            ["Owner Email"]: email,
            //["Data de submissão"]: new Date().toISOString(),
            Users: [userId],
            ["Client Internal Code"]: img.codigo || '',
        };

        if (records.length > 0) {
            // Atualiza registro existente
            await baseInstance(tableName).update(records[0].id, fields);
        } else {
            // Cria novo registro
            await baseInstance(tableName).create(fields);
        }
    }
}

// Versão sugerida (adaptada para receber os parâmetros do frontend):
export async function upsetImagesInAirtable(requestData) {
    const tableName = "Images";
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    
    // Obtém os valores do request ou usa valores padrão
    const email = requestData.email || "galia@acasa7.com.br";
    const clientId = requestData.clientId || "recZqOfnZXwqbbVZY";
    const invoiceId = requestData.invoiceId || "reclDmUiMoLKzRe8k";
    const userId = requestData.userId || "recMjeDtB77Ijl9BL";
    
    // Obtém o array de imagens
    const imagesArray = requestData.imagesArray || [];

    for (const img of imagesArray) {
        console.log("Processing image:", img);
        // Busca registro existente pelo campo 'imgUrl'
        const records = await baseInstance(tableName)
            .select({
                filterByFormula: `{IMAGE_CRM} = '${img.imgUrl}'`,
                maxRecords: 1,
            })
            .firstPage();

        const fields = {
            Invoices: [invoiceId],
            Clients: [clientId],
            ["Property's URL"]: img.propertyUrl || '',
            Decluttering: img.retirar,
            ["Image Workflow"]: "SmartStage",
            ["INPUT IMAGE"]: img.imgUrl ? [{ url: img.imgUrl }] : [],
            ["Room Type"]: img.tipo,
            ["Owner Email"]: email,
            //["Data de submissão"]: new Date().toISOString(),
            Users: [userId],
            ["Client Internal Code"]: img.codigo || '',
        };

        if (records.length > 0) {
            // Atualiza registro existente
            await baseInstance(tableName).update(records[0].id, fields);
        } else {
            // Cria novo registro
            await baseInstance(tableName).create(fields);
        }
    }
    
    return { success: true, message: `Processadas ${imagesArray.length} imagens com sucesso` };
}

// E o handler da API ficaria algo como:
app.post('/api/update-images-airtable', async (req, res) => {
    try {
        const requestData = req.body;
        const result = await upsetImagesInAirtable(requestData);
        res.json(result);
    } catch (error) {
        console.error('Erro ao processar imagens:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});
