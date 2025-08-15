//React
import { useEffect, useState } from 'react';
//Components
import MsgModal from './MsgModal';
import DialogBox from './DialogBox';
//Styles
import styles from './ImageSelector.module.css';

// 🔴🔴🔴 ARQUIVO CORRETO SENDO CARREGADO! 🔴🔴🔴
console.log('🔴🔴🔴 SMARTSTAGEFORM - ARQUIVO CORRETO CARREGADO EM:', new Date().toLocaleTimeString());

const SmartStageForm = ({
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
    selectedModel,
    table, // Prop para identificar se é SuggestionFeed
    openedFrom // Prop para controlar origem do formulário
}) => {
    const [openDialogBox, setOpenDialogBox] = useState(false);
    const [action, setAction] = useState('');
    const [questionDialog, setQuestionDialog] = useState('');
    const [isopen, setIsOpen] = useState(false);

    // Para SuggestionFeed, verificar estrutura de dados
    const isSuggestionFeed = openedFrom === 'suggestions-feed';

    // DEBUG: Logs das props recebidas - VERSÃO 2025
    console.log('� SMARTSTAGEFORM NOVA VERSÃO - Props recebidas:');
    console.log('� table:', table);
    console.log('� openedFrom:', openedFrom);
    console.log('� isSuggestionFeed:', isSuggestionFeed);
    console.log('� handleSubmit type:', typeof handleSubmit);

    // LÓGICA ROBUSTA PARA DETECTAR ESTRUTURA DE DADOS
    let displayImages = [];
    let mainDisplayImage = null;
    
    if (table === "Image suggestions") {
        // ROTA 3: SUGGESTIONFEED - Usar currentForm.imgUrls (não inputImages!)
        console.log('🔍 ROTA 3 - Detectando imagens em currentForm.imgUrls:', currentForm?.imgUrls?.length);
        if (currentForm?.imgUrls && Array.isArray(currentForm.imgUrls)) {
            displayImages = currentForm.imgUrls;
            mainDisplayImage = currentForm.imgUrls[currentImageIndex || 0];
            console.log('🔍 ROTA 3 - Usando currentForm.imgUrls:', displayImages.length, 'imagens');
        } else if (currentForm?.inputImages && Array.isArray(currentForm.inputImages)) {
            // Fallback para inputImages se imgUrls não existir
            displayImages = currentForm.inputImages;
            mainDisplayImage = currentForm.inputImages[currentImageIndex || 0];
            console.log('🔍 ROTA 3 - Fallback para currentForm.inputImages:', displayImages.length, 'imagens');
        } else if (forms && forms.length > 0 && forms[0]?.imgUrls) {
            // Fallback: usar forms[0].imgUrls
            displayImages = forms[0].imgUrls;
            mainDisplayImage = forms[0].imgUrls[currentImageIndex || 0];
            console.log('🔍 ROTA 3 - Fallback para forms[0].imgUrls:', displayImages.length, 'imagens');
        } else {
            displayImages = [];
            mainDisplayImage = null;
            console.log('🔍 ROTA 3 - Nenhuma imagem encontrada');
        }
    } else if (isSuggestionFeed) {
        // ROTA 1: IMOBPROPERTY -> FEED DE SUGESTÕES - Usar inputImages
        if (currentForm?.inputImages && Array.isArray(currentForm.inputImages)) {
            displayImages = currentForm.inputImages;
            mainDisplayImage = currentForm.inputImages[currentImageIndex || 0];
        } else if (forms && forms.length > 0 && forms[0]?.inputImages) {
            displayImages = forms[0].inputImages;
            mainDisplayImage = forms[0].inputImages[currentImageIndex || 0];
        } else {
            displayImages = [currentForm?.imgUrl].filter(Boolean);
            mainDisplayImage = currentForm?.imgUrl;
        }
    } else {
        // ROTA 2: IMOBPROPERTY -> IMAGESELECTOR - Usar imgUrl padrão
        displayImages = [currentForm?.imgUrl].filter(Boolean);
        mainDisplayImage = currentForm?.imgUrl;
    }

    // Calcular quantidade de imagens corretamente baseado na estrutura detectada
    let imgQty;
    if (table === "Image suggestions") {
        // ROTA 3: SUGGESTIONFEED - Contar imagens no displayImages (que já detectou imgUrls)
        imgQty = displayImages.length;
        console.log('🔍 ROTA 3 - imgQty calculado:', imgQty, 'baseado em displayImages');
    } else if (isSuggestionFeed) {
        // ROTA 1: IMOBPROPERTY -> FEED DE SUGESTÕES - Contar inputImages
        imgQty = displayImages.length;
    } else {
        // ROTA 2: IMOBPROPERTY -> IMAGESELECTOR - Contar formulários
        imgQty = forms.length;
    }
    const credits = imgQty * 100;
    const selectedIndex = selectedIndexes[formIndex];

    // Função para obter o título baseado no modelo selecionado
    const getFormTitle = () => {
        switch(selectedModel) {
            case 'smartStage':
                return 'SmartStage | Enviar nova imagem';
            default:
                return 'SmartStage | Enviar nova imagem';
        }
    };

    const actionScript = (act) => {
        console.log('🚀 ACTION SCRIPT CALLED:', act);
        console.log('🚀 currentForm na actionScript:', JSON.stringify(currentForm, null, 2));
        console.log('🚀 handleSubmit function na actionScript:', typeof handleSubmit);
        
        setOpenDialogBox(false);
        setIsOpen(false);
        setAction("");
        setQuestionDialog("");
        if (act === "Cancelar") {
            return;
        } else if (act === "Ok") {
            console.log('🚀 CHAMANDO handleSubmit() da actionScript');
            handleSubmit()
        }
    }

    const handleOpenDialogBox = () => {
        const msg = imgQty > 1
            ? `O processamento destas ${imgQty} imagens vai consumir ${credits} créditos do seu plano. Deseja continuar?`
            : `O processamento desta imagem vai consumir ${credits} créditos do seu plano. Deseja continuar?`;
        setQuestionDialog(msg);
        setIsOpen(true);
        setOpenDialogBox(true);
        setAction("confirm");
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

    useEffect(() => {
        handleFormChange('imgWorkflow', "SmartStage");
        // SmartStage não altera acabamentos, então definir como "Não"
        handleFormChange('acabamento', "Não");
    }, [formIndex]) // Executa sempre que muda de formulário

    useEffect(() => {
        if (codigoInterno) {
            handleFormChange('codigo', codigoInterno);
        }
        if (linkPaginaImovel) {
            handleFormChange('propertyUrl', linkPaginaImovel);
        }
        // eslint-disable-next-line
    }, [codigoInterno, linkPaginaImovel, formIndex]);

    const TIPOS = [
        'Sala de estar/jantar',
        'Quarto',
        'Quarto infantil',
        'Home Office',
        'Área externa'
    ];

    const RETIRAR = ['Sim', 'Não'];

    // Função para verificar se um formulário está preenchido
    const isFormComplete = (form) => {
        console.log('🔍 isFormComplete - form:', JSON.stringify(form, null, 2));
        console.log('🔍 isFormComplete - table:', table);
        console.log('🔍 isFormComplete - openedFrom:', openedFrom);
        
        if (table === "Image suggestions" || openedFrom === 'suggestions-feed') {
            // Para ROTA 3: SUGGESTIONFEED e ROTA 1: FEED DE SUGESTÕES, não exigir campo 'tipo'
            const isComplete = form.retirar;
            console.log('🔍 isFormComplete - ROTA 3/1 - form.retirar:', form.retirar, '- isComplete:', isComplete);
            return isComplete;
        } else {
            // Para ROTA 2: IMAGESELECTOR, exigir ambos os campos
            const isComplete = form.tipo && form.retirar;
            console.log('🔍 isFormComplete - ROTA 2 - form.tipo:', form.tipo, '- form.retirar:', form.retirar, '- isComplete:', isComplete);
            return isComplete;
        }
    };

    return (
        <div className={styles.modalContentGrid}>
            <div className={styles.leftCol}>
                <div className={styles.formImageBoxGrid}>
                    <img src={mainDisplayImage} alt={`Selecionada ${formIndex + 1}`} className={styles.formImageGrid} />
                </div>
                <h4 className={styles.title}>
                    {isSuggestionFeed 
                        ? `${displayImages.length} imagem${displayImages.length > 1 ? 's' : ''} selecionada${displayImages.length > 1 ? 's' : ''}`
                        : `Imagem ${formIndex + 1} de ${forms.length}`
                    }
                </h4>
                
                {/* THUMBNAILS - VERSÃO ROBUSTA */}
                {(() => {
                    // Usar as imagens já detectadas na lógica principal
                    let imagesToShow = displayImages;
                    let activeIndex = 0;

                    if (table === "Image suggestions") {
                        // ROTA 3: SUGGESTIONFEED - currentImageIndex controla qual imagem está ativa
                        activeIndex = currentImageIndex || 0;
                    } else if (isSuggestionFeed) {
                        // ROTA 1: IMOBPROPERTY -> FEED DE SUGESTÕES - currentImageIndex controla qual imagem está ativa
                        activeIndex = currentImageIndex || 0;
                    } else {
                        // ROTA 2: IMOBPROPERTY -> IMAGESELECTOR - formIndex controla qual formulário está ativo
                        imagesToShow = forms.map(form => form.imgUrl).filter(Boolean);
                        activeIndex = formIndex || 0;
                    }

                    // Mostrar thumbnails se tiver mais de 1 imagem
                    if (imagesToShow.length > 1) {
                        return (
                            <div className={styles.thumbnailsContainer}>
                                <h6 className={styles.thumbnailsTitle}>Imagens selecionadas:</h6>
                                <div className={styles.thumbnailsGrid}>
                                    {imagesToShow.map((imgUrl, index) => (
                                        <div
                                            key={`thumb-${index}`}
                                            className={`${styles.thumbnailBox} ${
                                                index === activeIndex ? styles.thumbnailActive : ''
                                            }`}
                                            onClick={() => {
                                                if (isSuggestionFeed || onNavigateToImage) {
                                                    // Navegação direta para suggestion feed OU quando onNavigateToImage está disponível
                                                    onNavigateToImage && onNavigateToImage(index);
                                                } else {
                                                    // Para rota normal sem onNavigateToImage, navegar usando handlePrev/handleNext
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
                                                className={styles.thumbnailImage}
                                            />
                                            <button
                                                type="button"
                                                className={styles.removeThumbnailBtn}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isSuggestionFeed || onRemoveImage) {
                                                        // Remoção para suggestion feed OU quando onRemoveImage está disponível
                                                        onRemoveImage && onRemoveImage(index);
                                                    } else {
                                                        // Para rota normal sem onRemoveImage
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
            <div className={styles.divider} />
            <div className={styles.rightCol} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <h2 className={styles.formTitle}>{getFormTitle()}</h2>
                <h6 className={styles.formSubtitle}>
                    Preencha o formulário para enviar nova imagem para processamento. Quanto melhor a qualidade da imagem enviada, melhor o resultado final ;)
                </h6>
                <form className={styles.formAreaGrid} onSubmit={e => e.preventDefault()}>
                    {/* Campo Tipo de ambiente - mostrar apenas na ROTA 2: IMOBPROPERTY -> IMAGESELECTOR */}
                    {table !== "Image suggestions" && openedFrom !== 'suggestions-feed' && (
                        <div className="mb-3">
                            <label className="form-label d-flex text-start fw-bold">
                                Tipo de ambiente*
                            </label>
                            <select
                                className={`form-select ${styles.formSelect}`}
                                value={currentForm.tipo}
                                onChange={e => handleFormChange('tipo', e.target.value)}
                                required
                            >
                                <option value="">Selecione...</option>
                                {TIPOS.map((tipo) => (
                                    <option key={tipo} value={tipo}>{tipo}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="mb-3">
                        <label className="form-label d-flex text-start fw-bold">
                            Retirar mobiliário/decoração existentes (Pode acarretar custo adicional, consulte o seu plano)?*
                        </label>
                        <select
                            className={`form-select ${styles.formSelect}`}
                            value={currentForm.retirar}
                            onChange={e => handleFormChange('retirar', e.target.value)}
                            required
                        >
                            <option value="">Selecione...</option>
                            {RETIRAR.map((ret) => (
                                <option key={ret} value={ret}>{ret}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Campo Destaques - apenas para SuggestionFeed E não aberto do feed de sugestões */}
                    {table === "Image suggestions" && openedFrom !== 'suggestions-feed' && (
                        <div className="mb-3">
                            <label className="form-label d-flex text-start fw-bold">
                                Destaques do imóvel (múltipla seleção)
                            </label>
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
                                {[
                                    'Adição recente',
                                    'Alto padrão',
                                    'Localização de destaque',
                                    'Precisa de reforma',
                                    'Mobiliário desvalorizado',
                                    'Alto potencial para ambientação'
                                ].map((destaque) => (
                                    <option key={destaque} value={destaque}>{destaque}</option>
                                ))}
                            </select>
                            <small className="form-text text-muted">
                                Segure Ctrl (Windows) ou Cmd (Mac) para selecionar múltiplas opções
                            </small>
                        </div>
                    )}
                    
                    <div className="mb-3">
                        <label className="form-label d-flex text-start fw-bold">
                            Código interno no imóvel na sua imobiliária
                        </label>
                        <input
                            type="text"
                            className={`form-control ${styles.formSelect}`}
                            value={codigoInterno}
                            readOnly
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label d-flex text-start fw-bold">
                            Link da página do imóvel
                        </label>
                        <input
                            type="text"
                            className={`form-control ${styles.formSelect}`}
                            value={linkPaginaImovel}
                            readOnly
                        />
                    </div>
                    <div>
                        <h6 className='d-flex text-start'>
                            * Campos obrigatórios
                        </h6>
                    </div>
                    <div className={styles.formNavGrid} style={{ marginTop: '2.2rem', padding: '0 1.2rem 1.2rem 1.2rem' }}>
                        {/* Para rota 3 (table === "Image suggestions"), pular modal e ir direto para handleSubmit */}
                        {table === "Image suggestions" ? (
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
                                onClick={() => {
                                    // Versão final - dados corretos para backend
                                    const formData = {
                                        ...currentForm,
                                        inputImages: currentForm.imgUrls
                                    };
                                    
                                    handleSubmit(formData);
                                }}
                                disabled={!isFormComplete(currentForm)}
                            >
                                Enviar
                            </button>
                        ) : isSuggestionFeed ? (
                            /* Para rota 1 (openedFrom === 'suggestions-feed'), mostrar modal normalmente */
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
                                        onClick={(e) => {
                                            console.log('🔍 BUTTON CLICK DEBUG:');
                                            console.log('🔍 forms.some(f => !isFormComplete(f)):', forms.some(f => !isFormComplete(f)));
                                            console.log('🔍 button disabled:', forms.some(f => !isFormComplete(f)));
                                            
                                            if (forms.some(f => !isFormComplete(f))) {
                                                console.log('❌ Button is disabled - preventing click');
                                                e.preventDefault();
                                                return;
                                            }
                                            
                                            handleOpenDialogBox(e);
                                        }}
                                        disabled={forms.some(f => !isFormComplete(f))}
                                    >
                                        Enviar
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </form>
            </div>
            {action && questionDialog &&
                <MsgModal
                    show={openDialogBox}
                    onClose={actionScript}>
                    <DialogBox
                        action={action}
                        actionScript={actionScript}
                        questionDialog={questionDialog}

                    />
                </ MsgModal>
            }

        </div>
    );
};

export default SmartStageForm;