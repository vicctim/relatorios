# Guia Rápido - Detecção Automática de Versões

## 🎯 Objetivo
Detectar automaticamente quando um arquivo é versão de outro e permitir ajuste manual da duração contabilizada.

## 📝 Mudanças Necessárias

### ✅ PASSO 1: Atualizar Imports (Linha 4)

**Adicionar**: `, Clock, GitBranch`

```typescript
import { Upload as UploadIcon, X, Tv, ChevronDown, ChevronUp, Check, Clock, GitBranch } from 'lucide-react';
```

---

### ✅ PASSO 2: Atualizar Interface (Linhas 11-20)

**Adicionar 3 campos** após `isOpen: boolean;`:

```typescript
interface VideoFormData {
  file: File;
  title: string;
  requestDate: string;
  completionDate: string;
  professionalId: string;
  isTv: boolean;
  tvTitle: string;
  isOpen: boolean;
  isVersion: boolean;                    // ← ADICIONAR
  originalVideoIndex: number | null;      // ← ADICIONAR  
  customDurationSeconds: string;          // ← ADICIONAR
}
```

---

### ✅ PASSO 3: Adicionar Função de Detecção (Linha 21 - ANTES de `export default function Upload()`)

**Adicionar esta função completa**:

```typescript
// Helper function to detect if filename is a version
function detectVersion(
  filename: string,
  allFilenames: string[]
): { isVersion: boolean; originalIndex: number | null } {
  const cleanName = (name: string) =>
    name.replace(/\.[^/.]+$/, '').toLowerCase().trim();

  const currentClean = cleanName(filename);

  for (let i = 0; i < allFilenames.length; i++) {
    const otherClean = cleanName(allFilenames[i]);

    if (currentClean === otherClean) continue;

    // Se o nome atual CONTÉM o outro nome completo, é uma versão
    if (currentClean.includes(otherClean) && currentClean !== otherClean) {
      return { isVersion: true, originalIndex: i };
    }
  }

  return { isVersion: false, originalIndex: null };
}
```

---

### ✅ PASSO 4: Modificar onDrop (Linhas 44-59)

**SUBSTITUIR** a função `onDrop` completa por:

```typescript
const onDrop = useCallback((acceptedFiles: File[]) => {
  const allFilenames = acceptedFiles.map(f => f.name);

  const newVideos: VideoFormData[] = acceptedFiles.map((file, index) => {
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
    const detection = detectVersion(file.name, allFilenames);

    return {
      file,
      title: nameWithoutExt.toUpperCase(),
      requestDate: '',
      completionDate: '',
      professionalId: '',
      isTv: false,
      tvTitle: '',
      isOpen: index === 0,
      isVersion: detection.isVersion,
      originalVideoIndex: detection.originalIndex,
      customDurationSeconds: '',
    };
  });

  setVideos((prev) => [...prev, ...newVideos]);
}, []);
```

---

### ✅ PASSO 5: Adicionar Campos no Formulário (APÓS linha 336 - após o select de Professional)

**ADICIONAR** este bloco HTML:

```tsx
{/* Custom Duration */}
<div>
  <label htmlFor={`customDuration-${index}`} className="label">
    <div className="flex items-center gap-2">
      <Clock className="w-4 h-4" />
      <span>Duração Considerada (segundos)</span>
      {video.isVersion && (
        <span className="text-xs text-orange-600 dark:text-orange-400">
          (Versão - padrão 50%)
        </span>
      )}
    </div>
  </label>
  <input
    id={`customDuration-${index}`}
    type="number"
    min="0"
    step="1"
    className="input"
    placeholder={
      video.isVersion
        ? "Deixe vazio para 50% automático"
        : "Deixe vazio para 100% da duração"
    }
    value={video.customDurationSeconds}
    onChange={(e) => updateVideo(index, 'customDurationSeconds', e.target.value)}
  />
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
    {video.isVersion
      ? "Padrão: 50% da duração do vídeo. Digite apenas o tempo alterado (ex: 6 segundos)."
      : "Padrão: 100% da duração do vídeo. Personalize se necessário."}
  </p>
</div>

{/* Version Badge */}
{video.isVersion && video.originalVideoIndex !== null && (
  <div className="flex items-center gap-2 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
    <GitBranch className="w-5 h-5 text-orange-600 dark:text-orange-400" />
    <div>
      <p className="text-sm font-medium text-orange-900 dark:text-orange-200">
        Versão Detectada
      </p>
      <p className="text-xs text-orange-700 dark:text-orange-300">
        Original: {videos[video.originalVideoIndex]?.file.name}
      </p>
    </div>
  </div>
)}
```

---

### ✅ PASSO 6: Atualizar handleSubmitAll (Linha ~141-150)

**DENTRO** do loop, após `tvTitle`, **ADICIONAR**:

```typescript
await videosApi.upload(video.file, {
  title: video.title,
  requestDate: video.requestDate,
  completionDate: video.completionDate,
  professionalId: parseInt(video.professionalId),
  isTv: video.isTv,
  tvTitle: video.isTv ? video.tvTitle : undefined,
  customDurationSeconds: video.customDurationSeconds     // ← ADICIONAR
    ? parseInt(video.customDurationSeconds)              // ← ADICIONAR
    : undefined,                                         // ← ADICIONAR
}, (progress) => {
  setCurrentProgress(progress);
});
```

---

## 🎬 Como Testar

1. **Salve as mudanças** no arquivo `Upload.tsx`
2. **Aguarde hot-reload** (~1-2 segundos)
3. **Acesse** http://localhost:3000/upload
4. **Selecione** múltiplos arquivos:
   - `INAUGURACAO FRANCA.mp4`
   - `INAUGURACAO FRANCA stories.mp4`
5. **Observe**:
   - Badge laranja "Versão Detectada" no segundo arquivo
   - Campo "Duração Considerada" com placeholder específico
   - Versão mostra "(Versão - padrão 50%)"

## 📊 Cenários de Teste

### Cenário 1: Deixar Vazio (Padrão)
- Original 50s → Conta 50s (100%)
- Versão 50s → Conta 25s (50%)

### Cenário 2: Customizar Versão
- Versão 50s, digitou "6" → Conta 6s

### Cenário 3: Customizar Original
- Original 50s, digitou "30" → Conta 30s

---

## ⚠️ Próximos Passos Backend

Após testar o frontend, precisará:

1. **Adicionar coluna** `customDurationSeconds` na tabela `videos`
2. **Criar migration** (veja `IMPLEMENTACAO_VERSOES.md`)
3. **Atualizar** `Video.getCalculatedDuration()` para usar custom duration

---

## 🐛 Troubleshooting

**Hot-reload não funciona?**
```bash
tail -f frontend-output.log
```

**Erro de compilação?**
- Verifique todas as vírgulas e chaves
- Compare com backup: `frontend/src/pages/Upload.tsx.backup`

**Badge não aparece?**
- Confirme que nomes de arquivo se encaixam
- Exemplo OK: "video.mp4" e "video stories.mp4"
- Exemplo FALHA: "video1.mp4" e "video2.mp4"

