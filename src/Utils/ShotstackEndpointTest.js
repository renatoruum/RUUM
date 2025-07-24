// TESTE DE ENDPOINTS SHOTSTACK
// ===========================
// Execute este arquivo para testar os endpoints

const API_BASE = 'https://apiruum-2cpzkgiiia-uc.a.run.app';
const API_TOKEN = 'ruum-api-secure-token-2024';

// Função para testar endpoint
const testEndpoint = async (endpoint, method = 'GET', body = null) => {
  console.log(`\n🔍 Testando: ${method} ${endpoint}`);
  
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_TOKEN}`
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resposta:', data);
      return { success: true, data };
    } else {
      const error = await response.text();
      console.log('❌ Erro:', error);
      return { success: false, error, status: response.status };
    }
    
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    return { success: false, error: error.message };
  }
};

// Função principal de teste
const runTests = async () => {
  console.log('🚀 INICIANDO TESTES DOS ENDPOINTS SHOTSTACK');
  console.log('==========================================');
  
  const results = {};
  
  // 1. Testar endpoint de status (correto)
  results.statusCorrect = await testEndpoint('/api/shotstack/status/test-id');
  
  // 2. Testar endpoint de status (incorreto - o que estava sendo usado)
  results.statusIncorrect = await testEndpoint('/api/shotstack-status/test-id');
  
  // 3. Testar endpoint de renderização
  const renderPayload = {
    timeline: {
      tracks: [{
        clips: [{
          asset: {
            type: 'video',
            src: 'https://example.com/test.mp4'
          },
          start: 0,
          length: 5
        }]
      }]
    },
    output: {
      format: 'mp4',
      resolution: 'hd'
    }
  };
  
  results.render = await testEndpoint('/api/send-shotstack', 'POST', renderPayload);
  
  // 4. Testar endpoints de upload
  results.uploadAudio = await testEndpoint('/api/upload-audio-file', 'POST');
  results.upload = await testEndpoint('/api/upload', 'POST');
  results.fileUpload = await testEndpoint('/api/file-upload', 'POST');
  
  // 5. Testar endpoint de polling
  results.poll = await testEndpoint('/api/shotstack/poll/test-id?timeout=10000');
  
  console.log('\n📋 RESUMO DOS TESTES:');
  console.log('====================');
  
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌';
    const statusCode = result.status ? ` (${result.status})` : '';
    console.log(`${status} ${test}${statusCode}`);
  });
  
  console.log('\n💡 CONCLUSÕES:');
  console.log('===============');
  
  if (results.statusCorrect.success) {
    console.log('✅ Endpoint de status correto está funcionando');
  } else {
    console.log('❌ Endpoint de status correto não está funcionando');
  }
  
  if (results.statusIncorrect.success) {
    console.log('ℹ️  Endpoint de status incorreto ainda funciona (pode ser removido)');
  } else {
    console.log('✅ Endpoint de status incorreto não existe (como esperado)');
  }
  
  if (results.render.success) {
    console.log('✅ Endpoint de renderização está funcionando');
  } else {
    console.log('❌ Endpoint de renderização não está funcionando');
  }
  
  const uploadEndpoints = [results.uploadAudio, results.upload, results.fileUpload];
  const workingUploads = uploadEndpoints.filter(r => r.success).length;
  
  if (workingUploads > 0) {
    console.log(`✅ ${workingUploads} endpoint(s) de upload funcionando`);
  } else {
    console.log('❌ Nenhum endpoint de upload está funcionando');
  }
  
  return results;
};

// Execute os testes
if (typeof window !== 'undefined') {
  // No browser
  window.testShotstackEndpoints = runTests;
  console.log('Execute: testShotstackEndpoints()');
} else {
  // No Node.js
  runTests().catch(console.error);
}

export default runTests;
