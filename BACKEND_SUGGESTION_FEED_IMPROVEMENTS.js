
export async function upsetImagesInAirtable(
    imagesArray,
    customEmail,
    customClientId,
    customInvoiceId,
    customUserId,
    imageTable,
    originalSuggestionIds = [],
    // NOVO: Adicionar parâmetros para controle de origem
    requestSource = null,
    processMode = null
) {
    
    const tableName = imageTable || "Images";
    
    // NOVO: Log de identificação da origem da requisição
    console.log('🔍 BACKEND - Origem da requisição:', requestSource);
    console.log('🔍 BACKEND - Modo de processamento:', processMode);
    console.log('🔍 BACKEND - Tabela destino:', tableName);
    console.log('🔍 BACKEND - Quantidade de imagens:', imagesArray.length);
    
    // NOVO: Verificar se é uma requisição do suggestion feed
    const isSuggestionFeedApproval = requestSource === 'suggestion-feed-approval' || 
                                    processMode === 'individual-records-only';
    
    if (isSuggestionFeedApproval) {
        console.log('✅ BACKEND - Detectada requisição do Feed de Sugestões - modo individual apenas');
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
    
    // NOVO: Validação específica para suggestion feed
    if (isSuggestionFeedApproval) {
        // Verificar se cada item do array tem flag skipAggregatedRecord
        const hasSkipFlags = imagesArray.every(img => img.skipAggregatedRecord === true);
        if (hasSkipFlags) {
            console.log('✅ BACKEND - Todas as imagens têm flag skipAggregatedRecord');
        } else {
            console.warn('⚠️ BACKEND - Nem todas as imagens têm flag skipAggregatedRecord');
        }
        
        // Verificar se cada item tem source = 'suggestion-feed-approved'
        const hasSourceFlags = imagesArray.every(img => img.source === 'suggestion-feed-approved');
        if (hasSourceFlags) {
            console.log('✅ BACKEND - Todas as imagens têm source correto');
        } else {
            console.warn('⚠️ BACKEND - Nem todas as imagens têm source correto');
        }
    }
    
    for (let i = 0; i < imagesArray.length; i++) {
        const img = imagesArray[i];
        
        try {
            // NOVO: Log específico para cada imagem do suggestion feed
            if (isSuggestionFeedApproval) {
                console.log(`🔍 BACKEND - Processando imagem ${i + 1}/${imagesArray.length} do Feed de Sugestões`);
                console.log(`🔍 BACKEND - Source: ${img.source}, Skip Aggregated: ${img.skipAggregatedRecord}`);
            }
            
            // Buscar registros existentes (temporariamente desabilitado para sempre criar novos)
            const records = [];
            
            const encodedUrl = img.imagensReferencia ? encodeURI(img.imagensReferencia) : '';
            
            // MELHORADO: Usar apenas imgUrl como fonte de verdade para INPUT IMAGE
            // Ignorar imgUrls e "INPUT IMAGES" para evitar duplicação
            const imageUrl = img.imgUrl || (Array.isArray(img.imgUrls) ? img.imgUrls[0] : null) || 
                            (Array.isArray(img["INPUT IMAGES"]) ? img["INPUT IMAGES"][0] : null);
            
            if (!imageUrl) {
                console.warn(`⚠️ BACKEND - Pulando imagem ${i + 1}: nenhuma URL válida encontrada`);
                results.push({ index: i, status: 'skipped', error: 'Nenhuma URL de imagem válida', imgUrl: null });
                continue;
            }
            
            // NOVO: Validação adicional para suggestion feed
            if (isSuggestionFeedApproval && img.skipAggregatedRecord !== true) {
                console.warn(`⚠️ BACKEND - Imagem ${i + 1} sem flag skipAggregatedRecord`);
            }
            
            // Campos básicos
            const fields = {
                ["Property's URL"]: img.propertyUrl || '',
                ["INPUT IMAGE"]: [{ url: imageUrl }], // Usar apenas uma fonte de verdade
                ["Owner Email"]: email,
                ["Client Internal Code"]: img.codigo || '',
                Message: img.observacoes || '',
            };
            
            // NOVO: Adicionar metadados de origem nos campos se for suggestion feed
            if (isSuggestionFeedApproval) {
                fields["Processing Source"] = "suggestion-feed-approval";
                fields["Created From"] = "feed-approval";
                
                // Adicionar timestamp específico
                fields["Approved At"] = new Date().toISOString();
            }
            
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
            
            // MELHORADO: Log mais específico
            if (isSuggestionFeedApproval) {
                console.log(`🔍 BACKEND - Campos para imagem ${i + 1} (Feed de Sugestões):`, JSON.stringify(fields, null, 2));
            } else {
                console.log(`🔍 BACKEND - Campos para imagem ${i + 1}:`, JSON.stringify(fields, null, 2));
            }
            
            // Criar/atualizar registro
            let result;
            if (records.length > 0) {
                result = await baseInstance(actualTableName).update(records[0].id, fields);
                console.log(`✅ BACKEND - Imagem ${i + 1} atualizada:`, records[0].id);
                results.push({ index: i, status: 'updated', id: records[0].id, imgUrl: imageUrl });
            } else {
                result = await baseInstance(actualTableName).create(fields);
                if (isSuggestionFeedApproval) {
                    console.log(`✅ BACKEND - Imagem ${i + 1} criada (Feed de Sugestões):`, result.id);
                } else {
                    console.log(`✅ BACKEND - Imagem ${i + 1} criada:`, result.id);
                }
                results.push({ index: i, status: 'created', id: result.id, imgUrl: imageUrl });
            }
            
        } catch (error) {
            console.error(`❌ BACKEND - Erro ao processar imagem ${i + 1}:`, error.message);
            results.push({ index: i, status: 'error', error: error.message, imgUrl: imageUrl || img.imgUrl });
        }
    }
    
    // NOVO: Log final específico para suggestion feed
    if (isSuggestionFeedApproval) {
        const successCount = results.filter(r => r.status === 'created' || r.status === 'updated').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        
        console.log(`🎯 BACKEND - Resultado Feed de Sugestões: ${successCount} sucessos, ${errorCount} erros`);
        console.log('🔍 BACKEND - IMPORTANTE: Se foram criados registros extras além destes, o problema está em outro lugar');
    }
    
    return results;
}

// NOVO: Função para o endpoint /api/update-images-airtable receber os parâmetros
export const updateImagesAirtableHandler = async (req, res) => {
    try {
        const { 
            imagesArray, 
            email, 
            clientId, 
            invoiceId, 
            userId, 
            table,
            processMode,    // NOVO
            source         // NOVO
        } = req.body;
        
        // Log da requisição recebida
        console.log('🔍 ENDPOINT - Requisição recebida:', {
            source,
            processMode,
            table,
            imageCount: imagesArray?.length
        });
        
        const results = await upsetImagesInAirtable(
            imagesArray,
            email,
            clientId,
            invoiceId,
            userId,
            table,
            [], // originalSuggestionIds
            source,      // NOVO: requestSource
            processMode  // NOVO: processMode
        );
        
        res.json({
            success: true,
            results,
            summary: {
                total: results.length,
                successful: results.filter(r => r.status === 'created' || r.status === 'updated').length,
                errors: results.filter(r => r.status === 'error').length
            }
        });
        
    } catch (error) {
        console.error('❌ ENDPOINT - Erro no handler:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao processar imagens',
            error: error.message
        });
    }
};

/**
 * Função específica para transferir sugestões aprovadas do Feed para tabela Images (Rota 3)
 * Converte 1 registro de Image suggestions (múltiplas imagens) 
 * em N registros individuais na tabela Images
 * @param {Object} suggestionData - Dados da sugestão aprovada
 * @param {string} customEmail - Email do usuário
 * @param {string} customClientId - ID do cliente
 * @param {string} customInvoiceId - ID da fatura
 * @param {string} customUserId - ID do usuário
 * @returns {Promise<Array>} Array com resultados da operação
 */
export async function transferApprovedSuggestionToImages(
    suggestionData,
    customEmail,
    customClientId,
    customInvoiceId,
    customUserId
) {
    console.log('🔄 ROTA 2 - Iniciando transferência de sugestão aprovada para Images');
    console.log('🔍 ROTA 2 - Dados recebidos:', JSON.stringify(suggestionData, null, 2));
    
    // Usar a mesma estrutura de import do arquivo principal
    const Airtable = require('airtable');
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);
    const results = [];
    
    // Extrair URLs das imagens - APENAS do campo inputImages
    const imageUrls = suggestionData.inputImages || [];
    
    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
        console.error('❌ ROTA 2 - Nenhuma URL de imagem válida encontrada');
        return [{ status: 'error', error: 'Nenhuma URL de imagem válida', imgUrl: null }];
    }
    
    console.log(`🔍 ROTA 2 - Processando ${imageUrls.length} imagens individuais para tabela Images`);
    
    // Função para validar campos
    const getSelectValue = (value) => {
        if (!value) return null;
        const cleanValue = value.toString().replace(/^"+|"+$/g, '').trim();
        return cleanValue !== '' ? cleanValue : null;
    };
    
    // Criar UM registro individual para CADA imagem
    for (let i = 0; i < imageUrls.length; i++) {
        const imageUrl = imageUrls[i];
        
        try {
            console.log(`🔍 ROTA 2 - Processando imagem ${i + 1}/${imageUrls.length}: ${imageUrl.substring(0, 50)}...`);
            
            const fields = {
                ["Property's URL"]: suggestionData.propertyUrl || '',
                ["INPUT IMAGE"]: [{ url: imageUrl }], // UMA imagem por registro
                ["Owner Email"]: customEmail || '',
                ["Client Internal Code"]: suggestionData.codigo || '',
                ["Message"]: suggestionData.observacoes || '',
                ["Processing Source"]: "rota-2-suggestion-approved", // Identificar origem
                ["Created From"]: "suggestion-feed-approval",
                ["Approved At"]: new Date().toISOString()
            };
            
            // Relacionamentos
            if (customClientId) fields.Clients = [customClientId];
            if (customInvoiceId) fields.Invoices = [customInvoiceId];
            if (customUserId) fields.Users = [customUserId];
            
            // Campos opcionais
            const decluttering = getSelectValue(suggestionData.retirar);
            if (decluttering) fields["Decluttering"] = decluttering;
            
            const roomType = getSelectValue(suggestionData.tipo);
            if (roomType) fields["Room Type"] = roomType;
            
            const finish = getSelectValue(suggestionData.acabamento);
            if (finish) fields["Finish"] = finish;
            
            const imageWorkflow = getSelectValue(suggestionData.imgWorkflow);
            if (imageWorkflow) fields["Image Workflow"] = imageWorkflow;
            
            // Estilo (se houver)
            const estilo = getSelectValue(suggestionData.estilo);
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
                    console.error(`❌ ROTA 2 - Erro ao buscar estilo '${estilo}':`, styleError.message);
                }
            }
            
            console.log(`🔍 ROTA 2 - Campos para registro ${i + 1}:`, JSON.stringify(fields, null, 2));
            
            // Criar registro individual na tabela Images
            const result = await baseInstance("Images").create(fields);
            
            console.log(`✅ ROTA 2 - Registro ${i + 1} criado na tabela Images: ${result.id}`);
            results.push({ 
                index: i, 
                status: 'created', 
                id: result.id, 
                imgUrl: imageUrl 
            });
            
        } catch (error) {
            console.error(`❌ ROTA 2 - Erro ao criar registro ${i + 1}:`, error.message);
            results.push({ 
                index: i, 
                status: 'error', 
                error: error.message, 
                imgUrl: imageUrl 
            });
        }
    }
    
    const successCount = results.filter(r => r.status === 'created').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`🎯 ROTA 2 - Transferência concluída: ${successCount} sucessos, ${errorCount} erros`);
    
    return results;
}

// NOVO: Handler para endpoint de transferência de sugestões aprovadas
export const transferApprovedSuggestionHandler = async (req, res) => {
    try {
        console.log('🔄 ENDPOINT - Transfer Approved Suggestion iniciado');
        
        const { 
            suggestionData,
            customEmail,
            customClientId,
            customInvoiceId,
            customUserId
        } = req.body;
        
        // Validar dados obrigatórios
        if (!suggestionData || !suggestionData.inputImages || !Array.isArray(suggestionData.inputImages)) {
            return res.status(400).json({
                success: false,
                message: 'suggestionData.inputImages é obrigatório e deve ser um array'
            });
        }
        
        console.log('🔍 ENDPOINT - Transferindo sugestão com:', suggestionData.inputImages.length, 'imagens');
        
        const results = await transferApprovedSuggestionToImages(
            suggestionData,
            customEmail,
            customClientId,
            customInvoiceId,
            customUserId
        );
        
        const successCount = results.filter(r => r.status === 'created').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        
        res.json({
            success: true,
            results,
            summary: {
                total: results.length,
                successful: successCount,
                errors: errorCount
            }
        });
        
    } catch (error) {
        console.error('❌ ENDPOINT - Erro na transferência:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao transferir sugestão aprovada',
            error: error.message
        });
    }
};
