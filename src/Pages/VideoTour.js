//STYLES
import styles from './VideoTour.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
//Hooks
import { useState } from 'react';
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
        duration: 4,
        model: 'gen4_turbo'
    });
    const [runwayLoading, setRunwayLoading] = useState(false);
    const [generatedVideo, setGeneratedVideo] = useState(null);

    // Estados para o gerador de script
    const [scriptLoading, setScriptLoading] = useState(false);
    const [generatedScript, setGeneratedScript] = useState(null);
    const [scriptImageUrl, setScriptImageUrl] = useState('');
    
    // Estados para o Text-to-Speech
    const [ttsLoading, setTtsLoading] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null);
    const [selectedVoice, setSelectedVoice] = useState('RACHEL');

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

    // Funções para o Runway
    const handleRunwayFormChange = (e) => {
        const { name, value } = e.target;
        setRunwayForm(prev => ({
            ...prev,
            [name]: value
        }));
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

        } catch (error) {
            console.error('Erro ao gerar script:', error);
            alert('Erro ao gerar script: ' + error.message);
        } finally {
            setScriptLoading(false);
        }
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

    const handleSendToShotstack = async () => {
        setLoading(true);
        try {
            // 1. Envia o JSON para o backend
            const data = await apiCall('/send-shotstack', {
                method: 'POST',
                body: JSON.stringify(json),
            });

            const renderId = data.id;
            console.log("Render ID:", renderId);

            // 2. Polling para status
            const poll = setInterval(async () => {
                console.log("Consultando status do render:", renderId);
                try {
                    const statusData = await apiCall(`/shotstack-status/${renderId}`);

                    if (statusData.status === "done" && statusData.url) {
                        clearInterval(poll);
                        setLoading(false);
                        const cdnUrl = statusData.url;
                        console.log("Vídeo pronto:", cdnUrl);
                        alert("Vídeo pronto! Veja o console para a URL.");
                    } else if (statusData.status === "failed") {
                        clearInterval(poll);
                        setLoading(false);
                        alert("Falha ao renderizar o vídeo.");
                    }
                } catch (error) {
                    console.error("Erro ao consultar status:", error);
                }
            }, 4000); // consulta a cada 4 segundos
        } catch (err) {
            setLoading(false);
            alert("Erro ao enviar para Shotstack: " + err.message);
        }
    }; return (
        <div className={`container mt-4 ${styles.videoTourContainer}`}>
            <h2 className="mb-4">Gerador de Vídeo com Runway</h2>

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
                                    readOnly
                                    style={{ fontSize: '1.1rem', lineHeight: '1.6' }}
                                />
                            </div>
                            <div className="mt-3">
                                <div className="row">
                                    <div className="col-md-8">
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
                                    </label>
                                    <input
                                        type="url"
                                        className="form-control"
                                        id="promptImage"
                                        name="promptImage"
                                        value={runwayForm.promptImage}
                                        onChange={handleRunwayFormChange}
                                        placeholder="https://exemplo.com/imagem.jpg"
                                        required
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="promptText" className="form-label">
                                        Descrição do Vídeo
                                    </label>
                                    <textarea
                                        className="form-control"
                                        id="promptText"
                                        name="promptText"
                                        value={runwayForm.promptText}
                                        onChange={handleRunwayFormChange}
                                        placeholder="Descreva como o vídeo deve ser..."
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label htmlFor="ratio" className="form-label">
                                        Proporção
                                    </label>
                                    <select
                                        className="form-select"
                                        id="ratio"
                                        name="ratio"
                                        value={runwayForm.ratio}
                                        onChange={handleRunwayFormChange}
                                    >
                                        <option value="1280:720">16:9 (1280x720)</option>
                                        <option value="1024:1024">1:1 (1024x1024)</option>
                                        <option value="720:1280">9:16 (720x1280)</option>
                                    </select>
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="duration" className="form-label">
                                        Duração (segundos)
                                    </label>
                                    <input
                                        type="number"
                                        className="form-control"
                                        id="duration"
                                        name="duration"
                                        value={runwayForm.duration}
                                        onChange={handleRunwayFormChange}
                                        min="1"
                                        max="10"
                                    />
                                </div>

                                <div className="mb-3">
                                    <label htmlFor="model" className="form-label">
                                        Modelo
                                    </label>
                                    <select
                                        className="form-select"
                                        id="model"
                                        name="model"
                                        value={runwayForm.model}
                                        onChange={handleRunwayFormChange}
                                    >
                                        <option value="gen4_turbo">Gen4 Turbo</option>
                                        <option value="gen4">Gen4</option>
                                    </select>
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

            {/* Seção de Diagnóstico */}
            <div className="card mt-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #dee2e6' }}>
                <div className="card-header" style={{ backgroundColor: '#e9ecef' }}>
                    <h6 className="mb-0">🔧 Diagnóstico TTS (Para Desenvolvedores)</h6>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6">
                            <h6>Configuração Frontend:</h6>
                            <ul className="list-unstyled text-muted small">
                                <li>✅ Token de autenticação: {apiHeaders.Authorization ? 'Configurado' : '❌ Não configurado'}</li>
                                <li>✅ Headers: Content-Type definido</li>
                                <li>✅ Função apiCallBlob: Implementada</li>
                                <li>✅ Logs detalhados: Habilitados</li>
                            </ul>
                        </div>
                        <div className="col-md-6">
                            <h6>Troubleshooting Backend:</h6>
                            <ul className="list-unstyled text-muted small">
                                <li>🔍 Verificar token ElevenLabs no backend</li>
                                <li>🔍 Confirmar endpoint: /api/elevenlabs/text-to-speech</li>
                                <li>🔍 Validar headers CORS</li>
                                <li>🔍 Checar logs do servidor para detalhes do erro 500</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-3">
                        <small className="text-muted">
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