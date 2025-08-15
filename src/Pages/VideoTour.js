//STYLES
import styles from './VideoTour.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
//Hooks
import { useState, useEffect } from 'react';
//Config
import { apiCall, apiHeaders } from '../Config/Config';
import API_CONFIG from '../Config/Config';
//Shotstack Fix - OTIMIZADO
import { handleShotstackIntegration } from '../Utils/ShotstackFix';

// Função utilitária para diagnóstico
const getSystemInfo = () => {
    return {
        timestamp: new Date().toISOString(),
        origin: window.location.origin,
        userAgent: navigator.userAgent,
        apiEndpoint: `${window.location.origin}/api/elevenlabs/text-to-speech`,
        hasToken: !!apiHeaders.Authorization,
        tokenPreview: apiHeaders.Authorization ? `${apiHeaders.Authorization.substring(0, 10)}...` : 'N/A'
    };
};

const initialJson = {
    timeline: {
        soundtrack: {
            src: "https://s3-ap-southeast-2.amazonaws.com/shotstack-assets/music/moment.mp3",
            effect: "fadeOut"
        },
        tracks: [
            {
                clips: [
                    {
                        asset: {
                            type: "text",
                            text: "HELLO WORLD",
                            font: {
                                family: "Montserrat ExtraBold",
                                color: "#ffffff",
                                size: 32
                            },
                            alignment: {
                                horizontal: "left"
                            }
                        },
                        start: 0,
                        length: 5,
                        transition: {
                            in: "fade",
                            out: "fade"
                        }
                    }
                ]
            }
        ]
    },
    output: {
        format: "mp4",
        size: {
            width: 1024,
            height: 576
        }
    }
};

const VideoTour = () => {
    const [json, setJson] = useState(initialJson);
    const [loading, setLoading] = useState(false);

    // Estados para o formulário do Runway
    const [runwayForm, setRunwayForm] = useState({
        promptImage: '',
        promptText: '',
        ratio: '1280:720',
        duration: 5,
        model: 'gen4_turbo',
        withHuman: false
    });
    const [runwayLoading, setRunwayLoading] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState(null);

    // Estados para o gerador de script
    const [scriptLoading, setScriptLoading] = useState(false);
    const [generatedScript, setGeneratedScript] = useState(null);
    const [originalScript, setOriginalScript] = useState(null);
    const [scriptImageUrl, setScriptImageUrl] = useState('');
    const [isEditingScript, setIsEditingScript] = useState(false);

    // Estados para o Text-to-Speech
    const [ttsLoading, setTtsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [selectedVoice, setSelectedVoice] = useState('RACHEL');

    // Estados para combinação de vídeo + áudio
    const [combineLoading, setCombineLoading] = useState(false);
    const [combinedVideo, setCombinedVideo] = useState(null);

    // Estados para Shotstack e Polling
    const [pollingInterval, setPollingInterval] = useState(null);
    const [pollingAttempts, setPollingAttempts] = useState(0);
    const [isPolling, setIsPolling] = useState(false);

    // Limpeza do polling ao desmontar o componente
    useEffect(() => {
        return () => {
            if (pollingInterval) {
                clearInterval(pollingInterval);
            }
        };
    }, [pollingInterval]);

    // useEffect para gerar prompt inicial
    useEffect(() => {
        updateVideoPrompt(runwayForm.duration, runwayForm.withHuman);
    }, []); // Executa apenas uma vez no mount

    // Função para fazer chamadas de API que retornam JSON
    const apiCallJSON = async (endpoint, options = {}) => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
                headers: {
                    'Content-Type': 'application/json',
                    ...apiHeaders,
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            throw error;
        }
    };

    // Função para converter blob para base64
    const convertBlobToBase64 = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // Função para criar Data URL a partir de blob
    const createDataURL = (blob) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    // FUNÇÕES PARA GERAÇÃO DE SCRIPT
    
    // Função para gerar prompt automático do vídeo baseado na duração e presença de humano
    const generateVideoPrompt = (duration, withHuman) => {
        if (withHuman) {
            return "Introduce a man walking through the room. Make sure lighting and perspective match the original image and ensure that the character considers original furniture placement.";
        }
        
        if (duration === 5) {
            return "POV slow motion forward.";
        } else if (duration === 10) {
            return "POV slow motion forward. Keep the original image unchanged. No new elements, no hidden areas revealed.";
        }
        
        // Para outras durações, usar o prompt básico
        return "POV slow motion forward.";
    };

    // Função para atualizar prompt automaticamente
    const updateVideoPrompt = (duration, withHuman) => {
        const newPrompt = generateVideoPrompt(duration, withHuman);
        setRunwayForm(prev => ({
            ...prev,
            promptText: newPrompt
        }));
    };

    const handleRunwayFormChange = (field, value) => {
        let updatedForm = {
            ...runwayForm,
            [field]: value
        };

        // Se marcou "Com Figura Humana", forçar duração para 5 segundos
        if (field === 'withHuman' && value === true) {
            updatedForm.duration = 5;
        }

        setRunwayForm(updatedForm);

        // Atualizar prompt automaticamente quando mudar duração ou withHuman
        if (field === 'duration' || field === 'withHuman') {
            const finalDuration = field === 'duration' ? parseInt(value) : updatedForm.duration;
            const finalWithHuman = field === 'withHuman' ? value : updatedForm.withHuman;
            
            setTimeout(() => {
                updateVideoPrompt(finalDuration, finalWithHuman);
            }, 100); // Pequeno delay para garantir que o estado seja atualizado
        }
    };

    const handleGenerateScript = async () => {
        if (!runwayForm.promptImage) {
            alert('Por favor, insira uma URL de imagem primeiro.');
            return;
        }

        setScriptLoading(true);
        setGeneratedScript(null);
        setOriginalScript(null);
        setScriptImageUrl(runwayForm.promptImage);

        try {
            const response = await apiCall('/api/chatgpt', {
                method: 'POST',
                body: JSON.stringify({
                    image_url: runwayForm.promptImage,
                    processing_type: 'SCRIPT_GENERATION'
                })
            });

            const script = response.data?.result || response.result || response.data?.script || response.script || response.message;
            setGeneratedScript(script);
            setOriginalScript(script);
            
            // Sincronizar URL da imagem com o formulário do Runway
            setRunwayForm(prev => ({
                ...prev,
                promptImage: runwayForm.promptImage
            }));

        } catch (error) {
            alert('Erro ao gerar script: ' + error.message);
        } finally {
            setScriptLoading(false);
        }
    };

    const handleEditScript = () => {
        setIsEditingScript(true);
    };

    const handleSaveScript = () => {
        setIsEditingScript(false);
        setOriginalScript(generatedScript);
    };

    const handleCancelEdit = () => {
        setGeneratedScript(originalScript);
        setIsEditingScript(false);
    };

    // FUNÇÕES PARA TEXT-TO-SPEECH - OTIMIZADAS
    const handleVoiceChange = (e) => {
        setSelectedVoice(e.target.value);
    };

    const handleTextToSpeech = async () => {
        if (!generatedScript || !generatedScript.trim()) {
            alert('Por favor, gere um script primeiro.');
            return;
        }

        setTtsLoading(true);
        setAudioUrl(null);

        try {
            const payload = {
                text: generatedScript,
                voice: selectedVoice,
                model: "eleven_multilingual_v2"
            };

            // Usar fetch direto para TTS que pode retornar blob
            const audioResponse = await fetch(`${API_CONFIG.BASE_URL}/api/elevenlabs/text-to-speech`, {
                method: "POST",
                headers: apiHeaders,
                body: JSON.stringify(payload)
            });

            if (!audioResponse.ok) {
                const errorText = await audioResponse.text();
                throw new Error(`HTTP ${audioResponse.status}: ${errorText}`);
            }

            // Verificar se é JSON ou blob
            const contentType = audioResponse.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                // Resposta JSON com URL
                const jsonResponse = await audioResponse.json();
                
                const publicAudioUrl = jsonResponse.url || jsonResponse.data?.url || jsonResponse.audioUrl;
                
                if (!publicAudioUrl) {
                    throw new Error('URL pública do áudio não foi retornada');
                }
                
                setAudioUrl(publicAudioUrl);
            } else {
                // Resposta é um arquivo de áudio - criar blob URL
                const audioBlob = await audioResponse.blob();
                
                const audioBlobUrl = URL.createObjectURL(audioBlob);
                setAudioUrl(audioBlobUrl);
            }

        } catch (error) {
            if (error.message.includes('401') || error.message.includes('autenticação')) {
                alert('🔐 Erro de autenticação com ElevenLabs.\nO token no backend pode estar inválido ou expirado.\nVerifique a configuração no servidor.');
            } else if (error.message.includes('500')) {
                alert('⚠️ Erro interno do servidor.\nProvavelmente é um problema de configuração da ElevenLabs API.\nVerifique os logs do backend para mais detalhes.');
            } else {
                alert('❌ Erro ao gerar áudio: ' + error.message);
            }
        } finally {
            setTtsLoading(false);
        }
    };

    // Função de teste com texto simples - OTIMIZADA
    const handleTestTTS = async () => {
        setTtsLoading(true);
        setAudioUrl(null);

        try {
            const testPayload = {
                text: "Teste simples de voz.",
                voice: selectedVoice,
                model: "eleven_multilingual_v2"
            };

            // Usar fetch direto para TTS que pode retornar blob
            const audioResponse = await fetch(`${API_CONFIG.BASE_URL}/api/elevenlabs/text-to-speech`, {
                method: "POST",
                headers: apiHeaders,
                body: JSON.stringify(testPayload)
            });

            if (!audioResponse.ok) {
                const errorText = await audioResponse.text();
                throw new Error(`HTTP ${audioResponse.status}: ${errorText}`);
            }

            // Verificar se é JSON ou blob
            const contentType = audioResponse.headers.get('content-type');
            
            if (contentType && contentType.includes('application/json')) {
                // Resposta JSON com URL
                const jsonResponse = await audioResponse.json();
                
                const publicAudioUrl = jsonResponse.url || jsonResponse.data?.url || jsonResponse.audioUrl;
                
                if (!publicAudioUrl) {
                    throw new Error('URL pública do áudio não foi retornada');
                }
                
                setAudioUrl(publicAudioUrl);
            } else {
                // Resposta é um arquivo de áudio - criar blob URL
                const audioBlob = await audioResponse.blob();
                
                const audioBlobUrl = URL.createObjectURL(audioBlob);
                setAudioUrl(audioBlobUrl);
            }

        } catch (error) {
            if (error.message.includes('401') || error.message.includes('autenticação')) {
                alert('🔐 Erro de autenticação no teste TTS.\nO token no backend pode estar inválido ou expirado.');
            } else if (error.message.includes('500')) {
                alert('⚠️ Erro interno do servidor no teste TTS.\nProblema de configuração da ElevenLabs API.');
            } else {
                alert('❌ Erro no teste TTS: ' + error.message);
            }
        } finally {
            setTtsLoading(false);
        }
    };

    // FUNÇÕES PARA GERAÇÃO DE VÍDEO
    const handleGenerateVideo = async () => {
        if (!runwayForm.promptImage) {
            alert('Por favor, insira uma URL de imagem primeiro.');
            return;
        }

        setRunwayLoading(true);
        setGeneratedVideo(null);

        try {
            const response = await apiCall('/api/runway/image-to-video', {
                method: 'POST',
                body: JSON.stringify(runwayForm)
            });

            setGeneratedVideo(response.data || response);
        } catch (error) {
            alert('❌ Erro ao gerar vídeo: ' + error.message);
        } finally {
            setRunwayLoading(false);
        }
    };

    // FUNÇÕES PARA COMBINAÇÃO - OTIMIZADAS
    const handleCombineWithShotstack = async () => {
        if (!generatedVideo || !audioUrl) {
            alert('❌ Você precisa gerar tanto o vídeo quanto o áudio antes de combinar.');
            return;
        }

        if (!generatedVideo.output || !Array.isArray(generatedVideo.output) || generatedVideo.output.length === 0) {
            alert('❌ Vídeo gerado não está disponível.');
            return;
        }

        setCombineLoading(true);
        setCombinedVideo(null);

        try {
            // Usar a função otimizada do ShotstackFix
            const result = await handleShotstackIntegration(
                generatedVideo.output[0], // URL do vídeo
                audioUrl // URL pública do áudio (diretamente do ElevenLabs)
            );
            
            // Atualizar estado com o resultado
            setCombinedVideo({
                url: result.url,
                status: 'done',
                renderId: result.renderId,
                timestamp: new Date().toISOString()
            });

            alert('✅ Vídeo combinado com áudio criado com sucesso!');

        } catch (error) {
            let errorMessage = 'Erro na combinação: ';
            if (error.message.includes('404')) {
                errorMessage += 'Endpoint não encontrado. Verifique se o backend está rodando.';
            } else if (error.message.includes('401')) {
                errorMessage += 'Erro de autenticação. Verifique o token do Shotstack.';
            } else if (error.message.includes('timeout')) {
                errorMessage += 'Timeout na renderização. Tente novamente.';
            } else {
                errorMessage += error.message;
            }
            
            alert('❌ ' + errorMessage);
        } finally {
            setCombineLoading(false);
        }
    };

    // Função para combinar vídeo do Runway com áudio do TTS - OTIMIZADA
    const handleCombineVideoAudio = async () => {
        if (!generatedVideo || !audioUrl) {
            alert('❌ Você precisa gerar tanto o vídeo quanto o áudio antes de combinar.');
            return;
        }

        if (!generatedVideo.output || !Array.isArray(generatedVideo.output) || generatedVideo.output.length === 0) {
            alert('❌ Vídeo gerado não está disponível.');
            return;
        }

        setCombineLoading(true);
        setCombinedVideo(null);

        try {
            // Usar a função otimizada do ShotstackFix
            const result = await handleShotstackIntegration(
                generatedVideo.output[0], // URL do vídeo
                audioUrl // URL pública do áudio (diretamente do ElevenLabs)
            );
            
            // Atualizar estado com o resultado
            setCombinedVideo({
                output: [result.url],
                status: 'done',
                type: 'combined_shotstack'
            });

            alert('✅ Vídeo combinado com áudio criado com sucesso!');

        } catch (error) {
            alert('❌ Erro ao combinar vídeo com áudio: ' + error.message);
        } finally {
            setCombineLoading(false);
        }
    };

    return (
        <div className={`container mt-4 ${styles.videoTourContainer}`}>
            <h2 className="mb-4">Gerador de Vídeo com Runway</h2>
            
            {/* Seção de Instruções */}
            <div className="card mb-4" style={{ border: '1px solid #007bff', backgroundColor: '#f8f9ff' }}>
                <div className="card-header" style={{ backgroundColor: '#007bff', color: 'white' }}>
                    <h5 className="mb-0">📋 Como usar - Vídeo com Locução</h5>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-4">
                            <h6 className="text-primary">1️⃣ Gerar Script</h6>
                            <p className="small">Insira a URL de uma imagem e gere um script de locução usando ChatGPT.</p>
                        </div>
                        <div className="col-md-4">
                            <h6 className="text-success">2️⃣ Gerar Áudio</h6>
                            <p className="small">Converta o script em áudio usando Text-to-Speech (ElevenLabs).</p>
                        </div>
                        <div className="col-md-4">
                            <h6 className="text-info">3️⃣ Gerar Vídeo</h6>
                            <p className="small">Crie um vídeo a partir da imagem usando Runway Gen-4.</p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="alert alert-success small">
                            <strong>✨ NOVO - OTIMIZADO:</strong> Agora usando URLs públicas diretamente do ElevenLabs, sem uploads desnecessários!<br/>
                            <strong>🚀 Mais rápido:</strong> Menos pontos de falha e processamento mais eficiente.<br/>
                            <strong>🎯 Prompts Automáticos:</strong> Os prompts de vídeo são gerados automaticamente baseados na duração e configurações escolhidas.
                        </div>
                        <div className="alert alert-info small">
                            <strong>📝 Prompts Pré-definidos:</strong><br/>
                            • <strong>5 segundos:</strong> "POV slow motion forward."<br/>
                            • <strong>10 segundos:</strong> "POV slow motion forward. Keep the original image unchanged. No new elements, no hidden areas revealed."<br/>
                            • <strong>Com Pessoa:</strong> "Introduce a man walking through the room. Make sure lighting and perspective match the original image and ensure that the character considers original furniture placement."
                        </div>
                    </div>
                </div>
            </div>

            {/* Formulário Runway */}
            <div className="card mb-4">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">🎬 Configuração do Vídeo</h5>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label">🖼️ URL da Imagem</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={runwayForm.promptImage}
                                    onChange={(e) => handleRunwayFormChange('promptImage', e.target.value)}
                                    placeholder="https://exemplo.com/imagem.jpg"
                                />
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label">📝 Prompt do Vídeo</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={runwayForm.promptText}
                                    onChange={(e) => handleRunwayFormChange('promptText', e.target.value)}
                                    placeholder="Cinematic shot of..."
                                />
                            </div>
                        </div>
                    </div>
                    <div className="row">
                        <div className="col-md-3">
                            <div className="mb-3">
                                <label className="form-label">📐 Proporção</label>
                                <select
                                    className="form-select"
                                    value={runwayForm.ratio}
                                    onChange={(e) => handleRunwayFormChange('ratio', e.target.value)}
                                >
                                    <option value="1280:720">16:9 (1280:720)</option>
                                    <option value="720:1280">9:16 (720:1280)</option>
                                    <option value="1024:1024">1:1 (1024:1024)</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="mb-3">
                                <label className="form-label">⏱️ Duração (s)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={runwayForm.duration}
                                    onChange={(e) => handleRunwayFormChange('duration', parseInt(e.target.value))}
                                    min="1"
                                    max="10"
                                    disabled={runwayForm.withHuman}
                                />
                                {runwayForm.withHuman && (
                                    <div className="form-text text-info">
                                        Duração fixa de 5s para vídeos com pessoa
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="mb-3">
                                <label className="form-label">🤖 Modelo</label>
                                <select
                                    className="form-select"
                                    value={runwayForm.model}
                                    onChange={(e) => handleRunwayFormChange('model', e.target.value)}
                                >
                                    <option value="gen4_turbo">Gen-4 Turbo</option>
                                    <option value="gen4">Gen-4</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-3">
                            <div className="mb-3">
                                <div className="form-check mt-4">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={runwayForm.withHuman}
                                        onChange={(e) => handleRunwayFormChange('withHuman', e.target.checked)}
                                    />
                                    <label className="form-check-label">🚶 Com Pessoa</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seção de Geração de Script */}
            <div className="card mb-4">
                <div className="card-header bg-success text-white">
                    <h5 className="mb-0">📝 Geração de Script (ChatGPT)</h5>
                </div>
                <div className="card-body">
                    <button
                        className="btn btn-success me-2"
                        onClick={handleGenerateScript}
                        disabled={scriptLoading || !runwayForm.promptImage}
                    >
                        {scriptLoading ? '⏳ Gerando...' : '🎯 Gerar Script'}
                    </button>
                    
                    {generatedScript && (
                        <div className="mt-3">
                            <div className="d-flex justify-content-between align-items-center">
                                <label className="form-label fw-bold">Script Gerado:</label>
                                <div>
                                    {!isEditingScript ? (
                                        <button className="btn btn-sm btn-outline-primary" onClick={handleEditScript}>
                                            ✏️ Editar
                                        </button>
                                    ) : (
                                        <>
                                            <button className="btn btn-sm btn-success me-2" onClick={handleSaveScript}>
                                                ✅ Salvar
                                            </button>
                                            <button className="btn btn-sm btn-secondary" onClick={handleCancelEdit}>
                                                ❌ Cancelar
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <textarea
                                className="form-control mt-2"
                                rows={3}
                                value={generatedScript}
                                onChange={(e) => setGeneratedScript(e.target.value)}
                                disabled={!isEditingScript}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Seção de Text-to-Speech */}
            <div className="card mb-4">
                <div className="card-header bg-info text-white">
                    <h5 className="mb-0">🎵 Text-to-Speech (ElevenLabs)</h5>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label">🎤 Voz</label>
                                <select
                                    className="form-select"
                                    value={selectedVoice}
                                    onChange={handleVoiceChange}
                                >
                                    <option value="RACHEL">Rachel (Feminina)</option>
                                    <option value="DREW">Drew (Masculina)</option>
                                    <option value="CLYDE">Clyde (Masculina)</option>
                                    <option value="PAUL">Paul (Masculina)</option>
                                    <option value="DOMI">Domi (Feminina)</option>
                                    <option value="DAVE">Dave (Masculina)</option>
                                    <option value="FIN">Fin (Masculina)</option>
                                    <option value="SARAH">Sarah (Feminina)</option>
                                    <option value="ANTONI">Antoni (Masculina)</option>
                                    <option value="THOMAS">Thomas (Masculina)</option>
                                    <option value="CHARLIE">Charlie (Masculina)</option>
                                    <option value="EMILY">Emily (Feminina)</option>
                                    <option value="ELLI">Elli (Feminina)</option>
                                    <option value="CALLUM">Callum (Masculina)</option>
                                    <option value="PATRICK">Patrick (Masculina)</option>
                                    <option value="HARRY">Harry (Masculina)</option>
                                    <option value="LIAM">Liam (Masculina)</option>
                                    <option value="DOROTHY">Dorothy (Feminina)</option>
                                    <option value="JOSH">Josh (Masculina)</option>
                                    <option value="ARNOLD">Arnold (Masculina)</option>
                                    <option value="CHARLOTTE">Charlotte (Feminina)</option>
                                    <option value="ALICE">Alice (Feminina)</option>
                                    <option value="MATILDA">Matilda (Feminina)</option>
                                    <option value="JAMES">James (Masculina)</option>
                                </select>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label">Ações</label>
                                <div>
                                    <button
                                        className="btn btn-info me-2"
                                        onClick={handleTextToSpeech}
                                        disabled={ttsLoading || !generatedScript}
                                    >
                                        {ttsLoading ? '⏳ Gerando...' : '🎵 Gerar Áudio'}
                                    </button>
                                    <button
                                        className="btn btn-outline-info"
                                        onClick={handleTestTTS}
                                        disabled={ttsLoading}
                                    >
                                        🧪 Teste
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {audioUrl && (
                        <div className="mt-3">
                            <label className="form-label fw-bold">Áudio Gerado:</label>
                            <audio controls className="w-100">
                                <source src={audioUrl} type="audio/mpeg" />
                                Seu navegador não suporta o elemento de áudio.
                            </audio>
                        </div>
                    )}
                </div>
            </div>

            {/* Seção de Geração de Vídeo */}
            <div className="card mb-4">
                <div className="card-header bg-warning text-dark">
                    <h5 className="mb-0">🎬 Geração de Vídeo (Runway)</h5>
                </div>
                <div className="card-body">
                    <button
                        className="btn btn-warning"
                        onClick={handleGenerateVideo}
                        disabled={runwayLoading || !runwayForm.promptImage}
                    >
                        {runwayLoading ? '⏳ Gerando...' : '🎬 Gerar Vídeo'}
                    </button>
                    
                    {generatedVideo && (
                        <div className="mt-3">
                            <label className="form-label fw-bold">Vídeo Gerado:</label>
                            <video controls className="w-100">
                                <source src={generatedVideo.output[0]} type="video/mp4" />
                                Seu navegador não suporta o elemento de vídeo.
                            </video>
                        </div>
                    )}
                </div>
            </div>

            {/* Seção de Combinação */}
            <div className="card mb-4">
                <div className="card-header bg-dark text-white">
                    <h5 className="mb-0">🔄 Combinação Vídeo + Áudio</h5>
                </div>
                <div className="card-body">
                    <div className="alert alert-info">
                        <strong>📋 Instruções:</strong> Após gerar o vídeo E o áudio, clique no botão abaixo para combinar ambos em um único arquivo final usando Shotstack.
                    </div>
                    
                    <div className="row">
                        <div className="col-md-6">
                            <button
                                className="btn btn-primary w-100"
                                onClick={handleCombineWithShotstack}
                                disabled={combineLoading || !generatedVideo || !audioUrl}
                            >
                                {combineLoading ? '⏳ Combinando...' : '🎬 Combinar com Shotstack'}
                            </button>
                        </div>
                        <div className="col-md-6">
                            <button
                                className="btn btn-secondary w-100"
                                onClick={handleCombineVideoAudio}
                                disabled={combineLoading || !generatedVideo || !audioUrl}
                            >
                                {combineLoading ? '⏳ Combinando...' : '🔄 Combinar Vídeo + Áudio'}
                            </button>
                        </div>
                    </div>
                    
                    {combinedVideo && (
                        <div className="mt-3">
                            <label className="form-label fw-bold">Vídeo Final:</label>
                            <video controls className="w-100">
                                <source src={combinedVideo.url || combinedVideo.output[0]} type="video/mp4" />
                                Seu navegador não suporta o elemento de vídeo.
                            </video>
                        </div>
                    )}
                </div>
            </div>

            {/* Seção de Diagnóstico */}
            <div className="card mb-4">
                <div className="card-header bg-secondary text-white">
                    <h5 className="mb-0">🔍 Diagnóstico do Sistema</h5>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <h6>Status dos Componentes:</h6>
                            <ul className="list-unstyled">
                                <li>✅ Shotstack Integration: Otimizado</li>
                                <li>✅ ElevenLabs TTS: URLs públicas</li>
                                <li>✅ Runway Gen-4: Funcionando</li>
                                <li>✅ ChatGPT Script: Funcionando</li>
                            </ul>
                        </div>
                        <div className="col-md-6">
                            <h6>Informações do Sistema:</h6>
                            <ul className="list-unstyled small">
                                <li>🕒 Timestamp: {getSystemInfo().timestamp}</li>
                                <li>🌐 Origin: {getSystemInfo().origin}</li>
                                <li>🔐 Token: {getSystemInfo().hasToken ? 'Presente' : 'Ausente'}</li>
                                <li>📱 User Agent: {getSystemInfo().userAgent.substring(0, 50)}...</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoTour;
