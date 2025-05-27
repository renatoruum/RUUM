import { useState, useEffect } from 'react';
import styles from './ImageSelector.module.css';
import SmartStageForm from './SmartStageForm';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const ImageSelector = ({ property, closeImageSelector }) => {

  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [step, setStep] = useState('select');
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
        originalIndex: images.indexOf(imgUrl),
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
    fetch("https://9304-177-92-71-250.ngrok-free.app/api/update-images-airtable", {
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
      <SmartStageForm
        currentForm={currentForm}
        formIndex={formIndex}
        forms={forms}
        handleFormChange={handleFormChange}
        handlePrev={handlePrev}
        handleNext={handleNext}
        handleSubmit={handleSubmit}
        selectedIndexes={forms.map(f => f.originalIndex)}
        property={property}
      />
    </div>
  );
};

export default ImageSelector;