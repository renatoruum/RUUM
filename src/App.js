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
  const [rawUser, setRawUser] = useState(null);
  const [polling, setPolling] = useState(true);

  // Polling contínuo até encontrar o e-mail
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => {
      const userObj = window.logged_in_user;
      const email = userObj?.softr_user_email?.trim() || '';
      setRawUser(userObj);
      setSoftrEmail(email);
      if (email) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [polling]);

  // Botão manual para tentar capturar o usuário
  const handleManualCheck = () => {
    const userObj = window.logged_in_user;
    const email = userObj?.softr_user_email?.trim() || '';
    setRawUser(userObj);
    setSoftrEmail(email);
    if (email) setPolling(false);
  };

  return (
    <div>

      <ClientPlanProvider>
        <div className="App p-0 m-0">
          <div>
            <BrowserRouter>
              <Routes>
                <Route path="*" element={<Navigate to="/" replace />} />
                <Route path="/" element={<Home />} />
                <Route path="/suggestionfeed" element={<SuggestionFeed />} />
                <Route path="/videotour" element={<VideoTour />} />
              </Routes>
            </BrowserRouter>
          </div>
        </div>
      </ClientPlanProvider>
    </div>
  );
}

export default App;
