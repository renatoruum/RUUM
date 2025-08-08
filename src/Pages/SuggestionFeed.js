//STYLES
import styles from './SuggestionFeed.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
//Hooks
import { useState, useEffect } from 'react';
import { useClientPlan } from '../Contexts/ClientPlanProvider';
//Components
import ChooseClient from '../Components/ChooseClient';
import PropertysList from '../Components/PropertysList';
import ImageSelector from '../Components/ImageSelector';
//Airtable
import Airtable from 'airtable';
//Constants
import { PAGE_SIZE } from '../constants';

const SuggestionFeed = () => {

  const [records, setRecords] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showChooseClient, setShowChooseClient] = useState(true);
  const [showPropertysList, setShowPropertysList] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [topMessage, setTopMessage] = useState('Selecione abaixo o imóvel para Virtual Staging.');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsToShow, setItemsToShow] = useState(PAGE_SIZE);
  const [clientId, setClientId] = useState("recMjeDtB77Ijl9BL");
  const [clientName, setClientName] = useState("");
  const [baseTable, setBaseTable] = useState("");
  const [userId, setUserId] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientInfos, setClientInfos] = useState({
    Email: "",
    ClientId: "",
    InvoiceId: "",
    UserId: "",
  });
  const [clientsCrm, setClientsCrm] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Para controlar qual imagem está sendo exibida na suggestion feed

  var client = {
    Email: "galia@acasa7.com.br",
    ClientId: "recZqOfnZXwqbbVZY",
    InvoiceId: "reclDmUiMoLKzRe8k",
    UserId: "recMjeDtB77Ijl9BL",
  }

  // Função para carregar todos os clientes com BaseCRM válido
  const loadClientsFromCRM = async () => {
    setLoading(true);
    Airtable.configure({
      apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
    });
    const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

    try {
      const records = await base('Clients')
        .select({
          filterByFormula: `AND({BaseCRM} != "", {BaseCRM} != BLANK())`,
          fields: ['Client Name', 'BaseCRM', 'Calculation']
        })
        .all();

      const clientsData = records.map(record => ({
        clientName: record.fields['Client Name'] || "",
        baseCRM: record.fields.BaseCRM || "",
        clientId: record.fields.Calculation || ""
      }));

      setClientsCrm(clientsData);

    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientsCrm) {
      setShowChooseClient(clientsCrm.length > 0);
    }
  }, [clientsCrm])

  // Função para buscar o plano do cliente pelo nome
  const getClientTable = async (clientid) => {
    setLoading(true);
    Airtable.configure({
      apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
    });
    const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

    try {
      const records = await base('Clients')
        .select({
          filterByFormula: `{Calculation} = "${clientid}"`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length > 0) {
        const clientData = records[0].fields;
        setClientName(clientData['Client Name'] || "");
        return {
          BaseCRM: clientData.BaseCRM || null,
          Calculation: clientData.Calculation || null,
          InvoiceId: clientData.InvoiceId || null,
          UserId: clientId || "",
        };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar tabela do cliente:', error);
      return null;
    }
  };

  useEffect(() => {
    if (clientId) {
      getClientTable(clientId).then(infos => {
        if (infos) {
          setBaseTable(infos.BaseCRM);

          setClientInfos({
            Email: clientEmail,
            ClientId: infos.Calculation,
            InvoiceId: infos.InvoiceId,
            UserId: userId
          });
        }
      });
    }
  }, [clientId])

  useEffect(() => {
    if (clientName) {
    }
  }, [clientName])

  useEffect(() => {
    if (clientInfos) {
    }
  }, [clientInfos])

  useEffect(() => {
    if (clientsCrm.length > 0) {
    }
  }, [clientsCrm])

  // Fetch all records on mount
  useEffect(() => {
    if (baseTable) {
      setLoading(true);
      Airtable.configure({
        apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
      });
      const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

      let allRecords = [];
      base(baseTable).select({ view: "Grid view" }).eachPage(
        function page(records, fetchNextPage) {
          allRecords = allRecords.concat(records);
          fetchNextPage();
        },
        function done(err) {
          setLoading(false);
          if (err) {
            console.error('Error fetching records:', err);
            return;
          }

          setRecords(allRecords);

        }
      );
    }
  }, [baseTable]);

  useEffect(() => {
    loadClientsFromCRM();
  }, []);

  // Paginação
  const totalPages = Math.ceil(records.length / PAGE_SIZE);
  const paginatedRecords = records.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Handle property selection
  const selectProperty = (property) => {
    setSelectedProperty(property);
    setShowPropertysList(false);
    setShowImageSelector(true);
    setTopMessage('Selecione as imagens que você quer aplicar Virtual Staging.');
  };

  const closeImageSelector = () => {
    setSelectedProperty(null);
    setShowPropertysList(true);
    setShowImageSelector(false);
    setCurrentImageIndex(0); // Resetar índice da imagem
    setTopMessage('Aqui estão as sugestões de imóveis que você pode considerar.');
  };

  // Funções para controle de imagens na suggestion feed
  const handleNavigateToImage = (index) => {
    // Para suggestion feed no ImageSelector, navegar entre imagens do formulário
    setCurrentImageIndex(index);
  };

  const handleRemoveImage = (index) => {
    // Esta função será gerenciada pelo ImageSelector
    // Apenas resetar o currentImageIndex se necessário
    if (index === currentImageIndex && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    } else if (index < currentImageIndex) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const goBackToClientMenu = () => {
    setShowChooseClient(true);
    setShowPropertysList(false);
    setShowImageSelector(false);
    setSelectedProperty(null);
    setClientName("");
    setBaseTable("");
    setRecords([]);
    setClientInfos({
      Email: "",
      ClientId: "",
      InvoiceId: "",
      UserId: "",
    });
    setTopMessage('Selecione abaixo o imóvel para Virtual Staging.');
  };

  useEffect(() => {
    document.title = "Portal de Imóveis - " + clientName;
  }, []);

  return (
    <div>
      <div className='mt-3'>

        {!showChooseClient &&
          <div className={styles.headerContainer}>
            <button 
              className={styles.backButton}
              onClick={goBackToClientMenu}
              title="Voltar ao menu de clientes"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h3 className={`${styles.title_font}`}>{`Portal de Imóveis - ${clientName}`}</h3>
            <p className={`${styles.paragraph_font}`}>{topMessage}</p>
          </div>}

        <div>
          {showChooseClient && (
            <ChooseClient
              clientsCrm={clientsCrm}
              setBaseTable={setBaseTable}
              setClientName={setClientName}
              setClientId={setClientId}
              setShowChooseClient={setShowChooseClient}
              setShowPropertysList={setShowPropertysList}
            />
          )}

          {showPropertysList && (
            <>

              <PropertysList
                propertyList={records}
                selectProperty={selectProperty}
                itemsToShow={itemsToShow}
                setItemsToShow={setItemsToShow}
                loading={loading}
              />

            </>
          )}
          {showImageSelector && (
            <ImageSelector
              property={selectedProperty}
              client={clientInfos}
              closeImageSelector={closeImageSelector}
              table={"Image suggestions"}
              currentImageIndex={currentImageIndex}
              onNavigateToImage={handleNavigateToImage}
              onRemoveImage={handleRemoveImage}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default SuggestionFeed;
