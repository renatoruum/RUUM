import { useState, useEffect } from 'react';
import { useClientPlan } from '../Contexts/ClientPlanProvider';
import CustomModal from './CustomModal';
import SmartStageForm from './SmartStageForm';
import AtelierForm from './AtelierForm';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import styles from './ImageSelector.module.css';
import Confetti from 'react-confetti';

const ImageSelector = ({ property, closeImageSelector }) => {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [step, setStep] = useState('select');
  const [formIndex, setFormIndex] = useState(0);
  const [forms, setForms] = useState([]);
  const [zoomImg, setZoomImg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const { clientPlan } = useClientPlan();

  const closeFormModal = () => setShowFormModal(false);

  const backToSelector = () => {
    setStep('select');
    setShowFormModal(false);
  };

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
    setShowFormModal(true);
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
    setSaving(true);
    fetch("https://3583-189-102-4-201.ngrok-free.app/api/update-images-airtable", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(forms)
    })
      .then(res => res.json())
      .then(data => {
        setSaving(false);
        if (data) {
          setShowConfetti(true);
          setTimeout(() => {
            setShowConfetti(false);
            closeImageSelector();
          }, 4000); // Mostra o confete por 2.2 segundos
        } else {
          alert('Erro ao enviar formulários. Tente novamente.');
        }
      })
      .catch(err => {
        setSaving(false);
        console.error(err);
        alert('Erro ao enviar formulários. Tente novamente.');
      });
  };

  // Overlay para spinner e confete
  const Overlay = ({ children }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(255,255,255,0.7)', // opacidade aumentada para 70%
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {children}
    </div>
  );

  // Renderização principal
  const currentForm = forms[formIndex];

  return (
    <>
      {/* Conteúdo normal da tela */}
      {step === 'select' && (
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
            type="button"
            className="btn mt-5"
            style={{
                backgroundColor: '#68bf6c',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: '1.1em',
                padding: '0.7em 2.2em',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(104,191,108,0.10)'
            }}
            onClick={handleConfirmSelection}
            disabled={selectedImages.length === 0}
          >
            Confirmar seleção ({selectedImages.length})
          </button>
        </div>
      )}

      {showConfetti && (
        <Overlay>
          <>
            <Confetti numberOfPieces={250} recycle={false} colors={["#68bf6c", "#b6e7c9", "#3a7d44", "#e6eaf0"]} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: '#fff',
              fontWeight: 'bold',
              fontSize: 28,
              textAlign: 'center',
              background: '#68bf6c', // verde principal do sistema
              borderRadius: 18,
              padding: '2.5rem 3.5rem',
              boxShadow: '0 4px 32px 0 rgba(44,62,80,0.18), 0 0 0 6px #fff4',
              border: '2px solid #fff',
              zIndex: 10000
            }}>
              Imagens salvas com sucesso!
            </div>
          </>
        </Overlay>
      )}
      {saving && (
        <Overlay>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 300,
            background: '#68bf6c', // verde principal do sistema
            borderRadius: 18,
            boxShadow: '0 4px 32px 0 rgba(44,62,80,0.18), 0 0 0 6px #fff4',
            border: '2px solid #fff',
            padding: '2.5rem 3.5rem',
            zIndex: 10000
          }}>
            <div style={{
              border: '6px solid #e6eaf0',
              borderTop: '6px solid #fff',
              borderRadius: '50%',
              width: '56px',
              height: '56px',
              animation: 'spin 1s linear infinite',
              margin: '2rem auto',
              background: 'transparent',
              boxShadow: '0 0 16px 2px #fff8'
            }} />
            <div style={{ marginTop: '.5rem', textAlign: 'center', color: '#fff', fontWeight: 'bold', textShadow: '0 2px 8px #000a' }}>
              Salvando imagens
            </div>
            <style>
              {`
              @keyframes spin {
                0% { transform: rotate(0deg);}
                100% { transform: rotate(360deg);}
              }
            `}
            </style>
          </div>
        </Overlay>
      )}

      {step !== 'select' && (
        <CustomModal show={showFormModal} onClose={backToSelector}>
          {clientPlan === "Imob"
            ? <SmartStageForm
                currentForm={currentForm}
                formIndex={formIndex}
                forms={forms}
                handleFormChange={handleFormChange}
                handlePrev={handlePrev}
                handleNext={handleNext}
                selectedIndexes={forms.map(f => f.originalIndex)}
                property={property}
                handleSubmit={handleSubmit}
              />
            : <AtelierForm
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
          }
        </CustomModal>
      )}
    </>
  );
};

export default ImageSelector;