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
        retirar: '',
        observacoes: ''
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
    console.log("forms ", forms);
    fetch("https://cfd4-2804-14c-125-846e-1c99-4381-16c7-7569.ngrok-free.app/api/update-images-airtable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forms)
    })
      .then(res => res.json())
      .then(data => {
        if (data) {
          alert('Formulários enviados com sucesso!');
          closeImageSelector();
        } else {
          alert('Erro ao enviar formulários. Tente novamente.');
        }
      })
      .catch(err => {
        console.error(err);
        alert('Erro ao enviar formulários. Tente novamente.');
      });
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
          {images.map((imgUrl, idx) => {
            const selected = selectedImages.includes(imgUrl);
            return (
              <div
                key={imgUrl}
                className={`${styles.imageBox} ${selected ? styles.selected : ''}`}
                tabIndex={0}
                role="group"
                aria-pressed={selected}
              >
                <img
                  src={imgUrl}
                  alt={`Foto ${idx + 1}`}
                  className={styles.image}
                  onClick={e => {
                    e.stopPropagation();
                    setZoomImg(imgUrl);
                  }}
                  style={{ cursor: 'zoom-in' }}
                />
                {/* Checkbox visual */}
                <button
                  type="button"
                  className={styles.checkBtn}
                  aria-label={selected ? "Desmarcar imagem" : "Selecionar imagem"}
                  onClick={e => {
                    e.stopPropagation();
                    toggleSelect(imgUrl);
                  }}
                >
                  {selected ? (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="14" cy="14" r="13" fill="#68bf6c" stroke="#fff" strokeWidth="2" />
                      <polyline points="9,15 13,19 19,11" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                      <circle cx="14" cy="14" r="13" fill="#fff" stroke="#68bf6c" strokeWidth="2" />
                    </svg>
                  )}
                </button>
                {/* Removido o botão de zoom */}
              </div>
            );
          })}
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
        <div className="mb-3">
          <label className="form-label">Observações</label>
          <textarea
            className="form-control"
            value={currentForm.observacoes}
            onChange={e => handleFormChange('observacoes', e.target.value)}
            rows={3}
            placeholder="Digite observações adicionais (opcional)"
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
};

export default ImageSelector