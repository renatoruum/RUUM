# Funcionalidade: Vídeo com Locução (Runway + ElevenLabs)

## 📋 Resumo

A nova funcionalidade permite combinar vídeo gerado pelo Runway com áudio gerado pelo ElevenLabs TTS, criando um vídeo final com locução sincronizada.

## 🔧 Implementação Técnica

### Limitação do Runway
- **Runway API** não suporta áudio como parâmetro de entrada
- Parâmetros disponíveis: `promptImage`, `promptText`, `ratio`, `duration`, `model`
- **Solução**: Combinar vídeo + áudio em pós-processamento

### Fluxo de Funcionamento

1. **Geração de Script** (ChatGPT)
   - Análise de imagem
   - Geração de texto para locução
   - Endpoint: `/api/chatgpt`

2. **Geração de Áudio** (ElevenLabs TTS)
   - Conversão de texto para áudio
   - Múltiplas vozes disponíveis
   - Endpoint: `/api/elevenlabs/text-to-speech`

3. **Geração de Vídeo** (Runway)
   - Criação de vídeo a partir da imagem
   - Modelos Gen-3 e Gen-4
   - Endpoint: `/api/runway/image-to-video`

4. **Combinação Final**
   - **Opção 1**: Shotstack (recomendado)
   - **Opção 2**: Backend próprio via FFmpeg

## 🎯 Métodos de Combinação

### Método 1: Shotstack (Recomendado)
```javascript
const shotstackJson = {
  timeline: {
    tracks: [
      {
        clips: [
          {
            asset: {
              type: "video",
              src: generatedVideo.output[0] // URL do vídeo do Runway
            },
            start: 0,
            length: runwayForm.duration
          }
        ]
      },
      {
        clips: [
          {
            asset: {
              type: "audio",
              src: audioUrl // URL do áudio do TTS
            },
            start: 0,
            length: runwayForm.duration
          }
        ]
      }
    ]
  },
  output: {
    format: "mp4",
    size: { width: 1280, height: 720 }
  }
};
```

**Vantagens:**
- ✅ Já implementado no backend
- ✅ Processamento em nuvem
- ✅ Qualidade profissional
- ✅ Suporte a múltiplos formatos

### Método 2: Backend Próprio
```javascript
const payload = {
  videoUrl: generatedVideo.output[0],
  audioUrl: audioUrl,
  duration: runwayForm.duration,
  outputFormat: 'mp4'
};
```

**Endpoint necessário:** `/api/video/combine-audio`

**Implementação sugerida (backend):**
```javascript
// Usar FFmpeg para combinar vídeo + áudio
const ffmpeg = require('fluent-ffmpeg');

app.post('/api/video/combine-audio', async (req, res) => {
  const { videoUrl, audioUrl, duration } = req.body;
  
  try {
    // Download dos arquivos
    const videoFile = await downloadFile(videoUrl);
    const audioFile = await downloadFile(audioUrl);
    
    // Combinar com FFmpeg
    const outputFile = `combined_${Date.now()}.mp4`;
    
    await new Promise((resolve, reject) => {
      ffmpeg(videoFile)
        .input(audioFile)
        .videoCodec('copy')
        .audioCodec('aac')
        .duration(duration)
        .output(outputFile)
        .on('end', resolve)
        .on('error', reject)
        .run();
    });
    
    // Upload para storage e retornar URL
    const finalUrl = await uploadToStorage(outputFile);
    
    res.json({
      success: true,
      data: {
        output: [finalUrl],
        status: 'done'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🎨 Interface do Usuário

### Seção de Instruções
- Explicação passo a passo
- Indicadores visuais de progresso
- Dicas de uso

### Seção de Combinação
- Aparece apenas quando vídeo E áudio estão prontos
- Dois botões: Shotstack (recomendado) e Backend próprio
- Feedback visual durante processamento

### Resultado Final
- Player de vídeo com controles
- Botões para download e compartilhamento
- Informações técnicas (duração, formato, etc.)

## 🔍 Logs e Debugging

### Logs Implementados
```javascript
console.log('=== COMBINAÇÃO VÍDEO + ÁUDIO ===');
console.log('URL do vídeo:', generatedVideo.output[0]);
console.log('URL do áudio:', audioUrl);
console.log('Duração estimada:', runwayForm.duration, 'segundos');
console.log('===============================');
```

### Informações de Sistema
- Estado atual de cada componente
- URLs e tokens configurados
- Timestamps de tentativas
- Erros e status

## 🚀 Como Usar

### Passo 1: Gerar Script
1. Inserir URL da imagem
2. Clicar em "Gerar Script"
3. Aguardar processamento do ChatGPT

### Passo 2: Gerar Áudio
1. Revisar script gerado
2. Escolher voz desejada
3. Clicar em "Gerar Áudio (TTS)"
4. Testar reprodução

### Passo 3: Gerar Vídeo
1. Inserir URL da imagem (mesma ou diferente)
2. Configurar parâmetros (duração, formato, etc.)
3. Clicar em "Gerar Vídeo"
4. Aguardar processamento do Runway

### Passo 4: Combinar
1. Seção de combinação aparece automaticamente
2. Escolher método (Shotstack recomendado)
3. Clicar em "Combinar via Shotstack"
4. Aguardar processamento final

## 🔧 Troubleshooting

### Problemas Comuns
1. **Vídeo sem áudio**: Verificar se ambos foram gerados
2. **Erro de combinação**: Verificar logs do backend
3. **Durações diferentes**: Ajustar duração no formulário do Runway
4. **Qualidade baixa**: Usar imagens de alta resolução

### Verificações
- [ ] Script gerado com sucesso
- [ ] Áudio reproduzindo corretamente
- [ ] Vídeo carregando no player
- [ ] Durações compatíveis
- [ ] Endpoints do backend funcionando

## 📊 Benefícios

### Para o Usuário
- ✅ Vídeos profissionais com locução
- ✅ Processo automatizado
- ✅ Múltiplas opções de voz
- ✅ Interface intuitiva

### Para o Negócio
- ✅ Diferencial competitivo
- ✅ Maior valor agregado
- ✅ Experiência completa
- ✅ Escalabilidade

## 🔮 Melhorias Futuras

### Funcionalidades Planejadas
- [ ] Múltiplas vozes em um vídeo
- [ ] Música de fundo customizável
- [ ] Efeitos sonoros
- [ ] Legenda automática
- [ ] Diferentes idiomas
- [ ] Presets de estilo

### Otimizações Técnicas
- [ ] Cache de áudio gerado
- [ ] Processamento em paralelo
- [ ] Compressão inteligente
- [ ] Preview em tempo real
