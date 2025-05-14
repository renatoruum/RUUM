// ReactRouter
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// React Hooks
import { useState, useEffect } from 'react';

// Estilos
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

//Pages
import Home from './Pages/Home';
import SuggestionFeed from './Pages/SuggestionFeed';

function App() {
  return (
    <div className="App p-0 m-0">
      <div>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/suggestionfeed" element={<SuggestionFeed />} />
          </Routes>
        </BrowserRouter>
      </div>
    </div>
  );
}

export default App;
