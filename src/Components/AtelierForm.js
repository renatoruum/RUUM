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
    property
}) => {
    // Recupera o índice da imagem selecionada
    const selectedIndex = selectedIndexes[formIndex];

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
        'Horizontal (Web - Portal de Vendas, Youtube)',
        'Vertical (Social - Stories, Reels e WhatsApp)'
    ]

    // --- SmartStage style/modal logic ---
    const [openDialogBox, setOpenDialogBox] = useState(false);
    const [action, setAction] = useState('');
    const [questionDialog, setQuestionDialog] = useState('');
    const imgQty = forms.length;
    const credits = imgQty * 100;
    const actionScript = (act) => {
        setOpenDialogBox(false);
        setAction("");
        setQuestionDialog("");
        if (act === "Ok") {
            handleSubmit();
        }
    };
    const handleOpenDialogBox = () => {
        const msg = imgQty > 1
            ? `O processamento destas ${imgQty} imagens vai consumir ${credits} créditos do seu plano. Deseja continuar?`
            : `O processamento desta imagem vai consumir ${credits} créditos do seu plano. Deseja continuar?`;
        setQuestionDialog(msg);
        setOpenDialogBox(true);
        setAction("confirm");
    };

    return (
        <div style={{ background: '#fff', borderRadius: 18, width: '100%', height: '100%' }}>
            <div className={styles.modalContentGrid}>
                <div className={styles.leftCol} style={{ position: 'sticky', top: 0, alignSelf: 'flex-start', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 className={styles.title}>Imagem {formIndex + 1} de {forms.length}</h4>
                    <div className={styles.formImageBox}>
                        <img src={currentForm.imgUrl} alt={`Selecionada ${formIndex + 1}`} className={styles.formImage} />
                    </div>
                </div>
                <div className={styles.divider} />
                <div className={styles.rightCol} style={{ maxHeight: '80vh', overflowY: 'auto' }}>
                    <h2 className={styles.formTitle}>RUUM Atelier | Enviar nova imagem</h2>
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
                        <div className="mb-2">
                            <label className="form-label">RUUM Project - Colocar/alterar acabeneto (Pode acarretar custo adicional. Consulte seu plano).*</label>
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
                            <label className="form-label text-start">Link da página do imóvel</label>
                            <input
                                type="text"
                                className={`form-control ${styles.formSelect}`}
                                value={linkPaginaImovel}
                                readOnly
                            />
                        </div>
                        <div className={styles.formNavGrid} style={{ marginTop: '2.2rem', padding: '0 1.2rem 1.2rem 1.2rem' }}>
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
                                        opacity: (!currentForm.estilo || !currentForm.tipo || !currentForm.acabamento || !currentForm.retirar) ? 0.7 : 1,
                                        width: '100%'
                                    }}
                                    onClick={handleNext}
                                    disabled={!currentForm.estilo || !currentForm.tipo || !currentForm.acabamento || !currentForm.retirar}
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
                                        opacity: forms.some(f => !f.estilo || !f.tipo || !f.acabamento || !f.retirar) ? 0.7 : 1,
                                        width: '100%'
                                    }}
                                    onClick={handleOpenDialogBox}
                                    disabled={forms.some(f => !f.estilo || !f.tipo || !f.acabamento || !f.retirar)}
                                >
                                    Enviar
                                </button>
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
        </div>
    );
}

export default AtelierForm