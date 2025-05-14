import { useState, useEffect } from 'react';
import styles from './ImageSelector.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

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
  'Sala de jantar',
  'Quarto',
  'Sala de jantar + cozinha',
  'Cozinha',
  'Varanda',
  'Lavanderia',
  'Banheiro',
  'Escritório'
];

const ACABAMENTOS = [
  'SIM',
  'NÃO'
];

const RETIRAR = [
  'SIM',
  'NÃO'
];

const ImageSelector = ({ property, closeImageSelector }) => {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [step, setStep] = useState('select'); // 'select' | 'form'
  const [formIndex, setFormIndex] = useState(0);
  const [forms, setForms] = useState([]);
  const [zoomImg, setZoomImg] = useState(null);

  useEffect(() => {
    if (property && property.fields && property.fields.Fotos_URLs) {
      const imgs = property.fields.Fotos_URLs.split('\n').filter(Boolean);
      setImages(imgs);
      setSelectedImages([]);
      setStep('select');
      setFormIndex(0);
      setForms([]);
    }
  }, [property]);

  const toggleSelect = (imgUrl) => {
    setSelectedImages((prev) =>
      prev.includes(imgUrl)
        ? prev.filter((url) => url !== imgUrl)
        : [...prev, imgUrl]
    );
  };

  const handleConfirmSelection = () => {
    setForms(
      selectedImages.map((imgUrl) => ({
        imgUrl,
        estilo: '',
        tipo: '',
        acabamento: '',
        retirar: ''
      }))
    );
    setStep('form');
    setFormIndex(0);
  };

  const handleFormChange = (field, value) => {
    setForms((prev) =>
      prev.map((form, idx) =>
        idx === formIndex ? { ...form, [field]: value } : form
      )
    );
  };

  const handleNext = () => {
    if (formIndex < forms.length - 1) setFormIndex(formIndex + 1);
  };

  const handlePrev = () => {
    if (formIndex > 0) setFormIndex(formIndex - 1);
  };

  const handleSubmit = () => {
    // Aqui você pode enviar forms para onde precisar
    alert('Formulários enviados com sucesso!');
    console.log("forms: ", forms);
    closeImageSelector();
  };

  if (step === 'select') {
    return (
      <div className={styles.selectorWrapper}>
        <button
          type="button"
          className={`btn-close ${styles.closeBtn}`}
          aria-label="Close"
          onClick={closeImageSelector}
        ></button>
        <h4 className={styles.title}>Selecione as imagens para Virtual Staging</h4>
        <div className={styles.imagesGrid}>
          {images.map((imgUrl, idx) => (
            <div
              key={imgUrl}
              className={`${styles.imageBox} ${selectedImages.includes(imgUrl) ? styles.selected : ''}`}
              onClick={() => toggleSelect(imgUrl)}
              tabIndex={0}
              role="button"
              aria-pressed={selectedImages.includes(imgUrl)}
            >
              <img src={imgUrl} alt={`Foto ${idx + 1}`} className={styles.image} />
              <button
                type="button"
                className={styles.zoomBtn}
                tabIndex={-1}
                onClick={e => {
                  e.stopPropagation();
                  setZoomImg(imgUrl);
                }}
                aria-label="Ampliar imagem"
              >
                <svg width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <circle cx="7" cy="7" r="6" stroke="#007bff" strokeWidth="2" fill="none" />
                  <line x1="11" y1="11" x2="15" y2="15" stroke="#007bff" strokeWidth="2" />
                </svg>
              </button>
              {selectedImages.includes(imgUrl) && (
                <div className={styles.checkOverlay}>
                  <span className="bi bi-check-circle-fill"></span>
                </div>
              )}
            </div>
          ))}
        </div>
        {/* Modal de zoom */}
        {zoomImg && (
          <div className={styles.zoomModal} onClick={() => setZoomImg(null)}>
            <img src={zoomImg} alt="Zoom" className={styles.zoomImg} />
            <button
              type="button"
              className={styles.closeZoom}
              aria-label="Fechar"
              onClick={e => {
                e.stopPropagation();
                setZoomImg(null);
              }}
            >
              &times;
            </button>
          </div>
        )}
        <button
          className="btn btn-primary mt-3 w-100"
          disabled={selectedImages.length === 0}
          onClick={handleConfirmSelection}
        >
          Confirmar seleção ({selectedImages.length})
        </button>
      </div>
    );
  }

  const currentForm = forms[formIndex];

  return (
    <div className={styles.selectorWrapper}>
      <button
        type="button"
        className={`btn-close ${styles.closeBtn}`}
        aria-label="Close"
        onClick={closeImageSelector}
      ></button>
      <h4 className={styles.title}>Configuração da Imagem {formIndex + 1} de {forms.length}</h4>
      <div className={styles.formImageBox}>
        <img src={currentForm.imgUrl} alt={`Selecionada ${formIndex + 1}`} className={styles.formImage} />
      </div>
      <form className={styles.formArea} onSubmit={e => e.preventDefault()}>
        <div className="mb-3">
          <label className="form-label">Estilo de ambientação</label>
          <select
            className="form-select"
            value={currentForm.estilo}
            onChange={e => handleFormChange('estilo', e.target.value)}
            required
          >
            <option value="">Selecione...</option>
            {ESTILOS.map((estilo) => (
              <option key={estilo} value={estilo}>{estilo}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Tipo de ambiente</label>
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
          <label className="form-label">Colocar/alterar acabamentos?</label>
          <select
            className="form-select"
            value={currentForm.acabamento}
            onChange={e => handleFormChange('acabamento', e.target.value)}
            required
          >
            <option value="">Selecione...</option>
            {ACABAMENTOS.map((acab) => (
              <option key={acab} value={acab}>{acab}</option>
            ))}
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Retirar mobiliário/decoração?</label>
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
};

export default ImageSelector