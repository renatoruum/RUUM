# Prompts Automáticos para Vídeo Runway

## 📋 Funcionalidade Implementada

Sistema de **geração automática de prompts** para vídeos do Runway baseado na duração e presença de figura humana.

## 🎯 Regras de Geração de Prompts

### **Vídeo de 5 segundos (sem figura humana)**
```
POV slow motion forward.
```

### **Vídeo de 10 segundos (sem figura humana)**
```
POV slow motion forward. Keep the original image unchanged. No new elements, no hidden areas revealed.
```

### **Vídeo com Figura Humana (sempre 5 segundos)**
```
Introduce a man walking through the room. Make sure lighting and perspective match the original image and ensure that the character considers original furniture placement.
```

## 🚶 Funcionalidade "Com Figura Humana"

### **Comportamento:**
- **Checkbox**: "Com Figura Humana"
- **Duração forçada**: Automaticamente define para 5 segundos
- **Campo duração**: Fica desabilitado quando marcado
- **Prompt específico**: Usa prompt para figura humana

### **Interface:**
- ✅ Checkbox com label em negrito
- ⚠️ Aviso sobre duração fixa
- 🔒 Campo duração desabilitado
- ℹ️ Texto explicativo

## 🔄 Fluxo Automático

### **1. Componente Inicializa**
```javascript
useEffect(() => {
    updateVideoPrompt(runwayForm.duration, runwayForm.withHuman);
}, []); // Gera prompt inicial
```

### **2. Usuário Altera Duração**
```javascript
// Trigger automático
if (name === 'duration') {
    updateVideoPrompt(newDuration, runwayForm.withHuman);
}
```

### **3. Usuário Marca "Com Figura Humana"**
```javascript
// Força duração para 5s e atualiza prompt
if (name === 'withHuman' && checked) {
    updatedForm.duration = 5;
    updateVideoPrompt(5, true);
}
```

### **4. Usuário Desmarca "Com Figura Humana"**
```javascript
// Volta ao prompt baseado na duração atual
updateVideoPrompt(updatedForm.duration, false);
```

## 💻 Implementação Técnica

### **Estados Adicionados:**
```javascript
const [runwayForm, setRunwayForm] = useState({
    // ...outros campos...
    withHuman: false  // Novo campo para figura humana
});
```

### **Função de Geração:**
```javascript
const generateVideoPrompt = (duration, withHuman) => {
    if (withHuman) {
        return "Introduce a man walking through the room...";
    }
    
    if (duration === 5) {
        return "POV slow motion forward.";
    } else if (duration === 10) {
        return "POV slow motion forward. Keep the original...";
    }
    
    return "POV slow motion forward.";
};
```

### **Função de Atualização:**
```javascript
const updateVideoPrompt = (duration, withHuman) => {
    const newPrompt = generateVideoPrompt(duration, withHuman);
    setRunwayForm(prev => ({
        ...prev,
        promptText: newPrompt
    }));
};
```

## 🎨 Interface do Usuário

### **Campo "Com Figura Humana":**
```jsx
<div className="form-check">
    <input
        className="form-check-input"
        type="checkbox"
        id="withHuman"
        name="withHuman"
        checked={runwayForm.withHuman}
        onChange={handleRunwayFormChange}
    />
    <label className="form-check-label">
        <strong>Com Figura Humana</strong>
    </label>
</div>
```

### **Campo Duração (condicional):**
```jsx
<select
    disabled={runwayForm.withHuman}
    style={{ 
        backgroundColor: runwayForm.withHuman ? '#f8f9fa' : '#fff',
        cursor: runwayForm.withHuman ? 'not-allowed' : 'pointer'
    }}
>
    <option value="5">5 segundos</option>
    <option value="10">10 segundos</option>
</select>
```

### **Campo Descrição (readonly):**
```jsx
<textarea
    value={runwayForm.promptText}
    readOnly
    style={{ backgroundColor: '#f8f9fa' }}
    placeholder="Prompt gerado automaticamente..."
/>
```

## 📊 Feedback Visual

### **Indicadores de Estado:**
- ✅ **Verde**: Campo sincronizado/automático
- ⚠️ **Amarelo**: Aviso sobre mudança de comportamento
- ℹ️ **Azul**: Informação adicional
- 🔒 **Cinza**: Campo desabilitado

### **Mensagens Contextuais:**
```jsx
{runwayForm.withHuman && (
    <div className="form-text text-warning">
        ⚠️ Duração fixada em 5 segundos para vídeos com figura humana
    </div>
)}

{runwayForm.withHuman && (
    <div className="form-text text-info">
        ℹ️ Duração automaticamente definida como 5 segundos para vídeos com figura humana
    </div>
)}
```

## 🔧 Logs e Debugging

### **Logs Automáticos:**
```javascript
console.log('✅ Prompt do vídeo atualizado automaticamente:', newPrompt);
```

### **Logs de Sistema:**
```javascript
console.log('=== CONFIGURAÇÕES RUNWAY ===');
console.log('Duração selecionada:', runwayForm.duration, 'segundos');
console.log('Com figura humana:', runwayForm.withHuman);
console.log('Prompt atual:', runwayForm.promptText);
console.log('Modelo:', runwayForm.model);
```

## 🎯 Benefícios

### **Para o Usuário:**
- ✅ **Prompts otimizados** para cada tipo de vídeo
- ✅ **Interface intuitiva** com feedback visual
- ✅ **Menos trabalho manual** (geração automática)
- ✅ **Resultados consistentes** baseados em regras definidas

### **Para o Negócio:**
- ✅ **Qualidade padronizada** dos vídeos
- ✅ **Processo otimizado** e escalável
- ✅ **Menos erros** de configuração
- ✅ **Experiência mais profissional**

## 🚀 Como Usar

### **Vídeo Padrão (5-10s):**
1. Escolher duração (5 ou 10 segundos)
2. Prompt é gerado automaticamente
3. Gerar vídeo normalmente

### **Vídeo com Figura Humana:**
1. Marcar checkbox "Com Figura Humana"
2. Duração é fixada em 5 segundos automaticamente
3. Prompt específico é gerado
4. Gerar vídeo com pessoa caminhando

### **Alternar Configurações:**
- **Mudar duração**: Prompt atualiza automaticamente
- **Marcar/desmarcar figura humana**: Comportamento muda imediatamente
- **Feedback visual**: Sempre presente para orientar o usuário

## ⚡ Performance

- **Geração instantânea** de prompts
- **Atualização em tempo real** da interface
- **Validação automática** de regras
- **Estados sincronizados** entre componentes
