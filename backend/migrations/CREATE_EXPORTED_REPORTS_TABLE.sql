-- Script para criar a tabela exported_reports
-- Execute este script no banco de dados MySQL
-- Database: pixfilmes_relatorios

USE pixfilmes_relatorios;

-- Criar tabela exported_reports
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
  
  -- Foreign key
  CONSTRAINT `fk_exported_reports_exported_by` 
    FOREIGN KEY (`exported_by`) 
    REFERENCES `users` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  -- Indexes
  INDEX `idx_exported_reports_exported_by` (`exported_by`),
  INDEX `idx_exported_reports_type_year_month` (`type`, `year`, `month`),
  INDEX `idx_exported_reports_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verificar se a tabela foi criada
SELECT 'Tabela exported_reports criada com sucesso!' AS status;

-- Mostrar estrutura da tabela
DESCRIBE exported_reports;
