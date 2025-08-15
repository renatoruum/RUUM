
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
import Confetti from 'react-confetti'; // Para animação de confetti
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
    const [savingSuggestion, setSavingSuggestion] = useState(false); // Estado para loader do Feed de Sugestões
    const [showSuggestionConfetti, setShowSuggestionConfetti] = useState(false); // Estado para confetti do Feed de Sugestões

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
            return null;
        }
    }

    // Função para abreviar texto dos badges
    const abbreviateText = (text, maxLength = 12) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    };

    // Função separada para atualizar status das sugestões usando a nova rota dedicada
    const updateSuggestionStatus = async (suggestionIds) => {
        if (!suggestionIds || suggestionIds.length === 0) {
            return;
        }

        try {
            // Importar apiCall para usar a nova rota
            const { apiCall } = await import('../Config/Config');

            const response = await apiCall("/api/update-suggestion-fields", {
                method: "POST",
                body: JSON.stringify({
                    suggestionIds: suggestionIds,
                    status: "Approved"
                })
            });

            if (!response || !response.success) {
                throw new Error(response?.message || 'Falha na atualização do status');
            }
        } catch (error) {
            throw error; // Re-throw para ser capturado no handleSuggestionSubmit
        }
    };

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
                    // Adicionar destaques do Airtable
                    destaques: fields['Destaques'] || [],
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
        setCurrentImageIndex(0); // Reset para a primeira imagem
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
            // Definir imgWorkflow baseado no tipo
            imgWorkflow: isAtelier ? 'Atelier' : 'SmartStage',
            // CRÍTICO: Campo para identificar a origem do formulário
            openedFrom: 'suggestions-feed',

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

    // Função para navegar diretamente para uma imagem específica na rota normal
    const handleNavigateToImage = (targetIndex) => {
        // Não precisamos fazer nada aqui - o controle será feito pelo ImageSelector
        // A navegação será direta via setFormIndex no ImageSelector
    };

    // Função para remover imagem na rota normal
    const handleRemoveImage = (imageIndex) => {
        // Para rota normal, ajustar o currentImageIndex se necessário
        if (imageIndex === currentImageIndex && currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        } else if (imageIndex < currentImageIndex) {
            setCurrentImageIndex(currentImageIndex - 1);
        }
    };

    const handleSuggestionSubmit = async (formData) => {
        setSavingSuggestion(true); // Iniciar loader

        try {
            // Importar apiCall para usar o mesmo endpoint que funciona
            const { apiCall } = await import('../Config/Config');

            // Determinar fonte dos dados - formData pode ser undefined ou ter estrutura diferente
            let currentForm;

            if (formData && formData.inputImages) {
                // Caso 1: formData contém inputImages (estrutura esperada)
                currentForm = formData;
            } else if (formData && formData.imgUrls) {
                // Caso 2: formData contém imgUrls (pode acontecer na rota suggestionfeed)
                currentForm = {
                    ...formData,
                    inputImages: formData.imgUrls // Converter imgUrls para inputImages
                };
            } else if (suggestionForms[0] && suggestionForms[0].inputImages) {
                // Caso 3: usar suggestionForms[0] como fallback
                currentForm = suggestionForms[0];

                // Se formData existe, mesclar os dados atualizados do formulário
                if (formData) {
                    currentForm = {
                        ...suggestionForms[0],
                        ...formData // Sobrescrever com dados atualizados do formulário
                    };

                    // Se formData tem imgUrls mas não inputImages, converter
                    if (formData.imgUrls && !formData.inputImages) {
                        currentForm.inputImages = formData.imgUrls;
                    }
                }
            } else if (suggestionForms[0] && suggestionForms[0].imgUrls) {
                // Caso 4: suggestionForms[0] tem imgUrls em vez de inputImages
                currentForm = {
                    ...suggestionForms[0],
                    inputImages: suggestionForms[0].imgUrls // Converter imgUrls para inputImages
                };

                // Se formData existe, mesclar os dados atualizados do formulário
                if (formData) {
                    currentForm = {
                        ...currentForm,
                        ...formData // Sobrescrever com dados atualizados do formulário
                    };
                }
            } else {
                throw new Error('Nenhuma imagem encontrada para processar');
            }

            // Para rota 3 (suggestionfeed), usar tabela "Image suggestions" com um único registro
            // Para outras rotas, usar tabela "Images" com registros individuais
            let imagesArray;
            let targetTable;

            // DETECÇÃO MAIS ROBUSTA DAS ROTAS

            // Detectar se é ROTA 1: Baseado no openedFrom dos forms sendo 'suggestions-feed'
            const hasOpenedFromSuggestionsFeed = (suggestionForms[0]?.openedFrom === 'suggestions-feed') ||
                (currentForm?.openedFrom === 'suggestions-feed');

            // Detectar se é ROTA 3: Baseado na URL contendo 'suggestionfeed' E não sendo ROTA 1
            const isUrlSuggestionFeed = window.location.pathname.includes('suggestionfeed') ||
                window.location.hash.includes('suggestionfeed');

            // ROTA 3 tem prioridade: se a URL tem suggestionfeed E não é ROTA 1, então é ROTA 3
            const isRoute3 = isUrlSuggestionFeed && !hasOpenedFromSuggestionsFeed;
            const isRoute1 = hasOpenedFromSuggestionsFeed && !isRoute3;

            // Validar se temos dados essenciais antes de prosseguir
            if (!currentForm?.inputImages || !Array.isArray(currentForm.inputImages) || currentForm.inputImages.length === 0) {
                throw new Error('Nenhuma imagem encontrada para processar. Verifique se as imagens foram selecionadas corretamente.');
            }

            // FORÇAR ROTA 3 SE URL CONTÉM SUGGESTIONFEED (correção para garantir detecção)
            const forceRoute3 = window.location.href.includes('suggestionfeed');
            const finalIsRoute3 = isRoute3 || forceRoute3;
            const finalIsRoute1 = isRoute1 && !forceRoute3;

            if (finalIsRoute1) {
                // ROTA 1: imobproperty -> feed de sugestões - USAR NOVA ROTA ESPECÍFICA

                // Usar nova função específica para transferir sugestões aprovadas
                try {
                    const suggestionData = {
                        inputImages: currentForm.inputImages, // Array de todas as imagens
                        propertyUrl: currentForm.propertyUrl || '',
                        codigo: currentForm.codigo || '',
                        observacoes: currentForm.observacoes || '',
                        retirar: currentForm.retirar || 'Não',
                        tipo: currentForm.tipo || '',
                        acabamento: currentForm.acabamento || 'Não',
                        estilo: currentForm.estilo || '',
                        imgWorkflow: currentForm.imgWorkflow || 'SmartStage'
                    };
                    const transferResults = await apiCall("/api/transfer-approved-suggestion", {

                        method: "POST",
                        body: JSON.stringify({
                            suggestionData: suggestionData,
                            customEmail: clientInfos?.Email || '',
                            customClientId: clientInfos?.ClientId || '',
                            customInvoiceId: clientInfos?.InvoiceId || '',
                            customUserId: clientInfos?.UserId || ''
                        })
                    });

                    setSavingSuggestion(false);

                    if (transferResults && transferResults.success) {
                        // APÓS o sucesso do processamento, atualizar o status das sugestões via nova rota
                        try {
                            await updateSuggestionStatus(currentForm.originalSuggestionIds);
                        } catch (statusError) {
                            // Não interromper o fluxo - o processamento foi bem-sucedido
                        }

                        // Mostrar confetti
                        setShowSuggestionConfetti(true);
                        setTimeout(() => {
                            setShowSuggestionConfetti(false);
                            closeSuggestionForm();
                        }, 4000);
                    } else {
                        alert('Erro ao transferir sugestão. Tente novamente.');
                    }

                    return; // Sair da função aqui para não executar o código antigo

                } catch (transferError) {
                    setSavingSuggestion(false);
                    alert('Erro ao transferir sugestão: ' + transferError.message);
                    return;
                }
            } else if (finalIsRoute3) {
                // ROTA 3: suggestionfeed - Tabela "Image suggestions" com um único registro
                targetTable = "Image suggestions";
                const propertyFields = selectedSuggestion?.fields || {};

                imagesArray = [{
                    imgUrls: currentForm.inputImages, // Array de todas as imagens
                    imgUrl: currentForm.inputImages[0], // Primeira imagem para compatibilidade
                    "INPUT IMAGES": currentForm.inputImages, // Campo específico para o Airtable
                    tipo: currentForm.tipo || '',
                    retirar: currentForm.retirar || 'Não',
                    codigo: currentForm.codigo || propertyFields['Client Internal Code'] || '',
                    propertyUrl: currentForm.propertyUrl || propertyFields["Property's URL"] || '',
                    observacoes: currentForm.observacoes || '',
                    estilo: currentForm.estilo || '',
                    acabamento: currentForm.acabamento || 'Não',
                    imagensReferencia: currentForm.imagensReferencia || [],
                    modeloVideo: currentForm.modeloVideo || '',
                    formatoVideo: currentForm.formatoVideo || '',
                    imgWorkflow: currentForm.imgWorkflow || 'SmartStage',
                    message: currentForm.message || '',
                    // CORREÇÃO CRÍTICA: Campo correto para a tabela "Image suggestions"
                    "Suggestion Status": "Suggested", // Campo com espaço e maiúscula
                    preco: currentForm.preco || propertyFields?.Valor || propertyFields?.Preço || '',
                    endereco: currentForm.endereco || (
                        propertyFields?.Bairro && propertyFields?.Cidade
                            ? propertyFields.Bairro + ' - ' + propertyFields.Cidade
                            : propertyFields?.Bairro ?? propertyFields?.Cidade ?? propertyFields?.Endereço ?? ''
                    ),
                    destaques: currentForm.destaques || propertyFields?.Destaques || [],
                    client: clientInfos?.Email || '',
                    status: 'Pending'
                }];
            } else {
                // Fallback para outras situações
                targetTable = "Images";
                imagesArray = currentForm.inputImages.map(imageUrl => ({
                    imgUrl: imageUrl,
                    imgUrls: [imageUrl],
                    "INPUT IMAGES": [imageUrl],
                    tipo: currentForm.tipo || '',
                    retirar: currentForm.retirar || 'Não',
                    codigo: currentForm.codigo || '',
                    propertyUrl: currentForm.propertyUrl || '',
                    observacoes: currentForm.observacoes || '',
                    estilo: currentForm.estilo || '',
                    acabamento: currentForm.acabamento || 'Não',
                    imagensReferencia: currentForm.imagensReferencia || [],
                    modeloVideo: currentForm.modeloVideo || '',
                    formatoVideo: currentForm.formatoVideo || '',
                    imgWorkflow: currentForm.imgWorkflow || 'SmartStage',
                    message: currentForm.message || '',
                    client: clientInfos?.Email || '',
                    status: 'Pending'
                }));
            }

            // Validar se temos dados essenciais antes de enviar
            if (!imagesArray || imagesArray.length === 0) {
                throw new Error('Nenhuma imagem encontrada para processar');
            }

            // Objeto para envio ao backend - usar tabela específica baseada na rota
            const requestData = {
                imagesArray: imagesArray,
                email: clientInfos?.Email,
                clientId: clientInfos?.ClientId,
                invoiceId: clientInfos?.InvoiceId,
                userId: clientInfos?.UserId,
                table: targetTable // CRÍTICO: Usar tabela correta baseada na rota detectada
            };

            // Usar o mesmo endpoint que funciona no ImageSelector
            let data;
            try {
                data = await apiCall("/api/update-images-airtable", {
                    method: "POST",
                    body: JSON.stringify(requestData)
                });
            } catch (apiError) {
                // Tentar identificar o tipo de erro e dar feedback específico
                if (apiError.message.includes('500')) {
                    throw new Error('Erro interno do servidor (500). Verifique: 1) Se a tabela "' + requestData.table + '" existe no Airtable, 2) Se os campos estão corretos, 3) Se não há limite de API excedido. Tente novamente em alguns minutos.');
                } else if (apiError.message.includes('400')) {
                    throw new Error('Dados inválidos. Verifique se todos os campos obrigatórios foram preenchidos corretamente.');
                } else if (apiError.message.includes('network') || apiError.message.includes('timeout')) {
                    throw new Error('Problema de conexão. Verifique sua internet e tente novamente.');
                } else {
                    throw new Error('Erro ao comunicar com o servidor: ' + (apiError.message || 'Erro desconhecido'));
                }
            }

            setSavingSuggestion(false); // Parar loader

            if (data) {
                // APÓS o sucesso do processamento, atualizar o status das sugestões via nova rota
                try {
                    await updateSuggestionStatus(currentForm.originalSuggestionIds);
                } catch (statusError) {
                    // Não interromper o fluxo - o processamento foi bem-sucedido
                }

                // Mostrar confetti igual ao ImageSelector
                setShowSuggestionConfetti(true);
                setTimeout(() => {
                    setShowSuggestionConfetti(false);
                    closeSuggestionForm();
                }, 4000);
            } else {
                alert('Erro ao enviar formulário. Tente novamente.');
            }
        } catch (error) {
            setSavingSuggestion(false); // Parar loader em caso de erro
            alert('Erro ao enviar formulário: ' + error.message);
        }
    };

    useEffect(() => {
        document.title = "Portal de Imóveis - " + clientName;
    }, []);

    // Componente Overlay para loader e confetti (igual ao ImageSelector)
    const Overlay = ({ children }) => (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(255,255,255,0.7)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }}>
            {children}
        </div>
    );

    return (
        <div>
            <div className='mt-3'>
                <h3 className={`${styles.title_font}`}>{`Portal de Imóveis - ${clientName}`}</h3>
                <p className={`${styles.paragraph_font}`}>{showImageSelector ? "Selecione as imagens que você quer aplicar Virtual Staging." : topMessage}</p>

                {!showImageSelector && (
                    <>
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
                                                                    style={{ position: 'relative' }}
                                                                >
                                                                    <img
                                                                        src={image.url}
                                                                        alt={`${property.propertyCode} - Imagem ${imgIndex + 1}`}
                                                                        className={styles.suggestionImage}
                                                                    />
                                                                    {/* Badges de Destaques */}
                                                                    {property.destaques && property.destaques.length > 0 && (
                                                                        <div className={styles.badgesContainer}>
                                                                            {property.destaques.slice(0, 3).map((destaque, badgeIndex) => (
                                                                                <span
                                                                                    key={badgeIndex}
                                                                                    className={styles.destaqueBadge}
                                                                                    title={destaque} // Tooltip com texto completo
                                                                                >
                                                                                    {abbreviateText(destaque)}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    )}
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
                                                        <div style={{ position: 'relative' }}>
                                                            <img
                                                                src={property.images[0].url}
                                                                alt={property.propertyCode}
                                                                className={styles.suggestionImage}
                                                            />
                                                            {/* Badges de Destaques para imagem única */}
                                                            {property.destaques && property.destaques.length > 0 && (
                                                                <div className={styles.badgesContainer}>
                                                                    {property.destaques.slice(0, 3).map((destaque, badgeIndex) => (
                                                                        <span
                                                                            key={badgeIndex}
                                                                            className={styles.destaqueBadge}
                                                                            title={destaque} // Tooltip com texto completo
                                                                        >
                                                                            {abbreviateText(destaque)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}
                                                        </div>
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
                        </div>
                    </>
                )}

                {showImageSelector && (
                    <ImageSelector
                        property={selectedProperty}
                        client={clientInfos}
                        closeImageSelector={closeImageSelector}
                        table={"Images"}
                        currentImageIndex={currentImageIndex}
                        onNavigateToImage={handleNavigateToImage}
                        onRemoveImage={handleRemoveImage}
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
                                table={"Images"}
                                openedFrom={'suggestions-feed'}
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
                                table={window.location.href.includes('suggestionfeed') ? "Image suggestions" : "Images"}
                                openedFrom={window.location.href.includes('suggestionfeed') ? undefined : 'suggestions-feed'}
                            />
                        )}
                    </CustomModal>
                )}

            </div>

            {/* Confetti para Feed de Sugestões */}
            {showSuggestionConfetti && (
                <Overlay>
                    <>
                        <Confetti numberOfPieces={250} recycle={false} colors={["#68bf6c", "#b6e7c9", "#3a7d44", "#e6eaf0"]} />
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: 28,
                            textAlign: 'center',
                            background: '#68bf6c',
                            borderRadius: 18,
                            padding: '2.5rem 3.5rem',
                            boxShadow: '0 4px 32px 0 rgba(44,62,80,0.18), 0 0 0 6px #fff4',
                            border: '2px solid #fff',
                            zIndex: 10000
                        }}>
                            Imagens enviadas para processamento!
                        </div>
                    </>
                </Overlay>
            )}

            {/* Loader para Feed de Sugestões */}
            {savingSuggestion && (
                <Overlay>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minHeight: 300,
                        background: '#68bf6c',
                        borderRadius: 18,
                        boxShadow: '0 4px 32px 0 rgba(44,62,80,0.18), 0 0 0 6px #fff4',
                        border: '2px solid #fff',
                        padding: '2.5rem 3.5rem',
                        zIndex: 10000
                    }}>
                        <div style={{
                            border: '6px solid #e6eaf0',
                            borderTop: '6px solid #fff',
                            borderRadius: '50%',
                            width: '56px',
                            height: '56px',
                            animation: 'spin 1s linear infinite',
                            margin: '2rem auto',
                            background: 'transparent',
                            boxShadow: '0 0 16px 2px #fff8'
                        }} />
                        <div style={{ marginTop: '.5rem', textAlign: 'center', color: '#fff', fontWeight: 'bold', textShadow: '0 2px 8px #000a' }}>
                            Salvando imagens do Feed de Sugestões
                        </div>
                        <style>
                            {`
                            @keyframes spin {
                                0% { transform: rotate(0deg);}
                                100% { transform: rotate(360deg);}
                            }
                            `}
                        </style>
                    </div>
                </Overlay>
            )}

        </div>
    );
}

export default ImobProperty;