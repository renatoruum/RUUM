// React Hooks
import { useState, useEffect, use } from 'react';

//System Hooks
import PropertysList from '../Components/PropertysList';
import ImageSelector from '../Components/ImageSelector';

// Estilos
import './SuggestionFeed.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

//Airtable
import Airtable from 'airtable';

const SuggestionFeed = () => {

  const [apiKey, setApiKey] = useState('');
  const [baseId, setBaseId] = useState('');
  const [envLoaded, setEnvLoaded] = useState(false);
  const [records, setRecords] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertysList, setShowPropertysList] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [topMessage, setTopMessage] = useState('Aqui estão as sugestões de imóveis que você pode considerar.');

  const selectProperty = (property) => {
    console.log('Selected:', property);
    setSelectedProperty(property);
  }

  const closeImageSelector = () => {
    setSelectedProperty(null);
    setShowPropertysList(true);
    setShowImageSelector(false);
    setTopMessage('Aqui estão as sugestões de imóveis que você pode considerar.');
  }

  const closePropertyList = () => {
    setSelectedProperty(null);
    setShowPropertysList(false);
    setShowImageSelector(true);
  }

  useEffect(() => {
    // Check if environment variables are accessible
    const key = process.env.REACT_APP_AIRTABLE_API_KEY;
    const base = process.env.REACT_APP_AIRTABLE_BASE_ID;

    setApiKey(key || 'Not found');
    setBaseId(base || 'Not found');
    setEnvLoaded(true);
  }, []);

  useEffect(() => {
    Airtable.configure({
      apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
    });

    const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

    base('Imobiliaria X').select().firstPage((err, fetchedRecords) => {
      if (err) {
        console.error('Error fetching records:', err);
        return;
      }
      setRecords(fetchedRecords);
    });
  }, []);

  useEffect(() => {
    if (records && records.length > 0) {
      setShowPropertysList(true);
      setShowImageSelector(false);
      setTopMessage('Aqui estão as sugestões de imóveis que você pode considerar.');
    }
  }
    , [records]);

  useEffect(() => {
    if (selectedProperty) {
      setShowPropertysList(false);
      setShowImageSelector(true);
      setTopMessage('Selecione as imagens que você quer aplicar Virtual Staging.');
    }
  }
    , [selectedProperty]);


  return (
    <div>
      <div>
        <h3>
          Feed de Oportunidades
        </h3>
        <p>
          {topMessage}
        </p>
        <div>
          {showPropertysList && (
            <PropertysList
              propertyList={records}
              selectProperty={selectProperty}
            />
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
  )
}

export default SuggestionFeed