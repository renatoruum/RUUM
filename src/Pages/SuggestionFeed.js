import { useState, useEffect } from 'react';
import PropertysList from '../Components/PropertysList';
import ImageSelector from '../Components/ImageSelector';
import Airtable from 'airtable';
import './SuggestionFeed.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const PAGE_SIZE = 42;

const SuggestionFeed = () => {
  const [records, setRecords] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertysList, setShowPropertysList] = useState(true);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [topMessage, setTopMessage] = useState('Aqui estão as sugestões de imóveis que você pode considerar.');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsToShow, setItemsToShow] = useState(PAGE_SIZE);

  // Fetch all records on mount
  useEffect(() => {
    setLoading(true);
    Airtable.configure({
      apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
    });
    const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

    let allRecords = [];
    base('A Casa 7').select({ view: "Grid view" }).eachPage(
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

  return (
    <div>
      <div>
        <h3>Feed de Oportunidades</h3>
        <p>{topMessage}</p>
        <div>
          {showPropertysList && (
            <>

              <PropertysList
                propertyList={records}
                selectProperty={selectProperty}
                itemsToShow={itemsToShow}
                setItemsToShow={setItemsToShow}
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