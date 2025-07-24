import { useState, useEffect, useRef } from 'react';
import { useClientPlan } from '../Contexts/ClientPlanProvider';
import CustomModal from './CustomModal';
import ChoosForm from './ChoosForm';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import styles from './ImageSelector.module.css';
import Confetti from 'react-confetti';
import { apiCall } from '../Config/Config';

const ImageSelector = ({ property, client, closeImageSelector, table }) => {
  console.log("Client infos:", client);
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [step, setStep] = useState('select');
  const [formIndex, setFormIndex] = useState(0);
  const [forms, setForms] = useState([]);
  const [zoomImg, setZoomImg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, message: '' });
  const choosFormRef = useRef(null);

  const { clientPlan } = useClientPlan();

  const closeFormModal = () => setShowFormModal(false);

  const backToSelector = () => {
    setStep('select');
    setShowFormModal(false);
  };

  // Função personalizada para o botão X da modal
  const handleModalClose = () => {
    if (choosFormRef.current && choosFormRef.current.isInFormView()) {
      // Se estamos em um formulário, voltar para seleção de modelos
      choosFormRef.current.backToModelSelection();
    } else {
      // Se estamos na seleção de modelos, fechar a modal
      backToSelector();
    }
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
        observacoes: '',
        imagensReferencia: '',
        modeloVideo: '',
        formatoVideo: '',
        imgWorkflow: ''
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

  const handleNavigateToImage = (targetIndex) => {
    if (targetIndex >= 0 && targetIndex < forms.length) {
      setFormIndex(targetIndex);
    }
  };

  const handleRemoveImage = (imageIndex) => {
    if (forms.length <= 1) {
      alert('Não é possível remover a última imagem selecionada.');
      return;
    }

    // Remover a imagem do array de forms
    const newForms = forms.filter((_, index) => index !== imageIndex);
    setForms(newForms);

    // Também remover das imagens selecionadas
    const removedImageUrl = forms[imageIndex].imgUrl;
    setSelectedImages(prev => prev.filter(url => url !== removedImageUrl));

    // Ajustar o formIndex se necessário
    if (imageIndex < formIndex) {
      setFormIndex(formIndex - 1);
    } else if (imageIndex === formIndex && formIndex >= newForms.length) {
      setFormIndex(newForms.length - 1);
    }
  };

  const handleSubmit = async () => {
    console.log('Enviando formulários:', forms);
    console.log('Número de formulários:', forms.length);
    setSaving(true);

    const imagesArray = forms.map((form, index) => {
      console.log(`Processando formulário ${index + 1}:`, form);
      const base = {
        imgUrl: form.imgUrl,
        tipo: form.tipo,         // Room Type
        retirar: form.retirar,   // Decluttering
        codigo: property?.fields?.Codigo || '',  // Client Internal Code
        propertyUrl: property?.fields?.URL_Portal || '', // Property's URL
        observacoes: form.observacoes, // Observations
        estilo: form.estilo,     // Style
        acabamento: form.acabamento, // Finish
        imagensReferencia: form.imagensReferencia, // Reference Images
        modeloVideo: form.modeloVideo, // Video Model
        formatoVideo: form.formatoVideo, // Video Format
        imgWorkflow: form.imgWorkflow
      };
      if (table === "Image suggestions") {
        base.suggestionstatus = "Suggested";
      }
      return base;
    });

    console.log('ImagesArray final:', imagesArray);
    console.log('Quantidade de imagens no array:', imagesArray.length);

    // Objeto para envio ao backend
    const requestData = {
      imagesArray: imagesArray,
      email: client?.Email,
      clientId: client?.ClientId,
      invoiceId: client?.InvoiceId,
      userId: client?.UserId,
      table: table || "Images"
    };

    console.log('Enviando dados para o backend:', requestData);
    console.log('Tamanho do payload:', JSON.stringify(requestData).length, 'bytes');

    try {
      const data = await apiCall("/api/update-images-airtable", {
        method: "POST",
        body: JSON.stringify(requestData)
      });

      console.log('Resposta do backend:', data);
      setSaving(false);
      if (data) {
        setShowConfetti(true);
        setTimeout(() => {
          setShowConfetti(false);
          closeImageSelector();
        }, 4000);
      } else {
        alert('Erro ao enviar formulários. Tente novamente.');
      }
    } catch (err) {
      setSaving(false);
      console.error('Erro detalhado:', err);
      console.error('RequestData que causou o erro:', requestData);
      console.error('Número de imagens no requestData:', requestData.imagesArray.length);

      // Tentar identificar qual imagem pode estar causando o problema
      if (requestData.imagesArray.length > 1) {
        console.log('Tentando enviar uma imagem por vez para identificar o problema...');

        setUploadProgress({ current: 0, total: requestData.imagesArray.length, message: 'Enviando imagens individualmente...' });

        const results = [];
        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < requestData.imagesArray.length; i++) {
          try {
            setUploadProgress({
              current: i + 1,
              total: requestData.imagesArray.length,
              message: `Enviando imagem ${i + 1} de ${requestData.imagesArray.length}...`
            });

            const singleImageData = {
              ...requestData,
              imagesArray: [requestData.imagesArray[i]]
            };

            console.log(`Enviando imagem ${i + 1} de ${requestData.imagesArray.length}:`, singleImageData);

            const singleResult = await apiCall("/api/update-images-airtable", {
              method: "POST",
              body: JSON.stringify(singleImageData)
            });

            console.log(`Imagem ${i + 1} enviada com sucesso:`, singleResult);
            results.push({ index: i, success: true, data: singleResult });
            successCount++;

            // Pequeno delay entre as requisições para evitar sobrecarga
            await new Promise(resolve => setTimeout(resolve, 2000)); // Aumentado para 2 segundos

          } catch (singleErr) {
            console.error(`Erro na imagem ${i + 1}:`, singleErr);
            results.push({ index: i, success: false, error: singleErr.message });
            errorCount++;
          }
        }

        console.log('Resultados do envio individual:', results);

        // Tentar reenviar imagens que falharam
        const failedImages = results.filter(r => !r.success);
        if (failedImages.length > 0 && successCount > 0) {
          console.log(`Tentando reenviar ${failedImages.length} imagem(ns) que falharam...`);

          setUploadProgress({
            current: 0,
            total: failedImages.length,
            message: 'Reenviando imagens que falharam...'
          });

          for (let j = 0; j < failedImages.length; j++) {
            const failed = failedImages[j];
            try {
              setUploadProgress({
                current: j + 1,
                total: failedImages.length,
                message: `Reenviando imagem ${failed.index + 1}... (${j + 1}/${failedImages.length})`
              });

              console.log(`Reenviando imagem ${failed.index + 1}...`);

              const retryImageData = {
                ...requestData,
                imagesArray: [requestData.imagesArray[failed.index]]
              };

              const retryResult = await apiCall("/api/update-images-airtable", {
                method: "POST",
                body: JSON.stringify(retryImageData)
              });

              console.log(`Imagem ${failed.index + 1} reenviada com sucesso:`, retryResult);

              // Atualizar o resultado
              const resultIndex = results.findIndex(r => r.index === failed.index);
              results[resultIndex] = { index: failed.index, success: true, data: retryResult };
              successCount++;
              errorCount--;

              // Delay maior para retry
              await new Promise(resolve => setTimeout(resolve, 3000));

            } catch (retryErr) {
              console.error(`Erro no reenvio da imagem ${failed.index + 1}:`, retryErr);
            }
          }
        }

        setUploadProgress({ current: 0, total: 0, message: '' });

        console.log('Resultados finais após tentativas:', results);

        if (successCount > 0) {
          const message = errorCount === 0
            ? `Todas as ${successCount} imagem(ns) foram salvas com sucesso!`
            : `${successCount} imagem(ns) foram salvas com sucesso. ${errorCount} falharam. Verifique o console para detalhes.`;

          alert(message);

          if (errorCount === 0) {
            // Todas foram salvas com sucesso
            setShowConfetti(true);
            setTimeout(() => {
              setShowConfetti(false);
              closeImageSelector();
            }, 4000);
          }
        } else {
          alert('Nenhuma imagem foi salva com sucesso. Verifique o console para detalhes.');
        }
      } else {
        alert('Erro ao enviar formulários: ' + err.message);
      }
    }
  };

  /*
      fetch("https://59ea-191-205-248-153.ngrok-free.app/api/update-images-airtable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData)
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
  */
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
              Imagens enviadas para processamento!
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
              {uploadProgress.message || 'Salvando imagens'}
            </div>
            {uploadProgress.total > 0 && (
              <div style={{ marginTop: '1rem', textAlign: 'center', color: '#fff', fontSize: '0.9em' }}>
                {uploadProgress.current} de {uploadProgress.total} imagens processadas
              </div>
            )}
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
        <CustomModal show={showFormModal} onClose={handleModalClose}>
          <ChoosForm
            ref={choosFormRef}
            currentForm={currentForm}
            formIndex={formIndex}
            forms={forms}
            handleFormChange={handleFormChange}
            handlePrev={handlePrev}
            handleNext={handleNext}
            handleSubmit={handleSubmit}
            selectedIndexes={forms.map(f => f.originalIndex)}
            property={property}
            onNavigateToImage={handleNavigateToImage}
            onRemoveImage={handleRemoveImage}
            onOriginalClose={backToSelector}
          />
        </CustomModal>
      )}
    </>
  );
};

export default ImageSelector;