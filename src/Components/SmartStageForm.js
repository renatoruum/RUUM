import React, { useEffect } from 'react';
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

    const TIPOS = [
        'Sala de estar + jantar',
        'Quarto',
        'Quarto infantil',
        'Home office',
        'Área externa'
    ];

    const RETIRAR = ['Sim', 'Não'];

    return (
        <div className={styles.selectorWrapper}>
            <h2>Smart Stage | Enviar nova imagem</h2>
            <h6>Preencha o formulário para enviar nova imagem para processamento. Marcas d'água na imagem enviada pode resultar em alucinações pela RUUM AI. Quanto melhor a qualidade da imagem enviada, melhor o resultado final ;)</h6>
            <h4 className={`mt-5 ${styles.title}`}>Imagem {formIndex + 1} de {forms.length}</h4>
            <div className={styles.formImageBox}>
                <img src={currentForm.imgUrl} alt={`Selecionada ${formIndex + 1}`} className={styles.formImage} />
            </div>
            <form className={styles.formArea} onSubmit={e => e.preventDefault()}>

                <div className="mb-3">
                    <label className="form-label text-start" style={{ display: 'block', textAlign: 'left' }}>Tipo de ambiente</label>
                    <select
                        className="form-select"
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
                    <label className="form-label text-start" style={{ display: 'block', textAlign: 'left' }}>
                        Retirar mobiliário/decoração existentes (Pode acarretar custo adicional, consulte o seu plano.)?
                    </label>
                    <select
                        className="form-select"
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

                {/* Campo: Código interno no imóvel */}
                <div className="mb-3">
                    <label className="form-label text-start" style={{ display: 'block', textAlign: 'left' }}>
                        Código interno no imóvel na sua imobiliária
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        value={codigoInterno}
                        readOnly
                    />
                </div>

                {/* Campo: Link da página do imóvel */}
                <div className="mb-3">
                    <label className="form-label text-start" style={{ display: 'block', textAlign: 'left' }}>
                        Link da página do imóvel
                    </label>
                    <input
                        type="text"
                        className="form-control"
                        value={linkPaginaImovel}
                        readOnly
                    />
                </div>

                <div className={styles.formNav}>
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
                            className="btn btn-success"
                            onClick={handleSubmit}
                            disabled={forms.some(f =>
                               !f.tipo || !f.retirar
                            )}
                        >
                            Enviar pedido
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default SmartStageForm;