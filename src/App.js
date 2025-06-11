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
  return (
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
  );
}

export default App;
