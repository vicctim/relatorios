# ============================================================================
# Pix Filmes - Upload Automatizado de Videos
# Versao: 1.1.0
# Uso: Executar via enviar_videos.bat (duplo-clique)
# ============================================================================

param(
    [string]$PastaOrigem = $PSScriptRoot
)

# ============================================================================
# CONFIGURACAO (hardcoded)
# ============================================================================

$script:Config = @{
    API_URL           = "https://relatorio.pixfilmes.com/api"
    API_KEY           = "815b1293194f59d0ba610c5f8e5a1c8b266dc334a16ed0eb1cd6708aee4f4cbe"
    PROFESSIONAL_NAME = "Victor"
}

$LOG_DIR = Join-Path $PastaOrigem "logs"
$ENVIADOS_DIR = Join-Path $PastaOrigem "enviados"
$VIDEO_EXTENSIONS = @("*.mp4", "*.mov", "*.avi")

# ============================================================================
# UTILITARIOS
# ============================================================================

function Write-Header {
    param([string]$Text)
    Write-Host ""
    Write-Host "  =================================================" -ForegroundColor Cyan
    Write-Host "  $Text" -ForegroundColor Cyan
    Write-Host "  =================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Info {
    param([string]$Text)
    Write-Host "  [INFO] $Text" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Text)
    Write-Host "  [OK] $Text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Text)
    Write-Host "  [AVISO] $Text" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Text)
    Write-Host "  [ERRO] $Text" -ForegroundColor Red
}

function Format-Duration {
    param([double]$Seconds)
    $ts = [TimeSpan]::FromSeconds([Math]::Round($Seconds))
    if ($ts.Hours -gt 0) {
        return "{0:D2}:{1:D2}:{2:D2}" -f $ts.Hours, $ts.Minutes, $ts.Seconds
    }
    return "{0:D2}:{1:D2}" -f $ts.Minutes, $ts.Seconds
}

function Format-FileSize {
    param([long]$Bytes)
    if ($Bytes -ge 1GB) { return "{0:N1} GB" -f ($Bytes / 1GB) }
    if ($Bytes -ge 1MB) { return "{0:N1} MB" -f ($Bytes / 1MB) }
    if ($Bytes -ge 1KB) { return "{0:N1} KB" -f ($Bytes / 1KB) }
    return "$Bytes B"
}

# API helper
function Invoke-Api {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Token = "",
        [string]$FilePath = "",
        [string]$FileField = "video",
        [hashtable]$FormFields = @{}
    )

    $uri = "$($script:Config['API_URL'])$Endpoint"
    $headers = @{ "Accept" = "application/json" }

    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    try {
        if ($FilePath) {
            # Multipart upload
            $boundary = [System.Guid]::NewGuid().ToString()
            $headers["Content-Type"] = "multipart/form-data; boundary=$boundary"

            $bodyLines = [System.Collections.ArrayList]::new()

            # Add form fields
            foreach ($key in $FormFields.Keys) {
                [void]$bodyLines.Add("--$boundary")
                [void]$bodyLines.Add("Content-Disposition: form-data; name=`"$key`"")
                [void]$bodyLines.Add("")
                [void]$bodyLines.Add($FormFields[$key])
            }

            $headerText = ($bodyLines -join "`r`n")
            if ($headerText) { $headerText += "`r`n" }
            $headerText += "--$boundary`r`n"

            $fileName = [System.IO.Path]::GetFileName($FilePath)
            $headerText += "Content-Disposition: form-data; name=`"$FileField`"; filename=`"$fileName`"`r`n"
            $headerText += "Content-Type: application/octet-stream`r`n`r`n"

            $footerText = "`r`n--$boundary--`r`n"

            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($headerText)
            $fileBytes = [System.IO.File]::ReadAllBytes($FilePath)
            $footerBytes = [System.Text.Encoding]::UTF8.GetBytes($footerText)

            $bodyArray = New-Object byte[] ($headerBytes.Length + $fileBytes.Length + $footerBytes.Length)
            [System.Buffer]::BlockCopy($headerBytes, 0, $bodyArray, 0, $headerBytes.Length)
            [System.Buffer]::BlockCopy($fileBytes, 0, $bodyArray, $headerBytes.Length, $fileBytes.Length)
            [System.Buffer]::BlockCopy($footerBytes, 0, $bodyArray, $headerBytes.Length + $fileBytes.Length, $footerBytes.Length)

            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $bodyArray -TimeoutSec 600
        }
        elseif ($Body) {
            $headers["Content-Type"] = "application/json"
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -Body $jsonBody -TimeoutSec 30
        }
        else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $headers -TimeoutSec 30
        }

        return @{ Success = $true; Data = $response }
    }
    catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            try {
                $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                $errorBody = $reader.ReadToEnd() | ConvertFrom-Json
                $errorMsg = $errorBody.error
            } catch {}
        }
        return @{ Success = $false; Error = $errorMsg }
    }
}

# Upload via curl (melhor para arquivos grandes - mostra progresso)
function Upload-WithCurl {
    param(
        [string]$Endpoint,
        [string]$Token,
        [string]$FilePath,
        [hashtable]$Fields = @{}
    )

    $uri = "$($script:Config['API_URL'])$Endpoint"

    $curlArgs = @(
        "-s", "-S",
        "--progress-bar",
        "-X", "POST",
        "-H", "Authorization: Bearer $Token",
        "-H", "Accept: application/json",
        "-F", "video=@`"$FilePath`""
    )

    foreach ($key in $Fields.Keys) {
        $curlArgs += @("-F", "$key=$($Fields[$key])")
    }

    $curlArgs += $uri

    try {
        $result = & curl @curlArgs 2>&1
        $jsonResult = $result | Where-Object { $_ -is [string] -and $_.Trim().StartsWith("{") } | Select-Object -Last 1
        if ($jsonResult) {
            $parsed = $jsonResult | ConvertFrom-Json
            if ($parsed.error) {
                return @{ Success = $false; Error = $parsed.error }
            }
            return @{ Success = $true; Data = $parsed }
        }
        return @{ Success = $false; Error = "Resposta inesperada do servidor" }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# Upload via curl com PUT (para replace)
function Replace-WithCurl {
    param(
        [string]$Endpoint,
        [string]$Token,
        [string]$FilePath,
        [hashtable]$Fields = @{}
    )

    $uri = "$($script:Config['API_URL'])$Endpoint"

    $curlArgs = @(
        "-s", "-S",
        "--progress-bar",
        "-X", "PUT",
        "-H", "Authorization: Bearer $Token",
        "-H", "Accept: application/json",
        "-F", "video=@`"$FilePath`""
    )

    foreach ($key in $Fields.Keys) {
        $curlArgs += @("-F", "$key=$($Fields[$key])")
    }

    $curlArgs += $uri

    try {
        $result = & curl @curlArgs 2>&1
        $jsonResult = $result | Where-Object { $_ -is [string] -and $_.Trim().StartsWith("{") } | Select-Object -Last 1
        if ($jsonResult) {
            $parsed = $jsonResult | ConvertFrom-Json
            if ($parsed.error) {
                return @{ Success = $false; Error = $parsed.error }
            }
            return @{ Success = $true; Data = $parsed }
        }
        return @{ Success = $false; Error = "Resposta inesperada do servidor" }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message }
    }
}

# ============================================================================
# FASE 1: SETUP & VERIFICACOES
# ============================================================================

function Test-Prerequisites {
    Write-Header "FASE 1: Verificacao de Pre-requisitos"

    # Verificar ffprobe
    $ffprobe = Get-Command ffprobe -ErrorAction SilentlyContinue
    if (-not $ffprobe) {
        Write-Err "ffprobe nao encontrado no PATH!"
        Write-Host ""
        Write-Host "  Instale o FFmpeg globalmente:" -ForegroundColor Yellow
        Write-Host "    winget install Gyan.FFmpeg" -ForegroundColor White
        Write-Host ""
        Write-Host "  Ou baixe de: https://www.gyan.dev/ffmpeg/builds/" -ForegroundColor Yellow
        Write-Host "  Extraia e adicione ao PATH do sistema." -ForegroundColor Yellow
        Write-Host ""
        return $false
    }
    Write-Success "ffprobe encontrado: $($ffprobe.Source)"

    # Verificar curl
    $curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if (-not $curl) {
        $curl = Get-Command curl -ErrorAction SilentlyContinue
    }
    if (-not $curl) {
        Write-Err "curl nao encontrado!"
        return $false
    }
    Write-Success "curl encontrado"

    return $true
}

function Connect-Api {
    Write-Header "FASE 1: Autenticando na API"

    $result = Invoke-Api -Method "POST" -Endpoint "/auth/api-key" -Body @{ apiKey = $script:Config["API_KEY"] }

    if (-not $result.Success) {
        Write-Err "Falha na autenticacao: $($result.Error)"
        return $null
    }

    Write-Success "Autenticado como: $($result.Data.user.name) ($($result.Data.user.email))"
    return $result.Data.token
}

function Get-ProfessionalId {
    param([string]$Token, [string]$Name)

    $result = Invoke-Api -Method "GET" -Endpoint "/professionals" -Token $Token

    if (-not $result.Success) {
        Write-Err "Falha ao buscar profissionais: $($result.Error)"
        return $null
    }

    $professional = $result.Data.professionals | Where-Object { $_.name -eq $Name }
    if (-not $professional) {
        Write-Err "Profissional '$Name' nao encontrado!"
        Write-Host "  Profissionais disponiveis:" -ForegroundColor Yellow
        $result.Data.professionals | ForEach-Object { Write-Host "    - $($_.name) (ID: $($_.id))" }
        return $null
    }

    Write-Success "Profissional: $($professional.name) (ID: $($professional.id))"
    return $professional.id
}

# ============================================================================
# FASE 2: SCAN DE ARQUIVOS
# ============================================================================

function Get-VideoFiles {
    Write-Header "FASE 2: Escaneando Arquivos de Video"

    $files = @()
    foreach ($ext in $VIDEO_EXTENSIONS) {
        $found = Get-ChildItem -Path $PastaOrigem -Filter $ext -File -ErrorAction SilentlyContinue
        if ($found) { $files += $found }
    }

    # Excluir subpastas (enviados, logs)
    $files = $files | Where-Object { $_.DirectoryName -eq $PastaOrigem }

    if ($files.Count -eq 0) {
        Write-Warn "Nenhum arquivo de video encontrado na pasta."
        Write-Host "  Extensoes buscadas: $($VIDEO_EXTENSIONS -join ', ')" -ForegroundColor Gray
        return $null
    }

    Write-Info "$($files.Count) arquivo(s) de video encontrado(s)"
    Write-Host ""

    $videoList = @()
    $counter = 0
    foreach ($file in $files) {
        $counter++
        Write-Host "  [$counter/$($files.Count)] Analisando: $($file.Name)..." -ForegroundColor Gray -NoNewline

        # Extrair duracao via ffprobe
        $duration = 0
        try {
            $ffOutput = & ffprobe -v quiet -show_entries "format=duration" -of "default=nokey=1:noprint_wrappers=1" $file.FullName 2>&1
            $durationStr = ($ffOutput | Where-Object { $_ -match "^\d" }) | Select-Object -First 1
            if ($durationStr) {
                $duration = [Math]::Round([double]$durationStr, 2)
            }
        } catch {
            Write-Host " [duracao desconhecida]" -ForegroundColor Yellow -NoNewline
        }

        # Data de criacao do arquivo
        $fileDate = $file.CreationTime.ToString("yyyy-MM-dd")

        # Titulo candidato (nome sem extensao)
        $titleCandidate = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)

        $videoInfo = [PSCustomObject]@{
            Index           = $counter
            FileName        = $file.Name
            FilePath        = $file.FullName
            FileSize        = $file.Length
            FileSizeDisplay = Format-FileSize $file.Length
            Duration        = $duration
            DurationDisplay = Format-Duration $duration
            FileDate        = $fileDate
            Title           = $titleCandidate
            ProfessionalId  = $null
            IncludeInReport = $true
            Status          = "PENDENTE"
            RemoteId        = $null
            RemoteTitle     = $null
            RemoteSize      = $null
            RemoteDate      = $null
            Action          = $null
        }

        $videoList += $videoInfo
        Write-Host " OK" -ForegroundColor Green
    }

    return $videoList
}

# ============================================================================
# FASE 3: VERIFICACAO DE DUPLICATAS
# ============================================================================

function Check-Duplicates {
    param([array]$Videos, [string]$Token)

    Write-Header "FASE 3: Verificando Duplicatas na Base"

    $filenames = $Videos | ForEach-Object { $_.FileName }
    $result = Invoke-Api -Method "POST" -Endpoint "/videos/check-existing" -Token $Token -Body @{ filenames = $filenames }

    if (-not $result.Success) {
        Write-Warn "Nao foi possivel verificar duplicatas: $($result.Error)"
        Write-Info "Todos os arquivos serao tratados como NOVOS"
        $Videos | ForEach-Object { $_.Status = "NOVO"; $_.Action = "UPLOAD" }
        return $Videos
    }

    $novos = 0
    $existentes = 0

    foreach ($video in $Videos) {
        $check = $result.Data.results.($video.FileName)
        if ($check -and $check.exists) {
            $video.Status = "EXISTENTE"
            $video.RemoteId = $check.videoId
            $video.RemoteTitle = $check.title
            $video.RemoteSize = $check.fileSizeBytes
            if ($check.uploadedAt) {
                $video.RemoteDate = ([datetime]$check.uploadedAt).ToString("yyyy-MM-dd")
            } else {
                $video.RemoteDate = "?"
            }
            $existentes++
        } else {
            $video.Status = "NOVO"
            $video.Action = "UPLOAD"
            $novos++
        }
    }

    Write-Host ""
    if ($novos -gt 0) { Write-Success "$novos arquivo(s) NOVO(S) - serao enviados" }
    if ($existentes -gt 0) { Write-Warn "$existentes arquivo(s) ja EXISTEM na base - decisao necessaria" }

    return $Videos
}

# ============================================================================
# FASE 4: APROVACAO INDIVIDUAL
# ============================================================================

function Show-VideoCard {
    param([PSCustomObject]$Video, [int]$Total, [int]$ProfessionalId)

    $statusColor = "Green"
    $statusLabel = ">> NOVO"
    if ($Video.Status -ne "NOVO") {
        $statusColor = "Yellow"
        $statusLabel = ">> JA EXISTE NA BASE"
    }

    Write-Host ""
    Write-Host "  +----------------------------------------------------------+" -ForegroundColor DarkGray
    Write-Host "  |  [$($Video.Index)/$Total] " -ForegroundColor White -NoNewline
    Write-Host $statusLabel -ForegroundColor $statusColor
    Write-Host "  |" -ForegroundColor DarkGray
    Write-Host "  |  Arquivo:     $($Video.FileName)" -ForegroundColor White
    Write-Host "  |  Tamanho:     $($Video.FileSizeDisplay)" -ForegroundColor White
    Write-Host "  |  Duracao:     $($Video.DurationDisplay) ($($Video.Duration)s)" -ForegroundColor White
    Write-Host "  |  Data:        $($Video.FileDate)" -ForegroundColor White
    Write-Host "  |  Titulo:      $($Video.Title)" -ForegroundColor Cyan
    $includeText = "Sim"
    if (-not $Video.IncludeInReport) { $includeText = "Nao" }
    Write-Host "  |  Relatorio:   $includeText" -ForegroundColor White

    if ($Video.Status -eq "EXISTENTE") {
        Write-Host "  |" -ForegroundColor DarkGray
        Write-Host "  |  --- Na Base ---" -ForegroundColor Yellow
        Write-Host "  |  ID:          #$($Video.RemoteId)" -ForegroundColor Yellow
        Write-Host "  |  Titulo:      $($Video.RemoteTitle)" -ForegroundColor Yellow
        Write-Host "  |  Upload em:   $($Video.RemoteDate)" -ForegroundColor Yellow
        if ($Video.RemoteSize) {
            Write-Host "  |  Tamanho:     $(Format-FileSize $Video.RemoteSize)" -ForegroundColor Yellow
        }
    }

    Write-Host "  |" -ForegroundColor DarkGray
    Write-Host "  +----------------------------------------------------------+" -ForegroundColor DarkGray
}

function Edit-VideoFields {
    param([PSCustomObject]$Video)

    Write-Host ""
    Write-Host "  Editar campos (Enter para manter valor atual):" -ForegroundColor Cyan
    Write-Host ""

    # Titulo
    $newTitle = Read-Host "    Titulo [$($Video.Title)]"
    if ($newTitle.Trim()) { $Video.Title = $newTitle.Trim() }

    # Duracao
    $newDuration = Read-Host "    Duracao em segundos [$($Video.Duration)]"
    if ($newDuration.Trim()) {
        try {
            $Video.Duration = [double]$newDuration.Trim()
            $Video.DurationDisplay = Format-Duration $Video.Duration
        }
        catch { Write-Warn "Valor invalido, mantendo $($Video.Duration)s" }
    }

    # Data
    $newDate = Read-Host "    Data YYYY-MM-DD [$($Video.FileDate)]"
    if ($newDate.Trim()) {
        try {
            [datetime]::ParseExact($newDate.Trim(), "yyyy-MM-dd", $null) | Out-Null
            $Video.FileDate = $newDate.Trim()
        }
        catch { Write-Warn "Data invalida, mantendo $($Video.FileDate)" }
    }

    # Include in report
    $currentInclude = "S"
    if (-not $Video.IncludeInReport) { $currentInclude = "N" }
    $newInclude = Read-Host "    Incluir no relatorio S/N [$currentInclude]"
    if ($newInclude.Trim().ToUpper() -eq "N") { $Video.IncludeInReport = $false }
    elseif ($newInclude.Trim().ToUpper() -eq "S") { $Video.IncludeInReport = $true }

    return $Video
}

function Approve-Videos {
    param([array]$Videos, [int]$ProfessionalId)

    Write-Header "FASE 4: Aprovacao Individual"

    foreach ($video in $Videos) {
        $video.ProfessionalId = $ProfessionalId
        $approved = $false

        while (-not $approved) {
            Show-VideoCard -Video $video -Total $Videos.Count -ProfessionalId $ProfessionalId

            if ($video.Status -eq "NOVO") {
                Write-Host ""
                Write-Host "    [A] Aprovar envio" -ForegroundColor Green
                Write-Host "    [E] Editar campos" -ForegroundColor Cyan
                Write-Host "    [P] Pular (nao enviar)" -ForegroundColor Yellow
                Write-Host ""
                $choice = Read-Host "    Opcao"

                switch ($choice.ToUpper()) {
                    "A" {
                        $video.Action = "UPLOAD"
                        Write-Success "Aprovado para envio"
                        $approved = $true
                    }
                    "E" {
                        $video = Edit-VideoFields -Video $video
                    }
                    "P" {
                        $video.Action = "PULAR"
                        Write-Warn "Arquivo sera pulado"
                        $approved = $true
                    }
                    default { Write-Warn "Opcao invalida" }
                }
            }
            else {
                # EXISTENTE
                Write-Host ""
                Write-Host "    [S] Substituir arquivo + atualizar dados" -ForegroundColor Green
                Write-Host "    [D] Atualizar so os dados (sem re-upload)" -ForegroundColor Cyan
                Write-Host "    [E] Editar campos antes de decidir" -ForegroundColor Blue
                Write-Host "    [P] Pular" -ForegroundColor Yellow
                Write-Host ""
                $choice = Read-Host "    Opcao"

                switch ($choice.ToUpper()) {
                    "S" {
                        $video.Action = "SUBSTITUIR"
                        Write-Success "Arquivo sera substituido + dados atualizados"
                        $approved = $true
                    }
                    "D" {
                        $video.Action = "SO_DADOS"
                        Write-Success "Apenas dados serao atualizados"
                        $approved = $true
                    }
                    "E" {
                        $video = Edit-VideoFields -Video $video
                    }
                    "P" {
                        $video.Action = "PULAR"
                        Write-Warn "Arquivo sera pulado"
                        $approved = $true
                    }
                    default { Write-Warn "Opcao invalida" }
                }
            }
        }
    }

    # Resumo
    $uploads = @($Videos | Where-Object { $_.Action -eq "UPLOAD" }).Count
    $substitui = @($Videos | Where-Object { $_.Action -eq "SUBSTITUIR" }).Count
    $dados = @($Videos | Where-Object { $_.Action -eq "SO_DADOS" }).Count
    $pular = @($Videos | Where-Object { $_.Action -eq "PULAR" }).Count

    Write-Host ""
    Write-Host "  =================================================" -ForegroundColor Cyan
    Write-Host "  RESUMO" -ForegroundColor Cyan
    Write-Host "  =================================================" -ForegroundColor Cyan
    if ($uploads -gt 0) { Write-Host "    Novos uploads:   $uploads" -ForegroundColor Green }
    if ($substitui -gt 0) { Write-Host "    Substituicoes:   $substitui" -ForegroundColor Yellow }
    if ($dados -gt 0) { Write-Host "    So dados:        $dados" -ForegroundColor Cyan }
    if ($pular -gt 0) { Write-Host "    Pulados:         $pular" -ForegroundColor Gray }
    Write-Host ""

    $total = $uploads + $substitui + $dados
    if ($total -eq 0) {
        Write-Warn "Nenhum arquivo para processar!"
        return $null
    }

    $confirm = Read-Host "  Confirmar processamento de $total arquivo(s)? [S/N]"
    if ($confirm.ToUpper() -ne "S") {
        Write-Warn "Operacao cancelada pelo usuario"
        return $null
    }

    return $Videos
}

# ============================================================================
# FASE 5: UPLOAD
# ============================================================================

function Process-Uploads {
    param([array]$Videos, [string]$Token)

    Write-Header "FASE 5: Processando Envios"

    $successCount = 0
    $errorCount = 0
    $skipCount = 0
    $logEntries = @()

    $toProcess = @($Videos | Where-Object { $_.Action -ne "PULAR" })
    $total = $toProcess.Count
    $current = 0

    foreach ($video in $Videos) {
        if ($video.Action -eq "PULAR") {
            $skipCount++
            $logEntries += "PULADO | $($video.FileName)"
            continue
        }

        $current++

        switch ($video.Action) {
            "UPLOAD" {
                Write-Host "  [$current/$total] Enviando: $($video.FileName)..." -ForegroundColor White

                $fields = @{
                    title           = $video.Title
                    requestDate     = $video.FileDate
                    completionDate  = $video.FileDate
                    professionalId  = $video.ProfessionalId.ToString()
                    includeInReport = $video.IncludeInReport.ToString().ToLower()
                }

                $result = Upload-WithCurl -Endpoint "/videos" -Token $Token -FilePath $video.FilePath -Fields $fields

                if ($result.Success) {
                    $newId = "?"
                    if ($result.Data.video) { $newId = $result.Data.video.id }
                    Write-Success "[$current/$total] $($video.FileName) - ID #$newId"
                    $successCount++
                    $logEntries += "ENVIADO | $($video.FileName) | ID #$newId"
                    $video.RemoteId = $newId
                } else {
                    Write-Err "[$current/$total] $($video.FileName) - $($result.Error)"
                    $errorCount++
                    $logEntries += "ERRO | $($video.FileName) | $($result.Error)"
                }
            }

            "SUBSTITUIR" {
                Write-Host "  [$current/$total] Substituindo: $($video.FileName) (ID #$($video.RemoteId))..." -ForegroundColor Yellow

                $fields = @{
                    title           = $video.Title
                    requestDate     = $video.FileDate
                    completionDate  = $video.FileDate
                    professionalId  = $video.ProfessionalId.ToString()
                    includeInReport = $video.IncludeInReport.ToString().ToLower()
                }

                $result = Replace-WithCurl -Endpoint "/videos/$($video.RemoteId)/replace" -Token $Token -FilePath $video.FilePath -Fields $fields

                if ($result.Success) {
                    Write-Success "[$current/$total] $($video.FileName) - Substituido (ID #$($video.RemoteId))"
                    $successCount++
                    $logEntries += "SUBSTITUIDO | $($video.FileName) | ID #$($video.RemoteId)"
                } else {
                    Write-Err "[$current/$total] $($video.FileName) - $($result.Error)"
                    $errorCount++
                    $logEntries += "ERRO SUBSTITUIR | $($video.FileName) | $($result.Error)"
                }
            }

            "SO_DADOS" {
                Write-Host "  [$current/$total] Atualizando dados: $($video.FileName) (ID #$($video.RemoteId))..." -ForegroundColor Cyan

                $body = @{
                    title           = $video.Title
                    requestDate     = $video.FileDate
                    completionDate  = $video.FileDate
                    professionalId  = $video.ProfessionalId
                    includeInReport = $video.IncludeInReport
                }

                $result = Invoke-Api -Method "PUT" -Endpoint "/videos/$($video.RemoteId)" -Token $Token -Body $body

                if ($result.Success) {
                    Write-Success "[$current/$total] $($video.FileName) - Dados atualizados (ID #$($video.RemoteId))"
                    $successCount++
                    $logEntries += "DADOS ATUALIZADOS | $($video.FileName) | ID #$($video.RemoteId)"
                } else {
                    Write-Err "[$current/$total] $($video.FileName) - $($result.Error)"
                    $errorCount++
                    $logEntries += "ERRO DADOS | $($video.FileName) | $($result.Error)"
                }
            }
        }
    }

    return @{
        Success  = $successCount
        Errors   = $errorCount
        Skipped  = $skipCount
        Log      = $logEntries
        Videos   = $Videos
    }
}

# ============================================================================
# FASE 6: FINALIZACAO
# ============================================================================

function Complete-Process {
    param([hashtable]$Results)

    Write-Header "FASE 6: Finalizacao"

    # Relatorio
    Write-Host "  Resultado:" -ForegroundColor White
    if ($Results.Success -gt 0) { Write-Host "    Sucesso:  $($Results.Success)" -ForegroundColor Green }
    if ($Results.Errors -gt 0) { Write-Host "    Erros:    $($Results.Errors)" -ForegroundColor Red }
    if ($Results.Skipped -gt 0) { Write-Host "    Pulados:  $($Results.Skipped)" -ForegroundColor Gray }
    Write-Host ""

    # Salvar log
    if (-not (Test-Path $LOG_DIR)) { New-Item -Path $LOG_DIR -ItemType Directory -Force | Out-Null }
    $logFile = Join-Path $LOG_DIR ("upload_" + (Get-Date -Format "yyyyMMdd_HHmmss") + ".txt")
    $logContent = @(
        "=== Pix Filmes - Upload Log ==="
        ("Data: " + (Get-Date -Format "yyyy-MM-dd HH:mm:ss"))
        "Pasta: $PastaOrigem"
        "Sucesso: $($Results.Success) | Erros: $($Results.Errors) | Pulados: $($Results.Skipped)"
        "================================"
        ""
    )
    $logContent += $Results.Log
    $logContent | Out-File -FilePath $logFile -Encoding UTF8
    Write-Info "Log salvo em: $logFile"

    # Mover enviados
    if ($Results.Success -gt 0) {
        Write-Host ""
        $moveChoice = Read-Host "  Mover arquivos enviados para ./enviados/? [S/N]"
        if ($moveChoice.ToUpper() -eq "S") {
            $dateDir = Join-Path $ENVIADOS_DIR (Get-Date -Format "yyyy-MM-dd")
            if (-not (Test-Path $dateDir)) { New-Item -Path $dateDir -ItemType Directory -Force | Out-Null }

            $movedCount = 0
            foreach ($video in $Results.Videos) {
                if (($video.Action -eq "UPLOAD" -or $video.Action -eq "SUBSTITUIR") -and (Test-Path $video.FilePath)) {
                    try {
                        Move-Item -Path $video.FilePath -Destination $dateDir -Force
                        $movedCount++
                    } catch {
                        Write-Warn "Nao foi possivel mover: $($video.FileName)"
                    }
                }
            }
            Write-Success "$movedCount arquivo(s) movido(s) para $dateDir"
        }
    }

    Write-Host ""
    Write-Host "  Processo finalizado!" -ForegroundColor Green
    Write-Host ""
}

# ============================================================================
# MAIN
# ============================================================================

function Main {
    # Fase 1: Pre-requisitos
    if (-not (Test-Prerequisites)) { return }

    # Fase 1: Autenticacao
    $token = Connect-Api
    if (-not $token) { return }

    # Buscar profissional
    $professionalId = Get-ProfessionalId -Token $token -Name $script:Config["PROFESSIONAL_NAME"]
    if (-not $professionalId) { return }

    # Fase 2: Scan
    $videos = Get-VideoFiles
    if (-not $videos) { return }

    # Fase 3: Duplicatas
    $videos = Check-Duplicates -Videos $videos -Token $token

    # Fase 4: Aprovacao
    $approved = Approve-Videos -Videos $videos -ProfessionalId $professionalId
    if (-not $approved) { return }

    # Fase 5: Upload
    $results = Process-Uploads -Videos $approved -Token $token

    # Fase 6: Finalizacao
    Complete-Process -Results $results
}

# Executar
Main
