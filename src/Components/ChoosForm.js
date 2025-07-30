import styles from './ChoosForm.module.css';
import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import SmartStageForm from './SmartStageForm';
import AtelierForm from './AtelierForm';
import VideoForm from './VideoForm';
// Import images for icons
import smartImg from '../Images/smart.jpeg';
import smartHoverImg from '../Images/mart_hover.jpeg';
import atelierImg from '../Images/atelier.jpeg';
import atelierHoverImg from '../Images/atelier_hover.jpeg';
import restyleImg from '../Images/restyleImg.jpeg';
import restyleHoverImg from '../Images/restyleHoverImg.jpg';
import projectImg from '../Images/projectImg.jpg';
import projectHoverImg from '../Images/projectHoverImg.jpg';
import classicoImg from '../Images/classico_atualizado.jpg';
import eleganciaImg from '../Images/elegancia_descontraida.jpg';
import sofisticacaoImg from '../Images/sofisticacao_chic.jpg';
import refugioImg from '../Images/refugios_beiramar.jpg';
import industrialImg from '../Images/industrial.jpg';

const ChoosForm = forwardRef((props, ref) => {
    const [selectedModel, setSelectedModel] = useState('');
    const [showModelSelection, setShowModelSelection] = useState(true);
    const [hoveredModel, setHoveredModel] = useState(null);
    const videoRef = useRef(null);

    // Expor funções para o componente pai através da ref
    useImperativeHandle(ref, () => ({
        isInFormView: () => !showModelSelection,
        backToModelSelection: () => handleBack()
    }));

    // Define model options
    const modelOptions = [
        {
            id: 'smartStage',
            name: 'RUUM SmartStage',
            description: 'O equilíbrio perfeito entre consistência e custo-benefício.',
            features: ["Ambientes até 40m²", "Cada foto de um mesmo ambiente gera uma ambientação distinta", "I.A. que não altera a arquitetura do imóvel"],
            icon: null,
            normalImg: smartImg,
            hoverImg: smartHoverImg,
            buttonText: "Nova imagem SmartStage"
        },
        {
            id: 'atelier',
            name: 'RUUM Atelier',
            description: 'A melhor qualidade em ambientação virtual.',
            features: ["Qualquer ambiente e tamanho", "Mesma ambientação em fotos de ângulos diferetes", "Até 2 revisões"],
            icon: null,
            normalImg: atelierImg,
            hoverImg: atelierHoverImg,
            buttonText: "Nova imagem Atelier"
        },
        {
            id: 'restyle',
            name: 'RUUM ReStyle',
            description: 'Redecore um ambiente já mobiliado e destrave o verdadeiro potencial do imóvel.',
            features: ["Remoção de mobiliário existente + ambientação", "Todas as vantagens do processo de ambientação RUUM Atelier"],
            icon: null,
            normalImg: restyleImg,
            hoverImg: restyleHoverImg,
            buttonText: "Nova imagem ReStyle"
        },
        {
            id: 'project',
            name: 'RUUM Project',
            description: 'Tenha em mãos imagens sedutoras de imóveis ainda em obra e saia na frente nas vendas.',
            features: ["Finalização virtual de obra + ambientação", "Todas as vantagens do processo de ambientação RUUM Atelier"],
            icon: null,
            normalImg: projectImg,
            hoverImg: projectHoverImg,
            buttonText: "Nova imagem Project"
        },
        {
            id: 'magicmotion',
            name: 'RUUM MagicMotion',
            description: 'Produza vídeos a partir de uma foto estática e gere mais engajamento à primeira vista',
            features: ["Vídeos de aproximadamente 10 segundos", "Uma imagem por vídeo", "Formatos vertical e horizontal"],
            icon: null,
            videoUrl: 'https://assets.softr-files.com/applications/c20f75dd-9ea8-40e3-9211-5986448c7bb5/assets/9e14e1c1-e797-4280-80c6-33c416b5b3e3.mp4',
            buttonText: "Novo vídeo MagicMotion"
        },
        {
            id: 'videotour',
            name: 'RUUM VideoTour',
            description: 'Produza um tour narrado do imóvel usando apenas fotos estáticas.',
            features: ["Tours narrados de 30 ou 60 segundos", "Múltiplos ambientes por vídeo", "Formatos vertical e horizontal"],
            icon: null,
            videoUrl: 'https://assets.softr-files.com/applications/c20f75dd-9ea8-40e3-9211-5986448c7bb5/assets/8d47aa02-31e3-4973-a7b4-333e2c248a31.mp4',
            buttonText: "Em breve"
        }
    ];

    const estilosamb = [
        {
            id: 'classico',
            name: '1. Clássico Atualizado',
            description: 'Uma nova interpretação da estética tradicional, que mistura elegância com elementos contemporâneos.',
            img: classicoImg
        },
        {
            id: 'elegancia',
            name: '2. Elegância Descontraída',
            description: 'Mobiliário moderno em madeira, tonalidades convidativas e plantas para um ambiente acolhedor.',
            img: eleganciaImg
        },
        {
            id: 'sofisticacao',
            name: '3. Sofisticação Chic',
            description: 'Mármore, granito e detalhes em dourado e prateado que trazem requinte ao espaço.',
            img: sofisticacaoImg
        },
        {
            id: 'refugio',
            name: '4. Refúgio à Beira-Mar',
            description: 'Inspirado no litoral, com materiais naturais como vime e palhinha, perfeito para áreas externas.',
            img: refugioImg
        },
        {
            id: 'industrial',
            name: '5. Industrial Urbano',
            description: 'Uma mistura harmônica do metal e da madeira em concordância com linhas e silhuetas simples.',
            img: industrialImg
        }
    ]

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
                if (hoveredModel === 'magicmotion' || selectedModel === 'magicmotion' ||
                    hoveredModel === 'videotour' || selectedModel === 'videotour') {
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
        resetForm: resetForm,
        // Pass the selected model to the forms
        selectedModel: selectedModel,
        // Pass estilos de ambientação para AtelierForm
        estilosamb: estilosamb,
        // Pass table prop for SuggestionFeed logic
        table: props.table,
        // Adicionar funcionalidades para thumbnails
        onNavigateToImage: props.onNavigateToImage || ((targetIndex) => {
            // Fallback para navegação sequencial se a função direta não estiver disponível
            const difference = targetIndex - props.formIndex;
            if (difference > 0) {
                // Navegar para frente
                for (let i = 0; i < difference; i++) {
                    setTimeout(() => props.handleNext(), i * 100);
                }
            } else if (difference < 0) {
                // Navegar para trás
                for (let i = 0; i < Math.abs(difference); i++) {
                    setTimeout(() => props.handlePrev(), i * 100);
                }
            }
        }),
        onRemoveImage: props.onRemoveImage || ((imageIndex) => {
            // Fallback se a função de remoção não estiver disponível
            alert(`Funcionalidade de remoção da imagem ${imageIndex + 1} não está disponível neste contexto.`);
        })
    };

    // Render model selection or the selected form type
    if (showModelSelection) {
        // Separar os modelos de imagem e vídeo
        const imageModels = modelOptions.filter(model =>
            model.id === 'smartStage' ||
            model.id === 'atelier' ||
            model.id === 'restyle' ||
            model.id === 'project'
        );
        const videoModels = modelOptions.filter(model =>
            model.id === 'magicmotion' ||
            model.id === 'videotour'
        );

        // Função comum para renderizar os cards
        const renderModelCard = (model) => (
            <div
                key={model.id}
                className={`${styles.modelCard} ${selectedModel === model.id ? styles.modelCardSelected : ''}`}
                onClick={() => {
                    // Não permitir clique no VideoTour pois ainda não existe
                    if (model.id === 'videotour') {
                        return;
                    }
                    handleModelSelect(model.id);
                    handleContinue();
                }}
                onMouseEnter={() => {
                    setHoveredModel(model.id);
                    // Tenta iniciar o vídeo diretamente se for o card de vídeo
                    if ((model.id === 'magicmotion' || model.id === 'videotour') && videoRef.current) {
                        videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
                    }
                }}
                onMouseLeave={() => {
                    setHoveredModel(null);
                    // Pausa o vídeo e reinicia ao frame inicial se for o card de vídeo
                    if ((model.id === 'magicmotion' || model.id === 'videotour') && videoRef.current) {
                        videoRef.current.pause();
                        videoRef.current.currentTime = 0;
                    }
                }}
                onTouchStart={() => {
                    setHoveredModel(model.id);
                    // Tenta iniciar o vídeo diretamente se for o card de vídeo em dispositivos touch
                    if ((model.id === 'magicmotion' || model.id === 'videotour') && videoRef.current) {
                        videoRef.current.play().catch(e => console.log("Auto-play prevented:", e));
                    }
                }}
                onTouchEnd={() => {
                    // Em dispositivos touch, mantemos o hover ativo um pouco mais antes de remove-lo
                    setTimeout(() => {
                        setHoveredModel(null);
                        // Pausa o vídeo e reinicia ao frame inicial se for o card de vídeo
                        if ((model.id === 'magicmotion' || model.id === 'videotour') && videoRef.current) {
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
                                    if (model.id === 'magicmotion' || model.id === 'videotour') {
                                        videoRef.current = el;
                                    }

                                    // Play ou pause com base no estado de hover
                                    if (el && (model.id === 'magicmotion' || model.id === 'videotour')) {
                                        if (hoveredModel === model.id || selectedModel === model.id) {
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
                        className={`${styles.cardButton} ${model.id === 'videotour' ? styles.disabledButton : ''}`}
                        onClick={() => {
                            // Não permitir clique no VideoTour pois ainda não existe
                            if (model.id === 'videotour') {
                                return;
                            }
                            handleModelSelect(model.id);
                            handleContinue();
                        }}
                        disabled={model.id === 'videotour'}
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
        case 'restyle':
        case 'project':
            return <AtelierForm {...customProps} />;
        case 'magicmotion':
            return <VideoForm {...customProps} />;
        case 'videotour':
            return null;
        default:
            return null;
    }
});

export default ChoosForm;
