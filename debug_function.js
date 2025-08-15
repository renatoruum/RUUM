export async function upsetImagesInAirtable(
    imagesArray,
    customEmail,
    customClientId,
    customInvoiceId,
    customUserId,
    imageTable,
    originalSuggestionIds = []
) {
    console.log("🔍 DEBUG FUNÇÃO - Parâmetros recebidos:");
    console.log("- imagesArray:", imagesArray?.length, "items");
    console.log("- customEmail:", customEmail);
    console.log("- customClientId:", customClientId);
    console.log("- customInvoiceId:", customInvoiceId);
    console.log("- customUserId:", customUserId);
    console.log("- imageTable:", imageTable, "← VALOR RECEBIDO");
    console.log("- originalSuggestionIds:", originalSuggestionIds?.length || 0, "items");
    
    const tableName = imageTable || "Images";
    console.log("🔍 DEBUG FUNÇÃO - tableName calculado:", tableName);
    console.log("🔍 DEBUG FUNÇÃO - Condição (tableName === 'Image suggestions'):", tableName === "Image suggestions");
    console.log("🔍 DEBUG FUNÇÃO - Se true, vai criar 1 registro com todas as imagens");
    console.log("🔍 DEBUG FUNÇÃO - Se false, vai criar", imagesArray.length, "registros individuais");
    
    const baseInstance = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

    // Resto da função permanece igual...
    // (cole o resto do código aqui mantendo toda a lógica atual)
}
