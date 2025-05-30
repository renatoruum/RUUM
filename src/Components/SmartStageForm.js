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
    property
}) => {
    const [openDialogBox, setOpenDialogBox] = useState(false);
    const [action, setAction] = useState('');
    const [questionDialog, setQuestionDialog] = useState('');
    const [isopen, setIsOpen] = useState(false);

    const imgQty = forms.length;
    const credits = imgQty * 100;
    const selectedIndex = selectedIndexes[formIndex];

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
        if (codigoInterno) {
            handleFormChange('codigo', codigoInterno);
        }
        if (linkPaginaImovel) {
            handleFormChange('propertyUrl', linkPaginaImovel);
        }
        // eslint-disable-next-line
    }, [codigoInterno, linkPaginaImovel, formIndex]);

    const TIPOS = [
        'Sala de estar + jantar',
        'Quarto',
        'Quarto infantil',
        'Home office',
        'Área externa'
    ];

    const RETIRAR = ['Sim', 'Não'];

    const handleEnviarClick = () => {
        handleSubmit(); // chamada direta
    };

    return (
        <div className={styles.modalContentGrid}>
            <div className={styles.leftCol}>
                <h4 className={styles.title}>Imagem {formIndex + 1} de {forms.length}</h4>
                <div className={styles.formImageBoxGrid}>
                    <img src={currentForm.imgUrl} alt={`Selecionada ${formIndex + 1}`} className={styles.formImageGrid} />
                </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.rightCol}>
                <h2 className={styles.formTitle}>Smart Stage | Enviar nova imagem</h2>
                <h6 className={styles.formSubtitle}>
                    Preencha o formulário para enviar nova imagem para processamento. Marcas d'água na imagem enviada pode resultar em alucinações pela RUUM AI. Quanto melhor a qualidade da imagem enviada, melhor o resultado final ;)
                </h6>
                <form className={styles.formAreaGrid} onSubmit={e => e.preventDefault()}>
                    <div className="mb-3">
                        <label className="form-label d-flex text-start fw-bold">
                            Tipo de ambiente
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
                    <div className="mb-3">
                        <label className="form-label d-flex text-start fw-bold">
                            Retirar mobiliário/decoração existentes (Pode acarretar custo adicional, consulte o seu plano.)?
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
                    <div className={styles.formNavGrid}>
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={handlePrev}
                            disabled={formIndex === 0}
                        >
                            Anterior
                        </button>
                        {formIndex < forms.length - 1 ? (
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleNext}
                                disabled={
                                    !currentForm.tipo ||
                                    !currentForm.retirar
                                }
                            >
                                Próxima
                            </button>
                        ) : (
                            <button
                                type="button"
                                className={`btn btn-success ${styles.submitButton}`}
                                onClick={handleOpenDialogBox}
                                disabled={forms.some(f =>
                                    !f.tipo || !f.retirar
                                )}
                            >

                                Enviar
                            </button>
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