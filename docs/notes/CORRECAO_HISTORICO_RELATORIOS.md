# Correção: Erro ao carregar histórico de relatórios
**Data:** 20 de Janeiro de 2026  
**Erro:** "Erro ao carregar histórico de relatórios"  
**Status:** 🔧 REQUER AÇÃO MANUAL

---

## 🐛 Problema Identificado

### **Erro:**
```
Erro ao carregar histórico de relatórios
```

###  **Causa Raiz:**
A tabela `exported_reports` **não existe** no banco de dados. Essa tabela é necessária para armazenar o histórico de relatórios PDF exportados.

### **Por que aconteceu:**
- Migration foi criada (`20260121000001-create-exported-reports.js`)
- Modelo Sequelize foi criado (`ExportedReport.ts`)
- Rotas backend foram implementadas
- **MAS:** Migration não foi executada no banco de dados

---

## ✅ Solução

### **Opção 1: Executar Script SQL Manualmente (RECOMENDADO)**

1. **Abra o MySQL Workbench** ou outro cliente MySQL
2. **Conecte** ao banco de dados `pixfilmes_relatorios`
3. **Execute o arquivo:** `CREATE_EXPORTED_REPORTS_TABLE.sql`

```sql
-- O arquivo já está criado na raiz do projeto
-- Basta copiar e executar no MySQL
```

4. **Verifique** se a tabela foi criada:
```sql
SHOW TABLES LIKE 'exported_reports';
DESCRIBE exported_reports;
```

5. **Recarregue a página** de Relatórios no navegador

---

### **Opção 2: Executar Migration via WSL**

1. **Abra o terminal WSL** na pasta do projeto
2. **Navegue** para a pasta backend:
```bash
cd backend
```

3. **Execute a migration:**
```bash
npm run db:migrate
```

4. **Verificar sucesso:**
```bash
# Deverá mostrar:
# == 20260121000001-create-exported-reports: migrating =======
# == 20260121000001-create-exported-reports: migrated (0.XXXs)
```

5. **Recarregue a página** de Relatórios no navegador

---

### **Opção 3: Reiniciar Servidor (NÃO RECOMENDADO)**

**⚠️ ATENÇÃO:** Este método só funciona se `{ force: false }` no Sequelize.

Se por algum motivo as opções acima não funcionarem:

1. **Pare o servidor** (Ctrl+C no terminal)
2. **Limpe o banco** (CUIDADO - apaga todos os dados):
```bash
npm run db:reset
```

3. **Reinicie o servidor:**
```bash
npm run dev
```

**IMPORTANTE:** Isso apagará TODOS OS DADOS do banco de dados!

---

## 📊 Estrutura da Tabela

### **Campos:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | INT AUTO_INCREMENT | ID único |
| `type` | ENUM | 'monthly' ou 'dateRange' |
| `month` | INT NULL | Mês (1-12) para tipo monthly |
| `year` | INT NULL | Ano para tipo monthly |
| `start_date` | DATETIME NULL | Data inicial (dateRange) |
| `end_date` | DATETIME NULL | Data final (dateRange) |
| `date_field` | ENUM NULL | 'requestDate' ou 'completionDate' |
| `filename` | VARCHAR(255) | Nome do arquivo PDF |
| `file_path` | VARCHAR(500) | Caminho relativo do arquivo |
| `file_size` | BIGINT | Tamanho em bytes |
| `total_videos` | INT | Quantidade de vídeos no relatório |
| `total_duration` | DOUBLE | Duração total em segundos |
| `exported_by` | INT | ID do usuário que exportou |
| `created_at` | DATETIME | Data de criação |
| `updated_at` | DATETIME | Data de atualização |

### **Índices:**
- PRIMARY KEY (`id`)
- FOREIGN KEY (`exported_by`) → `users(id)`
- INDEX (`exported_by`)
- INDEX (`type`, `year`, `month`)
- INDEX (`created_at`)

---

## 🔧 Funcionalidade do Histórico

### **Como Funciona:**

1. **Quando você exporta um relatório PDF:**
   - Sistema gera o PDF
   - Salva o arquivo em `/uploads/reports/`
   - Cria registro na tabela `exported_reports`

2. **Na página Relatórios:**
   - Seção "Histórico de Relatórios Exportados"
   - Lista todos os PDFs já gerados
   - Mostra: Título, Data, Duração, Nº Vídeos, Tamanho, Exportador

3. **Ações Disponíveis:**
   - **Download:** Baixar o PDF novamente
   - **Excluir:** Apagar o registro e o arquivo

---

## 📝 Arquivos Envolvidos

### **Backend:**
1. ✅ `backend/src/models/ExportedReport.ts` - Modelo Sequelize
2. ✅ `backend/src/routes/reports.routes.ts` - Rotas (linhas 283-399)
3. ✅ `backend/migrations/20260121000001-create-exported-reports.js` - Migration

### **Frontend:**
1. ✅ `frontend/src/services/api.ts` - APIs history adicionadas
2. ✅ `frontend/src/pages/Reports.tsx` - UI do histórico implementada

### **SQL:**
1. ✅ `CREATE_EXPORTED_REPORTS_TABLE.sql` - Script para criar tabela (NOVO)

---

## 🧪 Como Testar (Após Corrigir)

### **1. Verificar se a tabela existe:**
```sql
SHOW TABLES LIKE 'exported_reports';
-- Deve retornar: exported_reports
```

### **2. Exportar um relatório:**
1. Acesse `/reports`
2. Selecione mês/ano
3. Clique em "Exportar Relatório"
4. PDF deve ser baixado

### **3. Verificar registro no banco:**
```sql
SELECT * FROM exported_reports ORDER BY created_at DESC LIMIT 1;
-- Deve mostrar o relatório recém-exportado
```

### **4. Ver histórico:**
1. Volte para `/reports`
2. Role para baixo até "Histórico de Relatórios Exportados"
3. Deve aparecer o relatório exportado
4. Teste o botão de Download
5. Teste o botão de Excluir

---

## ✅ Checklist

- [ ] Executar script SQL OU migration
- [ ] Verificar tabela criada no banco
- [ ] Recarregar página /reports
- [ ] Exportar um relatório de teste
- [ ] Verificar se aparece no histórico
- [ ] Testar download do histórico
- [ ] Testar exclusão do histórico

---

## 🎯 Resultado Esperado

### **Antes:**
```
🔴 Erro ao carregar histórico de relatórios
📋 Seção vazia ou com erro
```

### **Depois:**
```
✅ Histórico carrega normalmente
📋 Lista de relatórios exportados
⬇️ Botão de download funcional
🗑️ Botão de excluir funcional
```

---

## 💡 Dica

Sempre que criar uma nova migration, lembre-se de executá-la:

```bash
cd backend
npm run db:migrate
```

Ou, se preferir SQL direto, sempre tenha um script `.sql` de backup.

---

**Desenvolvido por:** Victor Samuel  
**GitHub:** @vicctim  
**Domínio:** victorsamuel.com.br  
**Stack:** Node.js + MySQL + Sequelize
