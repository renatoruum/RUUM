
//STYLES
import styles from './SuggestionFeed.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
//Hooks
import { useState, useEffect } from 'react';
import { useClientPlan } from '../Contexts/ClientPlanProvider';
//Components
import PropertysList from '../Components/PropertysList';
import ImageSelector from '../Components/ImageSelector';
//Airtable
import Airtable from 'airtable';
//Constants
import { PAGE_SIZE } from '../constants';

const SuggestionFeed = () => {
  const [records, setRecords] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertysList, setShowPropertysList] = useState(true);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [topMessage, setTopMessage] = useState('Selecione abaixo o imóvel para Virtual Staging.');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsToShow, setItemsToShow] = useState(PAGE_SIZE);
  const { clientPlan, setClientPlan } = useClientPlan();
  const [clientName, setClientName] = useState("Acasa7 Inteligência Imobiliária");

  // Função para buscar o plano do cliente pelo nome
  const getClientPlan = async (clientname) => {
    Airtable.configure({
      apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
    });
    const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

    console.log('Buscando plano do cliente:', clientname);

    try {
      const records = await base('Clients')
        .select({
          filterByFormula: `{Client Name} = "${clientname}"`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length > 0) {
        return records[0].fields.Ruum_plan || null;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar plano do cliente:', error);
      return null;
    }
  };

  useEffect(() => {
    getClientPlan("Acasa7 Inteligência Imobiliária").then(plan => {
      setClientPlan(plan);
      if (plan) {
        console.log("Plano do cliente:", plan);
      }
    });
  }, []);

  // Fetch all records on mount
  useEffect(() => {
    setLoading(true);
    Airtable.configure({
      apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
    });
    const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

    let allRecords = [];
    base('ACasa7').select({ view: "Grid view" }).eachPage(
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
        
        // Debug dos records recebidos
        console.log('SuggestionFeed - Total de records recebidos:', allRecords.length);
        
        if (allRecords.length > 0) {
          console.log('SuggestionFeed - Amostra do primeiro record:', allRecords[0]);
          console.log('SuggestionFeed - Tipo do primeiro record:', typeof allRecords[0]);
          console.log('SuggestionFeed - É um objeto Airtable Record?', typeof allRecords[0]?.get === 'function');
          console.log('SuggestionFeed - Tem fields?', !!allRecords[0]?.fields);
        }
        
        setRecords(allRecords);
      }
    );
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
    setTopMessage('Aqui estão as sugestões de imóveis que você pode considerar.');

  };

  useEffect(() => {
    document.title = "Portal de Imóveis - " + clientName;
  }, []);

  return (
    <div>
      <div className='mt-3'>
        <h3 className={`${styles.title_font}`}>{`Portal de Imóveis - ${clientName}`}</h3>
        <p className={`${styles.paragraph_font}`}>{topMessage}</p>
        <div>
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
              closeImageSelector={closeImageSelector}
            />
          )}
          
        </div>
      </div>
    </div>
  );
};

export default SuggestionFeed;
