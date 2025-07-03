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
      // Caso principal: A mensagem é um objeto contendo softrUserEmail (formato preferido)
      if (event.data && typeof event.data === 'object' && event.data.softrUserEmail) {
        const email = event.data.softrUserEmail;
        console.log('Email recebido via postMessage:', email);
        setSoftrEmail(email);
      }
    };
    
    // Registrar o listener de mensagens
    window.addEventListener('message', handleMessage);
    
    // Verificar se estamos em um iframe
    const isInIframe = window.self !== window.top;
    
    // Se estamos em um iframe, requisitar o email para o parent (Softr)
    // Usar um pequeno atraso para garantir que o parent está pronto
    if (isInIframe) {
      setTimeout(() => {
        try {
          window.parent.postMessage({ type: 'REQUEST_EMAIL' }, '*');
        } catch (e) {
          console.error('Erro ao solicitar email do parent:', e);
        }
      }, 500);
    }
    
    // Verificar primeiro se temos o email no hash (prioridade mais alta)
    if (window.location.hash && window.location.hash.includes('@')) {
      const hashValue = window.location.hash.substring(1);
      if (hashValue.includes('@')) {
        setSoftrEmail(hashValue);
      }
    }
    // Depois verificar no query string se não temos no hash
    else {
      const urlParams = new URLSearchParams(window.location.search);
      const emailFromQuery = urlParams.get('email');
      if (emailFromQuery && emailFromQuery.includes('@')) {
        setSoftrEmail(emailFromQuery);
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
      
    </div>
  );
}

export default App;

