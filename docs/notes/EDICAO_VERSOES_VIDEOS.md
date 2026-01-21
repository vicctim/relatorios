# Edição de Versões de Vídeos
**Data:** 20 de Janeiro de 2026  
**Feature:** Permitir edição de versões de vídeos (incluindo tempo contabilizado customizado)  
**Status:** ✅ IMPLEMENTADO

---

## 🎯 Objetivo

Permitir que administradores e editores possam editar versões de vídeos, especialmente para ajustar o **tempo contabilizado** manualmente quando necessário.

---

## 📋 Contexto

### **Problema Anterior:**
- ✅ Vídeo principal tinha botão de editar
- ❌ Versões NÃO tinham botão de editar
- ❌ Não era possível ajustar o tempo contabilizado de versões
- ❌ Tempo sempre calculado automaticamente (50% para versões)

### **Necessidade:**
- Permitir edição completa de versões
- Ajustar manualmente o tempo contabilizado nos relatórios
- Manter a mesma interface de edição do vídeo principal

---

## ✅ Solução Implementada

### **1. Botão de Edição para Versões**

Adicionado botão de edição (ícone de lápis) para cada versão na lista expandida.

```tsx
// frontend/src/pages/Videos.tsx - linha ~682
{(user?.role === 'admin' || user?.role === 'editor') && (
  <button
    onClick={() => openEditModal(version)}
    className="btn-ghost p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
    title="Editar versão"
  >
    <Pencil className="w-4 h-4" />
  </button>
)}
```

**Localização:** Ao lado dos botões de Preview, Download e Excluir de cada versão.

**Permissões:** Apenas `admin` e `editor`.

---

### **2. Modal Inteligente de Edição**

O modal agora detecta automaticamente se está editando um vídeo principal ou uma versão.

#### **Título Dinâmico:**
```tsx
title={editVideo?.parentId ? "Editar Versão" : "Editar Vídeo"}
```

- **Vídeo Principal:** "Editar Vídeo"
- **Versão:** "Editar Versão"

#### **Banner de Alerta para Versões:**
```tsx
{editVideo?.parentId && (
  <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
      <Film className="w-5 h-5 flex-shrink-0" />
      <div>
        <p className="text-sm font-semibold">Editando uma Versão</p>
        <p className="text-xs">Esta é uma versão alternativa do vídeo principal. O tempo contabilizado padrão é 50% da duração.</p>
      </div>
    </div>
  </div>
)}
```

**Visual:**
- Background azul claro (light mode) / azul escuro translúcido (dark mode)
- Ícone de filme
- Texto explicativo sobre o comportamento de versões

---

### **3. Campo Destacado de Duração Contabilizada**

O campo de duração customizada foi completamente redesenhado com destaque visual e informações claras.

#### **Design:**
```tsx
<div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-primary-200 dark:border-primary-800">
  <label className="label">
    <div className="flex items-center gap-2">
      <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
      <span className="font-semibold">Duração Considerada para Contabilização</span>
    </div>
  </label>
  <input
    type="number"
    step="0.001"
    className="input mt-2"
    value={editForm.customDurationSeconds}
    onChange={(e) => setEditForm({ ...editForm, customDurationSeconds: e.target.value })}
    placeholder={editVideo?.parentId ? "Deixe vazio para 50% automático" : "Deixe vazio para 100% da duração"}
  />
  {/* ... informações ... */}
</div>
```

#### **Elementos Visuais:**
1. **Background Gradiente:** Primary → Blue
2. **Ícone de Relógio:** Destaque em primary-600
3. **Label Bold:** Título destacado
4. **Input com Step 0.001:** Precisão de milissegundos
5. **Placeholder Inteligente:** Muda conforme tipo (principal/versão)

#### **Informações Exibidas:**

##### **Para TODOS os vídeos:**
```
📊 Duração total do arquivo: 49s (49.000s)
```

##### **Para VERSÕES:**
```
💡 Versão: Se deixar vazio, será contabilizado 50% da duração (24.5s)
```

##### **Para VÍDEOS PRINCIPAIS:**
```
💡 Vídeo Principal: Se deixar vazio, será contabilizado 100% da duração
```

##### **Dica Geral:**
```
Use este campo para definir manualmente quanto tempo será contabilizado nos relatórios (em segundos)
```

---

## 🎨 UI/UX Highlights

### **Hierarquia Visual:**
1. **Banner Azul** (se for versão) → Contexto
2. **Card Gradiente** (campo duração) → Destaque
3. **Informações Hierárquicas** (emojis + cores) → Facilita leitura

### **Cores e Feedback:**
| Elemento | Cor Light | Cor Dark | Significado |
|----------|-----------|----------|-------------|
| Banner versão | Blue-50 | Blue-900/20 | Informação |
| Card duração | Primary-50 → Blue-50 | Primary-900/20 → Blue-900/20 | Destaque importante |
| Ícone Clock | Primary-600 | Primary-400 | Ação principal |
| Botão Editar (versão) | Blue-500 | Blue-400 | Ação secundária |

### **Responsividade:**
- Banner versão: Flex com wrap
- Card duração: Padding adequado para mobile
- Informações: Stack vertical em telas pequenas

---

## 🔧 Funcionalidades

### **1. Editar Versão:**
1. Clique no botão **lápis azul** ao lado da versão
2. Modal "Editar Versão" abre com banner azul de contexto
3. Todos os campos editáveis:
   - Título
   - Data de Solicitação
   - Data de Conclusão
   - Profissional
   - Vídeo para TV (checkbox)
   - Título TV (se marcado)
   - **Duração Considerada (destaque)**

### **2. Ajustar Tempo Contabilizado:**

#### **Deixar Vazio (Automático):**
- **Vídeo Principal:** 100% da duração
- **Versão:** 50% da duração

#### **Definir Manualmente:**
- Digite o valor em segundos (ex: `25.500`)
- Aceita 3 casas decimais (milissegundos)
- Valor será usado diretamente nos relatórios

#### **Exemplo Prático:**
```
Vídeo: 49s de duração

ANTES (automático):
- Vídeo principal: 49s contabilizado
- Versão 1: 24.5s contabilizado (50%)

DEPOIS (manual):
- Vídeo principal: 49s (não alterado)
- Versão 1: 25s (ajustado manualmente)
```

---

## 📊 Impacto nos Relatórios

### **Como o Tempo Contabilizado é Usado:**

1. **Dashboard:**
   - Card "Tempo Total" soma todos os tempos contabilizados

2. **Relatórios:**
   - Cada vídeo/versão contribui com seu tempo contabilizado
   - Se customizado: usa o valor manual
   - Se vazio: usa o cálculo automático (100% ou 50%)

3. **Compartilhamentos:**
   - Não afeta (apenas exibe duração real do arquivo)

---

## 🎯 Casos de Uso

### **Caso 1: Versão com Tempo Diferente**
**Situação:** Versão foi editada e ficou menor que 50% do original.

**Solução:**
1. Editar versão
2. Definir duração customizada manualmente
3. Salvar

**Resultado:** Relatório contabiliza corretamente.

---

### **Caso 2: Vídeo Principal com Tempo Parcial**
**Situação:** Vídeo tem 2 minutos, mas cliente só usou 1 minuto.

**Solução:**
1. Editar vídeo principal
2. Definir duração customizada: `60` (segundos)
3. Salvar

**Resultado:** Relatório contabiliza apenas 1 minuto.

---

### **Caso 3: Resetar para Automático**
**Situação:** Havia customizado, mas quer voltar ao cálculo automático.

**Solução:**
1. Editar vídeo/versão
2. **Limpar campo** de duração customizada
3. Salvar

**Resultado:** Volta para 100% (principal) ou 50% (versão).

---

## 🔍 Detalhes Técnicos

### **Estrutura do Modal:**
```tsx
<Modal
  isOpen={!!editVideo}
  onClose={() => setEditVideo(null)}
  title={editVideo?.parentId ? "Editar Versão" : "Editar Vídeo"}
  size="lg"
>
  {/* Banner de contexto (se versão) */}
  {editVideo?.parentId && <VersionBanner />}
  
  {/* Formulário */}
  <form>
    <InputTitulo />
    <InputDatas />
    <SelectProfissional />
    <CheckboxTV />
    {isTv && <InputTituloTV />}
    <CardDuracaoContabilizada /> {/* Destaque especial */}
    <BotoesAcao />
  </form>
</Modal>
```

### **State Management:**
```tsx
const [editVideo, setEditVideo] = useState<Video | null>(null);
const [editForm, setEditForm] = useState({
  title: '',
  requestDate: new Date(),
  completionDate: new Date(),
  professionalId: '',
  isTv: false,
  tvTitle: '',
  customDurationSeconds: '', // String vazia = automático
});
```

### **API Call:**
```tsx
await videosApi.update(editVideo.id, {
  title: editForm.title,
  requestDate: editForm.requestDate,
  completionDate: editForm.completionDate,
  professionalId: editForm.professionalId ? Number(editForm.professionalId) : null,
  isTv: editForm.isTv,
  tvTitle: editForm.isTv ? editForm.tvTitle : null,
  customDurationSeconds: editForm.customDurationSeconds 
    ? Number(editForm.customDurationSeconds) 
    : null
});
```

**Nota:** `customDurationSeconds: null` = automático

---

## 🧪 Como Testar

### **1. Testar Edição de Versão:**
1. ✅ Login como admin/editor
2. ✅ Vá para página Vídeos
3. ✅ Expanda um vídeo com versões
4. ✅ Clique no **lápis azul** de uma versão
5. ✅ Verifique:
   - Título do modal: "Editar Versão"
   - Banner azul aparece
   - Campo duração mostra "50% automático"
   - Duração total exibida corretamente

### **2. Testar Ajuste Manual:**
1. ✅ Abra edição de versão
2. ✅ Digite `25` no campo duração
3. ✅ Salvar
4. ✅ Verifique na lista:
   - "Contabilizado: 25s" (ao invés de 24.5s)

### **3. Testar Reset para Automático:**
1. ✅ Edite versão com duração customizada
2. ✅ **Limpe o campo** (delete tudo)
3. ✅ Salvar
4. ✅ Verifique:
   - Volta para 50% automático (24.5s)

### **4. Testar Vídeo Principal:**
1. ✅ Edite vídeo principal (não versão)
2. ✅ Verifique:
   - Título: "Editar Vídeo"
   - SEM banner azul
   - Placeholder: "100% da duração"

---

## 📝 Arquivos Modificados

1. ✅ `frontend/src/pages/Videos.tsx`
   - Botão de edição para versões (linha ~682)
   - Modal com título dinâmico (linha ~977)
   - Banner de contexto para versões (linha ~984)
   - Card de duração destacado (linha ~1059)

---

## ✅ Checklist de Implementação

- [x] Botão de editar em versões
- [x] Título dinâmico do modal
- [x] Banner de contexto para versões
- [x] Card de duração com gradiente
- [x] Ícone Clock destacado
- [x] Informações de duração total
- [x] Placeholder inteligente
- [x] Dicas de uso (emojis)
- [x] Input com step 0.001
- [x] Permissões (admin/editor)
- [x] Sem erros de linter
- [x] Documentação criada

---

## 🎨 Screenshots (Descrição)

### **Modal - Editando Versão:**
```
┌──────────────────────────────────────┐
│ ✖ Editar Versão                      │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ 🎬 Editando uma Versão           │ │
│ │ Esta é uma versão alternativa... │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Título: [__________________]         │
│                                      │
│ Data Solicitação: [DD/MM/YYYY]       │
│ Data Conclusão:   [DD/MM/YYYY]       │
│                                      │
│ Profissional: [Selecionar ▼]         │
│                                      │
│ ☐ Vídeo para TV                      │
│                                      │
│ ┌────────────────────────────────┐   │
│ │ 🕐 Duração Considerada...      │   │
│ │ [_____] segundos               │   │
│ │                                │   │
│ │ 📊 Duração total: 49s          │   │
│ │ 💡 Se vazio: 50% = 24.5s       │   │
│ │ Use este campo para...         │   │
│ └────────────────────────────────┘   │
│                                      │
│          [Cancelar] [Salvar]         │
└──────────────────────────────────────┘
```

### **Lista - Versão com Botão de Editar:**
```
VT EXEMPLO
├── 1080x1920 │ Total: 49s │ Contab: 49s + 1 versão = 1m 14s
│
└─ VERSÕES (1)
   └─ Versão 1
      ├─ 1080X1920
      ├─ Total: 49s
      ├─ Contabilizado: 25s
      └─ Ações: [▶️] [⬇️] [✏️ Editar] [🗑️ Excluir]
                         ^^^^^^^^
                         NOVO!
```

---

## 🚀 Benefícios

1. **✅ Flexibilidade Total:**
   - Edite versões como vídeos principais
   - Ajuste manual quando automático não atende

2. **✅ Interface Clara:**
   - Banner contextual para versões
   - Campo de duração destacado
   - Informações visuais (emojis, cores)

3. **✅ Precisão nos Relatórios:**
   - Tempo contabilizado customizado
   - Controle total sobre contabilização

4. **✅ UX 10/10:**
   - Gradientes modernos
   - Hierarquia visual clara
   - Feedback instantâneo
   - Dark mode perfeito

---

## 📚 Referências

- **Sistema de Versões:** `parentId` identifica versões
- **Cálculo Automático:** 
  - Principal: 100% (`durationSeconds`)
  - Versão: 50% (`durationSeconds * 0.5`)
- **Override Manual:** `customDurationSeconds` sobrescreve cálculo

---

**Desenvolvido por:** Victor Samuel  
**GitHub:** @vicctim  
**Domínio:** victorsamuel.com.br  
**Stack:** React + TypeScript + Tailwind CSS
