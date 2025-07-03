
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

const SuggestionFeed = ({ softrEmail }) => {

  const [records, setRecords] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showPropertysList, setShowPropertysList] = useState(true);
  const [showImageSelector, setShowImageSelector] = useState(false);
  const [topMessage, setTopMessage] = useState('Selecione abaixo o imóvel para Virtual Staging.');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsToShow, setItemsToShow] = useState(PAGE_SIZE);
  const {clientPlan, setClientPlan } = useClientPlan();
  const [clientId, setClientId] = useState("");
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

  var client = {
    Email: "galia@acasa7.com.br",
    ClientId: "recZqOfnZXwqbbVZY",
    InvoiceId: "reclDmUiMoLKzRe8k",
    UserId: "recMjeDtB77Ijl9BL",
  }

  const getUserTable = async (email) => {
    setLoading(true);
    Airtable.configure({
      apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
    });
    const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

    console.log('Buscando tabela do usuário:', email);

    try {
      const records = await base('Users')
        .select({
          filterByFormula: `{Email} = "${email}"`,
          maxRecords: 1,
        })
        .firstPage();

      if (records.length > 0) {
        const userData = records[0].fields;
        return userData;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Erro ao buscar tabela do usuário:', error);
      return null;
    }
  }

  // Função para buscar o plano do cliente pelo nome
  const getClientTable = async (clientid) => {
    setLoading(true);
    Airtable.configure({
      apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
    });
    const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

    console.log('Buscando tabela do cliente:', clientid);

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
          UserId: clientId || null,
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
    var emailbase
    if (!softrEmail) {
      emailbase = "joel@krolowimoveis.com.br"
    } else {
      emailbase = softrEmail;
    }
    setClientEmail(emailbase);
    getUserTable(emailbase).then(user => {
      if (user) {
        console.log('User Data:', user);
        setUserId(user['Record ID']);
        setClientId(user.Client);
      }
    })

  }, [softrEmail]);

  useEffect(() => {
    console.log('Client Id:', clientId);
    if (clientId) {
      getClientTable(clientId[0]).then(infos => {
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
      console.log('Client Name changed:', clientName[0]);
    }
  }, [clientName])

  useEffect(() => {
    if (clientInfos) {
      console.log('Client Infos:', clientInfos);
    }
  }, [clientInfos])

  // Fetch all records on mount
  useEffect(() => {
    if (baseTable) {
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
              client={clientInfos}
              closeImageSelector={closeImageSelector}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default SuggestionFeed;
