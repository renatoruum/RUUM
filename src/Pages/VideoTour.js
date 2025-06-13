//STYLES
import styles from './VideoTour.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
//Hooks
import { useState } from 'react';

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

const API_BASE = "https://0d7a-191-205-248-153.ngrok-free.app/api";

const VideoTour = () => {
    const [json, setJson] = useState(initialJson);
    const [loading, setLoading] = useState(false);

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

    const handleSendToShotstack = async () => {
        setLoading(true);
        try {
            // 1. Envia o JSON para o backend
            const response = await fetch(`${API_BASE}/send-shotstack`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(json),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message);

            const renderId = data.id;
            console.log("Render ID:", renderId);

            // 2. Polling para status
            const poll = setInterval(async () => {
                console.log("URL chamada:", `${API_BASE}/shotstack-status/${renderId}`);
                const statusRes = await fetch(`${API_BASE}/shotstack-status/${renderId}`);
                const text = await statusRes.text();
                console.log("Resposta bruta do backend:", text);
                let statusData;
                try {
                    statusData = JSON.parse(text);
                } catch (e) {
                    //alert("Resposta inesperada do backend: " + text);
                    throw e;
                }
                if (statusData.status === "done" && statusData.url) {
                    clearInterval(poll);
                    setLoading(false);
                    // Monta a URL do CDN
                    const cdnUrl = statusData.url;
                    console.log("Vídeo pronto:", cdnUrl);
                    alert("Vídeo pronto! Veja o console para a URL.");
                } else if (statusData.status === "failed") {
                    clearInterval(poll);
                    setLoading(false);
                    alert("Falha ao renderizar o vídeo.");
                }
            }, 4000); // consulta a cada 4 segundos
        } catch (err) {
            setLoading(false);
            alert("Erro ao enviar para Shotstack: " + err.message);
        }
    };

    return (
        <div>
            <h2>Editor de VideoTour</h2>
            <div>
                <label>Texto do primeiro clip:</label>
                <input
                    type="text"
                    value={json.timeline.tracks[0].clips[0].asset.text}
                    onChange={handleTextChange}
                />
            </div>
            <button onClick={handleAddClip}>Adicionar Clip</button>

            <button onClick={handleSendToShotstack} disabled={loading}>
                {loading ? "Processando..." : "Enviar para Shotstack"}
            </button>
            <pre style={{ background: "#222", color: "#fff", padding: 16, marginTop: 16 }}>
                {JSON.stringify(json, null, 2)}
            </pre>

            {loading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    background: 'rgba(30,34,45,0.85)',
                    zIndex: 3000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                }}>
                    <div style={{
                        border: '8px solid #e6eaf0',
                        borderTop: '8px solid #68bf6c',
                        borderRadius: '50%',
                        width: 70,
                        height: 70,
                        animation: 'spin 1s linear infinite',
                        marginBottom: 32,
                        background: 'transparent',
                        boxShadow: '0 0 16px 2px #fff8'
                    }} />
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 22, textAlign: 'center', textShadow: '0 2px 8px #000a' }}>
                        Processando vídeo, aguarde...
                    </div>
                    <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    `}</style>
                </div>
            )}
        </div>
    );
};

export default VideoTour;