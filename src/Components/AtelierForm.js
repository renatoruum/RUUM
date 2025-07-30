import React, { useEffect, useState } from 'react';
import styles from './AtelierForm.module.css';
import formstyles from './ImageSelector.module.css';
import MsgModal from './MsgModal';
import DialogBox from './DialogBox';

const AtelierForm = ({
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
    selectedModel, // Nova prop para determinar o título
    estilosamb, // Nova prop com os estilos de ambientação
    table // Prop para identificar se é SuggestionFeed
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

    // Para SuggestionFeed, temos múltiplas imagens no currentForm.imgUrls
    const isSuggestionFeed = table === "Image suggestions";
    const displayImages = isSuggestionFeed ? currentForm?.imgUrls || [] : [currentForm?.imgUrl];
    const mainDisplayImage = isSuggestionFeed ? displayImages[0] : currentForm?.imgUrl;

    // Recupera o código interno do imóvel (property.fields.Codigo pode ser string ou array)
    let codigoInterno = '';
    if (property && property.fields && property.fields.Codigo) {
        if (Array.isArray(property.fields.Codigo)) {
            codigoInterno = property.fields.Codigo[selectedIndex] || property.fields.Codigo[0] || '';
        } else {
            codigoInterno = property.fields.Codigo;
        }
    }

    // Recupera o link da página do imóvel (property.fields['Fotos_URLs'] deve ser array)
    let linkPaginaImovel = '';
    if (property && property.fields && property.fields['Fotos_URLs']) {
        const fotosUrls = Array.isArray(property.fields['Fotos_URLs'])
            ? property.fields['Fotos_URLs']
            : property.fields['Fotos_URLs'].split('\n').filter(Boolean);
        linkPaginaImovel = fotosUrls[selectedIndex] || '';
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

                    {/* Thumbnails das imagens selecionadas - Para SuggestionFeed, mostrar todas as imagens */}
                    {isSuggestionFeed && displayImages.length > 1 ? (
                        <div className={formstyles.thumbnailsContainer}>
                            <h6 className={formstyles.thumbnailsTitle}>Todas as imagens selecionadas:</h6>
                            <div className={formstyles.thumbnailsGrid}>
                                {displayImages.map((imgUrl, idx) => (
                                    <div key={idx} className={formstyles.thumbnailBox}>
                                        <img
                                            src={imgUrl}
                                            alt={`Imagem ${idx + 1}`}
                                            className={formstyles.thumbnailImage}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Thumbnails originais para outras rotas */
                        forms.length > 1 && !isSuggestionFeed && (
                            <div className={formstyles.thumbnailsContainer}>
                                <h6 className={formstyles.thumbnailsTitle}>Imagens selecionadas:</h6>
                                <div className={formstyles.thumbnailsGrid}>
                                    {forms.map((form, idx) => (
                                        <div
                                            key={idx}
                                            className={`${formstyles.thumbnailBox} ${idx === formIndex ? formstyles.thumbnailActive : ''}`}
                                            onClick={() => {
                                                if (idx !== formIndex && onNavigateToImage) {
                                                    onNavigateToImage(idx);
                                                }
                                            }}
                                        >
                                            <img
                                                src={form.imgUrl}
                                                alt={`Thumbnail ${idx + 1}`}
                                                className={formstyles.thumbnailImage}
                                            />
                                            <button
                                                type="button"
                                                className={formstyles.removeThumbnailBtn}
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
                                                    <line x1="13.5" y1="4.5" x2="4.5" y2="13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                                    <line x1="4.5" y1="4.5" x2="13.5" y2="13.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                                </svg>
                                            </button>
                                            {isFormComplete(form) && (
                                                <div className={formstyles.thumbnailActiveIndicator}>
                                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                                        <circle cx="10" cy="10" r="9" fill="#68bf6c" stroke="#fff" strokeWidth="2" />
                                                        <polyline points="6,10 9,13 14,7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
                        {selectedModel === "atelier"
                            &&
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
                            </div>}
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
                        
                        {/* Campo Destaques - apenas para SuggestionFeed */}
                        {table === "Image suggestions" && (
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