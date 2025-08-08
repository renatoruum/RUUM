import React, { useEffect, useState } from 'react';
import styles from './AtelierForm.module.css';
import formstyles from './ImageSelector.module.css';
import MsgModal from './MsgModal';
import DialogBox from './DialogBox';

const AtelierForm = ({
    currentForm,
    formIndex,
    forms,
    currentImageIndex, // Novo prop para controlar imagem exibida na suggestion feed
    handleFormChange,
    handlePrev,
    handleNext,
    handleSubmit,
    selectedIndexes,
    property,
    onNavigateToImage,
    onRemoveImage,
    selectedModel, // Nova prop para determinar o título
    estilosamb, // Nova prop com os estilos de ambientação
    table, // Prop para identificar se é SuggestionFeed
    openedFrom // Prop para controlar origem do formulário
}) => {
    // Função para obter o título correto baseado no modelo selecionado
    const getFormTitle = () => {
        switch (selectedModel) {
            case 'restyle':
                return 'RUUM ReStyle | Enviar nova imagem';
            case 'project':
                return 'RUUM Project | Enviar nova imagem';
            case 'atelier':
            default:
                return 'RUUM Atelier | Enviar nova imagem';
        }
    };
    // Recupera o índice da imagem selecionada
    const selectedIndex = selectedIndexes[formIndex];

    // Para SuggestionFeed, temos múltiplas imagens no currentForm.inputImages
    const isSuggestionFeed = table === "Image suggestions";

    // DEBUG: Ver exatamente que dados chegam
    console.log("=== ATELIER FORM DEBUG ===");
    console.log("table:", table);
    console.log("isSuggestionFeed:", isSuggestionFeed);
    console.log("openedFrom:", openedFrom);
    console.log("currentForm:", currentForm);
    console.log("currentForm?.inputImages:", currentForm?.inputImages);
    console.log("currentForm?.imgUrls:", currentForm?.imgUrls);
    console.log("forms:", forms);
    console.log("forms length:", forms?.length);
    if (forms && forms.length > 0) {
        console.log("forms[0]:", forms[0]);
        console.log("forms[0].imgUrl:", forms[0].imgUrl);
        console.log("forms[0].imgUrls:", forms[0].imgUrls);
        console.log("forms[0].inputImages:", forms[0].inputImages);
    }
    console.log("currentImageIndex:", currentImageIndex);
    console.log("==========================");

    // LÓGICA ROBUSTA PARA DETECTAR ESTRUTURA DE DADOS
    // Detectar automaticamente qual estrutura usar baseado no que existe
    let displayImages = [];
    let mainDisplayImage = null;
    
    if (isSuggestionFeed) {
        // Para suggestion feed, tentar diferentes estruturas na ordem de prioridade
        if (currentForm?.imgUrls && Array.isArray(currentForm.imgUrls)) {
            // Estrutura vinda do ImageSelector (/suggestionfeed)
            displayImages = currentForm.imgUrls;
            mainDisplayImage = currentForm.imgUrls[currentImageIndex || 0];
            console.log("📁 USANDO: currentForm.imgUrls (ImageSelector)");
        } else if (currentForm?.inputImages && Array.isArray(currentForm.inputImages)) {
            // Estrutura vinda do Feed de Sugestões direto
            displayImages = currentForm.inputImages;
            mainDisplayImage = currentForm.inputImages[currentImageIndex || 0];
            console.log("📁 USANDO: currentForm.inputImages (Feed direto)");
        } else if (forms && forms.length > 0 && forms[0]?.imgUrls) {
            // Fallback: tentar forms[0].imgUrls
            displayImages = forms[0].imgUrls;
            mainDisplayImage = forms[0].imgUrls[currentImageIndex || 0];
            console.log("📁 USANDO: forms[0].imgUrls (Fallback)");
        } else if (forms && forms.length > 0 && forms[0]?.inputImages) {
            // Fallback: tentar forms[0].inputImages
            displayImages = forms[0].inputImages;
            mainDisplayImage = forms[0].inputImages[currentImageIndex || 0];
            console.log("📁 USANDO: forms[0].inputImages (Fallback)");
        } else {
            // Último recurso: usar imgUrl único
            displayImages = [currentForm?.imgUrl].filter(Boolean);
            mainDisplayImage = currentForm?.imgUrl;
            console.log("📁 USANDO: currentForm.imgUrl (Último recurso)");
        }
    } else {
        // Para rota normal - usar forms array
        displayImages = [currentForm?.imgUrl].filter(Boolean);
        mainDisplayImage = currentForm?.imgUrl;
        console.log("📁 USANDO: Rota normal - currentForm.imgUrl");
    }

    // Recupera o código interno do imóvel 
    let codigoInterno = '';
    
    // Para formulários de suggestion feed, usar o valor pré-preenchido
    if (isSuggestionFeed && openedFrom === 'suggestions-feed') {
        codigoInterno = currentForm?.codigo || '';
    } else {
        // Para outras rotas, primeiro tentar o valor já preenchido no form
        codigoInterno = currentForm?.codigo || '';
        
        // Se não houver valor no form, tentar buscar dos campos da propriedade
        if (!codigoInterno && property && property.fields) {
            // Tentar primeiro 'Client Internal Code' (para SuggestionFeed) depois 'Codigo' (para ImageSelector)
            let codigoField = property.fields['Client Internal Code'] || property.fields.Codigo;
            
            if (codigoField) {
                if (Array.isArray(codigoField)) {
                    codigoInterno = codigoField[selectedIndex] || codigoField[0] || '';
                } else {
                    codigoInterno = codigoField;
                }
            }
        }
    }

    // Recupera o link da página do imóvel
    let linkPaginaImovel = '';
    
    // Para formulários de suggestion feed, usar o valor pré-preenchido
    if (isSuggestionFeed && openedFrom === 'suggestions-feed') {
        linkPaginaImovel = currentForm?.propertyUrl || '';
    } else {
        // Para outras rotas, primeiro tentar o valor já preenchido no form
        linkPaginaImovel = currentForm?.propertyUrl || '';
        
        // Se não houver valor no form, tentar buscar dos campos da propriedade
        if (!linkPaginaImovel && property && property.fields) {
            // Tentar diferentes formatos de campo: Property's URL (SuggestionFeed), URL_Portal (ImageSelector), URL_Propriedade (Imobiliárias)
            let urlField = property.fields["Property's URL"] || property.fields.URL_Portal || property.fields.URL_Propriedade;
            
            if (urlField) {
                if (Array.isArray(urlField)) {
                    linkPaginaImovel = urlField[selectedIndex] || urlField[0] || '';
                } else {
                    linkPaginaImovel = urlField;
                }
            }
        }
    }

    // Atualiza os campos do formulário apenas quando selectedIndex, property, forms ou formIndex mudam
    useEffect(() => {
        if (codigoInterno) {
            handleFormChange('codigo', codigoInterno);
        }
        if (linkPaginaImovel) {
            handleFormChange('propertyUrl', linkPaginaImovel);
        }
        // eslint-disable-next-line
    }, [codigoInterno, linkPaginaImovel, formIndex]);

    useEffect(() => {
        handleFormChange('imgWorkflow', "Atelier");
    }, [formIndex]) // Executa sempre que muda de formulário

    useEffect(() => {
        if (selectedModel) {
            switch (selectedModel) {
                case 'restyle':
                    handleFormChange('retirar', "Sim");
                    handleFormChange('acabamento', "Não");
                    break;
                case 'project':
                    handleFormChange('acabamento', "Sim");
                    handleFormChange('retirar', "Não");
                    break;
            }
        }
    }, [selectedModel])

    const ESTILOS = [
        'Clássico Atualizado',
        'Elegância Descontraída',
        'Industrial Urbano',
        'Refúgio à Beira-Mar',
        'Satisfação Chic'
    ];
    const TIPOS = [
        'Sala de estar + jantar',
        'Sala de estar',
        'Quarto',
        'Sala de jantar',
        'Sala de jantar + cozinha',
        'Sala de estar + cozinha',
        'Cozinha',
        'Quarto infantil',
        'Home office',
        'Studio',
        'Banheiro',
        'Varanda',
        'Área externa',
        'Walk in closet',
        'Lavanderia',
        'Escritório',
        'Outro',
    ];
    const ACABAMENTOS = ['Sim', 'Não'];
    const RETIRAR = ['Sim', 'Não'];
    const MODELO_VIDEO = [
        'Sem vídeo',
        'A - Antes e depois',
        'B - Câmera mágica',
        'C - Câmera mágica + Antes e depois',
    ];
    const FORMATOS_VIDEO = [
        'Horizontal ↔️ (Web - Portal de vendas , YouTube)',
        'Vertical ↕️ (Social - Stories, Reels e WhatsApp)'
    ]
    const DESTAQUES = [
        'Adição recente',
        'Alto padrão',
        'Localização de destaque',
        'Precisa de reforma',
        'Mobiliário desvalorizado',
        'Alto potencial para ambientação'
    ]

    // --- SmartStage style/modal logic ---
    const [openDialogBox, setOpenDialogBox] = useState(false);
    const [action, setAction] = useState('');
    const [questionDialog, setQuestionDialog] = useState('');
    const imgQty = forms.length;
    const credits = imgQty * 300;
    const actionScript = (act) => {
        setOpenDialogBox(false);
        setAction("");
        setQuestionDialog("");
        if (act === "Ok") {
            handleSubmit();
        }
    };
    const handleOpenDialogBox = () => {
        // Para SuggestionFeed, não mostrar modal de confirmação de créditos
        if (table === "Image suggestions") {
            handleSubmit();
            return;
        }
        
        const msg = imgQty > 1
            ? `O processamento destas ${imgQty} imagens vai consumir ${credits} créditos do seu plano. Deseja continuar?`
            : `O processamento desta imagem vai consumir ${credits} créditos do seu plano. Deseja continuar?`;
        setQuestionDialog(msg);
        setOpenDialogBox(true);
        setAction("confirm");
    };

    // Função para verificar se um formulário está preenchido
    const isFormComplete = (form) => {
        // Para SuggestionFeed, não exigir o campo tipo
        let isComplete = isSuggestionFeed 
            ? form.estilo 
            : form.estilo && form.tipo;
        
        // Verificação condicional baseada no modelo selecionado
        switch (selectedModel) {
            case 'restyle':
                // Para ReStyle: retirar deve ser "Sim" e acabamento deve ser "Não"
                isComplete = isComplete && form.retirar === "Sim" && form.acabamento === "Não";
                break;
            case 'project':
                // Para Project: acabamento deve ser "Sim" e retirar deve ser "Não"
                isComplete = isComplete && form.acabamento === "Sim" && form.retirar === "Não";
                break;
            case 'atelier':
            default:
                // Para Atelier: ambos devem estar preenchidos
                isComplete = isComplete && form.acabamento && form.retirar;
                break;
        }
        
        return isComplete;
    };

    return (
        <div>
            <div className={formstyles.modalContentGrid}>
                <div className={formstyles.leftCol}>
                    <div className={formstyles.formImageBoxGrid}>
                        <img src={mainDisplayImage} alt={`Selecionada ${formIndex + 1}`} className={formstyles.formImageGrid} />
                    </div>
                    <h4 className={formstyles.title}>
                        {isSuggestionFeed 
                            ? `${displayImages.length} imagem${displayImages.length > 1 ? 's' : ''} selecionada${displayImages.length > 1 ? 's' : ''}`
                            : `Imagem ${formIndex + 1} de ${forms.length}`
                        }
                    </h4>

                    {/* THUMBNAILS - VERSÃO ROBUSTA */}
                    {(() => {
                        // Usar a mesma lógica robusta para detectar imagens
                        let imagesToShow = [];
                        let activeIndex = 0;

                        if (isSuggestionFeed) {
                            // Para suggestion feed, detectar automaticamente qual estrutura usar
                            if (currentForm?.imgUrls && Array.isArray(currentForm.imgUrls)) {
                                // Estrutura vinda do ImageSelector (/suggestionfeed)
                                imagesToShow = currentForm.imgUrls;
                                activeIndex = currentImageIndex || 0;
                                console.log("🖼️ THUMBNAILS: currentForm.imgUrls");
                            } else if (currentForm?.inputImages && Array.isArray(currentForm.inputImages)) {
                                // Estrutura vinda do Feed de Sugestões direto
                                imagesToShow = currentForm.inputImages;
                                activeIndex = currentImageIndex || 0;
                                console.log("🖼️ THUMBNAILS: currentForm.inputImages");
                            } else if (forms && forms.length > 0 && forms[0]?.imgUrls) {
                                // Fallback: tentar forms[0].imgUrls
                                imagesToShow = forms[0].imgUrls;
                                activeIndex = currentImageIndex || 0;
                                console.log("🖼️ THUMBNAILS: forms[0].imgUrls");
                            } else if (forms && forms.length > 0 && forms[0]?.inputImages) {
                                // Fallback: tentar forms[0].inputImages
                                imagesToShow = forms[0].inputImages;
                                activeIndex = currentImageIndex || 0;
                                console.log("🖼️ THUMBNAILS: forms[0].inputImages");
                            }
                        } else {
                            // Para rota normal: usar forms array
                            imagesToShow = forms.map(form => form.imgUrl).filter(Boolean);
                            activeIndex = formIndex || 0;
                            console.log("🖼️ THUMBNAILS: Rota normal - forms array");
                        }

                        // DEBUG
                        console.log("THUMBNAILS DEBUG:", {
                            isSuggestionFeed,
                            imagesToShow,
                            activeIndex,
                            shouldShow: imagesToShow.length > 1
                        });

                        // Mostrar thumbnails se tiver mais de 1 imagem
                        if (imagesToShow.length > 1) {
                            return (
                                <div className={formstyles.thumbnailsContainer}>
                                    <div className={formstyles.thumbnailsGrid}>
                                        {imagesToShow.map((imgUrl, index) => (
                                            <div
                                                key={`thumb-${index}`}
                                                className={`${formstyles.thumbnailBox} ${
                                                    index === activeIndex ? formstyles.thumbnailActive : ''
                                                }`}
                                            onClick={() => {
                                                if (isSuggestionFeed) {
                                                    onNavigateToImage && onNavigateToImage(index);
                                                } else {
                                                    // Para rota normal, navegar usando handlePrev/handleNext
                                                    const diff = index - formIndex;
                                                    if (diff > 0) {
                                                        for (let i = 0; i < diff; i++) {
                                                            handleNext && handleNext();
                                                        }
                                                    } else if (diff < 0) {
                                                        for (let i = 0; i < Math.abs(diff); i++) {
                                                            handlePrev && handlePrev();
                                                        }
                                                    }
                                                }
                                            }}
                                        >
                                            <img 
                                                src={imgUrl} 
                                                alt={`Thumbnail ${index + 1}`} 
                                                className={formstyles.thumbnailImage}
                                            />
                                            <button
                                                className={formstyles.removeThumbnailBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isSuggestionFeed) {
                                                        onRemoveImage && onRemoveImage(index);
                                                    } else {
                                                        // Para rota normal não implementamos remoção por thumbnail
                                                        alert('Remoção por thumbnail não disponível nesta rota.');
                                                    }
                                                }}
                                                aria-label={`Remover imagem ${index + 1}`}
                                            >
                                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                    <line x1="13.5" y1="4.5" x2="4.5" y2="13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                                    <line x1="4.5" y1="4.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
                <div className={formstyles.divider} />
                <div className={formstyles.rightCol} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <h2 className={styles.formTitle}>{getFormTitle()}</h2>
                    <h6 className={styles.formSubtitle}>Suba imagens na melhor qualidade possível. É preferível sem marca d'água.</h6>
                    <form className={styles.formAreaGrid} onSubmit={e => e.preventDefault()}>
                        <div className="mb-2">
                            <label className="form-label">Estilo de ambientação</label>
                            <select
                                className={`form-select ${styles.formSelect}`}
                                value={currentForm.estilo}
                                onChange={e => handleFormChange('estilo', e.target.value)}
                                placeholder="Selecione um estilo para ambientação"
                                required
                            >
                                <option value="">Selecione...</option>
                                {ESTILOS.map((estilo) => (
                                    <option key={estilo} value={estilo}>{estilo}</option>
                                ))}
                            </select>
                        </div>
                        {/* Campo Tipo de ambiente - esconder apenas para SuggestionFeed */}
                        {table !== "Image suggestions" && (
                            <div className="mb-2">
                                <label className="form-label">Tipo de ambiente</label>
                                <select
                                    className={`form-select ${styles.formSelect}`}
                                    value={currentForm.tipo}
                                    onChange={e => handleFormChange('tipo', e.target.value)}
                                    placeholder="Selecione uso do cômodo para ambientação"
                                    required
                                >
                                    <option value="">Selecione...</option>
                                    {TIPOS.map((tipo) => (
                                        <option key={tipo} value={tipo}>{tipo}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {/* Campos RUUM Project e RUUM ReStyle - mostrar sempre para modelos Atelier (incluindo suggestions-feed) */}
                        {(selectedModel === "atelier" || selectedModel === "restyle" || selectedModel === "project" || 
                          (isSuggestionFeed && openedFrom === 'suggestions-feed')) && (
                            <div>
                                <div className="mb-2">
                                    <label className="form-label">RUUM Project - Colocar/alterar acabamento (Pode acarretar custo adicional. Consulte seu plano).*</label>
                                    <select
                                        className={`form-select ${styles.formSelect}`}
                                        value={currentForm.acabamento}
                                        onChange={e => handleFormChange('acabamento', e.target.value)}
                                        placeholder="Deseja instalar ou alterar acabamentos?"
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {ACABAMENTOS.map((acab) => (
                                            <option key={acab} value={acab}>{acab}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">RUUM ReStyle - Retirar mobiliário/decoração existente (Pode acarretar custo adicional. Consulte seu plano).*</label>
                                    <select
                                        className={`form-select ${styles.formSelect}`}
                                        value={currentForm.retirar}
                                        onChange={e => handleFormChange('retirar', e.target.value)}
                                        placeholder="Deseja remover objetos na imagem enviada?"
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {RETIRAR.map((ret) => (
                                            <option key={ret} value={ret}>{ret}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                        <div className="mb-2">
                            <label className="form-label">Requisições de clientes</label>
                            <textarea
                                className={`form-control ${styles.formSelect}`}
                                value={currentForm.observacoes}
                                onChange={e => handleFormChange('observacoes', e.target.value)}
                                rows={3}
                                placeholder="Se desejar, indique aqui requisiç!oes pontuais para esta ambientação. De instruções gerais a solicitações específicas."
                            />
                        </div>
                        <div className="mb-2">
                            <label className="form-label">Imagens de referência</label>
                            <input
                                type="text"
                                className={`form-control ${styles.formSelect}`}
                                value={currentForm.imagensReferencia || ''}
                                onChange={e => handleFormChange('imagensReferencia', e.target.value)}
                                placeholder="Links ou descrições das imagens de referência"
                            />
                        </div>
                        
                        {/* Campo Destaques - apenas para SuggestionFeed E não aberto do feed de sugestões */}
                        {table === "Image suggestions" && openedFrom !== 'suggestions-feed' && (
                            <div className="mb-2">
                                <label className="form-label">Destaques do imóvel (múltipla seleção)</label>
                                <select
                                    className={`form-select ${styles.formSelect}`}
                                    value={currentForm.destaques || []}
                                    onChange={e => {
                                        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                                        handleFormChange('destaques', selectedOptions);
                                    }}
                                    multiple
                                    style={{ minHeight: '120px' }}
                                >
                                    {DESTAQUES.map((destaque) => (
                                        <option key={destaque} value={destaque}>{destaque}</option>
                                    ))}
                                </select>
                                <small className="form-text text-muted">
                                    Segure Ctrl (Windows) ou Cmd (Mac) para selecionar múltiplas opções
                                </small>
                            </div>
                        )}
                        
                        <div className="mb-2">
                            <label className="form-label">Modelo de vídeo</label>
                            <select
                                className={`form-select ${styles.formSelect}`}
                                value={currentForm.modeloVideo || ''}
                                onChange={e => handleFormChange('modeloVideo', e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                {MODELO_VIDEO.map((modelo) => (
                                    <option key={modelo} value={modelo}>{modelo}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-2">
                            <label className="form-label">Formato/proporção do vídeo</label>
                            <select
                                className={`form-select ${styles.formSelect}`}
                                value={currentForm.formatoVideo || ''}
                                onChange={e => handleFormChange('formatoVideo', e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                {FORMATOS_VIDEO.map((formato) => (
                                    <option key={formato} value={formato}>{formato}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-2">
                            <label className="form-label text-start">Código interno no imóvel na sua imobiliária</label>
                            <input
                                type="text"
                                className={`form-control ${styles.formSelect}`}
                                value={codigoInterno}
                                readOnly
                            />
                        </div>
                        <div className="mb-2">
                            <label className="form-label">Link da página do imóvel</label>
                            <input
                                type="text"
                                className={`form-control ${styles.formSelect}`}
                                value={linkPaginaImovel}
                                readOnly
                            />
                        </div>
                        <div className={styles.formNavGrid} style={{ marginTop: '2.2rem', padding: '0 1.2rem 1.2rem 1.2rem' }}>
                            {/* Para SuggestionFeed, apenas mostrar botão Enviar */}
                            {isSuggestionFeed ? (
                                <button
                                    type="button"
                                    className="btn"
                                    style={{
                                        backgroundColor: '#68bf6c',
                                        color: '#fff',
                                        border: 'none',
                                        fontWeight: 600,
                                        fontSize: '1.1em',
                                        padding: '0.6em 1.2em',
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 8px rgba(104,191,108,0.10)',
                                        opacity: !isFormComplete(currentForm) ? 0.7 : 1,
                                        width: '100%'
                                    }}
                                    onClick={handleOpenDialogBox}
                                    disabled={!isFormComplete(currentForm)}
                                >
                                    Enviar
                                </button>
                            ) : (
                                /* Navegação original para outras rotas */
                                <>
                                    <button
                                        type="button"
                                        className="btn"
                                        style={{
                                            backgroundColor: '#fff',
                                            color: '#222',
                                            border: '2px solid #222',
                                            fontWeight: 600,
                                            fontSize: '1.1em',
                                            padding: '0.6em 1.2em',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 8px rgba(104,191,108,0.10)',
                                            opacity: formIndex === 0 ? 0.7 : 1,
                                            width: '100%'
                                        }}
                                        onClick={handlePrev}
                                        disabled={formIndex === 0}
                                    >
                                        Anterior
                                    </button>
                                    {formIndex < forms.length - 1 ? (
                                        <button
                                            type="button"
                                            className="btn"
                                            style={{
                                                backgroundColor: '#68bf6c',
                                                color: '#fff',
                                                border: 'none',
                                                fontWeight: 600,
                                                fontSize: '1.1em',
                                                padding: '0.6em 1.2em',
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 8px rgba(104,191,108,0.10)',
                                                opacity: !isFormComplete(currentForm) ? 0.7 : 1,
                                                width: '100%'
                                            }}
                                            onClick={handleNext}
                                            disabled={!isFormComplete(currentForm)}
                                        >
                                            Próxima
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="btn"
                                            style={{
                                                backgroundColor: '#68bf6c',
                                                color: '#fff',
                                                border: 'none',
                                                fontWeight: 600,
                                                fontSize: '1.1em',
                                                padding: '0.6em 1.2em',
                                                borderRadius: '8px',
                                                boxShadow: '0 2px 8px rgba(104,191,108,0.10)',
                                                opacity: forms.some(f => !isFormComplete(f)) ? 0.7 : 1,
                                                width: '100%'
                                            }}
                                            onClick={handleOpenDialogBox}
                                            disabled={forms.some(f => !isFormComplete(f))}
                                        >
                                            Enviar
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </form>
                    {action && questionDialog && (
                        <MsgModal show={openDialogBox} onClose={actionScript}>
                            <DialogBox
                                action={action}
                                actionScript={actionScript}
                                questionDialog={questionDialog}
                            />
                        </MsgModal>
                    )}
                </div>
            </div>

            {/* Seção de Estilos de Ambientação */}
            <div className={styles.estilosSection}>
                <h3 className={styles.estilosTitle}>Estilos de Ambientação</h3>
                <p className={styles.estilosSubtitle}>Já conhece os estilos de ambientação Atelier? Escolha a opção desejada e selecione na página de envio acima.</p>
                <div className={styles.estilosGrid}>
                    {/* Primeira linha - 3 cards */}
                    <div className={styles.estilosRow}>
                        {estilosamb.slice(0, 3).map((estilo, index) => (
                            <div key={index} className={styles.estiloCard}>
                                <img
                                    src={estilo.img}
                                    alt={estilo.name}
                                    className={styles.estiloImage}
                                />
                                <div className={styles.estiloContent}>
                                    <h4 className={styles.estiloTitle}>{estilo.name}</h4>
                                    <p className={styles.estiloDescription}>{estilo.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    {/* Segunda linha - 2 cards */}
                    <div className={styles.estilosRow}>
                        {estilosamb.slice(3, 5).map((estilo, index) => (
                            <div key={index + 3} className={styles.estiloCard}>
                                <img
                                    src={estilo.img}
                                    alt={estilo.name}
                                    className={styles.estiloImage}
                                />
                                <div className={styles.estiloContent}>
                                    <h4 className={styles.estiloTitle}>{estilo.name}</h4>
                                    <p className={styles.estiloDescription}>{estilo.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AtelierForm