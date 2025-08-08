
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
        console.log('🚀 useEffect de sugestões executado!');
        console.log('📋 clientInfos.ClientId:', clientInfos.ClientId);
        
        if (clientInfos.ClientId) {
            console.log('✅ ClientId disponível, iniciando consulta Airtable');
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
                        console.log('📥 Recebendo página com', records.length, 'registros');
                        records.forEach((record, index) => {
                            console.log(`📝 Registro ${index + 1}:`, record.id);
                            console.log('🔍 Campos disponíveis:', Object.keys(record.fields));
                            console.log('🎨 Campo STYLE direto:', record.fields['STYLE']);
                            console.log('📊 Todos os campos:', record.fields);
                        });
                        allSuggestions = allSuggestions.concat(records);
                        fetchNextPage();
                    },
                    async function done(err) {
                        if (err) {
                            console.error('Erro ao carregar sugestões:', err);
                            // Tentar uma abordagem alternativa se a primeira falhar
                            base('Image suggestions')
                                .select({
                                    view: "Grid view"
                                })
                                .eachPage(
                                    function page(records, fetchNextPage) {
                                        console.log('📥 Recebendo página (alternativa) com', records.length, 'registros');
                                        records.forEach((record, index) => {
                                            console.log(`📝 Registro alternativo ${index + 1}:`, record.id);
                                            console.log('🔍 Campos disponíveis (alt):', Object.keys(record.fields));
                                            console.log('🎨 Campo STYLE direto (alt):', record.fields['STYLE']);
                                        });
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
                                            console.error('Erro na abordagem alternativa:', err2);
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
            console.log('❌ ClientId não disponível ainda');
        }
    }, [clientInfos.ClientId]);

    // Função para buscar nome do estilo pelo ID
    const getStyleName = async (styleId) => {
        try {
            console.log('🔍 Buscando estilo para ID:', styleId);
            console.log('🔑 API Key disponível:', !!process.env.REACT_APP_AIRTABLE_API_KEY);
            console.log('🏗️ Base ID disponível:', !!process.env.REACT_APP_AIRTABLE_BASE_ID);
            
            Airtable.configure({
                apiKey: process.env.REACT_APP_AIRTABLE_API_KEY,
            });
            const base = Airtable.base(process.env.REACT_APP_AIRTABLE_BASE_ID);
            
            console.log('📞 Fazendo chamada para Airtable tabela "Styles"...');
            const record = await base('Styles').find(styleId);
            console.log('✅ Registro encontrado na tabela "Styles":', record);
            console.log('✅ Campos do registro:', record.fields);
            console.log('📝 Style Name:', record.fields['Style Name']);
            console.log('🏷️ Style Token:', record.fields['Style Token']);
            
            const styleName = record.fields['Style Name'] || record.fields['Style Token'] || null;
            console.log('🎯 Nome final do estilo:', styleName);
            return styleName;
        } catch (error) {
            console.error('❌ Erro ao buscar nome do estilo:', error);
            console.error('❌ Detalhes do erro:', error.message);
            return null;
        }
    };

    // Função para agrupar sugestões por imóvel
    const groupSuggestionsByProperty = async (suggestions) => {
        console.log('🏠 Iniciando agrupamento de', suggestions.length, 'sugestões');
        const grouped = {};
        
        for (const suggestion of suggestions) {
            const fields = suggestion.fields;
            console.log('📋 Processando sugestão:', suggestion.id, 'com campos:', Object.keys(fields));
            
            // Filtrar apenas registros com Suggestion Status = "Suggested"
            if (fields['Suggestion Status'] !== 'Suggested') {
                console.log('⏭️ Pulando sugestão com status:', fields['Suggestion Status']);
                continue; // Pular este registro
            }
            
            const propertyCode = fields['Client Internal Code'] || 'Sem código';
            console.log('🏷️ Código do imóvel:', propertyCode);
            
            if (!grouped[propertyCode]) {
                // Buscar nome do estilo se STYLE existir
                let estiloName = null;
                console.log('🎨 Campo STYLE:', fields['STYLE']);
                console.log('🎨 Tipo do campo STYLE:', typeof fields['STYLE']);
                console.log('🎨 É array?', Array.isArray(fields['STYLE']));
                
                if (fields['STYLE'] && Array.isArray(fields['STYLE']) && fields['STYLE'].length > 0) {
                    console.log('🔍 Buscando estilo para ID:', fields['STYLE'][0]);
                    estiloName = await getStyleName(fields['STYLE'][0]);
                    console.log('✅ Nome do estilo obtido:', estiloName);
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
                
                console.log('🏠 Propriedade criada:', grouped[propertyCode]);
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
        
        console.log('📊 Resultado final do agrupamento:', Object.values(grouped));
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

    // Handle suggestion selection
    const selectSuggestion = (property) => {
        // Determinar se é Atelier (tem estilo) ou SmartStage (não tem estilo)
        // Campo Style Name (from STYLE) retorna o nome do estilo como string
        const hasStyle = property.estilo && 
                        (typeof property.estilo === 'string' && property.estilo.trim() !== '');
        const isAtelier = hasStyle;
        
        console.log('=== DEBUG SUGGESTION SELECTION ===');
        console.log('Property:', property);
        console.log('Property.estilo:', property.estilo);
        console.log('Property.estilo type:', typeof property.estilo);
        console.log('HasStyle:', hasStyle);
        console.log('IsAtelier:', isAtelier);
        console.log('=====================================');
        
        // Para feed de sugestões, criar apenas UM formulário único para todas as imagens
        const forms = [{
            // Usar a primeira imagem como imgUrl para compatibilidade
            imgUrl: property.images[0]?.url || '',
            originalIndex: 0,
            suggestionId: property.images[0]?.suggestionId || '',
            // Array com todas as imagens do INPUT IMAGE
            inputImages: property.images.map(img => img.url),
            currentImageIndex: 0, // Iniciar com a primeira imagem
            // Campos básicos
            tipo: '', // Será preenchido pelo usuário
            codigoInterno: property.propertyCode,
            endereco: property.address,
            preco: property.price ? property.price.toString() : '',
            destaques: [], // Vazio conforme solicitado
            // Campos específicos adicionais para pré-preenchimento
            codigo: property.propertyCode, // Client Internal Code - Código do Imóvel
            propertyUrl: property.propertyUrl || '', // Property's URL - Link da página do imóvel
            
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
        }];

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
        
        console.log('=== FINAL SUGGESTION PROPERTY ===');
        console.log('suggestionProperty.fields.IsAtelier:', suggestionProperty.fields.IsAtelier);
        console.log('================================');
        
        setSelectedSuggestion(suggestionProperty);
        setSuggestionForms(forms);
        setSuggestionFormIndex(0);
        setShowPropertysList(false);
        setShowSuggestionForm(true);
        setTopMessage(`Configure as opções de Virtual Staging (${isAtelier ? 'Atelier' : 'SmartStage'}) para este imóvel sugerido.`);
    };

    const closeSuggestionForm = () => {
        setSelectedSuggestion(null);
        setSuggestionForms([]);
        setSuggestionFormIndex(0);
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
        setSuggestionFormIndex(index);
    };

    const handleSuggestionRemoveImage = (index) => {
        if (suggestionForms.length > 1) {
            setSuggestionForms(prev => prev.filter((_, idx) => idx !== index));
            if (suggestionFormIndex >= index && suggestionFormIndex > 0) {
                setSuggestionFormIndex(prev => prev - 1);
            }
        }
    };

    const handleSuggestionSubmit = async (formData) => {
        console.log('=== INÍCIO DO HANDLE SUGGESTION SUBMIT ===');
        console.log('Dados do formulário de sugestão:', formData);
        
        try {
            // Criar array de imagens no formato correto
            const imagesArray = [{
                imgUrls: formData.inputImages || [], // Array de URLs das imagens
                imgUrl: formData.inputImages?.[0] || '', // Primeira imagem para compatibilidade
                "INPUT IMAGES": formData.inputImages || [], // Campo específico para o Airtable
                tipo: formData.tipo,
                retirar: formData.retirar,
                codigo: formData.codigo || '',
                propertyUrl: formData.propertyUrl || '',
                observacoes: formData.observacoes,
                estilo: formData.estilo,
                acabamento: formData.acabamento,
                imagensReferencia: formData.imagensReferencia,
                modeloVideo: formData.modeloVideo,
                formatoVideo: formData.formatoVideo,
                imgWorkflow: formData.imgWorkflow,
                suggestionstatus: "Suggested",
                preco: formData.preco || '',
                endereco: formData.endereco || '',
                destaques: formData.destaques || []
            }];

            // Objeto para envio ao backend - incluindo Clients
            const requestData = {
                imagesArray: imagesArray,
                email: clientInfos?.Email,
                clientId: clientInfos?.ClientId, // Este é o campo importante para Clients
                invoiceId: clientInfos?.InvoiceId,
                userId: clientInfos?.UserId,
                table: "Image suggestions"
            };

            console.log('=== DADOS PARA ENVIO ===');
            console.log('Request data:', requestData);
            console.log('Cliente ID:', clientInfos?.ClientId);

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
                console.log('✅ Formulário enviado com sucesso:', result);
                closeSuggestionForm();
            } else {
                console.error('❌ Erro no envio:', response.statusText);
                alert('Erro ao enviar formulário. Tente novamente.');
            }
        } catch (error) {
            console.error('❌ Erro no handleSuggestionSubmit:', error);
            alert('Erro ao enviar formulário. Tente novamente.');
        }
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