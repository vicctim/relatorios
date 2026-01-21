# Solução Correta para Ambiente WSL + Docker
**Data:** 20 de Janeiro de 2026  
**Ambiente:** WSL 2 + Docker + MySQL Container

---

## ✅ **SOLUÇÃO 1: Migration via NPM (RECOMENDADO)** ⭐

No terminal WSL, dentro da pasta do projeto:

```bash
# 1. Entre na pasta backend
cd backend

# 2. Execute as migrations
npm run db:migrate

# 3. Verifique se funcionou
# Deve aparecer algo como:
# == 20260121000001-create-exported-reports: migrating =======
# == 20260121000001-create-exported-reports: migrated (0.XXXs)
```

**PRONTO!** Recarregue a página `/reports` no navegador.

---

## ✅ **SOLUÇÃO 2: SQL direto no container Docker**

Se preferir executar o SQL diretamente:

```bash
# 1. Entre no container MySQL
docker exec -it relatorios-mysql mysql -u relatorios -prelatorios123 relatorios

# 2. Cole e execute o SQL:
CREATE TABLE IF NOT EXISTS `exported_reports` (
  `id` INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `type` ENUM('monthly', 'dateRange') NOT NULL,
  `month` INT NULL,
  `year` INT NULL,
  `start_date` DATETIME NULL,
  `end_date` DATETIME NULL,
  `date_field` ENUM('requestDate', 'completionDate') NULL,
  `filename` VARCHAR(255) NOT NULL,
  `file_path` VARCHAR(500) NOT NULL,
  `file_size` BIGINT NOT NULL,
  `total_videos` INT NOT NULL DEFAULT 0,
  `total_duration` DOUBLE NOT NULL DEFAULT 0,
  `exported_by` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT `fk_exported_reports_exported_by` 
    FOREIGN KEY (`exported_by`) 
    REFERENCES `users` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  INDEX `idx_exported_reports_exported_by` (`exported_by`),
  INDEX `idx_exported_reports_type_year_month` (`type`, `year`, `month`),
  INDEX `idx_exported_reports_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

# 3. Verifique:
DESCRIBE exported_reports;

# 4. Saia do MySQL:
exit;
```

---

## ✅ **SOLUÇÃO 3: Script SQL via docker exec (One-liner)**

```bash
docker exec -i relatorios-mysql mysql -u relatorios -prelatorios123 relatorios < CREATE_EXPORTED_REPORTS_TABLE.sql
```

---

## 🔍 Verificar se funcionou

```bash
# Ver tabelas no banco
docker exec -it relatorios-mysql mysql -u relatorios -prelatorios123 -e "SHOW TABLES FROM relatorios;"

# Ver estrutura da tabela
docker exec -it relatorios-mysql mysql -u relatorios -prelatorios123 -e "DESCRIBE relatorios.exported_reports;"
```

---

## ⚠️ Observações

- **Container:** `relatorios-mysql`
- **Banco:** `relatorios`
- **Usuário:** `relatorios`
- **Senha:** `relatorios123`
- **Porta:** `3307` (mapeada para 3306 no container)

---

## 🎯 Depois de executar

1. ✅ Recarregue a página `/reports`
2. ✅ Exporte um relatório de teste
3. ✅ Verifique se aparece no histórico
4. ✅ Teste download e exclusão

---

**Desenvolvido por:** Victor Samuel  
**Ambiente:** WSL 2 + Docker
