//STYLES
import styles from './ChooseClient.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
//Hooks
import { useState, useEffect } from 'react';

const ChooseClient = ({clientsCrm, setBaseTable, setClientName, setClientId, setShowChooseClient, setShowPropertysList}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState([]);

  useEffect(() => {
    if (clientsCrm) {
      const filtered = clientsCrm.filter(client =>
        client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredClients(filtered);
    }
  }, [clientsCrm, searchTerm]);

  const handleClientSelect = (client) => {
    setBaseTable(client.baseCRM);
    setClientName(client.clientName);
    setClientId(client.clientId);
    setShowChooseClient(false);
    setShowPropertysList(true);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Selecione o Cliente</h2>
        <p className={styles.subtitle}>Escolha o cliente para visualizar os imóveis disponíveis</p>
      </div>

      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Pesquisar cliente..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.clientGrid}>
        {filteredClients.map((client, index) => (
          <div
            key={index}
            className={styles.clientCard}
            onClick={() => handleClientSelect(client)}
          >
            <div className={styles.clientIcon}>
              <span className={styles.iconText}>
                {client.clientName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className={styles.clientInfo}>
              <h3 className={styles.clientName}>{client.clientName}</h3>
              <p className={styles.clientCode}>Base: {client.baseCRM}</p>
            </div>
            <div className={styles.arrow}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          </div>
        ))}
      </div>

      {filteredClients.length === 0 && searchTerm && (
        <div className={styles.noResults}>
          <p>Nenhum cliente encontrado para "{searchTerm}"</p>
        </div>
      )}
    </div>
  )
}

export default ChooseClient