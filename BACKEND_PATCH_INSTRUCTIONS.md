# INSTRUÇÕES PARA CORRIGIR O BACKEND

## PROBLEMA IDENTIFICADO
- 3 imagens estão criando 4 registros no Airtable
- A função `upsetImagesInAirtable` está executando AMBAS as lógicas:
  1. Lógica de "Image suggestions" (cria 1 registro agregado) ❌
  2. Lógica de "Images" (cria registros individuais) ✅

## ONDE ENCONTRAR A FUNÇÃO
A função `upsetImagesInAirtable` está no seu backend (Google Cloud Run).
Procure por ela em arquivos como:
- `src/connectors/airtable.js`
- `src/functions/airtable.js` 
- `src/utils/airtable.js`
- Ou qualquer arquivo que tenha `export function upsetImagesInAirtable`

## PATCH PARA APLICAR

### 1. LOCALIZAR ESTA SEÇÃO NO CÓDIGO:
```javascript
if (tableName === "Image suggestions") {
    // ... lógica que cria 1 registro com todas as imagens
    // ESTA É A LÓGICA QUE ESTÁ CAUSANDO O PROBLEMA
}
```

### 2. SUBSTITUIR POR:
```javascript
if (tableName === "Image suggestions") {
    console.log("🚨 PATCH: Pulando lógica de Image suggestions para evitar duplicatas");
    // Lógica temporariamente desabilitada para corrigir duplicatas
    // return results; // Comentado para forçar ir para a lógica de Images
}
```

### 3. GARANTIR QUE A PRÓXIMA SEÇÃO SEMPRE EXECUTE:
```javascript
// Esta parte deve SEMPRE executar para criar registros individuais
for (let i = 0; i < imagesArray.length; i++) {
    const img = imagesArray[i];
    // ... resto do código de criação individual
}
```

### 4. ADICIONAR LOGS DE DEBUG:
Adicione no início da função:
```javascript
console.log("🔍 DEBUG FUNÇÃO - INÍCIO");
console.log("🔍 DEBUG FUNÇÃO - tableName:", tableName);
console.log("🔍 DEBUG FUNÇÃO - imagesArray.length:", imagesArray.length);
console.log("🔍 DEBUG FUNÇÃO - originalSuggestionIds:", originalSuggestionIds);
```

## RESULTADO ESPERADO
Após a correção, você deve ver nos logs:
- ✅ Apenas 3 registros criados na tabela "Images"
- ✅ Nenhum registro extra criado na tabela "Image suggestions"
- ✅ Logs começando com "🔍 DEBUG FUNÇÃO"

## TESTE
1. Aplique o patch no backend
2. Faça deploy
3. Teste novamente o Feed de Sugestões
4. Verifique se apenas 3 registros são criados (não 4)
5. Me envie os novos logs com "🔍 DEBUG FUNÇÃO"
