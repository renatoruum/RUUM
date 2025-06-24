// React Hooks
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Estilos
import './Home.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Home = ({ softrEmail }) => {

  console.log('Home - Email recebido via props:', softrEmail);

  const navigate = useNavigate();

  const goFeed = () => {
    navigate('/suggestionfeed');
  }

  useEffect(() => {
    // Verificar se temos o email antes de redirecionar
    if (softrEmail) {
      console.log('Home - Email disponível:', softrEmail);
    } else {
      console.log('Home - Email não disponível ainda, redirecionando mesmo assim');
    }
    
    // Adicionar um pequeno atraso antes de redirecionar para garantir que o componente montou completamente
    const redirectTimeout = setTimeout(() => {
      console.log('Home - Redirecionando para SuggestionFeed');
      goFeed();
    }, 100);
    
    return () => clearTimeout(redirectTimeout);
  }, [softrEmail]);

  return (
    <div>
      <h1>Welcome to Ruum</h1>
      <p>Your one-stop solution for real estate management.</p>
      <p>Explore our features and get started today!</p>
      <button
        className="btn btn-primary"
        onClick={() => goFeed()}
      >
        Oppurtunity Feed
      </button>
    </div>
  )
}

export default Home