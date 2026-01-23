# 🔧 Troubleshooting - Deploy VPS

Guia rápido para resolver problemas comuns no deploy.

## ✅ Verificar Status dos Containers

```bash
# Ver status de todos os containers
docker ps -a

# Ver logs do backend
docker logs relatorios_backend --tail 100

# Ver logs do frontend
docker logs relatorios_frontend --tail 100

# Ver logs do MySQL
docker logs relatorios_mysql --tail 100
```

## 🐛 Problemas Comuns

### 1. Backend não inicia

**Sintomas:**
- Container reinicia constantemente
- Erros de conexão com MySQL
- Erros de migrations

**Soluções:**

```bash
# Ver logs detalhados
docker logs relatorios_backend --tail 200

# Verificar se MySQL está saudável
docker exec relatorios_mysql mysqladmin ping -h localhost -u root -p${DB_ROOT_PASSWORD}

# Verificar variáveis de ambiente
docker exec relatorios_backend env | grep DB_

# Executar migration manualmente
docker exec -it relatorios_backend npm run migrate
```

### 2. Erro 502 Bad Gateway

**Causas possíveis:**
- Backend não está rodando
- Backend não está respondendo na porta 3001
- Nginx não consegue conectar ao backend

**Soluções:**

```bash
# Verificar se backend está rodando
docker ps | grep relatorios_backend

# Testar health check do backend
docker exec relatorios_backend node -e "require('http').get('http://localhost:3001/api/health', (r) => console.log(r.statusCode))"

# Verificar rede
docker network inspect rede_publica

# Verificar se backend está na rede correta
docker inspect relatorios_backend | grep -A 10 Networks
```

### 3. Erro de Migration

**Sintomas:**
- `ERROR: Cannot find "/app/config/config.json"`
- `ERROR: No description found for "share_links" table`

**Soluções:**

```bash
# Verificar se arquivos de config foram copiados
docker exec relatorios_backend ls -la /app/config/
docker exec relatorios_backend ls -la /app/.sequelizerc

# Executar migration manualmente
docker exec -it relatorios_backend npm run migrate

# Se persistir, verificar banco diretamente
docker exec -it relatorios_mysql mysql -u root -p${DB_ROOT_PASSWORD} relatorios
# No MySQL:
# SHOW TABLES;
# DESCRIBE share_links;
```

### 4. Frontend não carrega

**Sintomas:**
- Página em branco
- Erros 404
- Assets não carregam

**Soluções:**

```bash
# Verificar se frontend está rodando
docker ps | grep relatorios_frontend

# Testar acesso direto
curl http://localhost:80

# Verificar logs do nginx
docker logs relatorios_frontend --tail 50

# Verificar configuração do nginx
docker exec relatorios_frontend cat /etc/nginx/conf.d/default.conf
```

### 5. Erro de Conexão com MySQL

**Sintomas:**
- `ECONNREFUSED`
- `Access denied for user`
- Timeout na conexão

**Soluções:**

```bash
# Verificar se MySQL está rodando
docker ps | grep relatorios_mysql

# Testar conexão
docker exec relatorios_mysql mysql -u ${DB_USER} -p${DB_PASSWORD} -e "SELECT 1"

# Verificar variáveis de ambiente do backend
docker exec relatorios_backend env | grep DB_

# Verificar se estão na mesma rede
docker network inspect default | grep -A 5 relatorios
```

### 6. Uploads não funcionam

**Sintomas:**
- Erro ao fazer upload
- Arquivos não são salvos

**Soluções:**

```bash
# Verificar permissões do diretório uploads
docker exec relatorios_backend ls -la /app/uploads

# Verificar se diretório existe
docker exec relatorios_backend test -d /app/uploads && echo "OK" || echo "FALTA"

# Verificar espaço em disco
df -h

# Verificar permissões do volume
ls -la ./uploads
```

## 🔄 Comandos Úteis

### Reiniciar Tudo

```bash
docker compose down
docker compose up -d
```

### Rebuildar e Recriar

```bash
docker compose down
docker compose pull
docker compose up -d --force-recreate
```

### Limpar Tudo (CUIDADO!)

```bash
# Para containers e volumes
docker compose down -v

# Para imagens também
docker compose down -v --rmi all
```

### Verificar Saúde dos Serviços

```bash
# Health check de todos
docker ps --format "table {{.Names}}\t{{.Status}}"

# Verificar health específico
docker inspect relatorios_backend | grep -A 10 Health
```

## 📊 Verificar Recursos

```bash
# Uso de CPU e memória
docker stats relatorios_backend relatorios_frontend relatorios_mysql

# Espaço usado por volumes
docker system df -v
```

## 🔍 Debug Avançado

### Entrar no Container

```bash
# Backend
docker exec -it relatorios_backend sh

# Frontend
docker exec -it relatorios_frontend sh

# MySQL
docker exec -it relatorios_mysql mysql -u root -p
```

### Verificar Variáveis de Ambiente

```bash
docker exec relatorios_backend env | sort
```

### Testar Conexão de Rede

```bash
# Do backend para MySQL
docker exec relatorios_backend ping -c 3 mysql

# Do backend para frontend
docker exec relatorios_backend ping -c 3 relatorios_frontend
```

## 📝 Logs em Tempo Real

```bash
# Backend
docker logs -f relatorios_backend

# Frontend
docker logs -f relatorios_frontend

# Todos
docker compose logs -f
```

## 🆘 Se Nada Funcionar

1. **Verificar todos os logs:**
   ```bash
   docker compose logs > logs.txt
   ```

2. **Verificar configuração:**
   ```bash
   cat .env
   docker compose config
   ```

3. **Recriar do zero:**
   ```bash
   docker compose down -v
   docker compose pull
   docker compose up -d
   ```

4. **Verificar recursos do servidor:**
   ```bash
   free -h
   df -h
   docker system df
   ```

---

**💡 Dica:** Sempre verifique os logs primeiro! A maioria dos problemas aparece claramente nos logs.
