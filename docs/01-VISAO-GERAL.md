# Visão Geral do Projeto

## Descrição

Sistema de gerenciamento de relatórios de vídeos para a **Pix Filmes**. Permite upload de vídeos, controle de limites mensais de produção (1100 segundos com rollover), geração de relatórios profissionais em PDF e notificações automáticas.

## Tecnologias

### Backend
- **Node.js** + **Express** + **TypeScript**
- **Sequelize ORM** com **MySQL 8.0**
- **JWT** para autenticação
- **Multer** para upload de arquivos
- **FFmpeg** para análise e compressão de vídeos
- **Puppeteer** para geração de PDF
- **Nodemailer** para emails
- **Evolution API** para WhatsApp

### Frontend
- **React 18** + **TypeScript**
- **Vite** como bundler
- **Tailwind CSS** para estilos
- **React Router v6** para rotas
- **React Hook Form** para formulários
- **Lucide React** para ícones
- **React Hot Toast** para notificações

### Infraestrutura
- **Docker** + **Docker Compose**
- **Nginx** como reverse proxy (produção)
- **MySQL 8.0** como banco de dados

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│     MySQL       │
│   React + Vite  │     │ Express + Node  │     │    Database     │
│   (porta 3000)  │     │   (porta 3001)  │     │   (porta 3307)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │     FFmpeg      │
                        │  (compressão)   │
                        └─────────────────┘
```

## Cores da Marca (Pix Filmes)

| Cor | Hex | Uso |
|-----|-----|-----|
| Verde Primário | `#4CAF50` | Botões, destaques |
| Verde Claro | `#8BC34A` | Acentos |
| Verde Escuro | `#388E3C` | Hover states |

## Papéis de Usuário

| Papel | Permissões |
|-------|------------|
| **admin** | Acesso total: usuários, configurações, relatórios |
| **editor** | Upload de vídeos, visualização de relatórios |
| **viewer** | Apenas visualização de vídeos e relatórios |

## Limites de Vídeo

- **Limite base mensal:** 1100 segundos (configurável)
- **Rollover:** Segundos não usados dos últimos 2 meses são acumulados
- **Versões adicionais:** Contam como 50% da duração original
- **Formatos aceitos:** MP4, MOV
- **Tamanho máximo:** 500MB
- **Compressão automática:** Acima de 100MB
