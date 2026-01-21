# Scripts de Desenvolvimento

Esta pasta contém todos os scripts auxiliares para desenvolvimento e manutenção do projeto.

## Scripts Disponíveis

- **`dev.sh`** / **`dev-watch.sh`** - Inicia ambiente de desenvolvimento com hot reload
- **`dev-simple.sh`** - Versão simplificada do dev.sh
- **`start-all.sh`** - Inicia todos os serviços (MySQL, Backend, Frontend)
- **`start-dev.sh`** - Inicia ambiente de desenvolvimento
- **`stop-all.sh`** - Para todos os serviços
- **`setup-git.sh`** - Configura hooks do Git
- **`apply-version-detection.sh`** - Aplica detecção automática de versões

## Uso

Os scripts podem ser executados diretamente ou através do `package.json`:

```bash
# Via npm
npm run dev
npm run stop
npm run setup:git

# Diretamente
./scripts/dev.sh
./scripts/stop-all.sh
```

## Permissões

Certifique-se de que os scripts têm permissão de execução:

```bash
chmod +x scripts/*.sh
```
