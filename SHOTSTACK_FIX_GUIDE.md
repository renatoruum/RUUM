# 🔧 GUIA DE CORREÇÃO - Problemas Shotstack

## 🚨 **Problemas Identificados**

### 1. **Endpoints Incorretos**
- **Problema**: Usando `/api/shotstack-status/` ❌
- **Correção**: Usar `/api/shotstack/status/` ✅

### 2. **Endpoints de Upload Não Encontrados**
- **Problema**: `/api/upload/audio`, `/api/upload`, `/api/file/upload` retornam 404
- **Correção**: Implementar endpoints corretos ou usar alternativas

### 3. **Polling Infinito**
- **Problema**: Não há timeout adequado, fica em loop infinito
- **Correção**: Implementar timeout e limite de tentativas

## 🛠️ **Soluções Implementadas**

### **1. Arquivo de Correção Criado**
```
/src/Utils/ShotstackFix.js
```

Este arquivo contém:
- ✅ Endpoints corretos
- ✅ Função de polling com timeout
- ✅ Função de upload com fallback
- ✅ Tratamento de erros adequado

### **2. Como Aplicar no VideoTour.js**

#### **Importar o arquivo de correção:**
```javascript
import { 
  pollShotstackStatus, 
  uploadAudioFile, 
  handleShotstackIntegration 
} from '../Utils/ShotstackFix';
```

#### **Substituir a função de polling:**
```javascript
// ANTES (com problema):
const pollStatus = async (renderId) => {
  // código problemático com endpoint errado
};

// DEPOIS (corrigido):
const pollStatus = async (renderId) => {
  return await pollShotstackStatus(renderId, 60, 5000); // 60 tentativas, 5s intervalo
};
```

#### **Substituir a função de upload:**
```javascript
// ANTES (com problema):
const uploadAudioBlob = async (audioBlob) => {
  // código problemático com endpoints que não existem
};

// DEPOIS (corrigido):
const uploadAudioBlob = async (audioBlob) => {
  return await uploadAudioFile(audioBlob);
};
```

#### **Usar a função principal integrada:**
```javascript
// OPÇÃO MAIS SIMPLES - Usar a função principal:
const handleCombineWithShotstackNew = async (videoUrl, audioBlob) => {
  try {
    const result = await handleShotstackIntegration(videoUrl, audioBlob);
    console.log('✅ Vídeo final:', result.url);
    return result;
  } catch (error) {
    console.error('❌ Erro na integração:', error);
    throw error;
  }
};
```

## 🔍 **Verificação dos Endpoints**

### **1. Verificar se o Backend está Rodando**
```bash
curl -I https://apiruum-2cpzkgiiia-uc.a.run.app/api/shotstack/status/test-id
```

### **2. Verificar Endpoints de Upload**
```bash
curl -X POST https://apiruum-2cpzkgiiia-uc.a.run.app/api/upload-audio-file \
  -H "Authorization: Bearer ruum-api-secure-token-2024"
```

### **3. Verificar Endpoint de Renderização**
```bash
curl -X POST https://apiruum-2cpzkgiiia-uc.a.run.app/api/send-shotstack \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ruum-api-secure-token-2024"
```

## 📋 **Próximos Passos**

### **1. Implementar as Correções**
1. Importar o arquivo `ShotstackFix.js` no `VideoTour.js`
2. Substituir as funções problemáticas
3. Testar com um vídeo pequeno

### **2. Verificar Backend**
1. Confirmar se os endpoints corretos estão funcionando
2. Verificar se há endpoints de upload disponíveis
3. Testar manualmente com curl

### **3. Monitoramento**
1. Adicionar logs detalhados
2. Implementar timeout adequado
3. Adicionar tratamento de erro robusto

## 🚀 **Implementação Rápida**

### **Substitua todo o código problemático por:**
```javascript
import { handleShotstackIntegration } from '../Utils/ShotstackFix';

// Função principal simplificada
const combineVideoWithShotstack = async (videoUrl, audioBlob) => {
  try {
    console.log('🚀 Iniciando combinação Shotstack...');
    
    const result = await handleShotstackIntegration(videoUrl, audioBlob);
    
    console.log('✅ Sucesso! URL final:', result.url);
    return result.url;
    
  } catch (error) {
    console.error('❌ Erro na combinação:', error);
    throw error;
  }
};
```

## 🎯 **Resultado Esperado**

Após aplicar as correções:
- ✅ Endpoints corretos sendo usados
- ✅ Polling com timeout adequado
- ✅ Upload de áudio funcionando
- ✅ Tratamento de erro robusto
- ✅ Logs informativos e úteis

## 💡 **Dica Extra**

Se os endpoints de upload ainda não estiverem funcionando, você pode:
1. Usar um serviço temporário de upload (ex: Cloudinary)
2. Implementar upload direto no Firebase Storage
3. Pular o áudio temporariamente até corrigir o backend
