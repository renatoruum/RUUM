

export async function upsetImagesInAirtable(
    imagesArray,
    customEmail,
    customClientId,
    customInvoiceId,
    customUserId,
    imageTable,
    originalSuggestionIds = []
) {
    console.log("🔍 DEBUG FUNÇÃO - INÍCIO DA EXECUÇÃO");
    console.log("🔍 DEBUG FUNÇÃO - Parâmetros:");
    console.log("  - imagesArray.length:", imagesArray?.length);
    console.log("  - imageTable:", imageTable);
    console.log("  - originalSuggestionIds.length:", originalSuggestionIds?.length || 0);
    
    const tableName = imageTable || "Images";
    console.log("🔍 DEBUG FUNÇÃO - tableName final:", tableName);
    
    // PATCH CRÍTICO: Desabilitar lógica de "Image suggestions" para evitar duplicatas
    if (tableName === "Image suggestions") {
        console.log("🚨 PATCH APLICADO: Pulando lógica de 'Image suggestions' para evitar duplicatas");
        console.log("🔍 DEBUG FUNÇÃO - Forçando uso da tabela 'Images' para registros individuais");
        // NÃO EXECUTAR A LÓGICA AGREGADA - ela cria registros extras
    }
    
    // Configuração do Airtable
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    
    // Valores padrão
    const email = customEmail || "";
    const clientId = customClientId || "";
    const invoiceId = customInvoiceId || "";
    const userId = customUserId || "";
    
    const results = [];
    
    // Função para validar campos de single select
    const getSelectValue = (value) => {
        if (!value) return null;
        const cleanValue = value.toString().replace(/^"+|"+$/g, '').trim();
        return cleanValue !== '' ? cleanValue : null;
    };
    
    // LÓGICA PRINCIPAL: Criar registros individuais na tabela "Images"
    console.log("🔍 DEBUG FUNÇÃO - Iniciando criação de registros individuais");
    console.log("🔍 DEBUG FUNÇÃO - Número de imagens a processar:", imagesArray.length);
    
    for (let i = 0; i < imagesArray.length; i++) {
        const img = imagesArray[i];
        console.log(`🔍 DEBUG FUNÇÃO - Processando imagem ${i + 1}/${imagesArray.length}`);
        
        try {
            // Buscar registros existentes (temporariamente desabilitado para sempre criar novos)
            const records = [];
            
            const encodedUrl = img.imagensReferencia ? encodeURI(img.imagensReferencia) : '';
            
            // Campos básicos
            const fields = {
                ["Property's URL"]: img.propertyUrl || '',
                ["INPUT IMAGE"]: img.imgUrl ? [{ url: img.imgUrl }] : [],
                ["Owner Email"]: email,
                ["Client Internal Code"]: img.codigo || '',
                Message: img.observacoes || '',
            };
            
            // Relacionamentos condicionais
            if (clientId && clientId.trim() !== '') {
                fields.Clients = [clientId];
            }
            
            // FORÇA USAR TABELA "Images" sempre
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
                fields["ADDITIONAL ATTACHMENTS"] = [{ url: encodedUrl }];
            }
            
            // Campos opcionais
            const decluttering = getSelectValue(img.retirar);
            if (decluttering) fields["Decluttering"] = decluttering;
            
            const roomType = getSelectValue(img.tipo);
            if (roomType) fields["Room Type"] = roomType;
            
            const videoTemplate = getSelectValue(img.modeloVideo);
            if (videoTemplate) fields["Video Template"] = videoTemplate;
            
            const videoProportion = getSelectValue(img.formatoVideo);
            if (videoProportion) fields["Video Proportion"] = videoProportion;
            
            const finish = getSelectValue(img.acabamento);
            if (finish) fields["Finish"] = finish;
            
            // Estilo (relacionamento)
            const estilo = getSelectValue(img.estilo);
            if (estilo) {
                try {
                    const styleRecords = await baseInstance("Styles").select({
                        filterByFormula: `{Style Name} = '${estilo}'`,
                        maxRecords: 1
                    }).firstPage();
                    
                    if (styleRecords.length > 0) {
                        fields["STYLE"] = [styleRecords[0].id];
                    }
                } catch (styleError) {
                    console.error(`❌ Erro ao buscar estilo '${estilo}':`, styleError.message);
                }
            }
            
            const imageWorkflow = getSelectValue(img.imgWorkflow);
            if (imageWorkflow) fields["Image Workflow"] = imageWorkflow;
            
            const suggestionstatus = getSelectValue(img.suggestionstatus);
            if (suggestionstatus) fields["Suggestion Status"] = suggestionstatus;
            
            // Destaques
            let destaques = img.destaques;
            if (Array.isArray(destaques) && destaques.length > 0) {
                fields["Destaques"] = destaques.filter(d => typeof d === "string" && d.trim() !== "");
            } else if (typeof destaques === "string" && destaques.trim() !== "") {
                fields["Destaques"] = [destaques.trim()];
            }
            
            const endereco = getSelectValue(img.endereco);
            if (endereco) fields["Endereço"] = endereco;
            
            const preco = getSelectValue(img.preco);
            if (preco) {
                const precoNumber = Number(
                    preco.toString()
                        .replace(/\./g, '')
                        .replace(',', '.')
                        .replace(/[^\d.-]/g, '')
                );
                if (!isNaN(precoNumber)) {
                    fields["Preço"] = precoNumber;
                }
            }
            
            console.log(`🔍 DEBUG FUNÇÃO - Campos para imagem ${i + 1}:`, JSON.stringify(fields, null, 2));
            
            // Criar/atualizar registro
            let result;
            if (records.length > 0) {
                result = await baseInstance(actualTableName).update(records[0].id, fields);
                console.log(`✅ Imagem ${i + 1} atualizada:`, records[0].id);
                results.push({ index: i, status: 'updated', id: records[0].id, imgUrl: img.imgUrl });
            } else {
                result = await baseInstance(actualTableName).create(fields);
                console.log(`✅ Imagem ${i + 1} criada:`, result.id);
                results.push({ index: i, status: 'created', id: result.id, imgUrl: img.imgUrl });
            }
            
        } catch (error) {
            console.error(`❌ Erro ao processar imagem ${i + 1}:`, error.message);
            results.push({ index: i, status: 'error', error: error.message, imgUrl: img.imgUrl });
        }
    }
    
    // Atualizar status das sugestões originais
    if (originalSuggestionIds && originalSuggestionIds.length > 0) {
        console.log(`🔍 DEBUG FUNÇÃO - Atualizando ${originalSuggestionIds.length} sugestões para 'Approved'`);
        try {
            for (const suggestionId of originalSuggestionIds) {
                try {
                    await baseInstance("Image suggestions").update(suggestionId, {
                        "Suggestion Status": "Approved"
                    });
                    console.log(`✅ Sugestão ${suggestionId} marcada como Approved`);
                } catch (error) {
                    console.error(`❌ Erro ao atualizar sugestão ${suggestionId}:`, error.message);
                }
            }
        } catch (error) {
            console.error(`❌ Erro geral ao atualizar sugestões:`, error.message);
        }
    }
    
    console.log(`🔍 DEBUG FUNÇÃO - FIM DA EXECUÇÃO - ${results.length} resultados`);
    return results;
}
