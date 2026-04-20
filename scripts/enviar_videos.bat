@echo off
chcp 65001 >nul 2>&1
title Pix Filmes - Upload de Videos
echo.
echo  ╔══════════════════════════════════════════════╗
echo  ║   🎬 Pix Filmes - Upload Automatizado       ║
echo  ║   Sistema de Relatorios                      ║
echo  ╚══════════════════════════════════════════════╝
echo.

:: Verificar se PowerShell está disponível
where powershell >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] PowerShell nao encontrado. Instale o PowerShell para continuar.
    pause
    exit /b 1
)

:: Executar script PowerShell
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0enviar_videos.ps1" -PastaOrigem "%~dp0"

echo.
echo Pressione qualquer tecla para fechar...
pause >nul
