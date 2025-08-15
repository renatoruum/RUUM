import express from "express";
import { transferApprovedSuggestionToImages } from "./BACKEND_SUGGESTION_FEED_IMPROVEMENTS.js";

const router = express.Router();

/**
 * Endpoint específico para transferir sugestões aprovadas do Feed para tabela Images (Rota 3)
 * POST /api/transfer-approved-suggestion
 */
router.post("/transfer-approved-suggestion", async (req, res) => {
    try {
        console.log('🔄 API - Transfer Approved Suggestion endpoint chamado');
        console.log('🔍 API - Body recebido:', JSON.stringify(req.body, null, 2));
        
        const { 
            suggestionData,
            customEmail,
            customClientId,
            customInvoiceId,
            customUserId
        } = req.body;
        
        // Validar dados obrigatórios
        if (!suggestionData || !suggestionData.inputImages || !Array.isArray(suggestionData.inputImages)) {
            console.error('❌ API - suggestionData.inputImages inválido');
            return res.status(400).json({
                success: false,
                message: 'suggestionData.inputImages é obrigatório e deve ser um array'
            });
        }
        
        if (suggestionData.inputImages.length === 0) {
            console.error('❌ API - Array de imagens vazio');
            return res.status(400).json({
                success: false,
                message: 'Pelo menos uma imagem deve ser fornecida'
            });
        }
        
        console.log(`🔍 API - Processando ${suggestionData.inputImages.length} imagens para transferência`);
        
        // Chamar função de transferência
        const results = await transferApprovedSuggestionToImages(
            suggestionData,
            customEmail,
            customClientId,
            customInvoiceId,
            customUserId
        );
        
        const successCount = results.filter(r => r.status === 'created').length;
        const errorCount = results.filter(r => r.status === 'error').length;
        
        console.log(`✅ API - Transferência concluída: ${successCount} sucessos, ${errorCount} erros`);
        
        res.json({
            success: true,
            message: `${successCount} imagens transferidas com sucesso, ${errorCount} erros`,
            results,
            summary: {
                total: results.length,
                successful: successCount,
                errors: errorCount
            }
        });
        
    } catch (error) {
        console.error('❌ API - Erro na transferência de sugestão aprovada:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

export default router;
