export async function upsetImagesInAirtable(
    imagesArray,
    customEmail,
    customClientId,
    customInvoiceId,
    customUserId,
    imageTable,
    originalSuggestionIds = []
) {
    console.log("🔍 DEBUG FUNÇÃO - INÍCIO");
    console.log("🔍 DEBUG FUNÇÃO - Parâmetros recebidos:");
    console.log("- imagesArray:", imagesArray?.length, "items");
    console.log("- customEmail:", customEmail);
    console.log("- customClientId:", customClientId);
    console.log("- customInvoiceId:", customInvoiceId);
    console.log("- customUserId:", customUserId);
    console.log("- imageTable (parâmetro recebido):", imageTable);
    console.log("- originalSuggestionIds:", originalSuggestionIds?.length || 0, "items");
    
    const tableName = imageTable || "Images";
    console.log("🔍 DEBUG FUNÇÃO - tableName calculado:", `"${tableName}"`);
    console.log("🔍 DEBUG FUNÇÃO - typeof tableName:", typeof tableName);
    console.log("🔍 DEBUG FUNÇÃO - tableName.length:", tableName.length);
    
    const isImageSuggestionsCondition = tableName === "Image suggestions";
    console.log("🔍 DEBUG FUNÇÃO - Condição (tableName === 'Image suggestions'):", isImageSuggestionsCondition);
    
    if (isImageSuggestionsCondition) {
        console.log("🔍 DEBUG FUNÇÃO - ❌ ENTRANDO NA LÓGICA ERRADA (Image suggestions)");
        console.log("🔍 DEBUG FUNÇÃO - Isso vai criar 1 registro com todas as imagens");
    } else {
        console.log("🔍 DEBUG FUNÇÃO - ✅ ENTRANDO NA LÓGICA CORRETA (Images)");
        console.log("🔍 DEBUG FUNÇÃO - Isso vai criar", imagesArray.length, "registros individuais");
    }
    
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    // Usar valores personalizados do frontend se fornecidos, ou valores padrão caso contrário
    const email = customEmail || ""
    const clientId = customClientId || ""
    const invoiceId = customInvoiceId || ""
    const userId = customUserId || ""

    const results = [];

    // Função para validar campos de single select - só inclui se tiver valor válido
    const getSelectValue = (value) => {
        if (!value) return null;
        // Remove aspas duplas extras e espaços em branco
        const cleanValue = value.toString().replace(/^"+|"+$/g, '').trim();
        return cleanValue !== '' ? cleanValue : null;
    };

    // CRÍTICO: Adicionar proteção contra execução da lógica errada
    if (tableName === "Image suggestions") {
        console.log("🚨 ERRO: Lógica 'Image suggestions' sendo executada quando deveria ser 'Images'");
        console.log("🚨 INTERROMPENDO execução para evitar registro extra");
        
        // TEMPORARIAMENTE DESABILITADO - não executar esta lógica
        console.log("🔧 PATCH: Pulando lógica de 'Image suggestions' e indo direto para lógica de 'Images'");
        // return results; // Comentado para forçar ir para a lógica correta
    }

    // Lógica original para outras tabelas (SEMPRE EXECUTAR ESTA PARA TABELA "Images")
    console.log("🔍 DEBUG FUNÇÃO - Iniciando lógica para registros individuais");
    for (let i = 0; i < imagesArray.length; i++) {
        const img = imagesArray[i];

        try {
            console.log(`Processing image ${i + 1}/${imagesArray.length}:`, img.imgUrl);

            // Busca registro existente pelo campo 'Client Internal Code' e 'INPUT IMAGE'
            // Temporariamente desabilitado para sempre criar novos registros
            const records = [];

            const encodedUrl = img.imagensReferencia ? encodeURI(img.imagensReferencia) : '';

            const fields = {
                ["Property's URL"]: img.propertyUrl || '',
                ["INPUT IMAGE"]: img.imgUrl ? [{ url: img.imgUrl }] : [],
                ["Owner Email"]: email,
                ["Client Internal Code"]: img.codigo || '',
                Message: img.observacoes || '',     // Long text
            };

            // Só adicionar campos de relacionamento se tiverem IDs válidos
            if (clientId && clientId.trim() !== '') {
                fields.Clients = [clientId];
            }

            // Forçar usar "Images" como tableName para evitar problemas
            const actualTableName = "Images";
            
            if (actualTableName === "Images") {
                if (invoiceId && invoiceId.trim() !== '') {
                    fields.Invoices = [invoiceId];
                }
                if (userId && userId.trim() !== '') {
                    fields.Users = [userId];
                }
            }

            if (encodedUrl) {
                fields["ADDITIONAL ATTACHMENTS"] = [{ url: encodedUrl }]
            }

            const decluttering = getSelectValue(img.retirar);
            if (decluttering) {
                fields["Decluttering"] = decluttering;
            }

            const roomType = getSelectValue(img.tipo);
            if (roomType) {
                fields["Room Type"] = roomType;
            }

            const videoTemplate = getSelectValue(img.modeloVideo);
            if (videoTemplate) {
                fields["Video Template"] = videoTemplate;
            }

            const videoProportion = getSelectValue(img.formatoVideo);
            if (videoProportion) {
                fields["Video Proportion"] = videoProportion;
            }

            const finish = getSelectValue(img.acabamento);
            if (finish) {
                fields["Finish"] = finish;
            }

            const estilo = getSelectValue(img.estilo);
            if (estilo) {
                try {
                    // Buscar o record ID na tabela de estilos
                    const styleRecords = await baseInstance("Styles").select({
                        filterByFormula: `{Style Name} = '${estilo}'`,
                        maxRecords: 1
                    }).firstPage();

                    if (styleRecords.length > 0) {
                        fields["STYLE"] = [styleRecords[0].id];
                    }
                } catch (styleError) {
                    console.error(`Erro ao buscar estilo '${estilo}':`, styleError.message);
                }
            }

            const imageWorkflow = getSelectValue(img.imgWorkflow);
            if (imageWorkflow) {
                // Sempre usar "Image Workflow" para tabela Images
                fields["Image Workflow"] = imageWorkflow;
            }

            const suggestionstatus = getSelectValue(img.suggestionstatus);
            if (suggestionstatus) {
                fields["Suggestion Status"] = suggestionstatus;
            }

            let destaques = img.destaques;
            if (Array.isArray(destaques) && destaques.length > 0) {
                fields["Destaques"] = destaques.filter(d => typeof d === "string" && d.trim() !== "");
            } else if (typeof destaques === "string" && destaques.trim() !== "") {
                fields["Destaques"] = [destaques.trim()];
            }

            const endereco = getSelectValue(img.endereco);
            if (endereco) {
                fields["Endereço"] = endereco;
            }

            const preco = getSelectValue(img.preco);
            if (preco) {
                const precoNumber = Number(
                    preco
                        .toString()
                        .replace(/\./g, '')
                        .replace(',', '.')
                        .replace(/[^\d.-]/g, '')
                );
                if (!isNaN(precoNumber)) {
                    fields["Preço"] = precoNumber;
                }
            }

            console.log(`Fields being sent for image ${i + 1}:`, JSON.stringify(fields, null, 2));

            let result;
            if (records.length > 0) {
                result = await baseInstance(actualTableName).update(records[0].id, fields);
                console.log(`✅ Image ${i + 1} updated successfully:`, records[0].id);
                results.push({ index: i, status: 'updated', id: records[0].id, imgUrl: img.imgUrl });
            } else {
                result = await baseInstance(actualTableName).create(fields);
                console.log(`✅ Image ${i + 1} created successfully:`, result.id);
                results.push({ index: i, status: 'created', id: result.id, imgUrl: img.imgUrl });
            }
        } catch (error) {
            console.error(`❌ Error processing image ${i + 1}:`, error.message);
            results.push({ index: i, status: 'error', error: error.message, imgUrl: img.imgUrl });
        }
    }

    // Atualizar status das sugestões originais para "Approved" se existirem
    if (originalSuggestionIds && originalSuggestionIds.length > 0) {
        console.log(`Updating ${originalSuggestionIds.length} original suggestions to 'Approved' status`);
        try {
            const suggestionBaseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
            
            for (const suggestionId of originalSuggestionIds) {
                try {
                    await suggestionBaseInstance("Image suggestions").update(suggestionId, {
                        "Suggestion Status": "Approved"
                    });
                    console.log(`✅ Suggestion ${suggestionId} updated to Approved`);
                } catch (error) {
                    console.error(`❌ Error updating suggestion ${suggestionId}:`, error.message);
                }
            }
            console.log(`✅ Successfully updated ${originalSuggestionIds.length} suggestions to 'Approved' status`);
        } catch (error) {
            console.error(`❌ Error updating suggestion statuses:`, error.message);
        }
    }

    console.log(`🔍 DEBUG FUNÇÃO - Processing complete. Results:`, results);
    return results;
}
