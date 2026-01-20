# Implementação de Detecção Automática de Versões

## Mudanças Necessárias

### 1. Interface VideoFormData (linha 11-20)

Adicionar novos campos:
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
  isVersion: boolean;                    // NOVO
  originalVideoIndex: number | null;      // NOVO
  customDurationSeconds: string;          // NOVO - vazio ou número como string
}
```

### 2. Função de Detecção de Versões

Adicionar antes da função Upload():
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

### 3. Modificar onDrop (linha 44-59)

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
      isVersion: detection.isVersion,           // NOVO
      originalVideoIndex: detection.originalIndex, // NOVO
      customDurationSeconds: '',                 // NOVO
    };
  });
  
  setVideos((prev) => [...prev, ...newVideos]);
}, []);
```

### 4. Adicionar Campo de Duração Customizada

Após o campo "Profissional" (linha 318-336), adicionar:

```typescript
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

### 5. Atualizar handleSubmitAll (linha 113-167)

Adicionar envio do customDurationSeconds:

```typescript
await videosApi.upload(video.file, {
  title: video.title,
  requestDate: video.requestDate,
  completionDate: video.completionDate,
  professionalId: parseInt(video.professionalId),
  isTv: video.isTv,
  tvTitle: video.isTv ? video.tvTitle : undefined,
  customDurationSeconds: video.customDurationSeconds 
    ? parseInt(video.customDurationSeconds) 
    : undefined,  // NOVO
}, (progress) => {
  setCurrentProgress(progress);
});
```

### 6. Backend - Atualizar Video Model

Adicionar campo `customDurationSeconds`:

```typescript
// backend/src/models/Video.ts
interface VideoAttributes {
  // ... existing fields
  customDurationSeconds: number | null;  // NOVO
}

// Atualizar getCalculatedDuration()
public getCalculatedDuration(): number {
  // Se tem duração customizada, usar ela
  if (this.customDurationSeconds !== null) {
    return this.customDurationSeconds;
  }
  
  // Senão, regra padrão
  if (this.parentId) {
    return this.durationSeconds * 0.5;  // 50% para versões
  }
  return this.durationSeconds;  // 100% para originais
}
```

### 7. Backend - Migration

Criar migration para adicionar coluna:

```typescript
// backend/src/database/migrations/XXXXXX-add-custom-duration.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('videos', 'customDurationSeconds', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Duração customizada pelo usuário para cálculo de uso mensal'
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('videos', 'customDurationSeconds');
  }
};
```

## Como Funciona

1. **Detecção Automática**: Ao selecionar múltiplos arquivos, compara nomes
   - "INAUGURACAO FRANCA.mp4" → Original
   - "INAUGURACAO FRANCA stories.mp4" → Detectado como versão

2. **Badge Visual**: Mostra qual arquivo é a versão e qual é o original

3. **Campo de Duração**:
   - Placeholder diferente para original vs versão
   - Versão mostra "(Versão - padrão 50%)"
   - Aceita valores customizados

4. **Cálculo**:
   - Se usuário digitar (ex: 6), usa 6 segundos
   - Se deixar vazio:
     - Original: 100% da duração real
     - Versão: 50% da duração real

5. **Exemplo Prático**:
   - Vídeo 50 segundos
   - Alterou apenas 6 segundos
   - Digite "6" no campo
   - Sistema contabiliza 6 segundos (não 25)

## Benefícios

- ✅ Detecção automática inteligente
- ✅ Flexibilidade total para ajustes
- ✅ Mantém regra padrão 50% se não alterar
- ✅ Visual claro de original vs versão
- ✅ Suporta qualquer duração customizada
