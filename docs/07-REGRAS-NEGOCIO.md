# Regras de Negócio

## 1. Limite Mensal de Vídeos

### Configuração Base
- **Limite padrão:** 1100 segundos por mês
- **Configurável:** Via Settings (`monthly_limit_seconds`)

### Sistema de Rollover
Segundos não utilizados dos meses anteriores são acumulados.

- **Meses considerados:** 2 (configurável via `rollover_months`)
- **Cálculo:** Soma do saldo positivo de cada mês anterior

```
Limite Efetivo = Limite Base + Rollover

Onde:
Rollover = Σ (Limite Base - Usado) para cada mês anterior (se positivo)
```

### Exemplo de Rollover

| Mês | Limite | Usado | Saldo |
|-----|--------|-------|-------|
| Out/24 | 1100s | 900s | +200s |
| Nov/24 | 1100s | 1000s | +100s |
| Dez/24 | 1100s | - | - |

**Limite efetivo Dez/24:** 1100 + 200 + 100 = **1400s**

---

## 2. Cálculo de Duração de Versões

### Regra
- **Vídeo original:** 100% da duração
- **Versão adicional:** 50% da duração

### Por que 50%?
Versões são variações do mesmo conteúdo (ex: corte diferente, resolução menor). O trabalho de produção é parcialmente reaproveitado.

### Implementação
```typescript
// Video model
public getCalculatedDuration(): number {
  if (this.parentId) {
    return this.durationSeconds * 0.5;
  }
  return this.durationSeconds;
}
```

### Exemplo Prático

| Vídeo | Tipo | Duração Real | Fator | Duração p/ Limite |
|-------|------|--------------|-------|-------------------|
| Institucional | Original | 120s | 100% | 120s |
| Institucional (9:16) | Versão | 120s | 50% | 60s |
| Institucional (Stories) | Versão | 30s | 50% | 15s |
| **Total** | - | 270s | - | **195s** |

---

## 3. Upload de Vídeos

### Formatos Aceitos
- **MP4** (video/mp4)
- **MOV** (video/quicktime)

### Limite de Tamanho
- **Máximo:** 500MB por arquivo

### Compressão Automática
- **Threshold:** 100MB (configurável)
- **Quando:** Arquivos acima do threshold são comprimidos
- **Como:** FFmpeg reduz bitrate mantendo qualidade aceitável

### Processo de Upload
1. Arquivo recebido via Multer
2. Validação de tipo e tamanho
3. FFmpeg extrai metadados (duração, resolução)
4. Se > 100MB, comprime
5. Salva arquivo final
6. Cria registro no banco

---

## 4. Checkbox "Para TV"

### Quando Marcar
O vídeo será exibido em televisão/display.

### Campo Obrigatório
Quando `isTv = true`, o campo `tvTitle` é **obrigatório**.

### Validação
```typescript
if (isTv && !tvTitle) {
  throw new Error('Título da TV é obrigatório');
}
```

### Uso no Relatório
Vídeos para TV são destacados no PDF com o título da TV.

---

## 5. Datas Importantes

### requestDate (Data de Solicitação)
- Quando o cliente pediu o vídeo
- **Usada para:** Agrupar vídeos no relatório mensal

### completionDate (Data de Conclusão)
- Quando o vídeo ficou pronto
- **Informativo:** Mostra no relatório

### Fuso Horário
- **Sistema:** UTC-3 (America/Sao_Paulo)
- **Logs:** Registrados em UTC-3

---

## 6. Relatórios

### Agrupamento
Vídeos são agrupados por **profissional/editor**.

### Filtro de Mês
Baseado na `requestDate`, não na data de upload.

### Informações Exibidas
- Total de vídeos
- Total de segundos (com cálculo de versões)
- Limite do mês
- Rollover aplicado
- Segundos restantes

### Exportação PDF
- Layout profissional com logo
- Dados da empresa do Settings
- Tabela por profissional
- Cards de estatísticas

---

## 7. Notificações

### Tipos
- **Email:** Via SMTP (Gmail, etc)
- **WhatsApp:** Via Evolution API

### Eventos que Disparam
- Novo vídeo publicado
- Relatório gerado
- 80% do limite utilizado
- Limite atingido

### Destinatários
- Cadastrados em `NotificationRecipient`
- Podem ser ativados/desativados individualmente

---

## 8. Controle de Acesso

### Roles

| Role | Descrição | Permissões |
|------|-----------|------------|
| admin | Administrador | Tudo |
| editor | Editor | Upload, ver relatórios |
| viewer | Visualizador | Apenas visualizar |

### Matriz de Permissões

| Recurso | admin | editor | viewer |
|---------|-------|--------|--------|
| Ver dashboard | ✅ | ✅ | ✅ |
| Ver vídeos | ✅ | ✅ | ✅ |
| Upload vídeos | ✅ | ✅ | ❌ |
| Deletar vídeos | ✅ | ❌ | ❌ |
| Ver relatórios | ✅ | ✅ | ✅ |
| Exportar PDF | ✅ | ✅ | ✅ |
| Gerenciar usuários | ✅ | ❌ | ❌ |
| Configurações | ✅ | ❌ | ❌ |
| Ver logs | ✅ | ❌ | ❌ |

---

## 9. Log de Downloads

### O que é Registrado
- ID do vídeo
- ID do usuário
- Data/hora (UTC-3)
- IP do cliente
- User-Agent

### Finalidade
- Auditoria
- Rastrear quem acessou qual conteúdo
- Estatísticas de acesso
