# 🧪 TESTE ELEVENLABS NO POSTMAN

## 📋 Configuração do Teste

### 1. **Informações da API**
```
URL: https://apiruum-2cpzkgiiia-uc.a.run.app/api/elevenlabs/text-to-speech
Method: POST
Content-Type: application/json
```

### 2. **Headers**
```
Content-Type: application/json
Authorization: Bearer ruum-api-secure-token-2024
```

### 3. **Body (JSON)**
```json
{
    "text": "Teste simples de voz.",
    "voice": "RACHEL",
    "model": "eleven_multilingual_v2"
}
```

### 4. **Payload Completo para Script**
```json
{
    "text": "Admire essa sala de jantar integrada, com design contemporâneo e elegância. Perfeita para momentos únicos, combinando conforto e sofisticação de maneira impecável.",
    "voice": "RACHEL",
    "model": "eleven_multilingual_v2"
}
```

## 🔍 Como Testar

### **Passo 1: Configurar no Postman**
1. Abra o Postman
2. Crie uma nova requisição POST
3. Cole a URL: `https://apiruum-2cpzkgiiia-uc.a.run.app/api/elevenlabs/text-to-speech`
4. Adicione os headers:
   - `Content-Type: application/json`
   - `Authorization: Bearer ruum-api-secure-token-2024`
5. No body, selecione "raw" e "JSON"
6. Cole o payload JSON

### **Passo 2: Analisar a Resposta**
- ✅ **Se retornar JSON**: Procure por `url`, `data.url`, ou `audioUrl`
- ✅ **Se retornar arquivo**: Será um arquivo de áudio direto

## 📊 Logs para Análise

Quando você executar o teste no navegador, procure por estes logs no console:

```
=== TTS TESTE OTIMIZADO ===
URL completa: https://apiruum-2cpzkgiiia-uc.a.run.app/api/elevenlabs/text-to-speech
📋 Content-Type da resposta: [TIPO_AQUI]
📋 Headers completos da resposta: [HEADERS_AQUI]
🔗 URL PÚBLICA DO ÁUDIO TESTE (para Postman): [URL_AQUI]
```

## 🎯 O que Procurar

### **Cenário 1: Resposta JSON**
```json
{
  "url": "https://storage.googleapis.com/...audio.mp3",
  "status": "success"
}
```

### **Cenário 2: Resposta Blob**
- Content-Type: `audio/mpeg` ou similar
- Arquivo de áudio direto no corpo da resposta

## 🔧 Configurações Alternativas

### **Teste com return_url**
```json
{
    "text": "Teste simples de voz.",
    "voice": "RACHEL",
    "model": "eleven_multilingual_v2",
    "return_url": true
}
```

### **Teste com diferentes vozes**
```json
{
    "text": "Teste simples de voz.",
    "voice": "DREW",
    "model": "eleven_multilingual_v2"
}
```

## 📝 Resultados do Teste

**Cole aqui os resultados dos seus testes:**

### Teste 1: Payload básico
- Status: [ ]
- Content-Type: [ ]
- Resposta: [ ]

### Teste 2: Com return_url
- Status: [ ]
- Content-Type: [ ]
- Resposta: [ ]

### Teste 3: Voz diferente
- Status: [ ]
- Content-Type: [ ]
- Resposta: [ ]

---

**Depois de testar, copie os logs do console e cole aqui para análise!**
