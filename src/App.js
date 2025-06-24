// ReactRouter
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// React Hooks
import { useState, useEffect } from 'react';
import { ClientPlanProvider } from './Contexts/ClientPlanProvider';

// Estilos
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

//Pages
import Home from './Pages/Home';
import SuggestionFeed from './Pages/SuggestionFeed';
import VideoTour from './Pages/VideoTour';

function App() {
  const [softrEmail, setSoftrEmail] = useState('');

  useEffect(() => {
    // Adicionar event listener para mensagens vindas do parent (Softr)
    const handleMessage = (event) => {
      console.log('Mensagem recebida:', event.data);
      
      // Caso 1: A mensagem é um objeto contendo softrUserEmail
      if (event.data && typeof event.data === 'object' && event.data.softrUserEmail) {
        const email = event.data.softrUserEmail;
        console.log('Email recebido via postMessage:', email);
        setSoftrEmail(email);
        return;
      }
      
      // Caso 2: A mensagem é uma string que parece um email
      if (typeof event.data === 'string' && event.data.includes('@')) {
        console.log('Email recebido via postMessage (string):', event.data);
        setSoftrEmail(event.data);
        return;
      }
      
      // Caso 3: A mensagem é uma string JSON que pode ser parseada
      if (typeof event.data === 'string') {
        try {
          const parsedData = JSON.parse(event.data);
          if (parsedData.softrUserEmail) {
            console.log('Email recebido via postMessage (JSON parseado):', parsedData.softrUserEmail);
            setSoftrEmail(parsedData.softrUserEmail);
            return;
          }
        } catch (e) {
          // Não é JSON válido, ignorar
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Verificar se estamos em um iframe
    const isInIframe = window.self !== window.top;
    console.log('Estamos em um iframe?', isInIframe);
    
    // Se estamos em um iframe, requisitar o email para o parent (Softr)
    if (isInIframe) {
      try {
        console.log('Solicitando email ao parent frame (Softr)');
        window.parent.postMessage({ type: 'REQUEST_EMAIL' }, '*');
      } catch (e) {
        console.error('Erro ao solicitar email do parent:', e);
      }
    }
    
    // Verificar se temos o email no query string
    const urlParams = new URLSearchParams(window.location.search);
    const emailFromQuery = urlParams.get('email');
    if (emailFromQuery && emailFromQuery.includes('@')) {
      console.log('Email encontrado na URL:', emailFromQuery);
      setSoftrEmail(emailFromQuery);
    }
    
    // Verificar se temos o email no hash
    if (window.location.hash && window.location.hash.includes('@')) {
      const hashValue = window.location.hash.substring(1);
      if (hashValue.includes('@')) {
        console.log('Email encontrado no hash:', hashValue);
        setSoftrEmail(hashValue);
      }
    }
    
    // Remover o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  return (
    <div>
      <ClientPlanProvider>
        <div className="App p-0 m-0">
          <div>
            <BrowserRouter>
              <Routes>
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/" element={<Home softrEmail={softrEmail} />} />
                <Route path="/suggestionfeed" element={<SuggestionFeed softrEmail={softrEmail} />} />
                <Route path="/videotour" element={<VideoTour softrEmail={softrEmail} />} />
              </Routes>
            </BrowserRouter>
          </div>
        </div>
      </ClientPlanProvider>
      
      {/* Debug: Mostrar o email capturado (remova após testar) */}
      {softrEmail && (
        <div style={{ position: 'fixed', bottom: 5, right: 5, background: '#f0f0f0', padding: '5px 10px', fontSize: '12px', opacity: 0.8 }}>
          Email: {softrEmail}
        </div>
      )}
    </div>
  );


  return (
    <div>

      <ClientPlanProvider>
        <div className="App p-0 m-0">
          <div>
            <BrowserRouter>
              <Routes>
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/" element={<Home softrEmail={softrEmail} />} />
                <Route path="/suggestionfeed" element={<SuggestionFeed softrEmail={softrEmail} />} />
                <Route path="/videotour" element={<VideoTour softrEmail={softrEmail} />} />
              </Routes>
            </BrowserRouter>
          </div>
        </div>
      </ClientPlanProvider>
      
      {/* Debug: Mostrar o email capturado (remova após testar) */}
      {softrEmail && (
        <div style={{ position: 'fixed', bottom: 5, right: 5, background: '#f0f0f0', padding: '5px 10px', fontSize: '12px', opacity: 0.8 }}>
          Email: {softrEmail}
        </div>
      )}
    </div>
  );
}

export default App;
