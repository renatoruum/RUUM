// SHOTSTACK API ENDPOINTS FIX
// =========================
// Correção para os endpoints corretos do Shotstack

// ENDPOINTS CORRETOS baseados na documentação:
const SHOTSTACK_ENDPOINTS = {

  RENDER: '/api/shotstack/render',          
  STATUS: '/api/shotstack/status/',          
  POLL: '/api/shotstack/poll/',             
  DIAGNOSE: '/api/shotstack/diagnose',      
  TEST_AUTH: '/api/shotstack/test-auth',    
  TEST_RENDER: '/api/shotstack/test-render', 
  UPLOAD: '/api/upload-file',              
  UPLOAD_AUDIO: '/api/upload-audio-file'    
};

// FUNÇÃO CORRIGIDA PARA POLLING
export const pollShotstackStatus = async (renderId, maxAttempts = 60, interval = 5000) => {
  console.log(`🔄 Iniciando polling para render ID: ${renderId}`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`📊 Tentativa ${attempt}/${maxAttempts} - Consultando status...`);
      
      // Usar o endpoint correto
      const response = await fetch(`https://apiruum-2cpzkgiiia-uc.a.run.app${SHOTSTACK_ENDPOINTS.STATUS}${renderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ruum-api-secure-token-2024'
        }
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Status ${response.status} na tentativa ${attempt}`);
        
        if (response.status === 404) {
          console.error('❌ Endpoint não encontrado. Verifique se o backend está rodando.');
          throw new Error('Endpoint de status não encontrado');
        }
        
        if (attempt === maxAttempts) {
          throw new Error(`Falha após ${maxAttempts} tentativas`);
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
        continue;
      }
      
      const data = await response.json();
      console.log(`📈 Status: ${data.status} - Progress: ${data.progress || 0}%`);
      
      if (data.status === 'done') {
        console.log('✅ Renderização concluída!');
        return {
          success: true,
          status: 'done',
          url: data.url
        };
      }
      
      if (data.status === 'failed') {
        console.error('❌ Renderização falhou');
        throw new Error('Renderização falhou');
      }
      
      // Aguardar antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, interval));
      
    } catch (error) {
      console.error(`❌ Erro na tentativa ${attempt}:`, error);
      
      if (attempt === maxAttempts) {
        throw error;
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
  
  throw new Error('Timeout: Renderização não foi concluída no tempo esperado');
};

// FUNÇÃO CORRIGIDA PARA UPLOAD DE ÁUDIO
export const uploadAudioFile = async (audioBlob) => {
  console.log('📤 Iniciando upload de áudio...');
  
  const formData = new FormData();
  formData.append('audio', audioBlob, 'audio.mp3');
  
  const uploadEndpoints = [
    SHOTSTACK_ENDPOINTS.UPLOAD_AUDIO,
    SHOTSTACK_ENDPOINTS.UPLOAD,
    '/api/file-upload'
  ];
  
  for (const endpoint of uploadEndpoints) {
    try {
      console.log(`🔄 Tentando upload em: ${endpoint}`);
      
      const response = await fetch(`https://apiruum-2cpzkgiiia-uc.a.run.app${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ruum-api-secure-token-2024'
        },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Upload bem-sucedido:', data);
        return data.url;
      }
      
      console.warn(`⚠️ Upload falhou em ${endpoint}: ${response.status}`);
      
    } catch (error) {
      console.error(`❌ Erro no upload em ${endpoint}:`, error);
    }
  }
  
  throw new Error('Não foi possível fazer upload do áudio em nenhum endpoint');
};

// FUNÇÃO CORRIGIDA PARA ENVIO DO SHOTSTACK
export const sendToShotstack = async (payload) => {
  console.log('📤 Enviando para Shotstack...');
  
  try {
    const response = await fetch(`https://apiruum-2cpzkgiiia-uc.a.run.app${SHOTSTACK_ENDPOINTS.RENDER}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ruum-api-secure-token-2024'
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Resposta do Shotstack:', data);
    
    return data;
    
  } catch (error) {
    console.error('❌ Erro no envio para Shotstack:', error);
    throw error;
  }
};

// FUNÇÃO PRINCIPAL OTIMIZADA PARA ELEVENLABS
export const handleShotstackIntegration = async (videoUrl, audioUrl = null) => {
  try {
    console.log('🚀 Iniciando integração Shotstack...');
    console.log('🎥 Vídeo URL:', videoUrl);
    console.log('🎵 Áudio URL:', audioUrl);
    
    // 1. Validar URLs
    if (!videoUrl || !videoUrl.startsWith('http')) {
      throw new Error('URL de vídeo inválida');
    }
    
    if (audioUrl && !audioUrl.startsWith('http')) {
      console.warn('⚠️ URL de áudio inválida, continuando sem áudio');
      audioUrl = null;
    }
    
    // 2. Montar payload do Shotstack
    const payload = {
      timeline: {
        tracks: [
          {
            clips: [
              {
                asset: {
                  type: 'video',
                  src: videoUrl
                },
                start: 0,
                length: 5 // Ajustar conforme necessário
              }
            ]
          }
        ]
      },
      output: {
        format: 'mp4',
        resolution: 'hd',
        aspectRatio: '16:9'
      }
    };
    
    // Adicionar áudio se disponível (URL pública do ElevenLabs)
    if (audioUrl) {
      payload.timeline.soundtrack = {
        src: audioUrl,
        effect: 'fadeIn'
      };
      console.log('🎵 Áudio adicionado ao payload');
    } else {
      console.log('📹 Processando apenas vídeo (sem áudio)');
    }
    
    // 3. Enviar para renderização
    const renderResponse = await sendToShotstack(payload);
    
    if (!renderResponse.success || !renderResponse.id) {
      throw new Error('Não foi possível obter ID de renderização');
    }
    
    console.log('🆔 Render ID obtido:', renderResponse.renderId);
    
    // 4. Fazer polling do status
    const result = await pollShotstackStatus(renderResponse.renderId);
    
    return result;
    
  } catch (error) {
    console.error('❌ Erro na integração Shotstack:', error);
    throw error;
  }
};

// FUNÇÃO ALTERNATIVA PARA CASOS QUE PRECISAM DE UPLOAD
export const handleShotstackIntegrationWithUpload = async (videoUrl, audioBlob = null) => {
  try {
    console.log('🚀 Iniciando integração Shotstack com upload...');
    
    // 1. Tentar upload do áudio se fornecido
    let audioUrl = null;
    if (audioBlob && audioBlob.size <= 300 * 1024) { // 300KB limit
      try {
        audioUrl = await uploadAudioFile(audioBlob);
      } catch (error) {
        console.warn('⚠️ Upload de áudio falhou, continuando sem áudio:', error);
      }
    }
    
    // 2. Usar a função principal otimizada
    return await handleShotstackIntegration(videoUrl, audioUrl);
    
  } catch (error) {
    console.error('❌ Erro na integração Shotstack com upload:', error);
    throw error;
  }
};

export default {
  SHOTSTACK_ENDPOINTS,
  pollShotstackStatus,
  uploadAudioFile,
  sendToShotstack,
  handleShotstackIntegration,
  handleShotstackIntegrationWithUpload
};
