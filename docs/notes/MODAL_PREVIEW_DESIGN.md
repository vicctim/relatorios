# Modal de Preview de Vídeo - Design System
**Data:** 20 de Janeiro de 2026  
**Componente:** Video Preview Modal (Enhanced)  
**Nível:** UI/UX 10/10 - Awwwards Style

---

## 🎨 Visão Geral do Design

Modal ultra-rico com player de vídeo HD + card informativo completo, seguindo padrões de design premium com gradientes, sombras e micro-interações.

---

## 📐 Estrutura do Modal

### **1. Player de Vídeo (Topo)**
```
┌────────────────────────────────────────────┐
│  ╔══════════════════════════════════════╗  │
│  ║                                      ║  │
│  ║        🎬 VIDEO PLAYER               ║  │
│  ║        Aspect Ratio 16:9             ║  │
│  ║        Controls: Native HTML5        ║  │
│  ║        AutoPlay: Enabled             ║  │
│  ║                                      ║  │
│  ╚══════════════════════════════════════╝  │
└────────────────────────────────────────────┘

Specs:
- className: aspect-video bg-black rounded-lg overflow-hidden
- Background: #000000
- Border radius: 0.5rem
- AutoPlay: true
- Controls: native
```

### **2. Card de Informações (Gradiente)**
```
┌────────────────────────────────────────────┐
│  ╭────────────────────────────────────╮   │
│  │ 🎥 Título do Vídeo          [📋][⬇]│   │
│  │ 🎞️ Badge TV (se aplicável)         │   │
│  ╰────────────────────────────────────╯   │
└────────────────────────────────────────────┘

Specs:
- Background: gradient from-gray-50 to-gray-100
- Dark mode: from-gray-800 to-gray-900
- Padding: 1.5rem (24px)
- Border radius: 0.75rem (12px)
```

### **3. Stats Grid (4 Colunas)**
```
┌──────────┬──────────┬──────────┬──────────┐
│ 📱 1920x │ ⏱ 4m 7s │ 📅 08/01 │ ✓ 09/01 │
│ 1080     │ 247s     │ 2026     │ 2026     │
│ Resolução│ Duração  │ Solicita.│ Conclusão│
└──────────┴──────────┴──────────┴──────────┘

Grid Responsivo:
- Mobile: grid-cols-2 (2 colunas)
- Desktop: grid-cols-4 (4 colunas)
- Gap: 1rem (16px)

Card Spec:
- Background: white / dark:gray-800
- Shadow: shadow-sm
- Padding: 1rem (16px)
- Border radius: 0.5rem (8px)
```

---

## 🎨 Paleta de Cores

### **Ícones Contextuais:**
| Elemento | Cor | Uso |
|----------|-----|-----|
| 📱 Smartphone | Purple 600 | Resolução vertical |
| 🖥️ TV | Purple 600 | Resolução horizontal |
| ⏱️ Clock | Blue 600 | Duração |
| 📅 Calendar | Green 600 | Data solicitação |
| ✓ Check | Orange 600 | Data conclusão |
| 👤 User | White on gradient | Editor |
| 🎬 Film | Primary 600 | Versões |

### **Gradientes:**
```css
/* Card Principal */
.info-card {
  background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
}
.dark .info-card {
  background: linear-gradient(to bottom right, #1f2937, #111827);
}

/* Avatar Editor */
.avatar {
  background: linear-gradient(to bottom right, #3b82f6, #2563eb);
}

/* Card Versões */
.versions-card {
  background: linear-gradient(to right, #eff6ff, #dbeafe);
}
.dark .versions-card {
  background: linear-gradient(to right, 
    rgba(59, 130, 246, 0.2), 
    rgba(37, 99, 235, 0.2)
  );
}
```

---

## 📊 Informações Exibidas

### **Seção 1: Header**
- ✅ Título do vídeo (h2, 2xl, bold)
- ✅ Badge TV (se `isTv === true`)
- ✅ Botões de ação (copiar link, download)

### **Seção 2: Stats Grid**
1. **Resolução:**
   - Ícone: Smartphone (vertical) ou TV (horizontal)
   - Label: "RESOLUÇÃO" (uppercase, xs)
   - Valor: Ex: "1920x1080"
   - Sub: Dimensões exatas

2. **Duração:**
   - Ícone: Clock
   - Label: "DURAÇÃO"
   - Valor: Ex: "4m 7s"
   - Sub: Segundos totais

3. **Data Solicitação:**
   - Ícone: Calendar
   - Label: "SOLICITADO"
   - Valor: DD/MM/YYYY

4. **Data Conclusão:**
   - Ícone: Check
   - Label: "CONCLUÍDO"
   - Valor: DD/MM/YYYY

### **Seção 3: Editor**
- ✅ Avatar circular com gradiente
- ✅ Label "Editor Responsável"
- ✅ Nome do profissional

### **Seção 4: Arquivo**
- ✅ Nome original do arquivo
- ✅ Tamanho em MB (com 2 decimais)

### **Seção 5: Versões (se houver)**
- ✅ Quantidade de versões
- ✅ Chips com resolução + duração
- ✅ Background gradiente destacado

---

## 🔧 Componentes Técnicos

### **Estados:**
```typescript
interface VideoPreview {
  id: number;
  title: string;
  resolutionLabel: string;
  widthPixels: number;
  heightPixels: number;
  durationSeconds: number;
  requestDate: string;
  completionDate: string;
  originalFilename: string;
  fileSizeBytes: number;
  isTv: boolean;
  tvTitle?: string;
  professional?: {
    id: number;
    name: string;
  };
  versions?: Array<{
    id: number;
    resolutionLabel: string;
    durationSeconds: number;
  }>;
}
```

### **Funções:**
```typescript
// Carregar vídeo completo
const handleVideoPreview = async (videoId: number) => {
  setIsLoadingVideo(true);
  const response = await videosApi.get(videoId);
  setPreviewVideo(response.data);
  setIsLoadingVideo(false);
};

// Copiar link do vídeo
const handleCopyVideoLink = () => {
  const url = `${window.location.origin}/videos/${previewVideo.id}`;
  navigator.clipboard.writeText(url);
  toast.success('Link do vídeo copiado!');
};
```

---

## 🎯 Interações

### **Loading State:**
- Spinner centralizado
- Size: lg
- Cor: primary

### **Hover Effects:**
- Botões de ação: `hover:bg-white dark:hover:bg-gray-700`
- Transição: 200ms ease

### **Click Actions:**
1. **Copiar Link:** Copia URL do vídeo + toast
2. **Download:** Abre link de download direto
3. **Fechar Modal:** ESC ou X

---

## 📱 Responsividade

### **Breakpoints:**
```css
/* Mobile (default) */
- Stats grid: 2 columns
- Cards: full width
- Padding: reduced

/* Desktop (md+) */
- Stats grid: 4 columns
- Cards: optimized
- Padding: full
```

### **Player:**
- Sempre 16:9 aspect-ratio
- Width: 100% do modal
- Max width: Modal XL (1280px)

---

## ✨ Animações e Transições

### **Modal:**
- Entrada: fade-in 200ms
- Saída: fade-out 150ms

### **Video:**
- AutoPlay: sem delay
- Controles: aparecem ao hover

### **Cards:**
- Shadow: transition-shadow 200ms
- Hover: shadow-md

---

## 🚀 Performance

### **Otimizações:**
- ✅ Lazy load do vídeo (via API)
- ✅ Streaming progressivo
- ✅ Thumbnails cacheadas
- ✅ Loading states claros
- ✅ Error boundaries

---

## 📋 Checklist de Qualidade

- [x] Design 10/10
- [x] Gradientes modernos
- [x] Sombras sutis
- [x] Tipografia hierárquica
- [x] Cores semânticas
- [x] Ícones contextuais
- [x] Responsivo
- [x] Acessível
- [x] Performance otimizada
- [x] Loading states
- [x] Error handling
- [x] Toast notifications
- [x] Keyboard navigation (ESC)

---

## 🎨 Inspirações

**Referências de Design:**
- Awwwards.com - Premium video players
- Dribbble - Modal designs
- Apple TV+ - Video info cards
- Netflix - Stats display
- YouTube - Player controls

**Padrões Aplicados:**
- Material Design 3 (cards, shadows)
- Tailwind spacing scale
- Lucide icons (consistent style)
- Gradient trends 2024
- Dark mode first

---

**Desenvolvido por:** Victor Samuel  
**GitHub:** @vicctim  
**Domínio:** victorsamuel.com.br  
**Stack:** React + TypeScript + Tailwind CSS
