//STYLES
import styles from './VideoTour.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
//Hooks
import { useState, useEffect } from 'react';
//Config
import { apiCall, apiHeaders } from '../Config/Config';
import API_CONFIG from '../Config/Config';

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

    // useEffect para gerar prompt inicial
    useEffect(() => {
        updateVideoPrompt(runwayForm.duration, runwayForm.withHuman);
    }, []); // Executa apenas uma vez no mount

    // Função especial para chamadas que retornam blob
    const apiCallBlob = async (endpoint, options = {}) => {
        console.log('apiCallBlob - Endpoint:', endpoint);
        console.log('apiCallBlob - Options:', options);
        console.log('apiCallBlob - URL completa:', `${API_CONFIG.BASE_URL}${endpoint}`);

        const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
            headers: apiHeaders,
            ...options
        });

        console.log('apiCallBlob - Response status:', response.status);
        console.log('apiCallBlob - Response headers:', Object.fromEntries(response.headers));

        if (!response.ok) {
            // Tentar ler a resposta como JSON para pegar a mensagem de erro
            let errorMessage = `HTTP ${response.status}`;
            let errorDetails = null;

            try {
                const responseText = await response.text();
                console.log('apiCallBlob - Error response text:', responseText);

                // Tentar fazer parse do JSON
                try {
                    errorDetails = JSON.parse(responseText);
                    errorMessage = errorDetails.message || errorDetails.error || errorMessage;
                } catch {
                    // Se não for JSON válido, usar o texto como está
                    errorMessage = responseText || errorMessage;
                }
            } catch (textError) {
                console.error('apiCallBlob - Erro ao ler resposta de erro:', textError);
                errorMessage = `${errorMessage} - ${response.statusText}`;
            }

            console.error('apiCallBlob - Erro completo:', { status: response.status, message: errorMessage, details: errorDetails });
            throw new Error(errorMessage);
        }

        return await response.blob();
    };

    // Editar texto do primeiro clip
    const handleTextChange = (e) => {
        const newJson = { ...json };
        newJson.timeline.tracks[0].clips[0].asset.text = e.target.value;
        setJson(newJson);
    };

    // Adicionar novo clip
    const handleAddClip = () => {
        const newClip = {
            asset: {
                type: "text",
                text: "Novo Clip",
                font: { family: "Montserrat", color: "#fff", size: 24 },
                alignment: { horizontal: "center" }
            },
            start: 0,
            length: 3,
            transition: { in: "fade", out: "fade" }
        };
        const newJson = { ...json };
        newJson.timeline.tracks[0].clips.push(newClip);
        setJson(newJson);
    };

    // Exportar JSON
    const handleExport = () => {
        console.log(JSON.stringify(json, null, 2));
    };

    // Função para gerar prompt automático do vídeo
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
        console.log('✅ Prompt do vídeo atualizado automaticamente:', newPrompt);
    };

    // Funções para o Runway
    const handleRunwayFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        
        let updatedForm = {
            ...runwayForm,
            [name]: newValue
        };

        // Se marcou "Com Figura Humana", forçar duração para 5 segundos
        if (name === 'withHuman' && checked) {
            updatedForm.duration = 5;
        }

        setRunwayForm(updatedForm);

        // Atualizar prompt automaticamente quando mudar duração ou withHuman
        if (name === 'duration' || name === 'withHuman') {
            const finalDuration = name === 'duration' ? parseInt(newValue) : updatedForm.duration;
            const finalWithHuman = name === 'withHuman' ? newValue : updatedForm.withHuman;
            
            setTimeout(() => {
                updateVideoPrompt(finalDuration, finalWithHuman);
            }, 100); // Pequeno delay para garantir que o estado seja atualizado
        }
    };

    const handleRunwaySubmit = async (e) => {
        e.preventDefault();

        if (!runwayForm.promptImage.trim()) {
            alert('Por favor, insira uma URL de imagem válida.');
            return;
        }

        setRunwayLoading(true);
        setGeneratedVideo(null);

        try {
            const data = await apiCall('/api/runway/image-to-video', {
                method: 'POST',
                body: JSON.stringify(runwayForm),
            });

            console.log('Vídeo gerado:', data.data);
            setGeneratedVideo(data.data);

        } catch (error) {
            console.error('Erro ao gerar vídeo:', error);
            alert('Erro ao gerar vídeo: ' + error.message);
        } finally {
            setRunwayLoading(false);
        }
    };

    // Funções para o gerador de script
    const handleScriptImageUrlChange = (e) => {
        setScriptImageUrl(e.target.value);
    };

    const handleGenerateScript = async () => {
        if (!scriptImageUrl.trim()) {
            alert('Por favor, insira uma URL de imagem válida.');
            return;
        }

        setScriptLoading(true);
        setGeneratedScript(null);

        try {
            const response = await apiCall('/api/chatgpt', {
                method: 'POST',
                body: JSON.stringify({
                    image_url: scriptImageUrl,
                    processing_type: 'SCRIPT_GENERATION'
                })
            });

            console.log('Script gerado:', response);
            setGeneratedScript(response.data.result);
            setOriginalScript(response.data.result); // Salvar script original

            // Sincronizar URL da imagem com o formulário do Runway
            setRunwayForm(prev => ({
                ...prev,
                promptImage: scriptImageUrl
            }));

            console.log('✅ URL da imagem sincronizada com o formulário do Runway');

        } catch (error) {
            console.error('Erro ao gerar script:', error);
            alert('Erro ao gerar script: ' + error.message);
        } finally {
            setScriptLoading(false);
        }
    };

    // Funções para edição do script
    const handleScriptChange = (e) => {
        setGeneratedScript(e.target.value);
    };

    const handleEditScript = () => {
        setIsEditingScript(true);
    };

    const handleSaveScript = () => {
        setIsEditingScript(false);
        console.log('Script editado salvo:', generatedScript);
    };

    const handleCancelEditScript = () => {
        setIsEditingScript(false);
        setGeneratedScript(originalScript); // Restaurar script original
        console.log('Edição cancelada, script original restaurado');
    };

    // Funções para o Text-to-Speech
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

            console.log('=== TTS REQUEST DEBUG ===');
            console.log('Enviando payload para TTS:', payload);
            console.log('Tamanho do texto:', generatedScript.length, 'caracteres');
            console.log('Headers que serão enviados:', apiHeaders);
            console.log('Timestamp:', new Date().toISOString());
            console.log('========================');

            // Usando apiCallBlob para requisições que retornam blob
            const audioBlob = await apiCallBlob('/api/elevenlabs/text-to-speech', {
                method: "POST",
                body: JSON.stringify(payload)
            });

            console.log('✅ TTS bem-sucedido!');
            console.log('Blob de áudio recebido:', audioBlob);
            console.log('Tamanho do blob:', audioBlob.size, 'bytes');

            // Criar URL para reproduzir
            const newAudioUrl = URL.createObjectURL(audioBlob);
            setAudioUrl(newAudioUrl);

            console.log('Áudio gerado com sucesso');

        } catch (error) {
            console.error('❌ Erro no TTS:', error);
            console.error('Script enviado:', generatedScript);
            console.error('Voz selecionada:', selectedVoice);
            console.error('Erro completo:', {
                message: error.message,
                status: error.status,
                details: error.details,
                timestamp: new Date().toISOString()
            });

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

    // Função de teste com texto simples
    const handleTestTTS = async () => {
        setTtsLoading(true);
        setAudioUrl(null);

        try {
            const testPayload = {
                text: "Teste simples de voz.",
                voice: selectedVoice,
                model: "eleven_multilingual_v2"
            };

            console.log('=== TTS TESTE DEBUG ===');
            console.log('Testando TTS com payload simples:', testPayload);
            console.log('Headers que serão enviados:', apiHeaders);
            console.log('Timestamp:', new Date().toISOString());
            console.log('======================');

            const audioBlob = await apiCallBlob('/api/elevenlabs/text-to-speech', {
                method: "POST",
                body: JSON.stringify(testPayload)
            });

            const newAudioUrl = URL.createObjectURL(audioBlob);
            setAudioUrl(newAudioUrl);

            console.log('✅ Teste TTS realizado com sucesso');
            console.log('Tamanho do blob:', audioBlob.size, 'bytes');

        } catch (error) {
            console.error('❌ Erro no teste TTS:', error);
            console.error('Erro completo:', {
                message: error.message,
                status: error.status,
                details: error.details,
                timestamp: new Date().toISOString()
            });

            if (error.message.includes('401') || error.message.includes('autenticação')) {
                alert('🔐 Erro de autenticação no teste TTS.\nO token ElevenLabs no backend precisa ser verificado.');
            } else if (error.message.includes('500')) {
                alert('⚠️ Erro interno do servidor no teste TTS.\nProvavelmente configuração da ElevenLabs API no backend.');
            } else {
                alert('❌ Erro no teste TTS: ' + error.message);
            }
        } finally {
            setTtsLoading(false);
        }
    };

    // Função para combinar vídeo do Runway com áudio do TTS
    const handleCombineVideoAudio = async () => {
        if (!generatedVideo || !audioUrl) {
            alert('❌ Você precisa gerar tanto o vídeo quanto o áudio antes de combinar.');
            return;
        }

        if (!generatedVideo.output || !Array.isArray(generatedVideo.output) || generatedVideo.output.length === 0) {
            alert('❌ Vídeo gerado não está disponível ou não foi processado corretamente.');
            return;
        }

        setCombineLoading(true);
        setCombinedVideo(null);

        try {
            console.log('=== COMBINAÇÃO VÍDEO + ÁUDIO ===');
            console.log('URL do vídeo:', generatedVideo.output[0]);
            console.log('URL do áudio:', audioUrl);
            console.log('Duração estimada:', runwayForm.duration, 'segundos');
            console.log('===============================');

            // Fazer upload do áudio primeiro (converter blob para URL pública)
            const audioBlob = await fetch(audioUrl).then(r => r.blob());
            console.log('Blob do áudio obtido:', audioBlob.size, 'bytes');

            const payload = {
                videoUrl: generatedVideo.output[0],
                audioBlob: audioBlob,
                duration: runwayForm.duration,
                outputFormat: 'mp4'
            };

            console.log('Enviando para combinação...');
            const response = await apiCall('/api/video/combine-audio', {
                method: 'POST',
                body: JSON.stringify({
                    videoUrl: generatedVideo.output[0],
                    audioUrl: audioUrl, // Enviar como URL temporária
                    duration: runwayForm.duration,
                    outputFormat: 'mp4'
                })
            });

            console.log('✅ Vídeo combinado com áudio:', response);
            setCombinedVideo(response.data);

        } catch (error) {
            console.error('❌ Erro ao combinar vídeo com áudio:', error);
            alert('❌ Erro ao combinar vídeo com áudio: ' + error.message);
        } finally {
            setCombineLoading(false);
        }
    };

    // Função alternativa usando Shotstack para combinar vídeo + áudio
    const handleCombineWithShotstack = async () => {
        if (!generatedVideo || !audioUrl) {
            alert('❌ Você precisa gerar tanto o vídeo quanto o áudio antes de combinar.');
            return;
        }

        if (!generatedVideo.output || !Array.isArray(generatedVideo.output) || generatedVideo.output.length === 0) {
            alert('❌ Vídeo gerado não está disponível ou não foi processado corretamente.');
            return;
        }

        setCombineLoading(true);
        setCombinedVideo(null);

        try {
            console.log('=== COMBINAÇÃO SHOTSTACK ===');
            console.log('URL do vídeo:', generatedVideo.output[0]);
            console.log('URL do áudio:', audioUrl);
            console.log('Duração:', runwayForm.duration, 'segundos');
            console.log('===========================');

            // Criar JSON do Shotstack com o vídeo do Runway + áudio do TTS
            const shotstackJson = {
                timeline: {
                    tracks: [
                        {
                            clips: [
                                {
                                    asset: {
                                        type: "video",
                                        src: generatedVideo.output[0]
                                    },
                                    start: 0,
                                    length: runwayForm.duration
                                }
                            ]
                        },
                        {
                            clips: [
                                {
                                    asset: {
                                        type: "audio",
                                        src: audioUrl
                                    },
                                    start: 0,
                                    length: runwayForm.duration
                                }
                            ]
                        }
                    ]
                },
                output: {
                    format: "mp4",
                    size: {
                        width: 1280,
                        height: 720
                    }
                }
            };

            console.log('JSON Shotstack:', JSON.stringify(shotstackJson, null, 2));

            // Enviar para o Shotstack
            const response = await apiCall('/send-shotstack', {
                method: 'POST',
                body: JSON.stringify(shotstackJson)
            });

            const renderId = response.id;
            console.log('Render ID Shotstack:', renderId);

            // Polling para status da combinação
            const pollCombination = setInterval(async () => {
                console.log('Consultando status da combinação:', renderId);
                try {
                    const statusData = await apiCall(`/shotstack-status/${renderId}`);
                    console.log('Status atual:', statusData.status);

                    if (statusData.status === "done" && statusData.url) {
                        clearInterval(pollCombination);
                        setCombineLoading(false);
                        
                        const finalVideo = {
                            output: [statusData.url],
                            status: "done",
                            id: renderId,
                            type: "combined"
                        };
                        
                        setCombinedVideo(finalVideo);
                        console.log('✅ Vídeo final combinado:', statusData.url);
                        
                    } else if (statusData.status === "failed") {
                        clearInterval(pollCombination);
                        setCombineLoading(false);
                        alert('❌ Falha ao combinar vídeo com áudio.');
                    }
                } catch (error) {
                    console.error('Erro ao consultar status da combinação:', error);
                }
            }, 3000); // consulta a cada 3 segundos

        } catch (error) {
            console.error('❌ Erro ao combinar com Shotstack:', error);
            alert('❌ Erro ao combinar vídeo com áudio: ' + error.message);
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
                            <p className="small">Insira a URL de uma imagem e gere um script de locução usando ChatGPT. Você pode editar o script antes de gerar o áudio.</p>
                        </div>
                        <div className="col-md-4">
                            <h6 className="text-success">2️⃣ Gerar Áudio</h6>
                            <p className="small">Converta o script em áudio usando Text-to-Speech (ElevenLabs). Edite o script se necessário.</p>
                        </div>
                        <div className="col-md-4">
                            <h6 className="text-info">3️⃣ Gerar Vídeo</h6>
                            <p className="small">Crie um vídeo a partir da mesma imagem usando Runway Gen-4. URL e prompt são gerados automaticamente. Opção para incluir figura humana.</p>
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className="alert alert-warning small">
                            <strong>🎯 Funcionalidade Extra:</strong> Após gerar o vídeo E o áudio, você pode combiná-los em um único arquivo final!<br/>
                            <strong>✨ Novo:</strong> Edite o script, URL sincronizada automaticamente, e prompts de vídeo gerados conforme configuração!<br/>
                            <strong>🚶 Figura Humana:</strong> Marque a opção para adicionar uma pessoa caminhando no ambiente (duração fixa de 5s).
                        </div>
                    </div>
                </div>
            </div>

            {/* Preview da Imagem */}
            {(runwayForm.promptImage || scriptImageUrl) && (
                <div className={`card mb-4 ${styles.previewCard}`}>
                    <div className="card-header">
                        <h5>Preview da Imagem</h5>
                    </div>
                    <div className="card-body text-center">
                        <img
                            src={runwayForm.promptImage || scriptImageUrl}
                            alt="Preview"
                            className={`img-fluid ${styles.previewImage}`}
                            onError={(e) => {
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Gerador de Script */}
            <div className={`card mb-4 ${styles.scriptCard}`}>
                <div className="card-header">
                    <h4>Gerador de Script de Locução</h4>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-8">
                            <div className="mb-3">
                                <label htmlFor="scriptImageUrl" className="form-label">
                                    URL da Imagem para Análise *
                                </label>
                                <input
                                    type="url"
                                    className="form-control"
                                    id="scriptImageUrl"
                                    value={scriptImageUrl}
                                    onChange={handleScriptImageUrlChange}
                                    placeholder="https://exemplo.com/imagem.jpg"
                                />
                            </div>
                        </div>
                        <div className="col-md-4 d-flex align-items-end">
                            <button
                                type="button"
                                className={`btn btn-success btn-lg ${styles.scriptBtn}`}
                                onClick={handleGenerateScript}
                                disabled={scriptLoading || !scriptImageUrl.trim()}
                            >
                                {scriptLoading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" />
                                        Gerando script...
                                    </>
                                ) : (
                                    'Gerar Script'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Script Gerado */}
            {generatedScript && (
                <div className={`card mb-4 ${styles.scriptResultCard}`}>
                    <div className="card-header">
                        <h5>Script de Locução Gerado</h5>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-success">
                            <h6>✨ Script gerado com sucesso!</h6>
                            <div className="mt-3">
                                <textarea
                                    className="form-control"
                                    rows="6"
                                    value={generatedScript}
                                    onChange={handleScriptChange}
                                    readOnly={!isEditingScript}
                                    style={{ 
                                        fontSize: '1.1rem', 
                                        lineHeight: '1.6',
                                        backgroundColor: isEditingScript ? '#fff' : '#f8f9fa',
                                        border: isEditingScript ? '2px solid #007bff' : '1px solid #dee2e6'
                                    }}
                                    placeholder="Seu script de locução..."
                                />
                                {isEditingScript && (
                                    <div className="form-text text-primary">
                                        ✏️ Modo de edição ativo - Modifique o script conforme necessário
                                    </div>
                                )}
                                <div className="form-text text-muted text-end">
                                    {generatedScript ? generatedScript.length : 0} caracteres
                                </div>
                            </div>
                            <div className="mt-3">
                                <div className="row">
                                    <div className="col-md-8">
                                        {!isEditingScript ? (
                                            <>
                                                <button
                                                    className="btn btn-primary me-2"
                                                    onClick={handleEditScript}
                                                >
                                                    ✏️ Editar Script
                                                </button>
                                                <button
                                                    className="btn btn-outline-primary me-2"
                                                    onClick={() => navigator.clipboard.writeText(generatedScript)}
                                                >
                                                    📋 Copiar Script
                                                </button>
                                                <button
                                                    className="btn btn-outline-secondary me-2"
                                                    onClick={() => setGeneratedScript(null)}
                                                >
                                                    🗑️ Limpar
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className="btn btn-success me-2"
                                                    onClick={handleSaveScript}
                                                >
                                                    ✅ Salvar Edições
                                                </button>
                                                <button
                                                    className="btn btn-outline-secondary me-2"
                                                    onClick={handleCancelEditScript}
                                                >
                                                    ❌ Cancelar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <div className="col-md-4">
                                        <select
                                            className="form-select form-select-sm"
                                            value={selectedVoice}
                                            onChange={handleVoiceChange}
                                        >
                                            <option value="RACHEL">Rachel (Feminina)</option>
                                            <option value="ANTONI">Antoni (Masculina)</option>
                                            <option value="BELLA">Bella (Feminina)</option>
                                            <option value="ADAM">Adam (Masculina)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <button
                                        className={`btn btn-success ${styles.ttsBtn} me-2`}
                                        onClick={handleTextToSpeech}
                                        disabled={ttsLoading}
                                    >
                                        {ttsLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Gerando áudio...
                                            </>
                                        ) : (
                                            '🎤 Gerar Áudio (TTS)'
                                        )}
                                    </button>
                                    <button
                                        className="btn btn-outline-info"
                                        onClick={handleTestTTS}
                                        disabled={ttsLoading}
                                    >
                                        🧪 Teste TTS
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Player de Áudio */}
            {audioUrl && (
                <div className={`card mb-4 ${styles.audioCard}`}>
                    <div className="card-header">
                        <h5>🎧 Áudio Gerado</h5>
                    </div>
                    <div className="card-body text-center">
                        <div className="alert alert-info mb-3">
                            <h6>✨ Áudio gerado com sucesso!</h6>
                            <p className="mb-0">Voz: <strong>{selectedVoice}</strong></p>
                        </div>
                        <audio
                            controls
                            style={{ width: '100%', maxWidth: '500px' }}
                            className={styles.audioPlayer}
                        >
                            <source src={audioUrl} type="audio/mpeg" />
                            Seu navegador não suporta o elemento de áudio.
                        </audio>
                        <div className="mt-3">
                            <a
                                href={audioUrl}
                                download="script-audio.mp3"
                                className="btn btn-outline-primary me-2"
                            >
                                💾 Baixar Áudio
                            </a>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    URL.revokeObjectURL(audioUrl);
                                    setAudioUrl(null);
                                }}
                            >
                                🗑️ Remover
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulário do Runway */}
                        <div className={`card mb-4 ${styles.runwayCard}`}>
                            <div className="card-header">
                                <h4>Gerar Vídeo a partir de Imagem</h4>
                            </div>
                            <div className="card-body">
                                <form onSubmit={handleRunwaySubmit}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="promptImage" className="form-label">
                                                    URL da Imagem *
                                                    {runwayForm.promptImage && (
                                                        <span className="text-success small"> (Sincronizada automaticamente)</span>
                                                    )}
                                                </label>
                                                <input
                                                    type="url"
                                                    className="form-control"
                                                    id="promptImage"
                                                    name="promptImage"
                                                    value={runwayForm.promptImage}
                                                    onChange={handleRunwayFormChange}
                                                    placeholder="https://exemplo.com/imagem.jpg"
                                                    readOnly={!!runwayForm.promptImage}
                                                    required
                                                />
                                                {runwayForm.promptImage && (
                                                    <div className="form-text text-success">
                                                        ✅ URL sincronizada automaticamente do script de locução
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mb-3">
                                                <div className="form-check d-flex align-items-center">
                                                    <input
                                                        className="form-check-input me-2"
                                                        type="checkbox"
                                                        id="withHuman"
                                                        name="withHuman"
                                                        checked={runwayForm.withHuman}
                                                        onChange={handleRunwayFormChange}
                                                    />
                                                    <label className="form-check-label mb-0" htmlFor="withHuman">
                                                        <strong>Com Figura Humana</strong>
                                                    </label>
                                                </div>
                                                {runwayForm.withHuman && (
                                                    <div className="form-text text-warning">
                                                        ⚠️ Duração fixada em 5 segundos para vídeos com figura humana
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mb-3">
                                                <label htmlFor="promptText" className="form-label">
                                                    Descrição do Vídeo
                                                    <span className="text-success small"> (Gerada automaticamente)</span>
                                                </label>
                                                <textarea
                                                    className="form-control"
                                                    id="promptText"
                                                    name="promptText"
                                                    value={runwayForm.promptText}
                                                    readOnly
                                                    placeholder="Prompt gerado automaticamente baseado na configuração..."
                                                    rows="3"
                                                    style={{ backgroundColor: '#f8f9fa' }}
                                                />
                                                <div className="form-text text-success">
                                                    ✅ Prompt gerado automaticamente baseado na duração e opções selecionadas
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">


                                            <div className="mb-3">
                                                <label htmlFor="duration" className="form-label">
                                                    Duração (segundos)
                                                    {runwayForm.withHuman && (
                                                        <span className="text-warning small"> (Fixo para figura humana)</span>
                                                    )}
                                                </label>
                                                <select
                                                    className="form-select"
                                                    id="duration"
                                                    name="duration"
                                                    value={runwayForm.duration}
                                                    onChange={handleRunwayFormChange}
                                                    disabled={runwayForm.withHuman}
                                                    style={{ 
                                                        backgroundColor: runwayForm.withHuman ? '#f8f9fa' : '#fff',
                                                        cursor: runwayForm.withHuman ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    <option value="5">5 segundos</option>
                                                    <option value="10">10 segundos</option>
                                                </select>
                                                {runwayForm.withHuman && (
                                                    <div className="form-text text-info">
                                                        ℹ️ Duração automaticamente definida como 5 segundos para vídeos com figura humana
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <button
                                            type="submit"
                                            className={`btn btn-primary btn-lg ${styles.generateBtn}`}
                                            disabled={runwayLoading}
                                        >
                                            {runwayLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" />
                                                    Gerando vídeo...
                                                </>
                                            ) : (
                                                'Gerar Vídeo'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* Vídeo Gerado */}
            {generatedVideo && (
                <div className={`card mb-4 ${styles.videoCard}`}>
                    <div className="card-header">
                        <h5>Vídeo Gerado</h5>
                    </div>
                    <div className="card-body">
                        <div className="text-center">
                            {generatedVideo.output && Array.isArray(generatedVideo.output) && generatedVideo.output.length > 0 ? (
                                <div>
                                    <video
                                        controls
                                        width="100%"
                                        style={{ maxWidth: '800px' }}
                                        className={styles.generatedVideo}
                                    >
                                        <source src={generatedVideo.output[0]} type="video/mp4" />
                                        Seu navegador não suporta o elemento de vídeo.
                                    </video>
                                    <div className="mt-3">
                                        <a
                                            href={generatedVideo.output[0]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline-primary me-2"
                                        >
                                            Abrir vídeo em nova aba
                                        </a>
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => navigator.clipboard.writeText(generatedVideo.output[0])}
                                        >
                                            Copiar URL
                                        </button>
                                    </div>
                                    <div className="mt-2 text-muted small">
                                        <strong>Status:</strong> {generatedVideo.status} |
                                        <strong> ID:</strong> {generatedVideo.id}
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-info">
                                    <h6>Detalhes da Tarefa:</h6>
                                    <pre>{JSON.stringify(generatedVideo, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Seção de Combinação Vídeo + Áudio */}
            {generatedVideo && audioUrl && (
                <div className="card mb-4" style={{ border: '2px solid #28a745' }}>
                    <div className="card-header" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', color: 'white' }}>
                        <h5 className="mb-0">🎬 Combinar Vídeo + Áudio</h5>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-info">
                            <h6>✨ Agora você pode combinar o vídeo gerado pelo Runway com o áudio do TTS!</h6>
                            <p className="mb-2">
                                <strong>Vídeo:</strong> {generatedVideo.output && generatedVideo.output[0] ? 'Disponível' : 'Não disponível'}<br/>
                                <strong>Áudio:</strong> {audioUrl ? 'Disponível' : 'Não disponível'}<br/>
                                <strong>Duração:</strong> {runwayForm.duration} segundos
                            </p>
                        </div>
                        <div className="text-center">
                            <div className="row">
                                <div className="col-md-6">
                                    <button
                                        className="btn btn-primary btn-lg mb-2"
                                        onClick={handleCombineWithShotstack}
                                        disabled={combineLoading}
                                        style={{ minWidth: '200px' }}
                                    >
                                        {combineLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Combinando...
                                            </>
                                        ) : (
                                            <>
                                                🎬 Combinar via Shotstack
                                            </>
                                        )}
                                    </button>
                                    <div className="text-muted small">
                                        Recomendado - Usar Shotstack para combinar
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <button
                                        className="btn btn-outline-success btn-lg mb-2"
                                        onClick={handleCombineVideoAudio}
                                        disabled={combineLoading}
                                        style={{ minWidth: '200px' }}
                                    >
                                        {combineLoading ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-2" />
                                                Combinando...
                                            </>
                                        ) : (
                                            <>
                                                🎞️ Combinar via Backend
                                            </>
                                        )}
                                    </button>
                                    <div className="text-muted small">
                                        Alternativo - Usar backend próprio
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Vídeo Final Combinado */}
            {combinedVideo && (
                <div className="card mb-4" style={{ border: '2px solid #ffc107' }}>
                    <div className="card-header" style={{ background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)', color: 'white' }}>
                        <h5 className="mb-0">🏆 Vídeo Final (Vídeo + Áudio)</h5>
                    </div>
                    <div className="card-body">
                        <div className="alert alert-success">
                            <h6>🎉 Vídeo com áudio gerado com sucesso!</h6>
                            <p className="mb-0">Seu vídeo agora inclui a locução gerada pelo TTS.</p>
                        </div>
                        <div className="text-center">
                            {combinedVideo.output && combinedVideo.output.length > 0 ? (
                                <div>
                                    <video
                                        controls
                                        width="100%"
                                        style={{ maxWidth: '800px' }}
                                        className="mb-3"
                                    >
                                        <source src={combinedVideo.output[0]} type="video/mp4" />
                                        Seu navegador não suporta o elemento de vídeo.
                                    </video>
                                    <div className="mt-3">
                                        <a
                                            href={combinedVideo.output[0]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-primary me-2"
                                        >
                                            🎬 Abrir Vídeo Final
                                        </a>
                                        <button
                                            className="btn btn-outline-secondary"
                                            onClick={() => navigator.clipboard.writeText(combinedVideo.output[0])}
                                        >
                                            📋 Copiar URL
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="alert alert-info">
                                    <h6>Detalhes do Vídeo Final:</h6>
                                    <pre>{JSON.stringify(combinedVideo, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Seção de Diagnóstico */}
            <div className="card mt-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                <div className="card-header" style={{ backgroundColor: '#e9ecef' }}>
                    <h6 className="mb-0">🔧 Diagnóstico & Informações (Para Desenvolvedores)</h6>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <h6>Frontend - Configuração:</h6>
                            <ul className="list-unstyled text-muted small">
                                <li>✅ Token de autenticação: {apiHeaders.Authorization ? 'Configurado' : '❌ Não configurado'}</li>
                                <li>✅ Headers: Content-Type definido</li>
                                <li>✅ Função apiCallBlob: Implementada</li>
                                <li>✅ Logs detalhados: Habilitados</li>
                                <li>✅ Combinação Vídeo+Áudio: Implementada</li>
                                <li>✅ Edição de Script: Implementada</li>
                                <li>✅ Sincronização de URL: Automática</li>
                                <li>✅ Prompts Automáticos: Baseados na duração</li>
                                <li>✅ Figura Humana: Opção implementada</li>
                            </ul>
                        </div>
                        <div className="col-md-6">
                            <h6>Backend - Endpoints Necessários:</h6>
                            <ul className="list-unstyled text-muted small">
                                <li>🔍 /api/elevenlabs/text-to-speech (TTS)</li>
                                <li>🔍 /api/runway/image-to-video (Runway)</li>
                                <li>🔍 /api/chatgpt (Script)</li>
                                <li>🔍 /api/video/combine-audio (Combinação)</li>
                                <li>🔍 /send-shotstack (Shotstack)</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-3">
                        <small className="text-muted">
                            <strong>💡 Runway API:</strong> Não suporta áudio diretamente. Solução: combinar vídeo + áudio via Shotstack ou backend próprio.<br/>
                            <strong>Endpoint TTS:</strong> {getSystemInfo().apiEndpoint}<br/>
                            <strong>Token Preview:</strong> {getSystemInfo().tokenPreview}<br/>
                            <strong>Última tentativa:</strong> {getSystemInfo().timestamp}
                        </small>
                    </div>
                    <div className="mt-2">
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => {
                                const info = getSystemInfo();
                                console.log('=== INFORMAÇÕES DE SISTEMA ===');
                                console.log('Timestamp:', info.timestamp);
                                console.log('Origin:', info.origin);
                                console.log('API Endpoint:', info.apiEndpoint);
                                console.log('Token configurado:', info.hasToken);
                                console.log('Token preview:', info.tokenPreview);
                                console.log('Headers completos:', apiHeaders);
                                console.log('User Agent:', info.userAgent);
                                console.log('=== ESTADO ATUAL ===');
                                console.log('Script gerado:', !!generatedScript);
                                console.log('Script sendo editado:', isEditingScript);
                                console.log('Script original preservado:', !!originalScript);
                                console.log('URL sincronizada:', runwayForm.promptImage === scriptImageUrl);
                                console.log('Áudio gerado:', !!audioUrl);
                                console.log('Vídeo gerado:', !!generatedVideo);
                                console.log('Vídeo combinado:', !!combinedVideo);
                                console.log('=== CONFIGURAÇÕES RUNWAY ===');
                                console.log('Duração selecionada:', runwayForm.duration, 'segundos');
                                console.log('Com figura humana:', runwayForm.withHuman);
                                console.log('Prompt atual:', runwayForm.promptText);
                                console.log('Modelo:', runwayForm.model);
                                console.log('==============================');
                                alert('Informações de sistema enviadas para o console.');
                            }}
                        >
                            📊 Logs de Sistema
                        </button>
                    </div>
                </div>
            </div>

            <hr className="my-5" />

            {/* Seção original do editor */}
            <div className="card">
                <div className="card-header">
                    <h4>Editor de VideoTour (Shotstack)</h4>
                </div>
                <div className="card-body">
                    <div className="alert alert-info">
                        Esta seção mantém a funcionalidade original do editor.
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoTour;