# SuggestionFeed - Formulário Único para Múltiplas Imagens

## Resumo das Mudanças

Para a rota `SuggestionFeed` (quando `table === "Image suggestions"`), implementamos um sistema de formulário único que se aplica a todas as imagens selecionadas, ao invés de um formulário individual para cada imagem.

## Mudanças Implementadas

### 1. ImageSelector.js

#### handleConfirmSelection()
- **Antes**: Criava um formulário para cada imagem selecionada
- **Agora**: Para SuggestionFeed, cria apenas 1 formulário contendo:
  - `imgUrls`: Array com todas as URLs das imagens selecionadas
  - `originalIndexes`: Array com os índices originais das imagens
  - Demais campos únicos aplicáveis a todas as imagens

#### handleFormChange()
- **Antes**: Atualizava apenas o formulário atual (baseado em formIndex)
- **Agora**: Para SuggestionFeed, sempre atualiza o primeiro (e único) formulário

#### handleSubmit()
- **Antes**: Criava um registro para cada imagem no array
- **Agora**: Para SuggestionFeed, cria apenas 1 registro contendo:
  - `imgUrls`: Array de todas as imagens
  - Campos únicos que se aplicam a todas as imagens
  - Todos os campos específicos do SuggestionFeed (preco, endereco, destaques)

#### Variável activeForm
- **Nova**: Define qual formulário usar baseado na rota
- Para SuggestionFeed: sempre usa `forms[0]`
- Para outras rotas: usa `forms[formIndex]`

### 2. AtelierForm.js

#### Exibição de Imagens
- **Antes**: Mostrava apenas a imagem atual do formulário
- **Agora**: Para SuggestionFeed:
  - Mostra a primeira imagem como principal
  - Título indica quantidade total de imagens selecionadas
  - Thumbnails mostram todas as imagens (sem navegação)

#### Navegação
- **Antes**: Botões "Anterior", "Próxima" e "Enviar"
- **Agora**: Para SuggestionFeed, apenas botão "Enviar"

### 3. VideoForm.js

#### Mudanças Idênticas ao AtelierForm
- Exibição de múltiplas imagens para SuggestionFeed
- Navegação simplificada (apenas botão "Enviar")
- Mesmo sistema de thumbnails

### 4. SmartStageForm.js

#### Mudanças Idênticas aos Outros Forms
- Exibição de múltiplas imagens para SuggestionFeed
- Navegação simplificada (apenas botão "Enviar")
- Mesmo sistema de thumbnails

## Fluxo de Dados

### Antes (Rotas Normais)
```
[Imagem1] → Formulário1 → Registro1
[Imagem2] → Formulário2 → Registro2
[Imagem3] → Formulário3 → Registro3
```

### Agora (SuggestionFeed)
```
[Imagem1, Imagem2, Imagem3] → Formulário Único → 1 Registro com Array de Imagens
```

## Estrutura de Dados

### Formulário SuggestionFeed
```javascript
{
  imgUrls: ["url1", "url2", "url3"],
  originalIndexes: [0, 2, 5],
  estilo: "Elegância Descontraída",
  tipo: "Sala de estar",
  // ... outros campos aplicáveis a todas as imagens
  destaques: ["Alto padrão", "Localização de destaque"]
}
```

### Payload para Backend (SuggestionFeed)
```javascript
{
  imagesArray: [{
    imgUrls: ["url1", "url2", "url3"],
    tipo: "Sala de estar",
    estilo: "Elegância Descontraída",
    // ... campos específicos do SuggestionFeed
    suggestionstatus: "Suggested",
    preco: "850000",
    endereco: "Copacabana - Rio de Janeiro",
    destaques: ["Alto padrão", "Localização de destaque"]
  }]
}
```

## Benefícios

1. **UX Melhorada**: Usuário preenche apenas 1 formulário para múltiplas imagens
2. **Consistência**: Todas as imagens da mesma propriedade têm as mesmas configurações
3. **Performance**: Menos dados enviados ao backend (1 registro vs N registros)
4. **Manutenção**: Lógica mais simples para processar sugestões no backend

## Compatibilidade

- ✅ Funcionalidade original mantida para todas as outras rotas
- ✅ Interface adaptativa baseada na prop `table`
- ✅ Backward compatibility garantida
