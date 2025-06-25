import styles from './ChoosForm.module.css';
import { useState, useEffect, useRef } from 'react';
import SmartStageForm from './SmartStageForm';
import AtelierForm from './AtelierForm';
import VideoForm from './VideoForm';
// Import images for icons
import smartImg from '../Images/smart.jpeg';
import smartHoverImg from '../Images/mart_hover.jpeg';
import atelierImg from '../Images/atelier.jpeg';
import atelierHoverImg from '../Images/atelier_hover.jpeg';

const ChoosForm = (props) => {
    const [selectedModel, setSelectedModel] = useState('');
    const [showModelSelection, setShowModelSelection] = useState(true);
    const [hoveredModel, setHoveredModel] = useState(null);
    const videoRef = useRef(null);

    // Define model options
    const modelOptions = [
        {
            id: 'smartStage',
            name: 'RUUM SmartStage',
            description: 'Decore imóveis vazios com o equilíbrio perfeito entre qualidade e custo-benefício."',
            features: ["Ambientes até 40m²", "I.A. que não altera a arquitetura do imóvel", "Processo de curadoria em cada imagem"],
            icon: null,
            normalImg: smartImg,
            hoverImg: smartHoverImg,
            buttonText: "Nova imagem SmartStage"
        },
        {
            id: 'atelier',
            name: 'RUUM Atelier',
            description: 'A união entre inteligência artificial e time de arquitetos. Ideal para imóveis de alto padrão e corporativos.',
            features: ["Arquitetos +  I.A.", "Mobiliário de alto padrão escolhido a dedo","Requisições personalizadas"],
            icon: null,
            normalImg: atelierImg,
            hoverImg: atelierHoverImg,
            buttonText: "Nova imagem Atelier"
        },
        {
            id: 'video',
            name: 'RUUM MagicMotion',
            description: 'Produza vídeos em escala com economia e qualidade somente a partir da foto estática. Garanta sucesso e resultado em redes sociais e anúncios!',
            features: ["Produção rápida e econômica", "Perfeito para redes sociais", "Garanta 33% mais cliques nos seus anúncios"],
            icon: null,
            videoUrl: 'https://assets.softr-files.com/applications/c20f75dd-9ea8-40e3-9211-5986448c7bb5/assets/9e14e1c1-e797-4280-80c6-33c416b5b3e3.mp4',
            buttonText: "Novo vídeo MagicMotion"
        }
    ];

    const handleModelSelect = (modelId) => {
        setSelectedModel(modelId);
    };

    const handleContinue = () => {
        setShowModelSelection(false);
    };

    const handleBack = () => {
        setShowModelSelection(true);
        setSelectedModel('');
    };

    const resetForm = () => {
        setShowModelSelection(true);
        setSelectedModel('');
    };

    // If we need to update form values based on the selected model
    useEffect(() => {
        if (selectedModel && props.currentForm) {
            // Set default values specific to the model if needed
            const defaults = {
                smartStage: {},
                atelier: {},
                video: {}
            };

            const modelDefaults = defaults[selectedModel] || {};

            // Apply default values
            Object.entries(modelDefaults).forEach(([key, value]) => {
                if (!props.currentForm[key]) {
                    props.handleFormChange(key, value);
                }
            });
        }
    }, [selectedModel, props.currentForm]);
    
    // Garante que o vídeo está em seu estado correto com base no estado de hover
    useEffect(() => {
        // Adicionamos um pequeno delay para garantir que o ref está atualizado
        const timer = setTimeout(() => {
            if (videoRef.current) {
                if (hoveredModel === 'video' || selectedModel === 'video') {
                    videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
                } else {
                    videoRef.current.pause();
                    videoRef.current.currentTime = 0;
                }
            }
        }, 10);
        
        return () => clearTimeout(timer);
    }, [hoveredModel, selectedModel]);

    // When submitting, we store the selected model
    const handleModelSubmit = () => {
        // Store the selected model when submitting
        props.handleFormChange('modelType', selectedModel);
        props.handleSubmit();
    };

    // Customize props for each form type
    const customProps = {
        ...props,
        // Override handleSubmit to include our model type
        handleSubmit: handleModelSubmit,
        // Add a back button handler to return to model selection
        handleBack: handleBack,
        // Reset the form to model selection
        resetForm: resetForm
    };

    // Render model selection or the selected form type
    if (showModelSelection) {
        // Separar os modelos de imagem e vídeo
        const imageModels = modelOptions.filter(model => model.id === 'smartStage' || model.id === 'atelier');
        const videoModels = modelOptions.filter(model => model.id === 'video');
        
        // Função comum para renderizar os cards
        const renderModelCard = (model) => (
            <div
                key={model.id}
                className={`${styles.modelCard} ${selectedModel === model.id ? styles.modelCardSelected : ''}`}
                onMouseEnter={() => {
                    setHoveredModel(model.id);
                    // Tenta iniciar o vídeo diretamente se for o card de vídeo
                    if (model.id === 'video' && videoRef.current) {
                        videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
                    }
                }}
                onMouseLeave={() => {
                    setHoveredModel(null);
                    // Pausa o vídeo e reinicia ao frame inicial se for o card de vídeo
                    if (model.id === 'video' && videoRef.current) {
                        videoRef.current.pause();
                        videoRef.current.currentTime = 0;
                    }
                }}
                onTouchStart={() => {
                    setHoveredModel(model.id);
                    // Tenta iniciar o vídeo diretamente se for o card de vídeo em dispositivos touch
                    if (model.id === 'video' && videoRef.current) {
                        videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
                    }
                }}
                onTouchEnd={() => {
                    // Em dispositivos touch, mantemos o hover ativo um pouco mais antes de remove-lo
                    setTimeout(() => {
                        setHoveredModel(null);
                        // Pausa o vídeo e reinicia ao frame inicial se for o card de vídeo
                        if (model.id === 'video' && videoRef.current) {
                            videoRef.current.pause();
                            videoRef.current.currentTime = 0;
                        }
                    }, 200);
                }}
            >
                <div className={styles.contentWrapper}>
                    {model.normalImg ? (
                        <div className={styles.modelIconImage}>
                            <img 
                                src={(selectedModel === model.id || hoveredModel === model.id) ? model.hoverImg : model.normalImg} 
                                alt={model.name}
                                className={styles.iconImg} 
                            />
                        </div>
                    ) : model.videoUrl ? (
                        <div className={styles.modelIconVideo}>
                            <video 
                                ref={el => {
                                    // Store the video element reference
                                    if (model.id === 'video') {
                                        videoRef.current = el;
                                    }
                                    
                                    // Play ou pause com base no estado de hover
                                    if (el && model.id === 'video') {
                                        if (hoveredModel === 'video' || selectedModel === 'video') {
                                            el.play().catch(e => console.log("Auto-play prevented:", e));
                                        } else {
                                            el.pause();
                                            el.currentTime = 0;
                                        }
                                    }
                                }}
                                src={model.videoUrl}
                                className={styles.videoPreview}
                                muted
                                loop
                                playsInline
                                preload="auto"
                                poster=""  // Use empty poster to show first frame
                            />
                        </div>
                    ) : model.icon ? (
                        <div className={styles.modelIcon}>{model.icon}</div>
                    ) : null}
                    <h3 className={styles.modelName}>
                        {model.name.split(' ').map((word, index) => {
                            if (index === 0) {
                                return <span key={index} className={styles.firstWord}>{word} </span>;
                            } else {
                                return <span key={index} className={styles.remainingWords}>{word} </span>;
                            }
                        })}
                    </h3>
                    <p className={styles.modelDescription}>{model.description}</p>
                    {model.features && (
                        <ul className={styles.featuresList}>
                            {model.features.map((feature, index) => (
                                <li key={index} className={styles.featureItem}>
                                    <span className={styles.bulletPoint}>•</span> {feature}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className={styles.buttonContainer}>
                    <button
                        className={styles.cardButton}
                        onClick={() => {
                            handleModelSelect(model.id);
                            handleContinue();
                        }}
                    >
                        {model.buttonText}
                    </button>
                </div>
            </div>
        );

        return (
            <div className={styles.formContainer}>
                <h5 className={styles.formTitle}>Escolha seu modelo de ambientação</h5>

                {/* Container dos cards de grupo */}
                <div className={styles.groupsWrapper}>
                    {/* Seção de imagens */}
                    <div className={styles.groupSection}>
                        <div className={`${styles.groupCard} ${styles.imageGroupCard}`}>
                            <h2 className={styles.groupTitle}>Imagem</h2>
                            <div className={styles.groupContent}>
                                {imageModels.map(model => renderModelCard(model))}
                            </div>
                        </div>
                    </div>

                    {/* Seção de vídeo */}
                    <div className={styles.groupSection}>
                        <div className={`${styles.groupCard} ${styles.videoGroupCard}`}>
                            <h2 className={styles.groupTitle}>Vídeo</h2>
                            <div className={styles.groupContent}>
                                {videoModels.map(model => renderModelCard(model))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mantemos o seletor original para compatibilidade, mas com display:none no CSS */}
                <div className={styles.modelSelector}>
                    {modelOptions.map((model) => renderModelCard(model))}
                </div>
            </div>
        );
    }

    // Render the appropriate form based on selection
    switch (selectedModel) {
        case 'smartStage':
            return <SmartStageForm {...customProps} />;
        case 'atelier':
            return <AtelierForm {...customProps} />;
        case 'video':
            return <VideoForm {...customProps} />;
        default:
            return null;
    }
};

export default ChoosForm;
