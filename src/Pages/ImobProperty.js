
//STYLES
import styles from './ImobProperty.module.css';
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

const ImobProperty = ({ softrEmail }) => {

    const [records, setRecords] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [showPropertysList, setShowPropertysList] = useState(true);
    const [showImageSelector, setShowImageSelector] = useState(false);
    const [topMessage, setTopMessage] = useState('Selecione abaixo o imóvel para Virtual Staging.');
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsToShow, setItemsToShow] = useState(PAGE_SIZE);
    const { clientPlan, setClientPlan } = useClientPlan();
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
    const [suggestionRecords, setSuggestionRecords] = useState([]);

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
            emailbase = "galia@acasa7.com.br"
        } else {
            emailbase = softrEmail;
        }
        setClientEmail(emailbase);
        getUserTable(emailbase).then(user => {
            if (user) {
                setUserId(user['Record ID']);
                setClientId(user.Client);
            }
        })

    }, [softrEmail]);

    useEffect(() => {
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

    // Carregar sugestões da tabela "Image suggestions"
    useEffect(() => {
        if (clientInfos.ClientId) {
            Airtable.configure({
                apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
            });
            const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);

            let allSuggestions = [];
            base('Image suggestions')
                .select({
                    filterByFormula: `AND(FIND("${clientInfos.ClientId}", {Clients (from Clients) (from Clients)}) > 0, {Suggestion Status} = "Suggested")`,
                    view: "Grid view"
                })
                .eachPage(
                    function page(records, fetchNextPage) {
                        allSuggestions = allSuggestions.concat(records);
                        fetchNextPage();
                    },
                    function done(err) {
                        if (err) {
                            console.error('Erro ao carregar sugestões:', err);
                            // Tentar uma abordagem alternativa se a primeira falhar
                            base('Image suggestions')
                                .select({
                                    view: "Grid view"
                                })
                                .eachPage(
                                    function page(records, fetchNextPage) {
                                        // Filtrar no lado do cliente
                                        const filteredRecords = records.filter(record => {
                                            const clientsField = record.fields['Clients'];
                                            const suggestionStatus = record.fields['Suggestion Status'];
                                            
                                            // Verificar se pertence ao cliente E tem status "Suggested"
                                            const belongsToClient = clientsField && Array.isArray(clientsField) 
                                                ? clientsField.some(clientId => clientId === clientInfos.ClientId)
                                                : false;
                                            
                                            return belongsToClient && suggestionStatus === 'Suggested';
                                        });
                                        allSuggestions = allSuggestions.concat(filteredRecords);
                                        fetchNextPage();
                                    },
                                    function done(err2) {
                                        if (err2) {
                                            console.error('Erro na abordagem alternativa:', err2);
                                            return;
                                        }
                                        // Agrupar sugestões por imóvel
                                        const groupedSuggestions = groupSuggestionsByProperty(allSuggestions);
                                        setSuggestionRecords(groupedSuggestions);
                                    }
                                );
                            return;
                        }
                        // Agrupar sugestões por imóvel
                        const groupedSuggestions = groupSuggestionsByProperty(allSuggestions);
                        setSuggestionRecords(groupedSuggestions);
                    }
                );
        }
    }, [clientInfos.ClientId]);

    // Função para agrupar sugestões por imóvel
    const groupSuggestionsByProperty = (suggestions) => {
        const grouped = {};
        
        suggestions.forEach(suggestion => {
            const fields = suggestion.fields;
            
            // Filtrar apenas registros com Suggestion Status = "Suggested"
            if (fields['Suggestion Status'] !== 'Suggested') {
                return; // Pular este registro
            }
            
            const propertyCode = fields['Client Internal Code'] || 'Sem código';
            
            if (!grouped[propertyCode]) {
                grouped[propertyCode] = {
                    propertyCode,
                    address: fields['Endereço'] || 'Endereço não informado',
                    price: fields['Preço'] || null,
                    images: []
                };
            }
            
            // Adicionar todas as imagens deste registro
            if (fields['INPUT IMAGE'] && Array.isArray(fields['INPUT IMAGE'])) {
                fields['INPUT IMAGE'].forEach(image => {
                    grouped[propertyCode].images.push({
                        url: image.url,
                        suggestionId: suggestion.id
                    });
                });
            }
        });
        
        // Converter objeto para array
        return Object.values(grouped);
    };

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
        if(suggestionRecords){
            console.log('Sugestões carregadas:', suggestionRecords);
        }
    }, [suggestionRecords])

    useEffect(() => {
        document.title = "Portal de Imóveis - " + clientName;
    }, []);

    return (
        <div>
            <div className='mt-3'>
                <h3 className={`${styles.title_font}`}>{`Portal de Imóveis - ${clientName}`}</h3>
                <p className={`${styles.paragraph_font}`}>{topMessage}</p>
                
                {/* Div de Sugestões com scroll horizontal */}
                {suggestionRecords.length > 0 && (
                    <div className={styles.suggestionsSection}>
                        <h5 className={styles.suggestionsTitle}>
                            Sugestões Disponíveis ({suggestionRecords.length} {suggestionRecords.length === 1 ? 'imóvel' : 'imóveis'})
                        </h5>
                        <div className={styles.suggestionsScrollContainer}>
                            {suggestionRecords.map((property, index) => (
                                <div
                                    key={`${property.propertyCode}-${index}`}
                                    className={styles.suggestionCard}
                                >
                                    {/* Carrossel de imagens */}
                                    <div className={styles.carouselContainer}>
                                        {property.images.length > 1 ? (
                                            // Carrossel para múltiplas imagens
                                            <div id={`suggestion-carousel-${index}`} className="carousel slide" data-bs-ride="carousel">
                                                <div className="carousel-inner">
                                                    {property.images.map((image, imgIndex) => (
                                                        <div
                                                            key={`${image.suggestionId}-${imgIndex}`}
                                                            className={`carousel-item ${imgIndex === 0 ? 'active' : ''}`}
                                                        >
                                                            <img 
                                                                src={image.url} 
                                                                alt={`${property.propertyCode} - Imagem ${imgIndex + 1}`}
                                                                className={styles.suggestionImage}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                {/* Controles do carrossel */}
                                                <button className="carousel-control-prev" type="button" data-bs-target={`#suggestion-carousel-${index}`} data-bs-slide="prev">
                                                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                                    <span className="visually-hidden">Anterior</span>
                                                </button>
                                                <button className="carousel-control-next" type="button" data-bs-target={`#suggestion-carousel-${index}`} data-bs-slide="next">
                                                    <span className="carousel-control-next-icon" aria-hidden="true"></span>
                                                    <span className="visually-hidden">Próxima</span>
                                                </button>
                                                {/* Indicadores */}
                                                <div className="carousel-indicators">
                                                    {property.images.map((_, imgIndex) => (
                                                        <button
                                                            key={imgIndex}
                                                            type="button"
                                                            data-bs-target={`#suggestion-carousel-${index}`}
                                                            data-bs-slide-to={imgIndex}
                                                            className={imgIndex === 0 ? 'active' : ''}
                                                            aria-label={`Slide ${imgIndex + 1}`}
                                                        ></button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            // Imagem única
                                            property.images.length > 0 && (
                                                <img 
                                                    src={property.images[0].url} 
                                                    alt={property.propertyCode}
                                                    className={styles.suggestionImage}
                                                />
                                            )
                                        )}
                                    </div>
                                    
                                    {/* Conteúdo do card */}
                                    <div className={styles.suggestionContent}>
                                        <div className={styles.suggestionCode}>
                                            {property.propertyCode}
                                        </div>
                                        <div className={styles.suggestionAddress}>
                                            {property.address}
                                        </div>
                                        {property.price && (
                                            <div className={styles.suggestionPrice}>
                                                R$ {property.price.toLocaleString('pt-BR')}
                                            </div>
                                        )}
                                        {/* Badge com número de imagens */}
                                        {property.images.length > 1 && (
                                            <div className={styles.imageCount}>
                                                {property.images.length} fotos
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

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
                            table={"Images"}
                        />
                    )}

                </div>
            </div>
        </div>
    );
}

export default ImobProperty