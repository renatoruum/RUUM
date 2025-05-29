import React, { useEffect } from 'react';
import styles from './ImageSelector.module.css';

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

    return (
        <div className={styles.selectorWrapper}>
            <h2>RUUM Atelier | Enviar nova imagem</h2>
            <h6>Suba imagens na melhor qualidade possível. É preferível sem marca d'água.</h6>
            <h4 className={`mt-5 ${styles.title}`}>Imagem {formIndex + 1} de {forms.length}</h4>
            <div className={styles.formImageBox}>
                <img src={currentForm.imgUrl} alt={`Selecionada ${formIndex + 1}`} className={styles.formImage} />
            </div>
            <form className={styles.formArea} onSubmit={e => e.preventDefault()}>
                <div className="mb-3">
                    <label className="form-label" style={{ display: 'block', textAlign: 'left' }}>Estilo de ambientação</label>
                    <select
                        className="form-select"
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
                <div className="mb-3">
                    <label className="form-label" style={{ display: 'block', textAlign: 'left' }}>Tipo de ambiente</label>
                    <select
                        className="form-select"
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
                <div className="mb-3">
                    <label className="form-label" style={{ display: 'block', textAlign: 'left' }}>RUUM Project - Colocar/alterar acabeneto (Pode acarretar custo adicional. Consulte seu plano).*</label>
                    <select
                        className="form-select"
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
                <div className="mb-3">
                    <label className="form-label" style={{ display: 'block', textAlign: 'left' }}>RUUM ReStyle - Retirar mobiliário/decoração existente (Pode acarretar custo adicional. Consulte seu plano).*</label>
                    <select
                        className="form-select"
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
                <div className="mb-3">
                    <label className="form-label" style={{ display: 'block', textAlign: 'left' }}>Requisições de clientes</label>
                    <textarea
                        className="form-control"
                        value={currentForm.observacoes}
                        onChange={e => handleFormChange('observacoes', e.target.value)}
                        rows={3}
                        placeholder="Se desejar, indique aqui requisiç!oes pontuais para esta ambientação. De instruções gerais a solicitações específicas."
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label" style={{ display: 'block', textAlign: 'left' }}>Imagens de referência</label>
                    <input
                        type="text"
                        className="form-control"
                        value={currentForm.imagensReferencia || ''}
                        onChange={e => handleFormChange('imagensReferencia', e.target.value)}
                        placeholder="Links ou descrições das imagens de referência"
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label" style={{ display: 'block', textAlign: 'left' }}>Modelo de vídeo</label>
                    <select
                        className="form-select"
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
                <div className="mb-3">
                    <label className="form-label" style={{ display: 'block', textAlign: 'left' }}>Formato/proporção do vídeo</label>
                    <select
                        className="form-select"
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
                                !currentForm.estilo ||
                                !currentForm.tipo ||
                                !currentForm.acabamento ||
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
                                !f.estilo || !f.tipo || !f.acabamento || !f.retirar
                            )}
                        >
                            Enviar
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default AtelierForm