//Reeact
import { useEffect, useState } from 'react';
//Components
import MsgModal from './MsgModal';
import DialogBox from './DialogBox';
//Styles
import styles from './ImageSelector.module.css';

const SmartStageForm = ({
    currentForm,
    formIndex,
    forms,
    handleFormChange,
    handlePrev,
    handleNext,
    handleSubmit,
    selectedIndexes,
    property,
    onNavigateToImage,
    onRemoveImage,
    selectedModel,
    table // Prop para identificar se é SuggestionFeed
}) => {
    const [openDialogBox, setOpenDialogBox] = useState(false);
    const [action, setAction] = useState('');
    const [questionDialog, setQuestionDialog] = useState('');
    const [isopen, setIsOpen] = useState(false);

    const imgQty = forms.length;
    const credits = imgQty * 100;
    const selectedIndex = selectedIndexes[formIndex];
    
    // Para SuggestionFeed, temos múltiplas imagens no currentForm.imgUrls
    const isSuggestionFeed = table === "Image suggestions";
    const displayImages = isSuggestionFeed ? currentForm?.imgUrls || [] : [currentForm?.imgUrl];
    const mainDisplayImage = isSuggestionFeed ? displayImages[0] : currentForm?.imgUrl;

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
        setOpenDialogBox(false);
        setIsOpen(false);
        setAction("");
        setQuestionDialog("");
        console.log("Action script called with action:", act);
        if (act === "Cancelar") {
            return;
        } else if (act === "Ok") {
            handleSubmit()
        }
    }

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
        setIsOpen(true);
        setOpenDialogBox(true);
        setAction("confirm");
    }

    let codigoInterno = '';
    if (property && property.fields && property.fields.Codigo) {
        if (Array.isArray(property.fields.Codigo)) {
            codigoInterno = property.fields.Codigo[selectedIndex] || property.fields.Codigo[0] || '';
        } else {
            codigoInterno = property.fields.Codigo;
        }
    }

    let linkPaginaImovel = '';
    if (property && property.fields && property.fields['Fotos_URLs']) {
        const fotosUrls = Array.isArray(property.fields['Fotos_URLs'])
            ? property.fields['Fotos_URLs']
            : property.fields['Fotos_URLs'].split('\n').filter(Boolean);
        linkPaginaImovel = fotosUrls[selectedIndex] || '';
    }

    useEffect(() => {
        handleFormChange('imgWorkflow', "SmartStage");
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

    const handleEnviarClick = () => {
        handleSubmit();
    };

    // Função para verificar se um formulário está preenchido
    const isFormComplete = (form) => {
        if (table === "Image suggestions") {
            // Para SuggestionFeed, não exigir campo 'tipo'
            return form.retirar;
        } else {
            // Para outras rotas, exigir ambos os campos
            return form.tipo && form.retirar;
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
                
                {/* Thumbnails das imagens selecionadas - Para SuggestionFeed, mostrar todas as imagens */}
                {isSuggestionFeed && displayImages.length > 1 ? (
                    <div className={styles.thumbnailsContainer}>
                        <h6 className={styles.thumbnailsTitle}>Todas as imagens selecionadas:</h6>
                        <div className={styles.thumbnailsGrid}>
                            {displayImages.map((imgUrl, idx) => (
                                <div key={idx} className={styles.thumbnailBox}>
                                    <img
                                        src={imgUrl}
                                        alt={`Imagem ${idx + 1}`}
                                        className={styles.thumbnailImage}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Thumbnails originais para outras rotas */
                    forms.length > 1 && !isSuggestionFeed && (
                        <div className={styles.thumbnailsContainer}>
                            <h6 className={styles.thumbnailsTitle}>Imagens selecionadas:</h6>
                            <div className={styles.thumbnailsGrid}>
                                {forms.map((form, idx) => (
                                    <div 
                                        key={idx}
                                        className={`${styles.thumbnailBox} ${idx === formIndex ? styles.thumbnailActive : ''}`}
                                        onClick={() => {
                                            if (idx !== formIndex && onNavigateToImage) {
                                                onNavigateToImage(idx);
                                            }
                                        }}
                                    >
                                        <img 
                                            src={form.imgUrl} 
                                            alt={`Thumbnail ${idx + 1}`} 
                                            className={styles.thumbnailImage}
                                        />
                                        <button
                                            type="button"
                                            className={styles.removeThumbnailBtn}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (forms.length > 1) {
                                                    if (onRemoveImage) {
                                                        onRemoveImage(idx);
                                                    }
                                                } else {
                                                    alert('Não é possível remover a última imagem selecionada.');
                                                }
                                            }}
                                            aria-label={`Remover imagem ${idx + 1}`}
                                        >
                                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                                <line x1="13.5" y1="4.5" x2="4.5" y2="13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                                <line x1="4.5" y1="4.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                            </svg>
                                        </button>
                                        {isFormComplete(form) && (
                                            <div className={styles.thumbnailActiveIndicator}>
                                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                    <circle cx="10" cy="10" r="9" fill="#68bf6c" stroke="#fff" strokeWidth="2"/>
                                                    <polyline points="6,10 9,13 14,7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                )}
            </div>
            <div className={styles.divider} />
            <div className={styles.rightCol} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                <h2 className={styles.formTitle}>{getFormTitle()}</h2>
                <h6 className={styles.formSubtitle}>
                    Preencha o formulário para enviar nova imagem para processamento. Quanto melhor a qualidade da imagem enviada, melhor o resultado final ;)
                </h6>
                <form className={styles.formAreaGrid} onSubmit={e => e.preventDefault()}>
                    {/* Campo Tipo de ambiente - esconder apenas para SuggestionFeed */}
                    {table !== "Image suggestions" && (
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
                    
                    {/* Campo Destaques - apenas para SuggestionFeed */}
                    {table === "Image suggestions" && (
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
                                    opacity: !currentForm.retirar ? 0.7 : 1,
                                    width: '100%'
                                }}
                                onClick={handleOpenDialogBox}
                                disabled={!currentForm.retirar}
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
                                            opacity: (!currentForm.tipo || !currentForm.retirar) ? 0.7 : 1,
                                            width: '100%'
                                        }}
                                        onClick={handleNext}
                                        disabled={!currentForm.tipo || !currentForm.retirar}
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
                                            opacity: forms.some(f => !f.tipo || !f.retirar) ? 0.7 : 1,
                                            width: '100%'
                                        }}
                                        onClick={handleOpenDialogBox}
                                        disabled={forms.some(f => !f.tipo || !f.retirar)}
                                    >
                                        Enviar
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </form>
            </div>
            {actionScript && questionDialog &&
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