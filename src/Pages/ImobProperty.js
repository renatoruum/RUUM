
import styles from './ImobProperty.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
//Hooks
import { useState, useEffect } from 'react';
import { useClientPlan } from '../Contexts/ClientPlanProvider';
//Components
import PropertysList from '../Components/PropertysList';
import ImageSelector from '../Components/ImageSelector';
import CustomModal from '../Components/CustomModal';
import AtelierForm from '../Components/AtelierForm';
import SmartStageForm from '../Components/SmartStageForm';
//Airtable
import Airtable from 'airtable';
//Constants
import { PAGE_SIZE } from '../constants';
//Images for estilos
import classicoImg from '../Images/classico_atualizado.jpg';
import eleganciaImg from '../Images/elegancia_descontraida.jpg';
import sofisticacaoImg from '../Images/sofisticacao_chic.jpg';
import refugioImg from '../Images/refugios_beiramar.jpg';
import industrialImg from '../Images/industrial.jpg';

const ImobProperty = ({ softrEmail }) => {

    // Definir estilos de ambientação
    const estilosamb = [
        {
            id: 'classico',
            name: '1. Clássico Atualizado',
            description: 'Uma nova interpretação da estética tradicional, que mistura elegância com elementos contemporâneos.',
            img: classicoImg
        },
        {
            id: 'elegancia',
            name: '2. Elegância Descontraída',
            description: 'Mobiliário moderno em madeira, tonalidades convidativas e plantas para um ambiente acolhedor.',
            img: eleganciaImg
        },
        {
            id: 'sofisticacao',
            name: '3. Sofisticação Chic',
            description: 'Mármore, granito e detalhes em dourado e prateado que trazem requinte ao espaço.',
            img: sofisticacaoImg
        },
        {
            id: 'refugio',
            name: '4. Refúgio à Beira-Mar',
            description: 'Inspirado no litoral, com materiais naturais como vime e palhinha, perfeito para áreas externas.',
            img: refugioImg
        },
        {
            id: 'industrial',
            name: '5. Industrial Urbano',
            description: 'Uma mistura harmônica do metal e da madeira em concordância com linhas e silhuetas simples.',
            img: industrialImg
        }
    ];

    const [records, setRecords] = useState([]);
    const [selectedProperty, setSelectedProperty] = useState(null);
    const [showPropertysList, setShowPropertysList] = useState(true);
    const [showImageSelector, setShowImageSelector] = useState(false);
    const [topMessage, setTopMessage] = useState('');
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
    const [showSuggestionForm, setShowSuggestionForm] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [suggestionForms, setSuggestionForms] = useState([]);
    const [suggestionFormIndex, setSuggestionFormIndex] = useState(0);
    const [currentImageIndex, setCurrentImageIndex] = useState(0); // Para controlar qual imagem está sendo exibida na suggestion feed

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
                    async function done(err) {
                        if (err) {
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
                                    async function done(err2) {
                                        if (err2) {
                                            return;
                                        }
                                        // Agrupar sugestões por imóvel
                                        const groupedSuggestions = await groupSuggestionsByProperty(allSuggestions);
                                        setSuggestionRecords(groupedSuggestions);
                                    }
                                );
                            return;
                        }
                        // Agrupar sugestões por imóvel
                        const groupedSuggestions = await groupSuggestionsByProperty(allSuggestions);
                        setSuggestionRecords(groupedSuggestions);
                    }
                );
        } else {
        }
    }, [clientInfos.ClientId]);

    // Função para buscar nome do estilo pelo ID
    const getStyleName = async (styleId) => {
        try {
            Airtable.configure({
                apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
            });
            const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);
            
            const record = await base('Styles').find(styleId);
            
            const styleName = record.fields['Style Name'] || record.fields['Style Token'] || null;
            return styleName;
        } catch (error) {
            return null;
        }
    };

    // Função para agrupar sugestões por imóvel
    const groupSuggestionsByProperty = async (suggestions) => {
        const grouped = {};
        
        for (const suggestion of suggestions) {
            const fields = suggestion.fields;
            
            // Filtrar apenas registros com Suggestion Status = "Suggested"
            if (fields['Suggestion Status'] !== 'Suggested') {
                continue; // Pular este registro
            }
            
            const propertyCode = fields['Client Internal Code'] || 'Sem código';
            
            if (!grouped[propertyCode]) {
                // Buscar nome do estilo se STYLE existir
                let estiloName = null;
                
                if (fields['STYLE'] && Array.isArray(fields['STYLE']) && fields['STYLE'].length > 0) {
                    estiloName = await getStyleName(fields['STYLE'][0]);
                }
                
                grouped[propertyCode] = {
                    propertyCode,
                    address: fields['Endereço'] || 'Endereço não informado',
                    price: fields['Preço'] || null,
                    images: [],
                    // Dados para o formulário - usar nome do estilo buscado
                    estilo: estiloName,
                    acabamento: fields['Finish'] || null,
                    retirar: fields['Decluttering'] || null,
                    propertyUrl: fields["Property's URL"] || '', // Adicionar URL da propriedade
                    // Armazenar os IDs originais das sugestões para referência
                    originalSuggestionIds: []
                };
            }
            
            // Adicionar ID da sugestão original
            grouped[propertyCode].originalSuggestionIds.push(suggestion.id);
            
            // Adicionar todas as imagens deste registro
            if (fields['INPUT IMAGE'] && Array.isArray(fields['INPUT IMAGE'])) {
                fields['INPUT IMAGE'].forEach(image => {
                    grouped[propertyCode].images.push({
                        url: image.url,
                        suggestionId: suggestion.id
                    });
                });
            }
        }
        
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

    // Handle suggestion selection
    const selectSuggestion = (property) => {
        // Determinar se é Atelier (tem estilo) ou SmartStage (não tem estilo)
        // Campo Style Name (from STYLE) retorna o nome do estilo como string
        const hasStyle = property.estilo && 
                        (typeof property.estilo === 'string' && property.estilo.trim() !== '');
        const isAtelier = hasStyle;
        
        // Para suggestion feed, criar UM ÚNICO FORMULÁRIO com array de imagens (como estava antes)
        const initialForm = {
            inputImages: property.images.map(img => img.url), // Array com todas as URLs das imagens
            tipo: '', // Será preenchido pelo usuário
            codigoInterno: property.propertyCode,
            endereco: property.address,
            preco: property.price ? property.price.toString() : '',
            destaques: [], // Vazio conforme solicitado
            // Campos específicos adicionais para pré-preenchimento
            codigo: property.propertyCode, // Client Internal Code - Código do Imóvel
            propertyUrl: property.propertyUrl || '', // Property's URL - Link da página do imóvel
            originalSuggestionIds: property.originalSuggestionIds, // IDs das sugestões originais
            
            // Campos específicos baseados no tipo de formulário
            ...(isAtelier ? {
                // Campos do AtelierForm
                // Style Name (from STYLE) já retorna o nome como string
                estilo: property.estilo || '',
                acabamento: property.acabamento || '', // Finish - RUUM Project
                retirar: property.retirar || '' // Decluttering - RUUM Restyle
            } : {
                // Campos do SmartStageForm
                acabamento: property.acabamento || '', // Finish → Acabamento / RUUM Project
                retirar: property.retirar || ''       // Retirar → Decluttering / RUUM Restyle
            })
        };

        // Criar objeto simulando propriedade
        const suggestionProperty = {
            id: `suggestion-${property.propertyCode}`,
            fields: {
                'Client Internal Code': property.propertyCode,
                'Endereço': property.address,
                'Preço': property.price,
                'Fotos_URLs': property.images.map(img => img.url).join('\n'),
                'OriginalSuggestionIds': property.originalSuggestionIds,
                'IsAtelier': isAtelier, // Flag para identificar o tipo
                'OpenedFrom': 'suggestions-feed' // Controle de origem do formulário
            }
        };
        
        setSelectedSuggestion(suggestionProperty);
        setSuggestionForms([initialForm]); // Um único formulário com array de imagens
        setSuggestionFormIndex(0);
        setCurrentImageIndex(0); // Resetar índice da imagem
        setShowPropertysList(false);
        setShowSuggestionForm(true);
        setTopMessage(`Configure as opções de Virtual Staging (${isAtelier ? 'Atelier' : 'SmartStage'}) para este imóvel sugerido.`);
    };

    const closeSuggestionForm = () => {
        setSelectedSuggestion(null);
        setSuggestionForms([]);
        setSuggestionFormIndex(0);
        setCurrentImageIndex(0); // Resetar índice da imagem
        setShowPropertysList(true);
        setShowSuggestionForm(false);
        setTopMessage('Aqui estão as sugestões de imóveis que você pode considerar.');
    };

    // Funções para controle do formulário de sugestões
    const handleSuggestionFormChange = (field, value) => {
        setSuggestionForms(prev => 
            prev.map((form, idx) => 
                idx === suggestionFormIndex ? { ...form, [field]: value } : form
            )
        );
    };

    const handleSuggestionPrev = () => {
        setSuggestionFormIndex(prev => Math.max(0, prev - 1));
    };

    const handleSuggestionNext = () => {
        setSuggestionFormIndex(prev => Math.min(suggestionForms.length - 1, prev + 1));
    };

    const handleSuggestionNavigateToImage = (index) => {
        // Para suggestion feed, navegar entre imagens do mesmo formulário
        if (suggestionForms.length > 0 && suggestionForms[0].inputImages) {
            if (index >= 0 && index < suggestionForms[0].inputImages.length) {
                setCurrentImageIndex(index);
            }
        }
    };

    const handleSuggestionRemoveImage = (index) => {
        if (suggestionForms.length > 0 && suggestionForms[0].inputImages) {
            const currentForm = suggestionForms[0];
            
            if (currentForm.inputImages.length <= 1) {
                alert('Não é possível remover a última imagem selecionada.');
                return;
            }

            // Remover a imagem do array
            const newImages = currentForm.inputImages.filter((_, idx) => idx !== index);
            const updatedForm = { ...currentForm, inputImages: newImages };
            setSuggestionForms([updatedForm]);

            // Ajustar o currentImageIndex se necessário
            if (index === currentImageIndex && currentImageIndex > 0) {
                setCurrentImageIndex(currentImageIndex - 1);
            } else if (index < currentImageIndex) {
                setCurrentImageIndex(currentImageIndex - 1);
            }
        }
    };

    const handleSuggestionSubmit = async (formData) => {
        try {
            // Para suggestion feed, pegar as imagens do array inputImages
            const currentForm = suggestionForms[0];
            const imagesArray = currentForm.inputImages.map(imageUrl => ({
                imgUrls: [imageUrl], // Array com a URL da imagem
                imgUrl: imageUrl, // URL da imagem
                "INPUT IMAGES": [imageUrl], // Campo específico para o Airtable
                tipo: currentForm.tipo,
                retirar: currentForm.retirar,
                codigo: currentForm.codigo || '',
                propertyUrl: currentForm.propertyUrl || '',
                observacoes: currentForm.observacoes,
                estilo: currentForm.estilo,
                acabamento: currentForm.acabamento,
                imagensReferencia: currentForm.imagensReferencia,
                modeloVideo: currentForm.modeloVideo,
                formatoVideo: currentForm.formatoVideo,
                imgWorkflow: currentForm.imgWorkflow,
                suggestionstatus: "Suggested",
                preco: currentForm.preco || '',
                endereco: currentForm.endereco || '',
                destaques: currentForm.destaques || []
            }));

            // Objeto para envio ao backend - incluindo Clients
            const requestData = {
                imagesArray: imagesArray,
                email: clientInfos?.Email,
                clientId: clientInfos?.ClientId, // Este é o campo importante para Clients
                invoiceId: clientInfos?.InvoiceId,
                userId: clientInfos?.UserId,
                table: "Image suggestions"
            };

            // Fazer o POST request
            const response = await fetch(`${process.env.REACT_APP_CLOUD_FUNCTION_URL}uploadimg-airtable-ruum`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const result = await response.json();
                closeSuggestionForm();
            } else {
                alert('Erro ao enviar formulário. Tente novamente.');
            }
        } catch (error) {
            alert('Erro ao enviar formulário. Tente novamente.');
        }
    };

    useEffect(() => {
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
                            Imóveis com potencial de valorização 🤩 ({suggestionRecords.length} {suggestionRecords.length === 1 ? 'imóvel' : 'imóveis'})
                        </h5>
                        <div className={styles.suggestionsScrollContainer}>
                            {suggestionRecords.map((property, index) => (
                                <div
                                    key={`${property.propertyCode}-${index}`}
                                    className={styles.suggestionCard}
                                    onClick={() => selectSuggestion(property)}
                                    style={{ cursor: 'pointer' }}
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
                                                <button className="carousel-control-prev" type="button" data-bs-target={`#suggestion-carousel-${index}`} data-bs-slide="prev" onClick={(e) => e.stopPropagation()}>
                                                    <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                                                    <span className="visually-hidden">Anterior</span>
                                                </button>
                                                <button className="carousel-control-next" type="button" data-bs-target={`#suggestion-carousel-${index}`} data-bs-slide="next" onClick={(e) => e.stopPropagation()}>
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
                                                            onClick={(e) => e.stopPropagation()}
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
                    {showSuggestionForm && suggestionForms.length > 0 && selectedSuggestion && (
                        <CustomModal show={showSuggestionForm} onClose={closeSuggestionForm}>
                            {selectedSuggestion.fields.IsAtelier ? (
                                <AtelierForm
                                    currentForm={suggestionForms[suggestionFormIndex]}
                                    formIndex={suggestionFormIndex}
                                    forms={suggestionForms}
                                    currentImageIndex={currentImageIndex} // Para controle da imagem exibida
                                    handleFormChange={handleSuggestionFormChange}
                                    handlePrev={handleSuggestionPrev}
                                    handleNext={handleSuggestionNext}
                                    handleSubmit={handleSuggestionSubmit}
                                    selectedIndexes={suggestionForms.map((_, idx) => idx)}
                                    property={selectedSuggestion}
                                    onNavigateToImage={handleSuggestionNavigateToImage}
                                    onRemoveImage={handleSuggestionRemoveImage}
                                    onOriginalClose={closeSuggestionForm}
                                    table={"Image suggestions"}
                                    openedFrom={selectedSuggestion.fields.OpenedFrom}
                                    estilosamb={estilosamb}
                                />
                            ) : (
                                <SmartStageForm
                                    currentForm={suggestionForms[suggestionFormIndex]}
                                    formIndex={suggestionFormIndex}
                                    forms={suggestionForms}
                                    currentImageIndex={currentImageIndex} // Para controle da imagem exibida
                                    handleFormChange={handleSuggestionFormChange}
                                    handlePrev={handleSuggestionPrev}
                                    handleNext={handleSuggestionNext}
                                    handleSubmit={handleSuggestionSubmit}
                                    selectedIndexes={suggestionForms.map((_, idx) => idx)}
                                    property={selectedSuggestion}
                                    onNavigateToImage={handleSuggestionNavigateToImage}
                                    onRemoveImage={handleSuggestionRemoveImage}
                                    onOriginalClose={closeSuggestionForm}
                                    table={"Image suggestions"}
                                    openedFrom={selectedSuggestion.fields.OpenedFrom}
                                />
                            )}
                        </CustomModal>
                    )}

                </div>
            </div>
        </div>
    );
}

export default ImobProperty