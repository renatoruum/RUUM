# Guia de Diagnóstico TTS (ElevenLabs)

## 🔍 Situação Atual

O frontend está **funcionando corretamente** e enviando todas as informações necessárias para o backend. O problema está na configuração do backend com a ElevenLabs API.

## ✅ Frontend (Funcionando)

### Implementações Realizadas:
- ✅ **Autenticação**: Token centralizado via `apiHeaders` (Config.js)
- ✅ **Headers**: Content-Type e Authorization configurados
- ✅ **Função `apiCallBlob`**: Para requisições que retornam blob (áudio)
- ✅ **Logs detalhados**: Payload, headers, status, timestamp
- ✅ **Tratamento de erros**: Mensagens específicas para diferentes tipos de erro
- ✅ **Testes**: Botão de teste TTS com texto simples
- ✅ **Diagnóstico**: Seção visual para troubleshooting

### Logs do Frontend:
```javascript
=== TTS REQUEST DEBUG ===
Enviando payload para TTS: {
  text: "texto do script",
  voice: "Rachel",
  model: "eleven_multilingual_v2"
}
Headers que serão enviados: {
  "Content-Type": "application/json",
  "Authorization": "Bearer [seu-token]"
}
Timestamp: 2024-01-15T10:30:00.000Z
========================
```

## ❌ Backend (Problema)

### Erro Detectado:
- **Status HTTP**: 500 (Internal Server Error)
- **Erro Real**: 401 (Unauthorized) da ElevenLabs API
- **Causa**: Token ElevenLabs não configurado ou inválido no backend

### Verificações Necessárias no Backend:

1. **Token ElevenLabs**:
   ```javascript
   // Verificar se está definido
   process.env.ELEVENLABS_API_KEY
   
   // Verificar se está sendo usado corretamente
   headers: {
     'xi-api-key': process.env.ELEVENLABS_API_KEY
   }
   ```

2. **Endpoint**: `/api/elevenlabs/text-to-speech`
   - Método: POST
   - Body: JSON com { text, voice, model }
   - Response: Blob (áudio)

3. **Headers CORS**:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'POST');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
   ```

4. **Logs do Backend**:
   ```javascript
   console.log('ElevenLabs API Key:', process.env.ELEVENLABS_API_KEY ? 'Configurado' : 'NÃO CONFIGURADO');
   console.log('Payload recebido:', req.body);
   console.log('Resposta ElevenLabs:', response.status);
   ```

## 🔧 Troubleshooting

### Passo 1: Verificar Token ElevenLabs
```bash
# No backend, verificar se a variável está definida
echo $ELEVENLABS_API_KEY

# Testar diretamente a API ElevenLabs
curl -X POST \
  https://api.elevenlabs.io/v1/text-to-speech/Rachel \
  -H "xi-api-key: $ELEVENLABS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "Teste", "model_id": "eleven_multilingual_v2"}'
```

### Passo 2: Verificar Endpoint Backend
```bash
# Testar endpoint local
curl -X POST \
  http://localhost:3000/api/elevenlabs/text-to-speech \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [seu-token]" \
  -d '{"text": "Teste", "voice": "Rachel", "model": "eleven_multilingual_v2"}'
```

### Passo 3: Verificar Logs
- **Frontend**: Abrir DevTools > Console
- **Backend**: Verificar logs do servidor

## 🎯 Ações Imediatas

1. **Verificar configuração do token ElevenLabs no backend**
2. **Adicionar logs detalhados no endpoint TTS do backend**
3. **Testar chamada direta para ElevenLabs API**
4. **Verificar quota/limites da conta ElevenLabs**

## 📱 Como Usar o Diagnóstico

1. Acesse a página VideoTour
2. Role até o final da página
3. Clique no botão "📊 Logs de Sistema"
4. Verifique o console do navegador
5. Use o botão "🧪 Teste TTS" para testar com texto simples

## 📋 Checklist Backend

- [ ] Token ElevenLabs configurado
- [ ] Endpoint `/api/elevenlabs/text-to-speech` implementado
- [ ] Headers CORS configurados
- [ ] Logs detalhados adicionados
- [ ] Tratamento de erro 401 implementado
- [ ] Teste direto com ElevenLabs API funcionando

---

**Conclusão**: O frontend está 100% funcional. O problema é exclusivamente no backend com a configuração/autenticação da ElevenLabs API.
