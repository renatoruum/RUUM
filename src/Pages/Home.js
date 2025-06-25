// React Hooks
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Estilos
import './Home.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const Home = () => {

  const navigate = useNavigate();

  const goFeed = () => {
    navigate('/suggestionfeed');
  }

  useEffect(() => {
    goFeed()
  }, []);

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