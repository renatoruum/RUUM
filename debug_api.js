import express from "express";
import { upsetImagesInAirtable } from "../connectors/airtable.js";

const router = express.Router();

router.post("/update-images-airtable", async (req, res) => {
  try {
    console.log("🔍 DEBUG API - Body recebido:", JSON.stringify(req.body, null, 2));
    
    // Verifica se recebemos um objeto com imagesArray ou diretamente um array
    const imagesArray = req.body.imagesArray || req.body;
    
    // Passa os parâmetros adicionais para a função
    const { email, clientId, invoiceId, userId, table, originalSuggestionIds } = req.body;
    
    console.log("🔍 DEBUG API - Parâmetros extraídos:");
    console.log("- imagesArray length:", imagesArray?.length);
    console.log("- email:", email);
    console.log("- clientId:", clientId);
    console.log("- invoiceId:", invoiceId);
    console.log("- userId:", userId);
    console.log("- table:", table);
    console.log("- originalSuggestionIds:", originalSuggestionIds);
    
    if (!Array.isArray(imagesArray) || imagesArray.length === 0) {
      return res.status(400).json({ success: false, message: "Body must be a non-empty array of images" });
    }

    console.log(`🔍 DEBUG API - Chamando upsetImagesInAirtable com parâmetros:`);
    console.log(`- Parâmetro 1 (imagesArray): ${imagesArray.length} items`);
    console.log(`- Parâmetro 2 (email): "${email}"`);
    console.log(`- Parâmetro 3 (clientId): "${clientId}"`);
    console.log(`- Parâmetro 4 (invoiceId): "${invoiceId}"`);
    console.log(`- Parâmetro 5 (userId): "${userId}"`);
    console.log(`- Parâmetro 6 (table): "${table}" ← CRÍTICO: Este deve determinar a tabela`);
    console.log(`- Parâmetro 7 (originalSuggestionIds): ${originalSuggestionIds?.length || 0} items`);
    
    console.log(`Starting to process ${imagesArray.length} images`);
    const results = await upsetImagesInAirtable(imagesArray, email, clientId, invoiceId, userId, table, originalSuggestionIds);
    
    // Conta sucessos e erros
    const successCount = results.filter(r => r.status === 'created' || r.status === 'updated').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    console.log(`🔍 DEBUG API - Processing complete: ${successCount} successful, ${errorCount} errors`);
    console.log(`🔍 DEBUG API - Results:`, JSON.stringify(results, null, 2));
    
    res.json({ 
      success: true, 
      message: `${successCount} images processed successfully, ${errorCount} errors`,
      results,
      summary: {
        total: imagesArray.length,
        successful: successCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error("🔍 DEBUG API - Error updating images in Airtable:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
});

export default router;
